import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/validation/money";

export default async function ProposalsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      `
      id,
      proposal_number,
      title,
      template_type,
      status,
      total_amount_minor,
      currency,
      updated_at,
      clients!inner(company_name)
    `,
    )
    .is("archived_at", null)
    .order("updated_at", { ascending: false });

  const proposalsList = proposals ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Proposals
          </h1>
          <p className="text-sm text-muted-foreground">
            All active proposals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/proposals/preview">
            <Button variant="secondary" size="sm">Preview template</Button>
          </Link>
          <Link href="/proposals/new">
            <Button>New proposal</Button>
          </Link>
        </div>
      </div>

      {proposalsList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No proposals yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  #
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {proposalsList.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/proposals/${p.id}`}
                      className="text-primary hover:underline"
                    >
                      {p.proposal_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {(p.clients as unknown as { company_name: string })
                      ?.company_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground max-w-[200px] truncate">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-foreground">
                    {formatMoney(p.total_amount_minor, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
