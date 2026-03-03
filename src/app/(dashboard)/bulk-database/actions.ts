"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadContacts(
  rows: { full_name: string; phone: string | null; unit_number: string | null; area: string | null }[],
  batchName: string,
  areaTag: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (!rows.length) return { error: "No rows to import" };

  // Create upload batch
  const { data: batch, error: batchErr } = await supabase
    .from("upload_batches")
    .insert({
      file_name: batchName,
      total_records: rows.length,
      status: "processing",
      uploaded_by: user.id,
    })
    .select("id")
    .single();

  if (batchErr || !batch) return { error: batchErr?.message ?? "Failed to create batch" };

  // Insert contacts with area tag
  const contacts = rows.map((row) => ({
    full_name: row.full_name,
    phone: row.phone || null,
    notes: row.unit_number ? `Unit: ${row.unit_number}` : null,
    area_tags: areaTag ? [areaTag] : row.area ? [row.area] : [],
    upload_batch_id: batch.id,
    created_by: user.id,
  }));

  const { error: insertErr } = await supabase.from("contacts").insert(contacts);

  if (insertErr) {
    await supabase
      .from("upload_batches")
      .update({ status: "failed", error_log: [{ message: insertErr.message }] })
      .eq("id", batch.id);
    return { error: insertErr.message };
  }

  await supabase
    .from("upload_batches")
    .update({ status: "completed", processed_records: rows.length })
    .eq("id", batch.id);

  // Log activity
  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "contacts_uploaded",
    entity_type: "upload_batch",
    entity_id: batch.id,
    metadata: { file_name: batchName, records: rows.length, area_tag: areaTag },
  });

  revalidatePath("/bulk-database");
  return { success: true, count: rows.length };
}

export async function assignContactToAgent(contactId: string, agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("contacts")
    .update({ assigned_agent_id: agentId })
    .eq("id", contactId);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "contact_assigned",
    entity_type: "contact",
    entity_id: contactId,
    metadata: { agent_id: agentId },
  });

  revalidatePath("/bulk-database");
  return { success: true };
}

export async function assignBatchToAgent(batchId: string, agentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("contacts")
    .update({ assigned_agent_id: agentId })
    .eq("upload_batch_id", batchId);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "batch_assigned",
    entity_type: "upload_batch",
    entity_id: batchId,
    metadata: { agent_id: agentId },
  });

  revalidatePath("/bulk-database");
  return { success: true };
}
