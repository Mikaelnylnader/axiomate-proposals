export function StatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    draft: "Draft",
    published: "Published",
    viewed: "Viewed",
    accepted: "Accepted",
    payment_pending: "Payment pending",
    partially_paid: "Partially paid",
    paid: "Paid",
    expired: "Expired",
    declined: "Declined",
    archived: "Archived",
    superseded: "Superseded",
  };

  const colors: Record<string, string> = {
    draft: "bg-secondary text-muted-foreground",
    published: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    viewed: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30",
    accepted: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    payment_pending: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    partially_paid: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    paid: "bg-green-500/10 text-green-400 border border-green-500/30",
    expired: "bg-red-500/10 text-red-400 border border-red-500/30",
    declined: "bg-red-500/10 text-red-400 border border-red-500/30",
    archived: "bg-secondary text-muted-foreground",
    superseded: "bg-secondary text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-secondary text-muted-foreground"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
