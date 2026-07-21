export function getStatusLabel(status: string): string {
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
  return labels[status] ?? status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-700",
    published: "bg-blue-100 text-blue-700",
    viewed: "bg-indigo-100 text-indigo-700",
    accepted: "bg-emerald-100 text-emerald-700",
    payment_pending: "bg-amber-100 text-amber-700",
    partially_paid: "bg-orange-100 text-orange-700",
    paid: "bg-green-100 text-green-700",
    expired: "bg-red-100 text-red-700",
    declined: "bg-red-100 text-red-700",
    archived: "bg-zinc-200 text-zinc-500",
    superseded: "bg-zinc-200 text-zinc-500",
  };
  return colors[status] ?? "bg-zinc-100 text-zinc-700";
}
