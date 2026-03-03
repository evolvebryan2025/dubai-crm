import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_REDIRECT } from "@/lib/constants";
import type { UserRole } from "@/types/enums";
import type { Profile } from "@/types/database";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { subDays, format, eachDayOfInterval } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = data as Profile | null;
  if (!profile) redirect("/login");

  const role = profile.role as UserRole;

  if (role === "finance") {
    redirect(ROLE_REDIRECT.finance);
  }

  const isAgent = role === "agent";
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).toISOString();

  // Build queries scoped by role
  let listingsQuery = supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .in("status", ["active", "under_offer"]);
  if (isAgent) listingsQuery = listingsQuery.eq("assigned_agent_id", user.id);

  let leadsQuery = supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .in("status", ["new", "contacted", "qualified"]);
  if (isAgent) leadsQuery = leadsQuery.eq("assigned_agent_id", user.id);

  let txnQuery = supabase
    .from("transactions")
    .select("*", { count: "exact", head: true })
    .gte("deal_date", startOfMonth);
  if (isAgent) txnQuery = txnQuery.eq("agent_id", user.id);

  let approvalQuery = supabase
    .from("commission_approvals")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "owner_approved"]);
  if (isAgent) approvalQuery = approvalQuery.eq("agent_id", user.id);

  // Leads in last 30 days for chart
  let leadsChartQuery = supabase
    .from("leads")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo);
  if (isAgent) leadsChartQuery = leadsChartQuery.eq("assigned_agent_id", user.id);

  // Run all queries in parallel
  const [listingsRes, leadsRes, txnRes, approvalRes, leadsChartRes] =
    await Promise.all([
      listingsQuery,
      leadsQuery,
      txnQuery,
      approvalQuery,
      leadsChartQuery,
    ]);

  // Aggregate leads-per-day for chart
  const days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const leadsByDay = new Map<string, number>();
  days.forEach((d) => leadsByDay.set(format(d, "MMM dd"), 0));

  (leadsChartRes.data ?? []).forEach((lead: { created_at: string }) => {
    const key = format(new Date(lead.created_at), "MMM dd");
    leadsByDay.set(key, (leadsByDay.get(key) ?? 0) + 1);
  });

  const leadsChartData = Array.from(leadsByDay.entries()).map(
    ([date, count]) => ({ date, count })
  );

  const stats = {
    totalListings: listingsRes.count ?? 0,
    activeLeads: leadsRes.count ?? 0,
    recentTransactions: txnRes.count ?? 0,
    pendingApprovals: approvalRes.count ?? 0,
    leadsChartData,
  };

  return <DashboardContent role={role} profile={profile} stats={stats} />;
}
