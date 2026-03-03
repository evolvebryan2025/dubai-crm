"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fireN8nWebhook } from "@/lib/webhooks";

export async function createLead(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData.entries());

  const assignedAgentId = (raw.assigned_agent_id as string) || null;

  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      full_name: raw.full_name as string,
      phone: (raw.phone as string) || null,
      email: (raw.email as string) || null,
      source: (raw.source as string) || null,
      property_type: (raw.property_type as string) || null,
      purpose: (raw.purpose as string) || null,
      budget_min: raw.budget_min ? Number(raw.budget_min) : null,
      budget_max: raw.budget_max ? Number(raw.budget_max) : null,
      notes: (raw.notes as string) || null,
      status: "new",
      assigned_agent_id: assignedAgentId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "lead_created",
    entity_type: "lead",
    entity_id: lead?.id ?? null,
    metadata: { full_name: raw.full_name, source: raw.source },
  });

  // Fire webhook if lead is assigned to an agent
  if (assignedAgentId) {
    fireLeadAssignedWebhook(raw.full_name as string, assignedAgentId);
  }

  revalidatePath("/leads");
  redirect("/leads");
}

export async function updateLead(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Get current lead to check if agent assignment changed
  const { data: currentLead } = await supabase
    .from("leads")
    .select("assigned_agent_id")
    .eq("id", id)
    .single();

  const raw = Object.fromEntries(formData.entries());
  const newAgentId = (raw.assigned_agent_id as string) || null;

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: raw.full_name as string,
      phone: (raw.phone as string) || null,
      email: (raw.email as string) || null,
      source: (raw.source as string) || null,
      property_type: (raw.property_type as string) || null,
      purpose: (raw.purpose as string) || null,
      budget_min: raw.budget_min ? Number(raw.budget_min) : null,
      budget_max: raw.budget_max ? Number(raw.budget_max) : null,
      notes: (raw.notes as string) || null,
      status: (raw.status as string) || "new",
      assigned_agent_id: newAgentId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "lead_updated",
    entity_type: "lead",
    entity_id: id,
    metadata: { full_name: raw.full_name },
  });

  // Fire webhook if agent assignment changed
  const oldAgentId = currentLead?.assigned_agent_id ?? null;
  if (newAgentId && newAgentId !== oldAgentId) {
    fireLeadAssignedWebhook(raw.full_name as string, newAgentId);
  }

  revalidatePath("/leads");
  redirect("/leads");
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "lead_status_changed",
    entity_type: "lead",
    entity_id: id,
    metadata: { new_status: status },
  });

  revalidatePath("/leads");
  return { success: true };
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("leads").delete().eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "lead_deleted",
    entity_type: "lead",
    entity_id: id,
  });

  revalidatePath("/leads");
  return { success: true };
}

// Non-blocking webhook fire
function fireLeadAssignedWebhook(leadName: string, agentId: string) {
  const payload = {
    event: "lead.assigned",
    lead_name: leadName,
    assigned_agent_id: agentId,
  };

  // Internal logging webhook
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    fetch(`${baseUrl}/api/webhooks/lead-assigned`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": process.env.WEBHOOK_SECRET || "",
      },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    // silently ignore
  }

  // n8n automation webhook
  fireN8nWebhook(payload);
}
