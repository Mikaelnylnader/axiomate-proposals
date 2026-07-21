import { describe, it, expect } from "vitest";
import {
  canTransition,
  clientSchema,
  acceptanceSchema,
  checkoutRequestSchema,
} from "./schemas";

describe("canTransition", () => {
  it("allows draft -> published", () => {
    expect(canTransition("draft", "published")).toBe(true);
  });

  it("allows draft -> archived", () => {
    expect(canTransition("draft", "archived")).toBe(true);
  });

  it("does not allow draft -> paid", () => {
    expect(canTransition("draft", "paid")).toBe(false);
  });

  it("allows published -> viewed", () => {
    expect(canTransition("published", "viewed")).toBe(true);
  });

  it("allows viewed -> accepted", () => {
    expect(canTransition("viewed", "accepted")).toBe(true);
  });

  it("allows accepted -> payment_pending", () => {
    expect(canTransition("accepted", "payment_pending")).toBe(true);
  });

  it("does not allow paid -> draft (irreversible)", () => {
    expect(canTransition("paid", "draft")).toBe(false);
  });

  it("does not allow archived -> anything", () => {
    expect(canTransition("archived", "draft")).toBe(false);
    expect(canTransition("archived", "published")).toBe(false);
  });
});

describe("clientSchema", () => {
  it("validates a complete client", () => {
    const result = clientSchema.safeParse({
      company_name: "Acme Inc.",
      contact_name: "Jane Smith",
      contact_email: "jane@acme.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing company name", () => {
    const result = clientSchema.safeParse({
      company_name: "",
      contact_name: "Jane",
      contact_email: "jane@acme.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = clientSchema.safeParse({
      company_name: "Acme",
      contact_name: "Jane",
      contact_email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("acceptanceSchema", () => {
  it("validates acceptance with consent", () => {
    const result = acceptanceSchema.safeParse({
      proposal_token: "abc123",
      signer_name: "Jane Smith",
      signer_email: "jane@acme.com",
      consent_given: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects acceptance without consent", () => {
    const result = acceptanceSchema.safeParse({
      proposal_token: "abc123",
      signer_name: "Jane Smith",
      signer_email: "jane@acme.com",
      consent_given: false,
    });
    expect(result.success).toBe(false);
  });
});

describe("checkoutRequestSchema", () => {
  it("validates deposit payment kind", () => {
    const result = checkoutRequestSchema.safeParse({
      proposalToken: "abc123",
      paymentKind: "deposit",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid payment kind", () => {
    const result = checkoutRequestSchema.safeParse({
      proposalToken: "abc123",
      paymentKind: "fake",
    });
    expect(result.success).toBe(false);
  });
});
