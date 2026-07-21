"use client";

import { useState, useActionState } from "react";
import {
  createProposalAction,
  parseCallScriptAction,
} from "@/app/actions";
import { type ProposalTemplate } from "@/lib/proposal/templates";
import { type DraftData } from "@/lib/validation/schemas";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Client {
  id: string;
  company_name: string;
}

interface Props {
  clients: Client[];
  templates: ProposalTemplate[];
}

export function ProposalForm({ clients, templates }: Props) {
  const template = templates[0]; // Introductions Agreement

  // ---- Call script import tab ----
  const [activeTab, setActiveTab] = useState<"form" | "script">("form");
  const [scriptText, setScriptText] = useState("");
  const [scriptClientId, setScriptClientId] = useState("");
  const [parsedData, setParsedData] = useState<Partial<DraftData> | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  async function handleParseScript() {
    if (!scriptClientId) {
      setParseError("Select a client first");
      return;
    }
    if (scriptText.length < 50) {
      setParseError("Call script should be at least 50 characters");
      return;
    }
    setParsing(true);
    setParseError("");
    try {
      const result = await parseCallScriptAction(
        scriptClientId,
        scriptText,
      );
      if (result?.parsed) {
        setParsedData(result.parsed);
        setActiveTab("form");
      }
    } catch {
      setParseError("Failed to parse script");
    } finally {
      setParsing(false);
    }
  }

  // Merge parsed data with form defaults
  const defaults = {
    ...template?.defaults,
    ...parsedData,
  };

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-accent p-1 w-fit">
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "form"
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("form")}
        >
          Manual entry
        </button>
        <button
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === "script"
              ? "bg-card text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setActiveTab("script")}
        >
          Import from call script
        </button>
      </div>

      {/* Call script tab */}
      {activeTab === "script" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-medium text-foreground">
            Paste call or meeting transcript
          </h2>
          <p className="text-sm text-muted-foreground">
            Paste your call notes, meeting transcript, or discovery call
            recording text. The system extracts client details, scope,
            pricing, and terms.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Client
            </label>
            <select
              value={scriptClientId}
              onChange={(e) => setScriptClientId(e.target.value)}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Call transcript"
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={12}
            placeholder={`Paste your call notes here. For example:

"Spoke with Jane at Acme Inc. They're looking for help with outbound lead generation targeting SaaS companies in the US. They need 3-5 qualified intros per month. Budget is around $2,500/month with a 10% success fee on closed deals. They want to start with a 60-day trial..."`}
          />

          {parseError && (
            <p className="text-sm text-destructive">{parseError}</p>
          )}

          <div className="flex gap-3">
            <Button onClick={handleParseScript} disabled={parsing}>
              {parsing ? "Analyzing..." : "Parse and pre-fill proposal"}
            </Button>
          </div>
        </div>
      )}

      {/* Manual form tab */}
      {activeTab === "form" && (
        <ProposalFormFields
          clients={clients}
          defaults={defaults as Partial<Record<string, unknown>>}
          parsedData={parsedData}
        />
      )}
    </div>
  );
}

// ---- Form fields component ----

function ProposalFormFields({
  clients,
  defaults,
  parsedData,
}: {
  clients: Client[];
  defaults: Partial<Record<string, unknown>>;
  parsedData: Partial<DraftData> | null;
}) {
  const [state, action, pending] = useActionState(
    createProposalAction,
    null,
  );

  return (
    <form action={action} className="space-y-6">
      {/* Client + Basics */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Client &amp; basics
        </h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Client
          </label>
          <select
            name="client_id"
            required
            defaultValue=""
            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a client...</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.company_name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="hidden"
          name="template_type"
          value="introductions_agreement"
        />

        <Input
          label="Proposal title"
          name="title"
          required
          defaultValue={(defaults.defaultTitle as string) ?? "Introductions Agreement"}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Issue date"
            name="issue_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split("T")[0]}
          />
          <Input label="Valid until" name="valid_until" type="date" />
        </div>
        <Input
          label="Currency"
          name="currency"
          defaultValue="usd"
          required
        />

        <Input
          label="Connector company"
          name="connector_company"
          defaultValue={(defaults.connector_company as string) ?? "AxiomateAI"}
        />
        <Input
          label="Connector name"
          name="connector_name"
          defaultValue={(defaults.connector_name as string) ?? "Mikael Nylander"}
        />
      </div>

      {/* Purpose */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">Purpose</h2>
        <Textarea
          label="Purpose statement"
          name="purpose_text"
          rows={5}
          defaultValue={(defaults.purpose_text as string) ?? ""}
        />
      </div>

      {/* Scope */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Scope of Work
        </h2>
        <Textarea
          label="Scope description"
          name="scope_text"
          rows={5}
          defaultValue={(defaults.scope_text as string) ?? ""}
        />
      </div>

      {/* Compensation */}
      <div className="rounded-xl border border-primary/30 bg-card p-6 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 space-y-4">
          <h2 className="text-lg font-medium text-primary">
            Compensation Structure
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Engagement Fee
              </h3>
              <Input
                label="Total engagement amount (minor units, e.g. 700000 = $7,000)"
                name="engagement_total_amount"
                type="number"
                defaultValue={String(defaults.engagement_total_amount ?? 0)}
              />
              <Input
                label="Engagement months"
                name="engagement_months"
                type="number"
                min="1"
                max="24"
                defaultValue={String(defaults.engagement_months ?? 3)}
              />
              <Textarea
                label="Engagement description"
                name="engagement_description"
                rows={2}
                defaultValue={(defaults.engagement_description as string) ?? ""}
              />
            </div>

            <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                After Engagement
              </h3>
              <Input
                label="Monthly fee after engagement (minor units)"
                name="access_fee_amount"
                type="number"
                defaultValue={String(defaults.access_fee_amount ?? 0)}
              />
              <Input
                label="Access fee label"
                name="access_fee_label"
                defaultValue={(defaults.access_fee_label as string) ?? "Monthly Access Fee"}
              />
              <Textarea
                label="Access fee description"
                name="access_fee_description"
                rows={2}
                defaultValue={(defaults.access_fee_description as string) ?? ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3">
              <h3 className="text-sm font-medium text-foreground">
                Success Fee
              </h3>
              <Input
                label="Success fee %"
                name="success_fee_percent"
                type="number"
                min="0"
                max="100"
                defaultValue={String(defaults.success_fee_percent ?? 0)}
              />
              <Input
                label="Duration (months)"
                name="success_fee_duration_months"
                type="number"
                min="1"
                max="120"
                defaultValue={String(defaults.success_fee_duration_months ?? 12)}
              />
              <Textarea
                label="Success fee description"
                name="success_fee_description"
                rows={2}
                defaultValue={(defaults.success_fee_description as string) ?? ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trial & Term */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Trial &amp; Term
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Trial period (days)"
            name="trial_period_days"
            type="number"
            min="0"
            max="365"
            defaultValue={String(defaults.trial_period_days ?? 90)}
          />
          <Input
            label="Currency"
            name="currency"
            defaultValue="usd"
            required
            className="hidden"
          />
        </div>
        <Textarea
          label="Trial description"
          name="trial_description"
          rows={3}
          defaultValue={(defaults.trial_description as string) ?? ""}
        />
        <Textarea
          label="Term and termination"
          name="term_text"
          rows={3}
          defaultValue={(defaults.term_text as string) ?? ""}
        />
      </div>

      {/* Definitions */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Definitions
        </h2>
        <Textarea
          label="Definition of success"
          name="success_definition"
          rows={2}
          defaultValue={(defaults.success_definition as string) ?? ""}
        />
        <Textarea
          label="Definition of failure"
          name="failure_definition"
          rows={2}
          defaultValue={(defaults.failure_definition as string) ?? ""}
        />
      </div>

      {/* Compliance + Boilerplate */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Compliance &amp; Legal
        </h2>
        <Textarea
          label="Compliance positioning"
          name="compliance_text"
          rows={3}
          defaultValue={(defaults.compliance_text as string) ?? ""}
        />
        <Textarea
          label="Confidentiality"
          name="confidentiality_text"
          rows={3}
          defaultValue={(defaults.confidentiality_text as string) ?? ""}
        />
        <Textarea
          label="Independent contractor clause"
          name="contractor_text"
          rows={3}
          defaultValue={(defaults.contractor_text as string) ?? ""}
        />
      </div>

      {/* Internal */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-lg font-medium text-foreground">
          Internal notes
        </h2>
        <Textarea
          label="Notes"
          name="internal_notes"
          placeholder="Meeting notes, source, or internal reference (never shown to client)"
          defaultValue={(defaults.internal_notes as string) ?? ""}
        />
      </div>

      {state &&
        "errors" in state &&
        typeof state.errors?._form === "string" ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors._form}
          </p>
        ) : null}

      {parsedData && (
        <div className="rounded-lg bg-primary/10 border border-primary/30 p-3 text-sm text-primary">
          Pre-filled from call script. Review and adjust before publishing.
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating..." : "Create proposal"}
        </Button>
        <Link href="/proposals">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  );
}
