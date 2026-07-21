import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/validation/money";

export default async function DashboardPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: proposals } = await supabase
    .from("proposals")
    .select(
      `
      id,
      proposal_number,
      title,
      status,
      total_amount_minor,
      currency,
      first_viewed_at,
      last_viewed_at,
      accepted_at,
      amount_paid_minor,
      updated_at,
      public_token,
      clients!inner(company_name)
    `,
    )
    .order("updated_at", { ascending: false })
    .limit(50);

  const proposalsList = proposals ?? [];

  // Summary stats
  const total = proposalsList.length;
  const published = proposalsList.filter((p) => ["published", "viewed"].includes(p.status)).length;
  const accepted = proposalsList.filter((p) => ["accepted", "payment_pending", "partially_paid"].includes(p.status)).length;
  const paid = proposalsList.filter((p) => p.status === "paid").length;
  const totalRevenue = proposalsList
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (p.amount_paid_minor as number), 0);

  const stats = [
    { label: "Total", value: String(total), sub: "all proposals" },
    { label: "Published", value: String(published), sub: "awaiting signature" },
    { label: "Accepted", value: String(accepted), sub: "awaiting payment" },
    { label: "Revenue", value: formatMoney(totalRevenue, "usd"), sub: `${paid} paid` },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Proposal overview</p>
        </div>
        <Link href="/proposals/new">
          <Button>New proposal</Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {s.label}
            </p>
            <p className="text-2xl font-bold text-foreground mt-2 tabular-nums">
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {proposalsList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No proposals yet.
          </p>
          <Link href="/proposals/new" className="mt-2 inline-block">
            <Button variant="secondary" size="sm">
              Create your first proposal
            </Button>
          </Link>
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
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">
                  Amount
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">
                  Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {proposalsList.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
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
                  <td className="px-4 py-3 text-right tabular-nums text-foreground hidden sm:table-cell">
                    {formatMoney(p.total_amount_minor, p.currency)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(p.updated_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
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
