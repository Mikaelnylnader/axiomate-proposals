import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { DraftData } from "@/lib/types";
import { sendPaymentEmails } from "@/lib/email/service";

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function createCheckoutSession(
  proposalToken: string,
  paymentKind: "deposit" | "full" | "subscribe",
) {
  const supabase = createAdminClient();
  const stripe = getStripe();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("public_token", proposalToken)
    .single();

  if (error || !proposal) throw new Error("Proposal not found");

  const allowedStatuses = ["accepted", "payment_pending", "partially_paid"];
  if (!allowedStatuses.includes(proposal.status)) {
    throw new Error("Proposal is not ready for payment");
  }

  // Load acceptance separately (more reliable than join)
  const { data: acceptance } = await supabase
    .from("acceptances")
    .select("*")
    .eq("proposal_id", proposal.id)
    .maybeSingle();

  if (!acceptance) throw new Error("Proposal must be accepted before payment");

  const draft = proposal.draft_data as DraftData;
  const engagementAmount: number = (draft.engagement_total_amount as number) || (draft.access_fee_amount as number) || 0;
  const engagementMonths = (draft.engagement_months as number) || 3;

  if (engagementAmount <= 0) {
    throw new Error("No engagement fee configured for this proposal");
  }

  // Create local payment record
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      proposal_id: proposal.id,
      acceptance_id: acceptance.id,
      payment_kind: "full",
      currency: proposal.currency,
      expected_amount_minor: engagementAmount,
    })
    .select()
    .single();

  if (paymentError) throw paymentError;

  const label = (draft.access_fee_label as string) || "Engagement Fee";

  // Create Stripe Checkout in PAYMENT mode (one-time engagement fee)
  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      customer_email: acceptance.signer_email as string,
      client_reference_id: proposal.proposal_number as string,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: proposal.currency as string,
            unit_amount: engagementAmount,
            product_data: {
              name: `${proposal.proposal_number} — ${proposal.title}`,
              description: `${label} — ${engagementMonths}-month engagement`,
            },
          },
        },
      ],
      metadata: {
        proposal_id: proposal.id,
        proposal_number: proposal.proposal_number as string,
        payment_id: payment.id,
        payment_kind: "full",
      },
      payment_intent_data: {
        metadata: {
          proposal_id: proposal.id,
          proposal_number: proposal.proposal_number as string,
          payment_id: payment.id,
        },
        description: `${proposal.proposal_number} — ${proposal.title}`,
      },
      success_url: `${appUrl}/p/${proposalToken}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/p/${proposalToken}?payment=cancelled`,
    },
    {
      idempotencyKey: `eng_${proposal.id}_${engagementAmount}`,
    },
  );

  await supabase
    .from("payments")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", payment.id);

  return { url: session.url! };
}

export async function processStripeWebhook(rawBody: string, signature: string) {
  const stripe = getStripe();
  const supabase = createAdminClient();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new Error("Invalid webhook signature");
    }
  } else {
    try {
      event = JSON.parse(rawBody) as Stripe.Event;
    } catch {
      throw new Error("Invalid webhook payload");
    }
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("stripe_event_id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) return { received: true, alreadyProcessed: true };

  await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    payload: event as unknown as Record<string, unknown>,
    processing_status: "received",
  });

  const handled = await handleEvent(supabase, event);

  await supabase
    .from("stripe_events")
    .update({
      processing_status: handled ? "processed" : "ignored",
      processed_at: new Date().toISOString(),
    })
    .eq("stripe_event_id", event.id);

  return { received: true };
}

async function handleEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
): Promise<boolean> {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentId = session.metadata?.payment_id;
    if (!paymentId) return false;

    const { data: payment } = await supabase
      .from("payments")
      .select("*, proposals!inner(id, total_amount_minor, amount_paid_minor, public_token, proposal_number, title, clients(contact_name, contact_email))")
      .eq("id", paymentId)
      .single();

    if (!payment || payment.status === "succeeded") return false;

    const stripeObj = getStripe();
    let amountReceived = payment.expected_amount_minor;
    let piId: string | null = null;

    if (typeof session.payment_intent === "string") {
      const pi = await stripeObj.paymentIntents.retrieve(session.payment_intent);
      amountReceived = pi.amount_received;
      piId = pi.id;
    }

    await supabase
      .from("payments")
      .update({
        status: "succeeded",
        received_amount_minor: amountReceived,
        stripe_payment_intent_id: piId,
        stripe_customer_id: (session.customer as string) ?? null,
        succeeded_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    const proposal = payment.proposals as unknown as {
      id: string;
      total_amount_minor: number;
      amount_paid_minor: number;
      public_token: string;
      proposal_number: string;
      title: string;
      clients: { contact_name: string; contact_email: string }[];
    };

    const newPaid = (proposal.amount_paid_minor ?? 0) + amountReceived;
    const total = proposal.total_amount_minor || payment.expected_amount_minor;
    const newStatus = newPaid >= total ? "paid" : "partially_paid";

    await supabase
      .from("proposals")
      .update({
        status: newStatus,
        amount_paid_minor: newPaid,
        paid_at: newStatus === "paid" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposal.id);

    // Fire-and-forget payment emails
    const c = proposal.clients?.[0];
    if (c?.contact_email) {
      sendPaymentEmails({
        token: proposal.public_token,
        proposalNumber: proposal.proposal_number,
        proposalTitle: proposal.title,
        amountMinor: amountReceived,
        currency: (payment.currency as string) || "usd",
        clientName: c.contact_name,
        clientEmail: c.contact_email,
      }).catch(() => {});
    }

    return true;
  }

  return false;
}
