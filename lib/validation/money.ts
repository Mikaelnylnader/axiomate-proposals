export function formatMoney(
  amountMinor: number,
  currency: string,
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function minorToDecimal(amountMinor: number): number {
  return amountMinor / 100;
}

export function validateDeposit(
  depositMinor: number | null | undefined,
  totalMinor: number,
): string | null {
  if (depositMinor == null) return null;
  if (depositMinor <= 0) return "Deposit must be greater than zero";
  if (depositMinor >= totalMinor) return "Deposit must be less than the total amount";
  return null;
}

export function calculatePayableAmount(
  totalMinor: number,
  depositMinor: number | null | undefined,
  paymentKind: "deposit" | "full" | "subscribe",
  alreadyPaidMinor: number,
): number {
  if (paymentKind === "deposit" && depositMinor != null) {
    return Math.max(0, depositMinor - alreadyPaidMinor);
  }
  return Math.max(0, totalMinor - alreadyPaidMinor);
}
