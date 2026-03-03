import { NextRequest, NextResponse } from "next/server";
import { validateWebhookSecret, logWebhookEvent } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
  const unauthorized = validateWebhookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    console.log("[Webhook] lead-assigned:", body);

    await logWebhookEvent(
      "webhook_lead_assigned",
      "lead",
      body.lead_id ?? null,
      body
    );

    return NextResponse.json({ received: true, event: "lead.assigned" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
