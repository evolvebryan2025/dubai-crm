import { NextRequest, NextResponse } from "next/server";
import { validateWebhookSecret, logWebhookEvent } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
  const unauthorized = validateWebhookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    console.log("[Webhook] transaction-created:", body);

    await logWebhookEvent(
      "webhook_transaction_created",
      "transaction",
      body.transaction_id ?? null,
      body
    );

    return NextResponse.json({ received: true, event: "transaction.created" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
