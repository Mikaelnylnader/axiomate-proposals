import { type NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe/service";
import { checkoutRequestSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = checkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request" },
        { status: 400 },
      );
    }

    const result = await createCheckoutSession(
      parsed.data.proposalToken,
      parsed.data.paymentKind,
    );

    return NextResponse.json({ url: result.url });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Checkout failed",
      },
      { status: 400 },
    );
  }
}
