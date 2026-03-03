"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOwner(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData.entries());

  const { data: owner, error } = await supabase
    .from("owners")
    .insert({
      full_name: raw.full_name as string,
      phone: (raw.phone as string) || null,
      email: (raw.email as string) || null,
      area: (raw.area as string) || null,
      community: (raw.community as string) || null,
      building_name: (raw.building_name as string) || null,
      unit_number: (raw.unit_number as string) || null,
      property_type: (raw.property_type as string) || null,
      bedrooms: raw.bedrooms ? Number(raw.bedrooms) : null,
      bathrooms: raw.bathrooms ? Number(raw.bathrooms) : null,
      size_sqft: raw.size_sqft ? Number(raw.size_sqft) : null,
      asking_price: raw.asking_price ? Number(raw.asking_price) : null,
      purpose: (raw.purpose as string) || null,
      notes: (raw.notes as string) || null,
      source: (raw.source as string) || null,
      assigned_agent_id: (raw.assigned_agent_id as string) || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "owner_created",
    entity_type: "owner",
    entity_id: owner?.id ?? null,
    metadata: { full_name: raw.full_name },
  });

  revalidatePath("/owners");
  redirect("/owners");
}

export async function updateOwner(id: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const raw = Object.fromEntries(formData.entries());

  const { error } = await supabase
    .from("owners")
    .update({
      full_name: raw.full_name as string,
      phone: (raw.phone as string) || null,
      email: (raw.email as string) || null,
      area: (raw.area as string) || null,
      community: (raw.community as string) || null,
      building_name: (raw.building_name as string) || null,
      unit_number: (raw.unit_number as string) || null,
      property_type: (raw.property_type as string) || null,
      bedrooms: raw.bedrooms ? Number(raw.bedrooms) : null,
      bathrooms: raw.bathrooms ? Number(raw.bathrooms) : null,
      size_sqft: raw.size_sqft ? Number(raw.size_sqft) : null,
      asking_price: raw.asking_price ? Number(raw.asking_price) : null,
      purpose: (raw.purpose as string) || null,
      notes: (raw.notes as string) || null,
      source: (raw.source as string) || null,
      assigned_agent_id: (raw.assigned_agent_id as string) || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "owner_updated",
    entity_type: "owner",
    entity_id: id,
    metadata: { full_name: raw.full_name },
  });

  revalidatePath("/owners");
  redirect("/owners");
}

export async function deleteOwner(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("owners").delete().eq("id", id);

  if (error) return { error: error.message };

  await supabase.from("activity_logs").insert({
    user_id: user.id,
    action: "owner_deleted",
    entity_type: "owner",
    entity_id: id,
  });

  revalidatePath("/owners");
  return { success: true };
}
