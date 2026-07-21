import { createAdminClient } from "@/lib/supabase/admin";
import { createHash } from "crypto";
import { sendClientSignedEmails } from "@/lib/email/service";

function canonicalJson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export function hashSnapshot(snapshot: Record<string, unknown>): string {
  return createHash("sha256")
    .update(canonicalJson(snapshot))
    .digest("hex");
}

export async function getPublicProposal(token: string) {
  const supabase = createAdminClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select(
      `
      id,
      proposal_number,
      template_type,
      title,
      status,
      issue_date,
      valid_until,
      currency,
      total_amount_minor,
      deposit_amount_minor,
      payment_choice,
      draft_data,
      published_version_id,
      accepted_version_id,
      first_viewed_at,
      last_viewed_at,
      view_count,
      accepted_at,
      amount_paid_minor,
      public_token,
      clients!inner(
        company_name,
        contact_name,
        contact_email,
        contact_title,
        address_text
      )
    `,
    )
    .eq("public_token", token)
    .single();

  if (error || !proposal) return null;

  // Only published, viewed, accepted, payment_pending, partially_paid, paid
  const visibleStatuses = [
    "published",
    "viewed",
    "accepted",
    "payment_pending",
    "partially_paid",
    "paid",
  ];

  if (!visibleStatuses.includes(proposal.status)) return null;

  // If expired, still show but don't allow actions
  const isExpired =
    proposal.valid_until &&
    new Date(proposal.valid_until) < new Date();

  // If proposal is accepted, use the accepted version snapshot
  let displayData = proposal.draft_data as Record<string, unknown>;
  if (
    proposal.accepted_version_id &&
    ["accepted", "payment_pending", "partially_paid", "paid"].includes(
      proposal.status,
    )
  ) {
    const { data: acceptedVersion } = await supabase
      .from("proposal_versions")
      .select("snapshot")
      .eq("id", proposal.accepted_version_id)
      .single();

    if (acceptedVersion) {
      displayData = acceptedVersion.snapshot as Record<string, unknown>;
    }
  }

  // Check if already accepted
  const { data: acceptance } = await supabase
    .from("acceptances")
    .select("*")
    .eq("proposal_id", proposal.id)
    .maybeSingle();

  return {
    ...proposal,
    displayData,
    isExpired,
    acceptance: acceptance ?? null,
  };
}

export async function recordProposalView(token: string) {
  const supabase = createAdminClient();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("id, status, first_viewed_at, view_count")
    .eq("public_token", token)
    .single();

  if (!proposal) return;

  const updates: Record<string, unknown> = {
    last_viewed_at: new Date().toISOString(),
    view_count: (proposal.view_count ?? 0) + 1,
  };

  if (!proposal.first_viewed_at) {
    updates.first_viewed_at = new Date().toISOString();
    if (proposal.status === "published") {
      updates.status = "viewed";
    }
  }

  await supabase.from("proposals").update(updates).eq("id", proposal.id);
}

export async function acceptProposal(
  token: string,
  input: {
    signer_name: string;
    signer_email: string;
    signer_title?: string;
    consent_given: true;
    signature?: string;
  },
  ipAddress?: string,
  userAgent?: string,
) {
  const supabase = createAdminClient();

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*, proposal_versions!proposals_published_version_fk(*)")
    .eq("public_token", token)
    .single();

  if (error || !proposal) {
    throw new Error("Proposal not found");
  }

  // Validate state
  if (!["published", "viewed"].includes(proposal.status)) {
    throw new Error(
      proposal.status === "accepted" || proposal.status === "payment_pending" ||
      proposal.status === "partially_paid" || proposal.status === "paid"
        ? "This proposal has already been accepted"
        : "This proposal cannot be accepted",
    );
  }

  if (proposal.valid_until && new Date(proposal.valid_until) < new Date()) {
    throw new Error("This proposal has expired");
  }

  // Find the published version
  const version = proposal.proposal_versions as unknown as Record<string, unknown>;
  if (!version?.id) {
    throw new Error("No published version found");
  }

  // Build the accepted snapshot
  const snapshot = {
    ...(proposal.draft_data as Record<string, unknown>),
    accepted_at: new Date().toISOString(),
    signer_name: input.signer_name,
    signer_email: input.signer_email,
    ...(input.signature ? { signature: input.signature } : {}),
  };

  const snapshotHash = hashSnapshot(snapshot as Record<string, unknown>);

  const consentText =
    "I have reviewed and agree to this proposal and its terms.";

  // Check for duplicate acceptance
  const { data: existingAcceptance } = await supabase
    .from("acceptances")
    .select("id")
    .eq("proposal_id", proposal.id)
    .maybeSingle();

  if (existingAcceptance) {
    throw new Error("This proposal has already been accepted");
  }

  // Create acceptance record
  const { data: acceptance, error: acceptanceError } = await supabase
    .from("acceptances")
    .insert({
      proposal_id: proposal.id,
      proposal_version_id: version.id,
      signer_name: input.signer_name,
      signer_email: input.signer_email,
      signer_title: input.signer_title || null,
      consent_text: consentText,
      consent_given: true,
      accepted_snapshot: snapshot as unknown as Record<string, unknown>,
      accepted_snapshot_hash: snapshotHash,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    })
    .select()
    .single();

  if (acceptanceError) throw acceptanceError;

  // Update proposal status
  const newStatus =
    proposal.payment_choice !== "none" &&
    proposal.total_amount_minor > 0
      ? "payment_pending"
      : "accepted";

  const { error: updateError } = await supabase
    .from("proposals")
    .update({
      status: newStatus,
      accepted_version_id: version.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", proposal.id);

  if (updateError) throw updateError;

  // Fire-and-forget email notifications
  sendClientSignedEmails({
    token,
    proposalNumber: proposal.proposal_number as string,
    proposalTitle: proposal.title as string,
    signerName: input.signer_name,
    signerEmail: input.signer_email,
  }).catch(() => {});

  return acceptance;
}
