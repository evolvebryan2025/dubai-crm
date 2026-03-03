import { NextRequest, NextResponse } from "next/server";
import { validateWebhookSecret, logWebhookEvent } from "@/lib/webhooks";

export async function POST(request: NextRequest) {
  // Validate shared secret
  const unauthorized = validateWebhookSecret(request);
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json();
    console.log("[Webhook] listing-published:", body);

    // Log to activity_logs
    await logWebhookEvent(
      "webhook_listing_published",
      "listing",
      body.listing_id ?? null,
      body
    );

    return NextResponse.json({ received: true, event: "listing.published" });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
