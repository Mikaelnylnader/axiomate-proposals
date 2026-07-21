"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptProposalAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignaturePad } from "@/components/ui/signature-pad";
import { formatMoney } from "@/lib/validation/money";
import { show } from "@/lib/cn";

function fmt(v: unknown): string {
  return String(v ?? "");
}

interface Props {
  proposal: Record<string, unknown>;
  token: string;
  paymentCancelled?: boolean;
}

export function PublicProposalView({ proposal, token, paymentCancelled }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);

  const d = (proposal.displayData as Record<string, unknown>) ?? {};
  const client = proposal.clients as Record<string, unknown> | undefined;
  const isExpired = proposal.isExpired as boolean;
  const status = proposal.status as string;
  const canAccept = ["published", "viewed"].includes(status) && !isExpired;
  const acceptance = proposal.acceptance as Record<string, unknown> | null;

  const engagementTotal = (d.engagement_total_amount as number) || 0;
  const engagementMonths = (d.engagement_months as number) || 3;
  const monthlyAfter = (d.access_fee_amount as number) || 0;
  const successPct = fmt(d.success_fee_percent || "__");
  const successMonths = fmt(d.success_fee_duration_months || "__");
  const currency = proposal.currency as string;

  async function handleAccept(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setAccepting(true);
    const fd = new FormData(e.currentTarget);
    fd.append("proposal_token", token);
    if (signatureData) fd.append("signature", signatureData);
    try {
      const result = await acceptProposalAction(null, fd);
      if (result && "errors" in result && result.errors?._form) {
        setError(String(result.errors._form));
      } else if (result && "success" in result) {
        router.push(`/p/${token}/pay`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAccepting(false);
    }
  }

  function statusBadge() {
    if (status === "published" || status === "viewed") {
      return (
        <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium">
          Awaiting signature
        </span>
      );
    }
    if (status === "paid") {
      return (
        <span className="text-xs text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-full font-medium">
          Active
        </span>
      );
    }
    if (acceptance) {
      return (
        <span className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-medium">
          Awaiting payment
        </span>
      );
    }
    return null;
  }

  const S = "mb-8";
  const H = "text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3";
  const B = "text-sm leading-relaxed whitespace-pre-wrap text-neutral-800";

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 no-print sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <a href="https://axiomateai.com" className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
              &larr; axiomateai.com
            </a>
            <img
              src="https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png"
              alt="AxiomateAI"
              className="h-5 object-contain"
            />
          </div>
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
              Dashboard
            </a>
            {statusBadge()}
          </div>
        </div>
      </header>

      {/* Document */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {paymentCancelled ? (
          <div className="mb-8 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700 no-print">
            Payment was cancelled. You can try again when ready.
          </div>
        ) : null}

        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-10 md:p-16">
          {/* Cover */}
          <div className="text-center mb-12">
            <img
              src="https://vibe.filesafe.space/1783600225777213225/attachments/c4378c64-e397-4302-8eb0-9bd2d8f57e57.png"
              alt="AxiomateAI"
              className="h-10 mx-auto mb-6 object-contain"
            />
            <div className="w-16 h-px bg-neutral-200 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              {proposal.title as string}
            </h1>
            <p className="text-sm text-neutral-500 mt-2">
              {fmt(proposal.proposal_number)} &middot;{" "}
              {new Date(proposal.issue_date as string).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="w-16 h-px bg-neutral-200 mx-auto mt-6" />
          </div>

          {/* Parties */}
          <div className={S}>
            <h2 className={H}>Parties</h2>
            <p className={B}>This Agreement is between:</p>
            <div className="mt-3 ml-6 space-y-3">
              <div>
                <p className="text-sm font-medium text-neutral-900">Connector:</p>
                <p className="text-sm text-neutral-700 mt-0.5">
                  {show(d.connector_company) || "AxiomateAI"}
                  {show(d.connector_name) ? ` (${fmt(d.connector_name)})` : ""}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Client:</p>
                <p className="text-sm text-neutral-700 mt-0.5">
                  {client?.company_name as string}
                </p>
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-3">
              Effective date:{" "}
              {new Date(proposal.issue_date as string).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Purpose */}
          {show(d.purpose_text) ? (
            <div className={S}>
              <h2 className={H}>Purpose</h2>
              <p className={B}>{fmt(d.purpose_text)}</p>
            </div>
          ) : null}

          {/* Scope */}
          {show(d.scope_text) ? (
            <div className={S}>
              <h2 className={H}>Scope of Work</h2>
              <p className={B}>{fmt(d.scope_text)}</p>
            </div>
          ) : null}

          {/* Compensation */}
          <div className={S}>
            <h2 className={H}>Compensation Structure</h2>
            {engagementTotal > 0 ? (
              <div className="mb-4 rounded bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">
                  {engagementMonths}-Month Engagement — {formatMoney(engagementTotal, currency)}
                </p>
                {show(d.engagement_description) ? (
                  <p className="text-xs text-amber-600 mt-1">{fmt(d.engagement_description)}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  1. {show(d.access_fee_label) || "Access Fee (Monthly)"}
                </p>
                <p className="text-sm text-neutral-700 mt-1">
                  {engagementTotal > 0
                    ? `After the ${engagementMonths}-month engagement: ${formatMoney(monthlyAfter, currency)} per month`
                    : monthlyAfter > 0
                      ? `${formatMoney(monthlyAfter, currency)} per month`
                      : "To be agreed per month"}
                </p>
                {show(d.access_fee_description) ? (
                  <p className="text-sm text-neutral-500 mt-0.5">{fmt(d.access_fee_description)}</p>
                ) : null}
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">2. Success Fee</p>
                <p className="text-sm text-neutral-700 mt-1">
                  {successPct}% of collected revenue for {successMonths} months from the start
                  of that relationship. Payment applies only to revenue directly resulting from
                  Connector introductions.
                </p>
                {show(d.success_fee_description) ? (
                  <p className="text-sm text-neutral-500 mt-0.5">{fmt(d.success_fee_description)}</p>
                ) : null}
              </div>
            </div>
          </div>

          {/* Compliance */}
          {show(d.compliance_text) ? (
            <div className={S}>
              <h2 className={H}>Compliance Positioning</h2>
              <p className={B}>{fmt(d.compliance_text)}</p>
            </div>
          ) : null}

          {/* Success / Failure */}
          {show(d.success_definition) ? (
            <div className={S}>
              <h2 className={H}>Definition of Success</h2>
              <p className={B}>{fmt(d.success_definition)}</p>
            </div>
          ) : null}
          {show(d.failure_definition) ? (
            <div className={S}>
              <h2 className={H}>Definition of Failure</h2>
              <p className={B}>{fmt(d.failure_definition)}</p>
            </div>
          ) : null}

          {/* Term */}
          {show(d.term_text) ? (
            <div className={S}>
              <h2 className={H}>Term &amp; Termination</h2>
              <p className={B}>{fmt(d.term_text)}</p>
            </div>
          ) : null}

          {/* Boilerplate */}
          {show(d.confidentiality_text) ? (
            <div className={S}>
              <h2 className={H}>Confidentiality</h2>
              <p className={B}>{fmt(d.confidentiality_text)}</p>
            </div>
          ) : null}
          {show(d.contractor_text) ? (
            <div className={S}>
              <h2 className={H}>Independent Contractor Clause</h2>
              <p className={B}>{fmt(d.contractor_text)}</p>
            </div>
          ) : null}

          <hr className="my-10 border-neutral-200" />

          {/* Acceptance */}
          <div className="no-print">
            {canAccept ? (
              <div>
                <h2 className={H}>Acceptance</h2>
                {error ? (
                  <div className="mb-4 rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
                <form onSubmit={handleAccept} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-neutral-500 mb-3">Client Representative:</p>
                      <Input label="Name" name="signer_name" required placeholder="Full name" />
                      <div className="mt-3">
                        <Input label="Title" name="signer_title" placeholder="Title" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-500 mb-3">Connector:</p>
                      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                        <p className="text-sm font-medium text-neutral-700">
                          {show(d.connector_name) || "Mikael Nylander"}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {show(d.connector_company) || "AxiomateAI"}
                        </p>
                        <p className="text-xs text-neutral-400 mt-2 italic">
                          Signed upon acceptance
                        </p>
                      </div>
                    </div>
                  </div>
                  <SignaturePad onSignature={setSignatureData} />
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="consent_given"
                      value="true"
                      required
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-amber-500"
                    />
                    <span className="text-neutral-600">
                      I have reviewed and agree to this proposal and its terms.
                    </span>
                  </label>
                  <Button type="submit" disabled={accepting} size="md">
                    {accepting ? "Submitting..." : "Sign agreement"}
                  </Button>
                </form>
              </div>
            ) : acceptance ? (
              <div>
                <h2 className={H}>Acceptance</h2>
                <div className="rounded bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-800">
                    ✓ Agreement signed — redirecting to payment
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Signed by {acceptance.signer_name as string} on{" "}
                    {new Date(acceptance.accepted_at as string).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ) : isExpired ? (
              <div className="rounded bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-medium text-red-700">This proposal has expired.</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-neutral-200 no-print">
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
              <a href="https://axiomateai.com" className="hover:text-neutral-600 transition-colors" target="_blank" rel="noopener">
                axiomateai.com
              </a>
              <span>&middot;</span>
              <span>{fmt(proposal.proposal_number)}</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
