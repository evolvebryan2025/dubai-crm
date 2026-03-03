"use client";

import type { Profile } from "@/types/database";
import type { UserRole } from "@/types/enums";
import { ROLE_LABELS } from "@/types/enums";
import { StatCard } from "./stat-card";
import { LeadsChart } from "./leads-chart";
import {
  Building2,
  UserPlus,
  Receipt,
  BadgeDollarSign,
  TrendingUp,
  CalendarClock,
} from "lucide-react";

interface DashboardStats {
  totalListings: number;
  activeLeads: number;
  recentTransactions: number;
  pendingApprovals: number;
  leadsChartData: { date: string; count: number }[];
}

interface DashboardContentProps {
  role: UserRole;
  profile: Profile;
  stats: DashboardStats;
}

export function DashboardContent({ role, profile, stats }: DashboardContentProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {profile.full_name || "User"}
        </h1>
        <p className="text-muted-foreground">
          {ROLE_LABELS[role]} Dashboard
        </p>
      </div>

      {(role === "super_admin" || role === "admin") && (
        <AdminDashboard stats={stats} />
      )}

      {role === "agent" && <AgentDashboard stats={stats} />}

      <LeadsChart data={stats.leadsChartData} />
    </div>
  );
}

function AdminDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Listings"
        value={stats.totalListings}
        description="Active properties"
        icon={Building2}
      />
      <StatCard
        title="Active Leads"
        value={stats.activeLeads}
        description="In pipeline"
        icon={UserPlus}
      />
      <StatCard
        title="Recent Transactions"
        value={stats.recentTransactions}
        description="This month"
        icon={TrendingUp}
      />
      <StatCard
        title="Pending Approvals"
        value={stats.pendingApprovals}
        description="Awaiting clearance"
        icon={BadgeDollarSign}
      />
    </div>
  );
}

function AgentDashboard({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="My Listings"
        value={stats.totalListings}
        description="Assigned to you"
        icon={Building2}
      />
      <StatCard
        title="My Leads"
        value={stats.activeLeads}
        description="Active leads"
        icon={UserPlus}
      />
      <StatCard
        title="My Transactions"
        value={stats.recentTransactions}
        description="This month"
        icon={Receipt}
      />
      <StatCard
        title="Pending Approvals"
        value={stats.pendingApprovals}
        description="Awaiting clearance"
        icon={CalendarClock}
      />
    </div>
  );
}
