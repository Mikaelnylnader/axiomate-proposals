"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateProposalAction,
  publishProposalAction,
  unpublishProposalAction,
  duplicateProposalAction,
  archiveProposalAction,
  adminSignAction,
  sendProposalLinkAction,
} from "@/app/actions";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SignaturePad } from "@/components/ui/signature-pad";
import { formatMoney } from "@/lib/validation/money";
import { show } from "@/lib/cn";
import { useToast } from "@/components/ui/toast";

interface ProposalDetailProps {
  proposal: Record<string, unknown>;
  publicLink: string;
  acceptance: Record<string, unknown> | null;
}

export function ProposalDetail({ proposal, publicLink, acceptance }: ProposalDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [adminSigning, setAdminSigning] = useState(false);
  const [adminSigData, setAdminSigData] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const hasClientSigned = !!proposal.accepted_version_id;
  const hasAdminSigned = !!(acceptance?.admin_signed_at);

  const isDraft = proposal.status === "draft";
  const isPublished = ["published", "viewed"].includes(proposal.status as string);
  const draftData = (proposal.draft_data ?? {}) as Record<string, unknown>;
  const client = proposal.clients as Record<string, unknown> | undefined;

  async function copyLink() {
    await navigator.clipboard.writeText(publicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleErr(r: Awaited<ReturnType<typeof publishProposalAction>>) {
    if (r && "errors" in r && r.errors?._form) {
      toast(String(r.errors._form), "error");
    }
  }

  async function handlePublish() {
    const r = await publishProposalAction(proposal.id as string);
    handleErr(r);
    if (r && "success" in r) toast("Proposal published", "success");
  }

  async function handleUnpublish() {
    const r = await unpublishProposalAction(proposal.id as string);
    handleErr(r);
    if (r && "success" in r) toast("Proposal unpublished", "success");
  }

  async function handleDuplicate() {
    const r = await duplicateProposalAction(proposal.id as string);
    handleErr(r);
  }

  async function handleArchive() {
    if (!confirm("Archive this proposal?")) return;
    const r = await archiveProposalAction(proposal.id as string);
    handleErr(r);
  }

  async function handleAdminSign() {
    if (!adminSigData) return;
    setAdminSigning(true);
    const r = await adminSignAction(proposal.id as string, adminSigData);
    if (r && "error" in r) {
      toast(r.error, "error");
    } else {
      toast("Signed as Connector. Client notified.", "success");
      router.refresh();
    }
    setAdminSigning(false);
  }

  async function handleSendToClient() {
    setSending(true);
    setSent(false);
    const r = await sendProposalLinkAction(proposal.id as string);
    if (r && "error" in r) {
      toast(r.error, "error");
    } else {
      setSent(true);
      toast("Proposal link sent to client", "success");
      setTimeout(() => setSent(false), 3000);
    }
    setSending(false);
  }

  async function handleSaveDraft(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const r = await updateProposalAction(null, fd, proposal.id as string);
    handleErr(r as Awaited<ReturnType<typeof publishProposalAction>>);
    if (r && "success" in r) {
      setEditing(false);
      router.refresh();
      toast("Draft saved", "success");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <Link href="/proposals" className="text-sm text-muted-foreground hover:text-foreground">
            &larr; Back to proposals
          </Link>
          <div className="mt-2 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{proposal.title as string}</h1>
            <StatusBadge status={proposal.status as string} />
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="font-mono">{proposal.proposal_number as string}</span>
            <span>&middot;</span>
            <span>{client?.company_name as string}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDraft && <Button onClick={handlePublish}>Publish</Button>}
          {isPublished && (
            <>
              <Button variant="secondary" onClick={handleUnpublish}>Unpublish</Button>
              <Button onClick={copyLink}>{copied ? "Copied" : "Copy client link"}</Button>
              <Button variant="secondary" onClick={handleSendToClient} disabled={sending}>
                {sending ? "Sending..." : sent ? "Sent!" : "Send to client"}
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={handleDuplicate}>Duplicate</Button>
          <Button variant="ghost" onClick={handleArchive}>Archive</Button>
        </div>
      </div>

      {isPublished && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Client link</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-accent px-3 py-1.5 text-sm break-all">{publicLink}</code>
            <Button size="sm" variant="secondary" onClick={copyLink}>{copied ? "Copied" : "Copy"}</Button>
          </div>
        </div>
      )}

      {/* Meta cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Engagement</p>
          <p className="text-lg font-semibold tabular-nums mt-1 text-foreground">
            {formatMoney((draftData.engagement_total_amount as number) ?? (draftData.access_fee_amount as number) ?? 0, proposal.currency as string)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{(draftData.engagement_months as number) ?? 3} months</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Monthly after</p>
          <p className="text-lg font-semibold tabular-nums mt-1 text-foreground">
            {formatMoney((draftData.access_fee_amount as number) ?? 0, proposal.currency as string)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Success fee</p>
          <p className="text-lg font-semibold tabular-nums mt-1 text-foreground">{String(draftData.success_fee_percent ?? 0)}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">{String(draftData.success_fee_duration_months ?? 12)} months</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Views</p>
          <p className="text-lg font-semibold tabular-nums mt-1 text-foreground">{proposal.view_count as number}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Since published</p>
        </div>
      </div>

      {/* Admin signature — shown after client signs, before admin signs */}
      {hasClientSigned && !hasAdminSigned ? (
        <div className="rounded-xl border border-primary/30 bg-card overflow-hidden">
          <div className="bg-primary/5 border-b border-primary/20 px-6 py-3">
            <p className="text-sm font-medium text-primary">Pending your signature</p>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              The client has signed. Draw your signature below to complete the agreement. The client will be notified automatically.
            </p>
            <SignaturePad onSignature={setAdminSigData} />
            <Button onClick={handleAdminSign} disabled={adminSigning || !adminSigData}>
              {adminSigning ? "Signing..." : "Sign as Connector"}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Content: edit or read-only */}
      {isDraft && editing ? (
        <form onSubmit={handleSaveDraft} className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="text-lg font-medium">Edit proposal</h2>
            <Input label="Title" name="title" defaultValue={proposal.title as string} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Issue date" name="issue_date" type="date" defaultValue={proposal.issue_date as string} />
              <Input label="Valid until" name="valid_until" type="date" defaultValue={(proposal.valid_until as string) ?? ""} />
            </div>
            <Input label="Connector company" name="connector_company" defaultValue={String(draftData.connector_company ?? "")} />
            <Input label="Connector name" name="connector_name" defaultValue={String(draftData.connector_name ?? "")} />
            <Textarea label="Purpose" name="purpose_text" defaultValue={String(draftData.purpose_text ?? "")} rows={4} />
            <Textarea label="Scope of Work" name="scope_text" defaultValue={String(draftData.scope_text ?? "")} rows={4} />
            <h3 className="font-medium pt-2 text-primary">Compensation</h3>
            <Input label="Access fee label" name="access_fee_label" defaultValue={String(draftData.access_fee_label ?? "")} />
            <Input label="Monthly amount (minor units)" name="access_fee_amount" type="number" defaultValue={String(draftData.access_fee_amount ?? 0)} />
            <Textarea label="Access fee description" name="access_fee_description" defaultValue={String(draftData.access_fee_description ?? "")} rows={2} />
            <Input label="Success fee %" name="success_fee_percent" type="number" defaultValue={String(draftData.success_fee_percent ?? 0)} />
            <Input label="Success fee duration (months)" name="success_fee_duration_months" type="number" defaultValue={String(draftData.success_fee_duration_months ?? 12)} />
            <Textarea label="Success fee description" name="success_fee_description" defaultValue={String(draftData.success_fee_description ?? "")} rows={2} />
            <h3 className="font-medium pt-2">Trial & Term</h3>
            <Input label="Trial period (days)" name="trial_period_days" type="number" defaultValue={String(draftData.trial_period_days ?? 90)} />
            <Textarea label="Trial description" name="trial_description" defaultValue={String(draftData.trial_description ?? "")} rows={2} />
            <Textarea label="Terms" name="term_text" defaultValue={String(draftData.term_text ?? "")} rows={3} />
            <h3 className="font-medium pt-2">Definitions & Legal</h3>
            <Textarea label="Success definition" name="success_definition" defaultValue={String(draftData.success_definition ?? "")} rows={2} />
            <Textarea label="Failure definition" name="failure_definition" defaultValue={String(draftData.failure_definition ?? "")} rows={2} />
            <Textarea label="Compliance" name="compliance_text" defaultValue={String(draftData.compliance_text ?? "")} rows={3} />
            <Textarea label="Confidentiality" name="confidentiality_text" defaultValue={String(draftData.confidentiality_text ?? "")} rows={2} />
            <Textarea label="Contractor clause" name="contractor_text" defaultValue={String(draftData.contractor_text ?? "")} rows={2} />
            <Textarea label="Internal notes" name="internal_notes" defaultValue={(proposal.internal_notes as string) ?? ""} />
            <div className="flex gap-3 pt-2">
              <Button type="submit">Save draft</Button>
              <Button type="button" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6 space-y-8">
          {/* Parties */}
          {show(draftData.connector_company) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Parties</h2>
              <p className="text-sm text-foreground">
                This Agreement is between{" "}
                <strong>{String(draftData.connector_company)}</strong>
                {show(draftData.connector_name) && ` (${String(draftData.connector_name)})`}{" "}
                and <strong>{client?.company_name as string}</strong>.
              </p>
            </section>
          )}

          {show(draftData.purpose_text) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Purpose</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(draftData.purpose_text)}</p>
            </section>
          )}

          {show(draftData.scope_text) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Scope of Work</h2>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(draftData.scope_text)}</p>
            </section>
          )}

          {/* Compensation card */}
          <section className="rounded-xl border border-primary/30 bg-accent/30 p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 space-y-4">
              <h2 className="text-sm font-medium text-primary">Compensation Structure</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg bg-card p-3">
                  <p className="text-xs text-muted-foreground">
                    {show(draftData.access_fee_label) || "Access Fee (Monthly)"}
                  </p>
                  <p className="text-xl font-semibold tabular-nums mt-1">
                    {formatMoney((draftData.access_fee_amount as number) ?? 0, proposal.currency as string)}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  {show(draftData.access_fee_description) && (
                    <p className="text-xs text-muted-foreground mt-1">{String(draftData.access_fee_description)}</p>
                  )}
                </div>
                <div className="rounded-lg bg-card p-3">
                  <p className="text-xs text-muted-foreground">Success Fee</p>
                  <p className="text-xl font-semibold tabular-nums mt-1">{String(draftData.success_fee_percent ?? 0)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">for {String(draftData.success_fee_duration_months ?? 12)} months</p>
                  {show(draftData.success_fee_description) && (
                    <p className="text-xs text-muted-foreground mt-1">{String(draftData.success_fee_description)}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {(show(draftData.trial_description) || show(draftData.term_text)) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Trial &amp; Term</h2>
              {show(draftData.trial_description) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed mb-2">{String(draftData.trial_description)}</p>
              )}
              {show(draftData.term_text) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(draftData.term_text)}</p>
              )}
            </section>
          )}

          {(show(draftData.success_definition) || show(draftData.failure_definition)) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Definitions</h2>
              {show(draftData.success_definition) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed mb-2">{String(draftData.success_definition)}</p>
              )}
              {show(draftData.failure_definition) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(draftData.failure_definition)}</p>
              )}
            </section>
          )}

          {(show(draftData.compliance_text) || show(draftData.confidentiality_text) || show(draftData.contractor_text)) && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-1">Compliance &amp; Legal</h2>
              {show(draftData.compliance_text) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed mb-2">{String(draftData.compliance_text)}</p>
              )}
              {show(draftData.confidentiality_text) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed mb-2">{String(draftData.confidentiality_text)}</p>
              )}
              {show(draftData.contractor_text) && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{String(draftData.contractor_text)}</p>
              )}
            </section>
          )}

          {show(proposal.internal_notes) && (
            <section className="border-t border-border pt-4">
              <h2 className="text-sm font-medium text-primary mb-1">Internal notes</h2>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground">{String(proposal.internal_notes)}</p>
            </section>
          )}
        </div>
      )}

      {isDraft && !editing && (
        <div className="flex gap-2">
          <Button onClick={() => setEditing(true)}>Edit draft</Button>
        </div>
      )}
    </div>
  );
}
