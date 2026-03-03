"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";

async function requireSuperAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated", supabase: null, user: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profile as { role: string } | null)?.role;
  if (role !== "super_admin")
    return { error: "Not authorized", supabase: null, user: null };

  return { error: null, supabase, user };
}

// --- Team Management ---

export async function createTeam(formData: FormData) {
  const { error: authErr, supabase, user } = await requireSuperAdmin();
  if (authErr || !supabase || !user) return { error: authErr ?? "Auth failed" };

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;

  const { error } = await supabase.from("teams").insert({
    name,
    description,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function deleteTeam(teamId: string) {
  const { error: authErr, supabase } = await requireSuperAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  // Unassign members first
  await supabase
    .from("profiles")
    .update({ team_id: null })
    .eq("team_id", teamId);

  const { error } = await supabase.from("teams").delete().eq("id", teamId);
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function assignUserToTeam(userId: string, teamId: string | null) {
  const { error: authErr, supabase } = await requireSuperAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  const { error } = await supabase
    .from("profiles")
    .update({ team_id: teamId })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// --- Role Management ---

export async function updateUserRole(userId: string, role: UserRole) {
  const { error: authErr, supabase } = await requireSuperAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const { error: authErr, supabase } = await requireSuperAdmin();
  if (authErr || !supabase) return { error: authErr ?? "Auth failed" };

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { success: true };
}

// --- Company Settings ---

export async function updateCompanySetting(key: string, value: string) {
  const { error: authErr, supabase, user } = await requireSuperAdmin();
  if (authErr || !supabase || !user) return { error: authErr ?? "Auth failed" };

  // Upsert: try update first, then insert
  const { data: existing } = await supabase
    .from("settings")
    .select("id")
    .eq("category", "company")
    .eq("key", key)
    .single();

  if (existing) {
    const { error } = await supabase
      .from("settings")
      .update({ value: value as unknown as import("@/types/database").Json, updated_by: user.id })
      .eq("id", (existing as { id: string }).id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("settings").insert({
      category: "company",
      key,
      value: value as unknown as import("@/types/database").Json,
      updated_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidatePath("/settings");
  return { success: true };
}
