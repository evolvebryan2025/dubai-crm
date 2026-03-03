"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fireN8nWebhook } from "@/lib/webhooks";

export async function approveCommission(
  approvalId: string,
  notes: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check role — only admin / super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (role !== "super_admin" && role !== "admin")
    return { error: "Not authorized" };

  const { error } = await supabase
    .from("commission_approvals")
    .update({
      status: "owner_approved",
      owner_approved_at: new Date().toISOString(),
      owner_approved_by: user.id,
      owner_notes: notes,
    })
    .eq("id", approvalId)
    .eq("status", "pending"); // guard: only pending → owner_approved

  if (error) return { error: error.message };

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "commission_owner_approved",
    entity_type: "commission_approval",
    entity_id: approvalId,
  });

  // Fire webhooks
  const approvePayload = {
    event: "commission.owner_approved",
    approval_id: approvalId,
    approved_by: user.id,
  };

  // Internal logging webhook
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    fetch(`${baseUrl}/api/webhooks/commission-approved`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(approvePayload),
    }).catch(() => {});
  } catch {
    // non-blocking
  }

  // n8n automation webhook
  fireN8nWebhook(approvePayload);

  revalidatePath("/commissions");
  return { success: true };
}

export async function financeCleared(
  approvalId: string,
  notes: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Check role — finance, admin, super_admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (role !== "super_admin" && role !== "admin" && role !== "finance")
    return { error: "Not authorized" };

  const { error } = await supabase
    .from("commission_approvals")
    .update({
      status: "finance_cleared",
      finance_cleared_at: new Date().toISOString(),
      finance_cleared_by: user.id,
      finance_notes: notes,
    })
    .eq("id", approvalId)
    .eq("status", "owner_approved"); // guard: only owner_approved → finance_cleared

  if (error) return { error: error.message };

  // Also mark the transaction as completed
  const { data: approval } = await supabase
    .from("commission_approvals")
    .select("transaction_id")
    .eq("id", approvalId)
    .single();

  if (approval) {
    await supabase
      .from("transactions")
      .update({ status: "completed" })
      .eq("id", (approval as { transaction_id: string }).transaction_id);
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "commission_finance_cleared",
    entity_type: "commission_approval",
    entity_id: approvalId,
  });

  // Fire webhooks
  const clearPayload = {
    event: "commission.finance_cleared",
    approval_id: approvalId,
    cleared_by: user.id,
  };

  // Internal logging webhook
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    fetch(`${baseUrl}/api/webhooks/finance-cleared`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(clearPayload),
    }).catch(() => {});
  } catch {
    // non-blocking
  }

  // n8n automation webhook
  fireN8nWebhook(clearPayload);

  revalidatePath("/commissions");
  return { success: true };
}

export async function rejectCommission(
  approvalId: string,
  reason: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (role !== "super_admin" && role !== "admin" && role !== "finance")
    return { error: "Not authorized" };

  const { error } = await supabase
    .from("commission_approvals")
    .update({
      status: "rejected",
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejection_reason: reason,
    })
    .eq("id", approvalId);

  if (error) return { error: error.message };

  // Mark transaction as cancelled
  const { data: approval } = await supabase
    .from("commission_approvals")
    .select("transaction_id")
    .eq("id", approvalId)
    .single();

  if (approval) {
    await supabase
      .from("transactions")
      .update({ status: "cancelled" })
      .eq("id", (approval as { transaction_id: string }).transaction_id);
  }

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "commission_rejected",
    entity_type: "commission_approval",
    entity_id: approvalId,
    metadata: { reason },
  });

  revalidatePath("/commissions");
  return { success: true };
}
