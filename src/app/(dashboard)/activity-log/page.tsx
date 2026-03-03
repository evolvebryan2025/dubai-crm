import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import type { ActivityLog, Profile } from "@/types/database";
import { PageHeader } from "@/components/shared/page-header";
import { ActivityTable } from "@/components/activity-log/activity-table";
import { ActivityFilters } from "@/components/activity-log/activity-filters";

export const dynamic = "force-dynamic";

type ActivityLogWithUser = ActivityLog & {
  user?: Pick<Profile, "full_name" | "email"> | null;
};

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only admin / super_admin
  const { data: profileRaw } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = (profileRaw?.role as UserRole) ?? "agent";
  if (role !== "super_admin" && role !== "admin") redirect("/");

  // Build query with filters
  let query = supabase
    .from("activity_logs")
    .select("*, user:profiles!activity_logs_user_id_fkey(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.action) {
    query = query.eq("action", params.action);
  }
  if (params.from) {
    query = query.gte("created_at", `${params.from}T00:00:00`);
  }
  if (params.to) {
    query = query.lte("created_at", `${params.to}T23:59:59`);
  }

  const { data: rawLogs } = await query;
  const logs = (rawLogs ?? []) as ActivityLogWithUser[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="System-wide activity and audit trail"
      />
      <ActivityFilters />
      <ActivityTable logs={logs} />
    </div>
  );
}
