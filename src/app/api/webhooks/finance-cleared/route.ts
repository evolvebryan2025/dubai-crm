import { NextRequest, NextResponse } from "next/server";
import { validateWebhookSecret, logWebhookEvent } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
  const unauthorized = validateWebhookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    console.log("[Webhook] finance-cleared:", body);

    await logWebhookEvent(
      "webhook_finance_cleared",
      "commission_approval",
      body.approval_id ?? null,
      body
    );

    return NextResponse.json({ received: true, event: "commission.finance_cleared" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
