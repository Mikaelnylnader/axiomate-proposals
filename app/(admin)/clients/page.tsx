import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function ClientsPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .is("archived_at", null)
    .order("company_name");

  const clientsList = clients ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Clients
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage client records
          </p>
        </div>
        <Link href="/clients/new">
          <Button>Add client</Button>
        </Link>
      </div>

      {clientsList.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No clients yet. Add your first client to create a proposal.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Company
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Contact
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Email
                </th>
              </tr>
            </thead>
            <tbody>
              {clientsList.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border last:border-0 hover:bg-accent/30"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.company_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.contact_name}
                    {c.contact_title ? ` — ${c.contact_title}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {c.contact_email}
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
