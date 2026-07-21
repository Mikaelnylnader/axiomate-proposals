import { type NextRequest, NextResponse } from "next/server";
import { processStripeWebhook } from "@/lib/stripe/service";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("Stripe-Signature");
  const rawBody = await request.text();

  try {
    const result = await processStripeWebhook(rawBody, signature ?? "");
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Webhook error";
    const status = message === "Invalid webhook signature" ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
