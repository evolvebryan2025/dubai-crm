import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Select,
  Button,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  teamsService,
  profilesService,
  transactionsService,
  leadsService,
} from '../../services/supabaseService';

const { RangePicker } = DatePicker;
const { Title } = Typography;

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const COLORS = {
  teal: '#00C4A1',
  blue: '#1890ff',
  purple: '#722ed1',
  yellow: '#faad14',
  red: '#ff4d4f',
  cyan: '#13c2c2',
};

const PIE_COLORS = [COLORS.teal, COLORS.blue, COLORS.purple, COLORS.yellow, COLORS.red];

// Custom label for PieChart
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Format AED values for tooltip
const formatAED = (value: number): string => {
  if (value >= 1000000) return `AED ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `AED ${(value / 1000).toFixed(0)}K`;
  return `AED ${value}`;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const KPIInsightBoard: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState<string | undefined>(undefined);
  const [teams, setTeams] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, profilesRes, transactionsRes, leadsRes] = await Promise.all([
          teamsService.getAll(),
          profilesService.getAll(),
          transactionsService.getAll(),
          leadsService.getAll(),
        ]);
        if (teamsRes.data) setTeams(teamsRes.data);
        if (profilesRes.data) setProfiles(profilesRes.data);
        if (transactionsRes.data) setTransactions(transactionsRes.data);
        if (leadsRes.data) setLeads(leadsRes.data);
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // -----------------------------------------------------------------------
  // Build profile lookup maps
  // -----------------------------------------------------------------------
  const profileMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const p of profiles) {
      map[p.id] = p;
    }
    return map;
  }, [profiles]);

  const teamMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of teams) {
      map[t.id] = t.name;
    }
    return map;
  }, [teams]);

  // -----------------------------------------------------------------------
  // Filtered data based on dateRange and selectedTeam
  // -----------------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      filtered = filtered.filter((t) => {
        const d = dayjs(t.deal_date || t.created_at);
        return d.isAfter(start) && d.isBefore(end);
      });
    }

    if (selectedTeam) {
      filtered = filtered.filter((t) => {
        const profile = profileMap[t.agent_id];
        return profile && profile.team_id === selectedTeam;
      });
    }

    return filtered;
  }, [transactions, dateRange, selectedTeam, profileMap]);

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      filtered = filtered.filter((l) => {
        const d = dayjs(l.created_at);
        return d.isAfter(start) && d.isBefore(end);
      });
    }

    if (selectedTeam) {
      filtered = filtered.filter((l) => {
        const profile = profileMap[l.assigned_agent_id];
        return profile && profile.team_id === selectedTeam;
      });
    }

    return filtered;
  }, [leads, dateRange, selectedTeam, profileMap]);

  // -----------------------------------------------------------------------
  // Summary card stats
  // -----------------------------------------------------------------------
  const totalRevenue = useMemo(
    () => filteredTransactions.reduce((sum, t) => sum + (Number(t.deal_value) || 0), 0),
    [filteredTransactions],
  );

  const totalDeals = filteredTransactions.length;

  const avgDealSize = totalDeals > 0 ? totalRevenue / totalDeals : 0;

  const activeLeads = useMemo(
    () => filteredLeads.filter((l) => ['new', 'contacted', 'qualified'].includes(l.status)).length,
    [filteredLeads],
  );

  // -----------------------------------------------------------------------
  // Leads Trend (Area Chart) — group by month for last 12 months
  // -----------------------------------------------------------------------
  const leadsTrendData = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const m = dayjs().subtract(i, 'month');
      months.push({ key: m.format('YYYY-MM'), label: m.format('MMM') });
    }

    const counts: Record<string, number> = {};
    for (const m of months) counts[m.key] = 0;

    for (const l of filteredLeads) {
      const key = dayjs(l.created_at).format('YYYY-MM');
      if (counts[key] !== undefined) {
        counts[key]++;
      }
    }

    return months.map((m) => ({ month: m.label, Leads: counts[m.key] }));
  }, [filteredLeads]);

  // -----------------------------------------------------------------------
  // Deal Distribution (Pie Chart) — group by property type from listing
  // -----------------------------------------------------------------------
  const dealDistributionData = useMemo(() => {
    const typeCounts: Record<string, number> = {};

    for (const t of filteredTransactions) {
      const propType = t.listings?.property_type || 'Other';
      const label = propType.charAt(0).toUpperCase() + propType.slice(1);
      typeCounts[label] = (typeCounts[label] || 0) + 1;
    }

    return Object.entries(typeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // -----------------------------------------------------------------------
  // Transactions Per Team
  // -----------------------------------------------------------------------
  const transactionsPerTeamData = useMemo(() => {
    const teamCounts: Record<string, number> = {};

    for (const t of filteredTransactions) {
      const profile = profileMap[t.agent_id];
      const teamName = profile?.team_id ? (teamMap[profile.team_id] || 'Unknown') : 'Unassigned';
      teamCounts[teamName] = (teamCounts[teamName] || 0) + 1;
    }

    return Object.entries(teamCounts)
      .map(([name, count]) => ({ name, Transactions: count }))
      .sort((a, b) => b.Transactions - a.Transactions);
  }, [filteredTransactions, profileMap, teamMap]);

  // -----------------------------------------------------------------------
  // Top Agents by Revenue — top 5
  // -----------------------------------------------------------------------
  const topAgentRevenueData = useMemo(() => {
    const agentRevenue: Record<string, number> = {};

    for (const t of filteredTransactions) {
      const agentId = t.agent_id;
      if (!agentId) continue;
      agentRevenue[agentId] = (agentRevenue[agentId] || 0) + (Number(t.deal_value) || 0);
    }

    return Object.entries(agentRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([agentId, revenue]) => {
        const profile = profileMap[agentId];
        const fullName = profile?.full_name || 'Unknown';
        const firstName = fullName.split(' ')[0];
        return { name: firstName, Revenue: revenue };
      });
  }, [filteredTransactions, profileMap]);

  const handleReset = () => {
    setDateRange(null);
    setSelectedTeam(undefined);
    setSelectedPeriod(undefined);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      {/* Page title */}
      <Title level={4} style={{ margin: 0, marginBottom: 20 }}>
        KPI - Insight Board
      </Title>

      {/* ----------------------------------------------------------------
          FILTERS
          ---------------------------------------------------------------- */}
      <Card
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(vals) => setDateRange(vals)}
              style={{ width: 260 }}
              placeholder={['Start date', 'End date']}
            />
          </Col>
          <Col>
            <Select
              placeholder="Select Team"
              allowClear
              value={selectedTeam}
              onChange={setSelectedTeam}
              style={{ width: 180 }}
              options={teams.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Select Period"
              allowClear
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 160 }}
              options={[
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
                { label: 'Quarterly', value: 'quarterly' },
              ]}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* ----------------------------------------------------------------
          ROW 1 - STAT CARDS
          ---------------------------------------------------------------- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <DollarOutlined style={{ fontSize: 28, color: COLORS.teal, marginBottom: 8 }} />
            <Statistic
              title="Total Revenue"
              value={formatAED(totalRevenue)}
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.teal }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <FileTextOutlined style={{ fontSize: 28, color: COLORS.blue, marginBottom: 8 }} />
            <Statistic
              title="Total Deals"
              value={totalDeals}
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.blue }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <BarChartOutlined style={{ fontSize: 28, color: COLORS.purple, marginBottom: 8 }} />
            <Statistic
              title="Avg Deal Size"
              value={formatAED(avgDealSize)}
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.purple }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <TeamOutlined style={{ fontSize: 28, color: COLORS.yellow, marginBottom: 8 }} />
            <Statistic
              title="Active Leads"
              value={activeLeads}
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.yellow }}
            />
          </Card>
        </Col>
      </Row>

      {/* ----------------------------------------------------------------
          ROW 2 - Area Chart + Pie Chart
          ---------------------------------------------------------------- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Leads Trend (Area Chart) */}
        <Col xs={24} lg={14}>
          <Card
            title="Leads Trend (12 Months)"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={leadsTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Leads"
                    stroke={COLORS.teal}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#leadGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Deal Distribution (Pie Chart) */}
        <Col xs={24} lg={10}>
          <Card
            title="Deal Distribution by Property Type"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dealDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel as any}
                    outerRadius={120}
                    dataKey="value"
                  >
                    {dealDistributionData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `${value} deals`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ----------------------------------------------------------------
          ROW 3 - Transactions Per Team + Top Agents by Revenue
          ---------------------------------------------------------------- */}
      <Row gutter={[16, 16]}>
        {/* Transactions Per Team */}
        <Col xs={24} lg={12}>
          <Card
            title="Transactions Per Team"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={transactionsPerTeamData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Transactions" fill={COLORS.blue} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        {/* Top Agents by Revenue */}
        <Col xs={24} lg={12}>
          <Card
            title="Top Agents by Revenue"
            style={{ borderRadius: 12, height: '100%' }}
            styles={{ body: { padding: '12px 16px' } }}
          >
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAgentRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(val: number) => formatAED(val)} />
                  <Tooltip formatter={(value: any) => formatAED(Number(value))} />
                  <Legend />
                  <Bar dataKey="Revenue" fill={COLORS.cyan} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default KPIInsightBoard;
