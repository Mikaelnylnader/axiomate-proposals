"use client";

import { useActionState } from "react";
import { createClientAction } from "@/app/actions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewClientPage() {
  const [state, action, pending] = useActionState(createClientAction, null);

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <Link
          href="/clients"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">
          Add client
        </h1>
      </div>

      <form
        action={action}
        className="rounded-xl border border-border bg-card p-6 space-y-4"
      >
        <Input
          label="Company name"
          name="company_name"
          required
          placeholder="Acme Inc."
        />
        <Input
          label="Contact name"
          name="contact_name"
          required
          placeholder="Jane Smith"
        />
        <Input
          label="Contact email"
          name="contact_email"
          type="email"
          required
          placeholder="jane@acme.com"
        />
        <Input
          label="Contact title"
          name="contact_title"
          placeholder="CEO"
        />
        <Textarea
          label="Address"
          name="address_text"
          placeholder="123 Main St, City, State"
        />

        {state && "errors" in state && typeof state.errors?._form === "string" ? (
          <p className="text-sm text-destructive" role="alert">
            {state.errors._form}
          </p>
        ) : null}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save client"}
          </Button>
          <Link href="/clients">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
