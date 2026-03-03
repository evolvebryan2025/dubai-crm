import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import type { Profile, Team } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { SettingsPanel } from "@/components/settings/settings-panel";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profileRaw?.role as UserRole) ?? "agent";
  if (role !== "super_admin") redirect("/");

  // Fetch teams
  const { data: teamsRaw } = await supabase
    .from("teams")
    .select("*")
    .order("name");

  // Fetch all users
  const { data: usersRaw } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, team_id, is_active")
    .order("full_name");

  // Fetch company settings
  const { data: settingsRaw } = await supabase
    .from("settings")
    .select("*")
    .eq("category", "company");

  const teams = (teamsRaw ?? []) as Team[];
  const users = (usersRaw ?? []) as Pick<
    Profile,
    "id" | "full_name" | "email" | "role" | "team_id" | "is_active"
  >[];

  const companySettings: Record<string, string> = {};
  (settingsRaw ?? []).forEach((s: { key: string; value: unknown }) => {
    companySettings[s.key] = typeof s.value === "string" ? s.value : JSON.stringify(s.value);
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="System configuration — Super Admin only" />
      <SettingsPanel
        teams={teams}
        users={users}
        companySettings={companySettings}
      />
    </div>
  );
}
