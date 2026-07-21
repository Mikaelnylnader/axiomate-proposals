import type { DraftData } from "@/lib/validation/schemas";

export interface ProposalTemplate {
  id: string;
  displayName: string;
  defaultTitle: string;
  defaults: Partial<DraftData>;
}

export const templates: Record<string, ProposalTemplate> = {
  introductions_agreement: {
    id: "introductions_agreement",
    displayName: "Introductions Agreement",
    defaultTitle: "Introductions Agreement",
    defaults: {
      connector_company: "AxiomateAI",
      connector_name: "Mikael Nylander",
      // Purpose — exact wording from the Google Doc
      purpose_text:
        "Connector introduces potential business relationships to Client by facilitating introductions to companies or individuals who may benefit from Client's services.\n\nConnector does not:\n\n- advise on investments,\n- negotiate transactions,\n- act as a broker,\n- handle funds,\n- participate in regulated advisory activities.\n\nConnector's role is limited to introductions and relationship facilitation.",
      // Scope — exact wording
      scope_text:
        "Connector will:\n\n- Identify and contact potential counterparties\n- Facilitate qualified introductions\n- Provide context and warm connection between parties\n- Support early routing of conversations\n\nConnector does not participate in deal negotiation or execution.",
      // Compensation
      access_fee_label: "Access Fee (Monthly)",
      access_fee_amount: 0,
      access_fee_description:
        "Client pays Connector a fixed monthly access fee. This covers ongoing sourcing and introductions.",
      success_fee_percent: 0,
      success_fee_duration_months: 12,
      success_fee_description:
        "If Client generates revenue directly from an introduction made by Connector, Client agrees to pay the success fee percentage of collected revenue for the specified duration from the start of that relationship. Payment applies only to revenue directly resulting from Connector introductions.",
      // Compliance — exact wording
      compliance_text:
        "Compensation is for:\n\n- introduction access,\n- relationship facilitation,\n- sourcing activities.\n\nCompensation is not tied to investment transactions, securities placement, or regulated advisory activity.\n\nConnector acts solely as an independent introducer.",
      // Success / failure — exact wording
      success_definition:
        "A success occurs when an introduced party becomes a paying client of Client.",
      failure_definition:
        "Failure is defined as:\n\n- No qualified introductions provided within a continuous period of 60 days\n\nOR\n\n- Introductions consistently failing qualification standards agreed beforehand.\n\nIf failure occurs, parties may renegotiate or terminate agreement.",
      // Engagement (paid initial period)
      engagement_total_amount: 700000,
      engagement_months: 3,
      engagement_description:
        "The 90-day engagement is $7,000 paid upfront. During this period, Connector will identify, contact, and facilitate qualified introductions. After the initial engagement, the Agreement converts to a month-to-month subscription.",
      trial_period_days: 90,
      // Term & Termination — exact wording
      term_text:
        "Agreement runs month-to-month unless otherwise agreed.\n\nEither party may terminate with 30 days written notice.\n\nOutstanding success fees remain payable.",
      // Confidentiality — exact wording
      confidentiality_text:
        "Both parties agree to maintain confidentiality regarding shared contacts and information.",
      // Independent Contractor — exact wording
      contractor_text:
        "Connector operates as an independent contractor and not as an employee, broker, or advisor.",
    },
  },
};

export function getTemplate(type: string): ProposalTemplate | undefined {
  return templates[type];
}
