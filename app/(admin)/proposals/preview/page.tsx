import { requireAdmin } from "@/lib/auth";
import { getTemplate } from "@/lib/proposal/templates";
import { PublicProposalView } from "@/components/proposal/public-view";

export default async function PreviewPage() {
  await requireAdmin();

  const template = getTemplate("introductions_agreement");
  const defaults = template?.defaults ?? {};

  // Build a mock proposal so the public view renders exactly as a client would see it
  const mockProposal = {
    id: "preview",
    proposal_number: "AXM-PREVIEW",
    title: template?.defaultTitle ?? "Introductions Agreement",
    status: "published",
    template_type: "introductions_agreement",
    issue_date: new Date().toISOString().split("T")[0],
    valid_until: null,
    currency: "usd",
    total_amount_minor: 0,
    deposit_amount_minor: null,
    payment_choice: "full",
    first_viewed_at: null,
    last_viewed_at: null,
    view_count: 0,
    accepted_at: null,
    amount_paid_minor: 0,
    public_token: "preview",
    // The key part — template defaults rendered as the proposal content
    displayData: {
      ...defaults,
      // Override with realistic preview values where defaults are empty
      access_fee_amount: defaults.access_fee_amount || 250000,
      success_fee_percent: defaults.success_fee_percent || 10,
      success_fee_duration_months: defaults.success_fee_duration_months || 12,
      trial_period_days: defaults.trial_period_days || 90,
    },
    isExpired: false,
    acceptance: null,
    clients: {
      company_name: "Acme Inc. (sample client)",
      contact_name: "Jane Smith",
      contact_email: "jane@acme.com",
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Template preview
          </h1>
          <p className="text-sm text-muted-foreground">
            {template?.displayName} — exactly what the client sees
          </p>
        </div>
        <span className="rounded-full bg-primary/10 border border-primary/30 px-3 py-1 text-xs text-primary font-medium">
          Preview mode
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <PublicProposalView
          proposal={mockProposal as unknown as Record<string, unknown>}
          token="preview"
        />
      </div>
    </div>
  );
}
