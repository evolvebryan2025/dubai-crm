"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 85%, 55%)",
  "hsl(0, 70%, 55%)",
  "hsl(270, 60%, 55%)",
  "hsl(180, 55%, 45%)",
  "hsl(330, 65%, 50%)",
];

const STATUS_COLORS: Record<string, string> = {
  new: "hsl(210, 70%, 55%)",
  contacted: "hsl(40, 85%, 55%)",
  qualified: "hsl(150, 60%, 45%)",
  closed: "hsl(var(--primary))",
  lost: "hsl(0, 70%, 55%)",
};

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "var(--radius)",
  fontSize: "12px",
};

interface ReportChartsProps {
  fromDate: string;
  toDate: string;
  listingsPerAgent: { agent: string; count: number }[];
  leadsByStatus: Record<string, unknown>[];
  txnsPerMonth: { month: string; count: number }[];
  commissionPerAgent: { agent: string; total: number }[];
  leadSources: { name: string; value: number }[];
}

function EmptyState() {
  return (
    <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
      No data available for this period
    </div>
  );
}

export function ReportCharts({
  fromDate,
  toDate,
  listingsPerAgent,
  leadsByStatus,
  txnsPerMonth,
  commissionPerAgent,
  leadSources,
}: ReportChartsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function applyDateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/reports?${params.toString()}`);
  }

  // Collect all lead statuses present in data
  const allStatuses = new Set<string>();
  leadsByStatus.forEach((row) => {
    Object.keys(row).forEach((k) => {
      if (k !== "agent") allStatuses.add(k);
    });
  });

  return (
    <div className="space-y-6">
      {/* Date range filter */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="space-y-2">
            <Label>From Date</Label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => applyDateFilter("from", e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-2">
            <Label>To Date</Label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => applyDateFilter("to", e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/reports")}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 1. Listings per agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Listings per Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {listingsPerAgent.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={listingsPerAgent}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="agent"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="fill-muted-foreground"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar
                    dataKey="count"
                    name="Listings"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 2. Leads by status per agent (stacked bar) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Leads by Status per Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadsByStatus.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leadsByStatus}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="agent"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="fill-muted-foreground"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  {Array.from(allStatuses).map((status, i) => (
                    <Bar
                      key={status}
                      dataKey={status}
                      stackId="leads"
                      name={status.charAt(0).toUpperCase() + status.slice(1)}
                      fill={STATUS_COLORS[status] || CHART_COLORS[i % CHART_COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 3. Transactions closed per month (line chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Transactions per Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {txnsPerMonth.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={txnsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="fill-muted-foreground"
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Transactions"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 4. Commission totals per agent */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Commission Totals per Agent (AED)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {commissionPerAgent.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={commissionPerAgent}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="agent"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    className="fill-muted-foreground"
                    tickFormatter={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) =>
                      new Intl.NumberFormat("en-AE", {
                        style: "currency",
                        currency: "AED",
                        maximumFractionDigits: 0,
                      }).format(Number(value))
                    }
                  />
                  <Bar
                    dataKey="total"
                    name="Commission"
                    fill="hsl(150, 60%, 45%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* 5. Lead source breakdown (pie chart) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Lead Source Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadSources.length === 0 ? (
              <EmptyState />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    labelLine
                    label={({ name, percent }) =>
                      `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                    }
                    outerRadius={100}
                    dataKey="value"
                  >
                    {leadSources.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
