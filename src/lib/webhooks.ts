import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Validates the x-webhook-secret header against WEBHOOK_SECRET env var.
 * Returns null if valid, or a 401 NextResponse if invalid.
 */
export function validateWebhookSecret(request: NextRequest) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Fires an event to the n8n automation webhook (non-blocking).
 * All events go to the same endpoint; the n8n Switch node routes by event type.
 */
export function fireN8nWebhook(payload: Record<string, unknown>) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return;

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

/**
 * Logs a webhook event to the activity_logs table using the admin client.
 */
export async function logWebhookEvent(
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {}
) {
  const supabase = createAdminClient();
  await supabase.from("activity_logs").insert({
    user_id: "00000000-0000-0000-0000-000000000000", // system user
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}
