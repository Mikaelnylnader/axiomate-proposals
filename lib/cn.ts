export function cn(
  ...inputs: (string | undefined | false | null | 0)[]
): string {
  return inputs.filter(Boolean).join(" ");
}

/** Render a string value from unknown, or undefined if not a non-empty string. */
export function show(v: unknown): string | undefined {
  if (typeof v === "string" && v.length > 0) return v;
  return undefined;
}
