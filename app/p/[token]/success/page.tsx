import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublicProposal } from "@/lib/proposal/public";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatMoney } from "@/lib/validation/money";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SuccessPage({ params }: PageProps) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();

  const status = proposal.status as string;
  const isPaid = status === "paid";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {isPaid ? (
          <div className="rounded-full bg-green-500/20 p-3 w-16 h-16 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        ) : (
          <div className="rounded-full bg-amber-500/20 p-3 w-16 h-16 flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {isPaid ? "Payment received" : "Payment processing"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPaid
              ? `Thank you. Your payment of ${formatMoney(proposal.amount_paid_minor as number, proposal.currency as string)} has been received.`
              : "Your payment is being processed. This may take a moment for some payment methods."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-left">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {proposal.proposal_number as string}
            </span>
            <StatusBadge status={status} />
          </div>
          <p className="mt-1 font-medium text-foreground">
            {proposal.title as string}
          </p>
          <p className="mt-2 text-xl font-semibold tabular-nums">
            {formatMoney(
              proposal.total_amount_minor as number,
              proposal.currency as string,
            )}
          </p>
          {(proposal.amount_paid_minor as number) > 0 && (
            <p className="text-sm text-green-400 mt-1">
              Paid:{" "}
              {formatMoney(
                proposal.amount_paid_minor as number,
                proposal.currency as string,
              )}
            </p>
          )}
        </div>

        <Link
          href={`/p/${token}`}
          className="inline-block text-sm text-primary hover:underline"
        >
          Back to proposal
        </Link>
      </div>
    </div>
  );
}
