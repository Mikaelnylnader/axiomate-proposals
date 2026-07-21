import { z } from "zod";

// ---- Money helpers ----
export const moneySchema = z
  .number()
  .int("Amount must be in minor units (integer)")
  .nonnegative("Amount must not be negative");

export const currencySchema = z
  .string()
  .regex(/^[a-z]{3}$/, "Currency must be a 3-letter lowercase ISO code");

// ---- Client ----
export const clientSchema = z.object({
  company_name: z.string().min(1, "Company name is required").max(200),
  contact_name: z.string().min(1, "Contact name is required").max(200),
  contact_email: z.string().email("Valid email is required").max(254),
  contact_title: z.string().max(200).optional().or(z.literal("")),
  address_text: z.string().max(500).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

// ---- Proposal template types ----
export const templateTypeSchema = z.enum(["introductions_agreement"]);

export type TemplateType = z.infer<typeof templateTypeSchema>;

// ---- Proposal status ----
export const proposalStatusSchema = z.enum([
  "draft",
  "published",
  "viewed",
  "accepted",
  "payment_pending",
  "partially_paid",
  "paid",
  "expired",
  "declined",
  "archived",
  "superseded",
]);

export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

// ---- Payment choice ----
export const paymentChoiceSchema = z.enum([
  "none",
  "deposit",
  "full",
  "deposit_or_full",
]);

export type PaymentChoice = z.infer<typeof paymentChoiceSchema>;

// ---- Proposal draft data ----
export const draftDataSchema = z.object({
  // Parties
  connector_company: z.string().max(200).optional(),
  connector_name: z.string().max(200).optional(),
  // Purpose
  purpose_text: z.string().max(5000).optional(),
  // Scope
  scope_text: z.string().max(5000).optional(),
  // Compensation
  access_fee_label: z.string().max(200).optional(),
  access_fee_amount: moneySchema.optional(),
  access_fee_description: z.string().max(2000).optional(),
  success_fee_percent: z.number().min(0).max(100).optional(),
  success_fee_duration_months: z.number().int().min(1).max(120).optional(),
  success_fee_description: z.string().max(2000).optional(),
  // Compliance
  compliance_text: z.string().max(3000).optional(),
  // Success / failure definitions
  success_definition: z.string().max(2000).optional(),
  failure_definition: z.string().max(2000).optional(),
  // Engagement (paid initial period)
  engagement_total_amount: moneySchema.optional(),
  engagement_months: z.number().int().min(1).max(24).optional(),
  engagement_description: z.string().max(2000).optional(),
  // Legacy — kept for backward compat, now means engagement period
  trial_period_days: z.number().int().min(0).max(365).optional(),
  trial_description: z.string().max(2000).optional(),
  // Term
  term_text: z.string().max(3000).optional(),
  // Boilerplate
  confidentiality_text: z.string().max(3000).optional(),
  contractor_text: z.string().max(3000).optional(),
});

export type DraftData = z.infer<typeof draftDataSchema>;

// ---- Proposal create ----
export const proposalCreateSchema = z.object({
  client_id: z.string().uuid(),
  template_type: templateTypeSchema,
  title: z.string().min(1, "Title is required").max(300),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD required"),
  valid_until: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD required")
    .optional()
    .or(z.literal("")),
  currency: currencySchema.default("usd"),
  total_amount_minor: moneySchema.default(0),
  deposit_amount_minor: z
    .number()
    .int()
    .positive("Deposit must be positive")
    .optional()
    .nullable(),
  payment_choice: paymentChoiceSchema.default("full"),
  internal_notes: z.string().max(5000).optional().or(z.literal("")),
  // Draft data fields
  ...draftDataSchema.shape,
});

export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;

// ---- Call script import ----
export const callScriptSchema = z.object({
  client_id: z.string().uuid(),
  script_text: z
    .string()
    .min(50, "Call script should be at least 50 characters to be useful")
    .max(50000, "Script too long (max 50,000 characters)"),
});

export type CallScriptInput = z.infer<typeof callScriptSchema>;

// ---- Acceptance ----
export const acceptanceSchema = z.object({
  proposal_token: z.string().min(1),
  signer_name: z.string().min(1, "Full name is required").max(200),
  signer_email: z.string().email("Valid email is required").max(254),
  signer_title: z.string().max(200).optional().or(z.literal("")),
  consent_given: z.literal(true, {
    message: "You must agree to the proposal and terms",
  }),
});

export type AcceptanceInput = z.infer<typeof acceptanceSchema>;

// ---- Stripe checkout ----
export const checkoutRequestSchema = z.object({
  proposalToken: z.string().min(1),
  paymentKind: z.enum(["deposit", "full", "subscribe"]),
});

export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;

// ---- Valid state transitions ----
export const validTransitions: Record<ProposalStatus, ProposalStatus[]> = {
  draft: ["published", "archived"],
  published: ["viewed", "expired", "archived", "superseded"],
  viewed: ["accepted", "expired", "archived", "superseded"],
  accepted: ["payment_pending", "archived", "superseded"],
  payment_pending: ["partially_paid", "paid", "archived", "superseded"],
  partially_paid: ["paid", "archived", "superseded"],
  paid: ["archived", "superseded"],
  expired: ["archived", "superseded"],
  declined: ["archived"],
  archived: [],
  superseded: [],
};

export function canTransition(
  from: ProposalStatus,
  to: ProposalStatus,
): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}
