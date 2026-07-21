"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  clientSchema,
  proposalCreateSchema,
  acceptanceSchema,
} from "@/lib/validation/schemas";
import {
  createClientRecord,
  createProposal,
  updateProposalDraft,
  publishProposal,
  unpublishProposal,
  duplicateProposal,
  archiveProposal,
} from "@/lib/proposal/service";
import { acceptProposal } from "@/lib/proposal/public";
import { parseCallScript } from "@/lib/proposal/service";
import { sendAdminSignedEmail, sendProposalLink } from "@/lib/email/service";

// ---- Shared result types ----

export type ActionState = {
  errors: Record<string, string[] | string | undefined>;
} | null;

// ---- Clients ----

export async function createClientAction(
  _prevState: ActionState | void,
  formData: FormData,
): Promise<ActionState | void> {
  const parsed = clientSchema.safeParse({
    company_name: formData.get("company_name"),
    contact_name: formData.get("contact_name"),
    contact_email: formData.get("contact_email"),
    contact_title: formData.get("contact_title") || undefined,
    address_text: formData.get("address_text") || undefined,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | string | undefined
      >,
    };
  }

  try {
    await createClientRecord(parsed.data);
  } catch (e) {
    return {
      errors: {
        _form: e instanceof Error ? e.message : "Failed to create client",
      },
    };
  }

  revalidatePath("/clients");
  redirect("/clients");
}

// ---- Proposals ----

export async function createProposalAction(
  _prevState: ActionState | void,
  formData: FormData,
): Promise<ActionState | void> {
  const rawData: Record<string, unknown> = {
    client_id: formData.get("client_id"),
    template_type: formData.get("template_type"),
    title: formData.get("title"),
    issue_date: formData.get("issue_date"),
    valid_until: formData.get("valid_until") || undefined,
    currency: formData.get("currency") || "usd",
    total_amount_minor: Number(formData.get("total_amount_minor")) || 0,
    deposit_amount_minor: formData.get("deposit_amount_minor")
      ? Number(formData.get("deposit_amount_minor"))
      : null,
    payment_choice: formData.get("payment_choice") || "full",
    internal_notes: formData.get("internal_notes") || undefined,
    connector_company: formData.get("connector_company") || undefined,
    connector_name: formData.get("connector_name") || undefined,
    purpose_text: formData.get("purpose_text") || undefined,
    scope_text: formData.get("scope_text") || undefined,
    access_fee_label: formData.get("access_fee_label") || undefined,
    access_fee_amount: formData.get("access_fee_amount") ? Number(formData.get("access_fee_amount")) : undefined,
    access_fee_description: formData.get("access_fee_description") || undefined,
    engagement_total_amount: formData.get("engagement_total_amount") ? Number(formData.get("engagement_total_amount")) : undefined,
    engagement_months: formData.get("engagement_months") ? Number(formData.get("engagement_months")) : undefined,
    engagement_description: formData.get("engagement_description") || undefined,
    success_fee_percent: formData.get("success_fee_percent") ? Number(formData.get("success_fee_percent")) : undefined,
    success_fee_duration_months: formData.get("success_fee_duration_months") ? Number(formData.get("success_fee_duration_months")) : undefined,
    success_fee_description: formData.get("success_fee_description") || undefined,
    compliance_text: formData.get("compliance_text") || undefined,
    success_definition: formData.get("success_definition") || undefined,
    failure_definition: formData.get("failure_definition") || undefined,
    trial_period_days: formData.get("trial_period_days") ? Number(formData.get("trial_period_days")) : undefined,
    trial_description: formData.get("trial_description") || undefined,
    term_text: formData.get("term_text") || undefined,
    confidentiality_text: formData.get("confidentiality_text") || undefined,
    contractor_text: formData.get("contractor_text") || undefined,
  };

  const parsed = proposalCreateSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | string | undefined
      >,
    };
  }

  try {
    const proposal = await createProposal(parsed.data);
    revalidatePath("/proposals");
    revalidatePath("/dashboard");
    redirect(`/proposals/${proposal.id}`);
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to create proposal",
      },
    };
  }
}

export async function updateProposalAction(
  _prevState: ActionState | void,
  formData: FormData,
  id: string,
): Promise<ActionState | { success: true }> {
  const rawData: Record<string, unknown> = {
    title: formData.get("title") || undefined,
    issue_date: formData.get("issue_date") || undefined,
    valid_until: formData.get("valid_until") || undefined,
    currency: formData.get("currency") || undefined,
    total_amount_minor: formData.get("total_amount_minor")
      ? Number(formData.get("total_amount_minor"))
      : undefined,
    deposit_amount_minor: formData.get("deposit_amount_minor")
      ? Number(formData.get("deposit_amount_minor"))
      : undefined,
    payment_choice: formData.get("payment_choice") || undefined,
    internal_notes: formData.get("internal_notes") || undefined,
    connector_company: formData.get("connector_company") || undefined,
    connector_name: formData.get("connector_name") || undefined,
    purpose_text: formData.get("purpose_text") || undefined,
    scope_text: formData.get("scope_text") || undefined,
    access_fee_label: formData.get("access_fee_label") || undefined,
    access_fee_amount: formData.get("access_fee_amount") ? Number(formData.get("access_fee_amount")) : undefined,
    access_fee_description: formData.get("access_fee_description") || undefined,
    engagement_total_amount: formData.get("engagement_total_amount") ? Number(formData.get("engagement_total_amount")) : undefined,
    engagement_months: formData.get("engagement_months") ? Number(formData.get("engagement_months")) : undefined,
    engagement_description: formData.get("engagement_description") || undefined,
    success_fee_percent: formData.get("success_fee_percent") ? Number(formData.get("success_fee_percent")) : undefined,
    success_fee_duration_months: formData.get("success_fee_duration_months") ? Number(formData.get("success_fee_duration_months")) : undefined,
    success_fee_description: formData.get("success_fee_description") || undefined,
    compliance_text: formData.get("compliance_text") || undefined,
    success_definition: formData.get("success_definition") || undefined,
    failure_definition: formData.get("failure_definition") || undefined,
    trial_period_days: formData.get("trial_period_days") ? Number(formData.get("trial_period_days")) : undefined,
    trial_description: formData.get("trial_description") || undefined,
    term_text: formData.get("term_text") || undefined,
    confidentiality_text: formData.get("confidentiality_text") || undefined,
    contractor_text: formData.get("contractor_text") || undefined,
  };

  try {
    await updateProposalDraft(id, rawData);
    revalidatePath(`/proposals/${id}`);
    revalidatePath("/proposals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to update proposal",
      },
    };
  }
}

export async function publishProposalAction(
  id: string,
): Promise<ActionState | { success: true }> {
  try {
    await publishProposal(id);
    revalidatePath(`/proposals/${id}`);
    revalidatePath("/proposals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to publish proposal",
      },
    };
  }
}

export async function unpublishProposalAction(
  id: string,
): Promise<ActionState | { success: true }> {
  try {
    await unpublishProposal(id);
    revalidatePath(`/proposals/${id}`);
    revalidatePath("/proposals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to unpublish proposal",
      },
    };
  }
}

export async function duplicateProposalAction(id: string) {
  try {
    const proposal = await duplicateProposal(id);
    revalidatePath("/proposals");
    revalidatePath("/dashboard");
    redirect(`/proposals/${proposal.id}`);
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to duplicate proposal",
      },
    };
  }
}

export async function archiveProposalAction(id: string) {
  try {
    await archiveProposal(id);
    revalidatePath("/proposals");
    revalidatePath("/dashboard");
    redirect("/proposals");
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to archive proposal",
      },
    };
  }
}

// ---- Acceptance ----

export async function acceptProposalAction(
  _prevState: ActionState | void,
  formData: FormData,
): Promise<ActionState | { success: true; acceptance: unknown }> {
  const parsed = acceptanceSchema.safeParse({
    proposal_token: formData.get("proposal_token"),
    signer_name: formData.get("signer_name"),
    signer_email: formData.get("signer_email"),
    signer_title: formData.get("signer_title") || undefined,
    consent_given:
      formData.get("consent_given") === "true" ? true : undefined,
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[] | string | undefined
      >,
    };
  }

  try {
    const headersList = await headers();
    const ip =
      headersList
        .get("x-forwarded-for")
        ?.split(",")[0]
        ?.trim() ?? undefined;
    const userAgent = headersList.get("user-agent") ?? undefined;

    const signature = formData.get("signature") as string | null;

    const acceptance = await acceptProposal(
      parsed.data.proposal_token,
      {
        signer_name: parsed.data.signer_name,
        signer_email: parsed.data.signer_email,
        signer_title: parsed.data.signer_title,
        consent_given: true,
        ...(signature ? { signature } : {}),
      },
      ip,
      userAgent,
    );

    revalidatePath(`/p/${parsed.data.proposal_token}`);
    return { success: true, acceptance };
  } catch (e) {
    return {
      errors: {
        _form:
          e instanceof Error ? e.message : "Failed to accept proposal",
      },
    };
  }
}

// ---- Stripe ----

export async function createCheckoutSession(
  proposalToken: string,
  paymentKind: "deposit" | "full" | "subscribe",
): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/checkout`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalToken, paymentKind }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return { error: data.error || "Failed to create checkout session" };
    }

    return { url: data.url };
  } catch {
    return { error: "Failed to create checkout session" };
  }
}

// ---- Call script parsing ----

export async function parseCallScriptAction(
  clientId: string,
  scriptText: string,
) {
  try {
    // Get client name for context
    const { createClient: createServerClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createServerClient();
    const { data: client } = await supabase
      .from("clients")
      .select("company_name")
      .eq("id", clientId)
      .single();

    const clientName = client?.company_name ?? "Unknown";
    const parsed = await parseCallScript(scriptText, clientName);

    return { parsed };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to parse script",
    };
  }
}

// ---- Admin signature ----

export async function adminSignAction(
  proposalId: string,
  signatureDataUrl: string,
): Promise<{ success: true } | { error: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  try {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, clients!inner(contact_name, contact_email), acceptances(*)")
      .eq("id", proposalId)
      .single();

    if (!proposal) return { error: "Proposal not found" };

    const acceptance = (proposal.acceptances as unknown as Record<string, unknown>[])?.[0];
    if (!acceptance) return { error: "No client acceptance found yet" };

    // Update acceptance with admin signature
    await supabase
      .from("acceptances")
      .update({
        admin_signature: signatureDataUrl,
        admin_signed_at: new Date().toISOString(),
      })
      .eq("id", acceptance.id);

    // Email client that both parties signed
    const client = (proposal.clients as unknown as { contact_name: string; contact_email: string }[])?.[0];
    if (client?.contact_email) {
      sendAdminSignedEmail({
        token: proposal.public_token as string,
        proposalNumber: proposal.proposal_number as string,
        proposalTitle: proposal.title as string,
        clientName: client.contact_name,
        clientEmail: client.contact_email,
      }).catch(() => {});
    }

    revalidatePath(`/proposals/${proposalId}`);
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to sign",
    };
  }
}

// ---- Send proposal link ----

export async function sendProposalLinkAction(
  proposalId: string,
): Promise<{ success: true } | { error: string }> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  try {
    const { data: proposal } = await supabase
      .from("proposals")
      .select("*, clients!inner(contact_name, contact_email)")
      .eq("id", proposalId)
      .single();

    if (!proposal) return { error: "Proposal not found" };

    const client = (proposal.clients as unknown as { contact_name: string; contact_email: string }[])?.[0];
    if (!client?.contact_email) return { error: "Client has no email address" };

    await sendProposalLink({
      proposalNumber: proposal.proposal_number as string,
      proposalTitle: proposal.title as string,
      token: proposal.public_token as string,
      clientName: client.contact_name,
      clientEmail: client.contact_email,
    });

    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to send email",
    };
  }
}
