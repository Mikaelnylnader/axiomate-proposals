import { requireAdmin } from "@/lib/auth";
import { getClients } from "@/lib/proposal/service";
import { templates } from "@/lib/proposal/templates";
import { ProposalForm } from "@/components/admin/proposal-form";

export default async function NewProposalPage() {
  await requireAdmin();
  const clients = await getClients();

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--brand-ink)]">
          New proposal
        </h1>
        <p className="text-sm text-[var(--brand-muted)]">
          Select a template and fill in the details
        </p>
      </div>

      <ProposalForm
        clients={clients}
        templates={Object.values(templates)}
      />
    </div>
  );
}
