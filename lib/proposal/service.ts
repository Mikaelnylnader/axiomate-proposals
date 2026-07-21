import { createClient } from "@/lib/supabase/server";
import {
  type ProposalCreateInput,
  type ProposalStatus,
  type DraftData,
  canTransition,
} from "@/lib/validation/schemas";
import { getTemplate } from "@/lib/proposal/templates";
import { createHash } from "crypto";

function generateProposalNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AXM-${year}-${seq}`;
}

function canonicalJson(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

function hashSnapshot(snapshot: Record<string, unknown>): string {
  return createHash("sha256")
    .update(canonicalJson(snapshot))
    .digest("hex");
}

const DRAFT_FIELDS = [
  "connector_company",
  "connector_name",
  "purpose_text",
  "scope_text",
  "access_fee_label",
  "access_fee_amount",
  "access_fee_description",
  "engagement_total_amount",
  "engagement_months",
  "engagement_description",
  "success_fee_percent",
  "success_fee_duration_months",
  "success_fee_description",
  "compliance_text",
  "success_definition",
  "failure_definition",
  "trial_period_days",
  "trial_description",
  "term_text",
  "confidentiality_text",
  "contractor_text",
];

export async function createClientRecord(input: {
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_title?: string;
  address_text?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("clients")
    .insert({
      company_name: input.company_name,
      contact_name: input.contact_name,
      contact_email: input.contact_email,
      contact_title: input.contact_title || null,
      address_text: input.address_text || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .is("archived_at", null)
    .order("company_name");

  if (error) throw error;
  return data ?? [];
}

export async function createProposal(input: ProposalCreateInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const proposalNumber = generateProposalNumber();

  const template = getTemplate(input.template_type);
  const draftData: Record<string, unknown> = {
    ...(template?.defaults ?? {}),
  };

  // Merge provided draft fields
  for (const field of DRAFT_FIELDS) {
    if (field in input && (input as Record<string, unknown>)[field] !== undefined) {
      draftData[field] = (input as Record<string, unknown>)[field];
    }
  }

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      proposal_number: proposalNumber,
      client_id: input.client_id,
      template_type: input.template_type,
      title: input.title,
      issue_date: input.issue_date,
      valid_until: input.valid_until || null,
      currency: input.currency,
      total_amount_minor: input.total_amount_minor,
      deposit_amount_minor: input.deposit_amount_minor ?? null,
      payment_choice: input.payment_choice,
      internal_notes: input.internal_notes || null,
      draft_data: draftData as Record<string, unknown>,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getProposal(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*, clients(*)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProposalDraft(
  id: string,
  input: Partial<Record<string, unknown>>,
) {
  const supabase = await createClient();
  const proposal = await getProposal(id);

  if (proposal.status !== "draft") {
    throw new Error("Only draft proposals can be edited");
  }

  const updateData: Record<string, unknown> = {};

  // Update top-level fields
  const topFields = [
    "title",
    "issue_date",
    "valid_until",
    "currency",
    "total_amount_minor",
    "deposit_amount_minor",
    "payment_choice",
    "internal_notes",
  ];
  for (const field of topFields) {
    if (field in input && input[field] !== undefined) {
      updateData[field] = input[field];
    }
  }

  // Merge draft data
  const existingDraft = (proposal.draft_data as Record<string, unknown>) ?? {};
  const newDraftData: Record<string, unknown> = { ...existingDraft };

  for (const field of DRAFT_FIELDS) {
    if (field in input && input[field] !== undefined) {
      newDraftData[field] = input[field];
    }
  }

  updateData.draft_data = newDraftData;

  const { data, error } = await supabase
    .from("proposals")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function publishProposal(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const proposal = await getProposal(id);

  if (!canTransition(proposal.status as ProposalStatus, "published")) {
    throw new Error(
      `Cannot publish a proposal with status "${proposal.status}"`,
    );
  }

  const clientData = proposal.clients as Record<string, unknown>;

  const snapshot = {
    title: proposal.title,
    template_type: proposal.template_type,
    issue_date: proposal.issue_date,
    valid_until: proposal.valid_until,
    currency: proposal.currency,
    total_amount_minor: proposal.total_amount_minor,
    deposit_amount_minor: proposal.deposit_amount_minor,
    payment_choice: proposal.payment_choice,
    client: {
      company_name: clientData?.company_name,
      contact_name: clientData?.contact_name,
      contact_email: clientData?.contact_email,
    },
    ...(proposal.draft_data as Record<string, unknown>),
    published_at: new Date().toISOString(),
  };

  const snapshotHash = hashSnapshot(snapshot as Record<string, unknown>);

  const { data: version, error: versionError } = await supabase
    .from("proposal_versions")
    .insert({
      proposal_id: id,
      version_number: 1,
      snapshot: snapshot as Record<string, unknown>,
      snapshot_hash: snapshotHash,
      published_at: new Date().toISOString(),
      created_by: user.id,
    })
    .select()
    .single();

  if (versionError) throw versionError;

  const { data, error } = await supabase
    .from("proposals")
    .update({
      status: "published",
      published_version_id: version.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function unpublishProposal(id: string) {
  const supabase = await createClient();
  const proposal = await getProposal(id);

  if (!["published", "viewed"].includes(proposal.status)) {
    throw new Error("Only published proposals can be unpublished");
  }

  const { data, error } = await supabase
    .from("proposals")
    .update({ status: "draft" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function duplicateProposal(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const original = await getProposal(id);

  const { data, error } = await supabase
    .from("proposals")
    .insert({
      proposal_number: generateProposalNumber(),
      client_id: original.client_id,
      template_type: original.template_type,
      title: `${original.title} (copy)`,
      issue_date: new Date().toISOString().split("T")[0],
      currency: original.currency,
      total_amount_minor: original.total_amount_minor,
      deposit_amount_minor: original.deposit_amount_minor,
      payment_choice: original.payment_choice,
      draft_data: original.draft_data,
      internal_notes: null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function archiveProposal(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("proposals")
    .update({
      status: "archived",
      archived_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---- Call script parsing ----

export async function parseCallScript(
  scriptText: string,
  clientName: string,
): Promise<Partial<DraftData>> {
  // Extract key information from a call/meeting transcript
  // This is a structured extraction using pattern matching + heuristics
  const draft: Partial<DraftData> = {};

  // Try to find ICP / target market
  const icpMatch = scriptText.match(
    /(?:ICP|ideal customer|target (?:market|audience|client|segment)|looking for|who need[s]?)\s*(?:is|:)?\s*([^.!?\n]{20,300})/i,
  );
  if (icpMatch) {
    draft.success_definition = `Target: ${icpMatch[1].trim()}`;
  }

  // Try to find scope / deliverables
  const scopeMatch = scriptText.match(
    /(?:scope|deliverables|what we'?ll do|we will|we'll provide|services? include)\s*(?:is|:)?\s*([^.!?\n]{30,500})/i,
  );
  if (scopeMatch) {
    const existing = draft.scope_text || "";
    draft.scope_text = existing
      ? `${existing}\n\nFrom call: ${scopeMatch[1].trim()}`
      : scopeMatch[1].trim();
  }

  // Try to find pricing / budget
  const priceMatch = scriptText.match(
    /(?:price|pricing|budget|fee|cost|per month|monthly|investment)\s*(?:is|:)?\s*(?:[$€£])?\s*(\d[\d,.]*)\s*(?:k|000)?/gi,
  );
  if (priceMatch) {
    const amounts = priceMatch.map((m) => {
      const num = parseInt(m.replace(/[^0-9]/g, ""), 10);
      return num;
    });
    const maxAmount = Math.max(...amounts);
    if (maxAmount > 0) {
      draft.access_fee_amount = maxAmount * 100; // Convert to minor units
    }
  }

  // Try to find success fee
  const successFeeMatch = scriptText.match(
    /(?:success fee|commission|percentage|revenue share)\s*(?:of|is|:)?\s*(\d+)\s*%/i,
  );
  if (successFeeMatch) {
    draft.success_fee_percent = parseInt(successFeeMatch[1], 10);
  }

  // Try to find trial period
  const trialMatch = scriptText.match(
    /(?:trial|test period|pilot)\s*(?:of|for|is)?\s*(\d+)\s*(?:day|month)/i,
  );
  if (trialMatch) {
    const num = parseInt(trialMatch[1], 10);
    draft.trial_period_days = trialMatch[0].toLowerCase().includes("month")
      ? num * 30
      : num;
  }

  // Try to find industry / vertical
  const industryMatch = scriptText.match(
    /(?:industry|vertical|sector|niche|space)\s*(?:is|:)?\s*([^.!?\n]{10,200})/i,
  );
  if (industryMatch) {
    const existing = draft.purpose_text || "";
    draft.purpose_text = `Industry focus: ${industryMatch[1].trim()}${existing ? `\n\n${existing}` : ""}`;
  }

  return draft;
}
