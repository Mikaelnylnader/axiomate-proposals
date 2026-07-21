import { notFound, redirect } from "next/navigation";
import { getPublicProposal } from "@/lib/proposal/public";
import { formatMoney } from "@/lib/validation/money";
import { PayButton } from "./pay-button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PayPage({ params }: PageProps) {
  const { token } = await params;
  const proposal = await getPublicProposal(token);
  if (!proposal) notFound();

  // If already paid, redirect to success
  if (proposal.status === "paid") {
    redirect(`/p/${token}/success`);
  }

  // If not accepted yet, redirect back to agreement
  const allowed = ["payment_pending", "partially_paid", "accepted"];
  if (!allowed.includes(proposal.status as string)) {
    redirect(`/p/${token}`);
  }

  const d = proposal.displayData as Record<string, unknown>;
  const client = (Array.isArray(proposal.clients)
    ? (proposal.clients as unknown as Record<string, unknown>[])[0]
    : proposal.clients) as unknown as Record<string, unknown>;
  const acceptance = proposal.acceptance as Record<string, unknown> | null;
  const engagementTotal = (d.engagement_total_amount as number) || 0;
  const engagementMonths = (d.engagement_months as number) || 3;
  const monthlyAfter = (d.access_fee_amount as number) || 0;
  const currency = proposal.currency as string;

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 no-print">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <a
              href="https://axiomateai.com"
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              &larr; axiomateai.com
            </a>
            <img
              src="https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png"
              alt="AxiomateAI"
              className="h-5 object-contain"
            />
          </div>
          <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
            Awaiting payment
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-10 md:p-16">
          {/* Logo */}
          <div className="text-center mb-10">
            <img
              src="https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png"
              alt="AxiomateAI"
              className="h-10 mx-auto mb-6 object-contain"
            />
          </div>

          {/* Signed confirmation */}
          <div className="rounded bg-green-50 border border-green-200 p-4 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold">
                ✓
              </span>
              <p className="text-sm font-medium text-green-800">
                Agreement signed
              </p>
            </div>
            {acceptance && (
              <p className="text-xs text-green-600 ml-8">
                Signed by {acceptance.signer_name as string} on{" "}
                {new Date(
                  acceptance.accepted_at as string,
                ).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>

          {/* Step 2 indicator */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white text-xs font-medium px-4 py-1.5">
              Step 2 of 2
            </span>
            <h1 className="text-2xl font-semibold text-neutral-900 mt-3">
              Complete payment
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {proposal.title as string} &mdash;{" "}
              {client?.company_name as string}
            </p>
          </div>

          {/* Payment details */}
          {engagementTotal > 0 ? (
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-neutral-700">
                  {engagementMonths}-Month Engagement
                </p>
                <p className="text-lg font-semibold text-neutral-900 tabular-nums">
                  {formatMoney(engagementTotal, currency)}
                </p>
              </div>
              <hr className="border-neutral-200 mb-3" />
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-neutral-500">Due today</p>
                <p className="text-lg font-semibold text-neutral-900 tabular-nums">
                  {formatMoney(engagementTotal, currency)}
                </p>
              </div>
              <p className="text-xs text-neutral-400 mt-3">
                After the {engagementMonths}-month engagement, continues at{" "}
                {monthlyAfter > 0
                  ? formatMoney(monthlyAfter, currency) + "/month"
                  : "the agreed monthly rate"}
                . Cancel anytime.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-6 mb-8 text-center">
              <p className="text-sm text-neutral-500">
                No payment is required at this time. The engagement is underway.
              </p>
            </div>
          )}

          {/* Pay button — client component for the Stripe redirect */}
          {engagementTotal > 0 && (
            <div className="text-center">
              <PayButton
                token={token}
                label={`Pay ${formatMoney(engagementTotal, currency)}`}
              />
              <p className="text-xs text-neutral-400 mt-3">
                Secure payment powered by Stripe
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <img
                src="https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png"
                alt="AxiomateAI"
                className="h-4 object-contain opacity-60"
              />
              <span>Signal-Based B2B Introductions</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://axiomateai.com"
                className="hover:text-neutral-600 transition-colors"
                target="_blank"
                rel="noopener"
              >
                axiomateai.com
              </a>
              <span>&middot;</span>
              <span>{proposal.proposal_number as string}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
