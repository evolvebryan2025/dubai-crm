import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/types/enums";
import { PageHeader } from "@/components/shared/page-header";
import { ReportCharts } from "@/components/reports/report-charts";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const params = await searchParams;
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
  if (role !== "super_admin" && role !== "admin") redirect("/");

  // Date range defaults: last 90 days
  const toDate = params.to || new Date().toISOString().split("T")[0];
  const fromDate =
    params.from ||
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  // Fetch all agents
  const { data: agentsRaw } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("role", "agent")
    .eq("is_active", true)
    .order("full_name");

  const agents = (agentsRaw ?? []) as { id: string; full_name: string }[];
  const agentMap: Record<string, string> = {};
  agents.forEach((a) => {
    agentMap[a.id] = a.full_name;
  });

  // 1. Listings per agent
  const { data: listingsRaw } = await supabase
    .from("listings")
    .select("assigned_agent_id")
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`);

  const listingsPerAgent: Record<string, number> = {};
  (listingsRaw ?? []).forEach((l: { assigned_agent_id: string }) => {
    const name = agentMap[l.assigned_agent_id] || "Unknown";
    listingsPerAgent[name] = (listingsPerAgent[name] || 0) + 1;
  });
  const listingsPerAgentData = Object.entries(listingsPerAgent).map(
    ([agent, count]) => ({ agent, count })
  );

  // 2. Leads by status per agent
  const { data: leadsRaw } = await supabase
    .from("leads")
    .select("assigned_agent_id, status")
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`);

  const leadsMap: Record<string, Record<string, number>> = {};
  (leadsRaw ?? []).forEach(
    (l: { assigned_agent_id: string | null; status: string }) => {
      const name = l.assigned_agent_id
        ? agentMap[l.assigned_agent_id] || "Unassigned"
        : "Unassigned";
      if (!leadsMap[name]) leadsMap[name] = {};
      leadsMap[name][l.status] = (leadsMap[name][l.status] || 0) + 1;
    }
  );
  const leadsByStatusData = Object.entries(leadsMap).map(
    ([agent, statuses]) => ({ agent, ...statuses })
  );

  // 3. Transactions closed per month
  const { data: txnsRaw } = await supabase
    .from("transactions")
    .select("deal_date")
    .gte("deal_date", fromDate)
    .lte("deal_date", toDate);

  const txnsByMonth: Record<string, number> = {};
  (txnsRaw ?? []).forEach((t: { deal_date: string }) => {
    const month = t.deal_date.substring(0, 7); // YYYY-MM
    txnsByMonth[month] = (txnsByMonth[month] || 0) + 1;
  });
  const txnsPerMonthData = Object.entries(txnsByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));

  // 4. Commission totals per agent
  const { data: commissionsRaw } = await supabase
    .from("commission_approvals")
    .select("agent_id, commission_amount")
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`);

  const commPerAgent: Record<string, number> = {};
  (commissionsRaw ?? []).forEach(
    (c: { agent_id: string; commission_amount: number }) => {
      const name = agentMap[c.agent_id] || "Unknown";
      commPerAgent[name] = (commPerAgent[name] || 0) + c.commission_amount;
    }
  );
  const commissionPerAgentData = Object.entries(commPerAgent).map(
    ([agent, total]) => ({ agent, total })
  );

  // 5. Lead source breakdown
  const { data: leadSourcesRaw } = await supabase
    .from("leads")
    .select("source")
    .gte("created_at", `${fromDate}T00:00:00`)
    .lte("created_at", `${toDate}T23:59:59`);

  const sourceMap: Record<string, number> = {};
  (leadSourcesRaw ?? []).forEach((l: { source: string | null }) => {
    const src = l.source || "Unknown";
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const leadSourceData = Object.entries(sourceMap).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="KPR Reports" description="Key performance reports and analytics" />
      <ReportCharts
        fromDate={fromDate}
        toDate={toDate}
        listingsPerAgent={listingsPerAgentData}
        leadsByStatus={leadsByStatusData}
        txnsPerMonth={txnsPerMonthData}
        commissionPerAgent={commissionPerAgentData}
        leadSources={leadSourceData}
      />
    </div>
  );
}
