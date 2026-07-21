// ---- Database row types ----

export interface Client {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_title: string | null;
  address_text: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface Proposal {
  id: string;
  proposal_number: string;
  client_id: string;
  template_type: "introductions_agreement";
  title: string;
  status: ProposalStatus;
  issue_date: string;
  valid_until: string | null;
  currency: string;
  total_amount_minor: number;
  deposit_amount_minor: number | null;
  payment_choice: "none" | "deposit" | "full" | "deposit_or_full";
  draft_data: DraftData;
  internal_notes: string | null;
  public_token: string;
  published_version_id: string | null;
  accepted_version_id: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  accepted_at: string | null;
  paid_at: string | null;
  amount_paid_minor: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  clients?: Client;
}

export type ProposalStatus =
  | "draft"
  | "published"
  | "viewed"
  | "accepted"
  | "payment_pending"
  | "partially_paid"
  | "paid"
  | "expired"
  | "declined"
  | "archived"
  | "superseded";

export interface DraftData {
  connector_company?: string;
  connector_name?: string;
  purpose_text?: string;
  scope_text?: string;
  access_fee_label?: string;
  access_fee_amount?: number;
  access_fee_description?: string;
  success_fee_percent?: number;
  success_fee_duration_months?: number;
  success_fee_description?: string;
  compliance_text?: string;
  success_definition?: string;
  failure_definition?: string;
  trial_period_days?: number;
  trial_description?: string;
  term_text?: string;
  confidentiality_text?: string;
  contractor_text?: string;
  // Legacy fields kept for backward compat
  executive_summary?: string;
  fee_label?: string;
  [key: string]: unknown;
}

export interface Acceptance {
  id: string;
  proposal_id: string;
  proposal_version_id: string;
  signer_name: string;
  signer_email: string;
  signer_title: string | null;
  consent_text: string;
  consent_given: boolean;
  accepted_snapshot: Record<string, unknown>;
  accepted_snapshot_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  accepted_at: string;
}

export interface PublicProposal extends Proposal {
  displayData: DraftData;
  isExpired: boolean;
  acceptance: Acceptance | null;
}
