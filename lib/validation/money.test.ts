import { describe, it, expect } from "vitest";
import {
  formatMoney,
  validateDeposit,
  calculatePayableAmount,
} from "./money";

describe("formatMoney", () => {
  it("formats USD minor units to currency string", () => {
    expect(formatMoney(250000, "usd")).toBe("$2,500.00");
  });

  it("formats zero correctly", () => {
    expect(formatMoney(0, "usd")).toBe("$0.00");
  });

  it("formats cents correctly", () => {
    expect(formatMoney(1099, "usd")).toBe("$10.99");
  });

  it("formats large amounts", () => {
    expect(formatMoney(10000000, "usd")).toBe("$100,000.00");
  });
});

describe("validateDeposit", () => {
  it("returns null for null deposit", () => {
    expect(validateDeposit(null, 1000)).toBeNull();
  });

  it("returns error for zero deposit", () => {
    expect(validateDeposit(0, 1000)).toBe(
      "Deposit must be greater than zero",
    );
  });

  it("returns error for negative deposit", () => {
    expect(validateDeposit(-100, 1000)).toBe(
      "Deposit must be greater than zero",
    );
  });

  it("returns error when deposit >= total", () => {
    expect(validateDeposit(1000, 1000)).toBe(
      "Deposit must be less than the total amount",
    );
    expect(validateDeposit(2000, 1000)).toBe(
      "Deposit must be less than the total amount",
    );
  });

  it("returns null for valid deposit", () => {
    expect(validateDeposit(500, 1000)).toBeNull();
  });
});

describe("calculatePayableAmount", () => {
  it("calculates full payment minus already paid", () => {
    expect(calculatePayableAmount(500000, null, "full", 0)).toBe(500000);
  });

  it("calculates remaining full payment", () => {
    expect(calculatePayableAmount(500000, null, "full", 250000)).toBe(
      250000,
    );
  });

  it("calculates deposit payment", () => {
    expect(calculatePayableAmount(500000, 200000, "deposit", 0)).toBe(
      200000,
    );
  });

  it("calculates remaining deposit after partial payment", () => {
    expect(
      calculatePayableAmount(500000, 200000, "deposit", 100000),
    ).toBe(100000);
  });

  it("returns 0 when already fully paid", () => {
    expect(calculatePayableAmount(500000, null, "full", 500000)).toBe(0);
  });

  it("returns 0 when deposit already covered", () => {
    expect(
      calculatePayableAmount(500000, 200000, "deposit", 200000),
    ).toBe(0);
  });
});
