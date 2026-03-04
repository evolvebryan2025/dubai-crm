import React, { useState, useEffect } from 'react';
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
import type { Dayjs } from 'dayjs';
import { teamsService, profilesService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';
import type { User, Team } from '../../types';

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

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

// Leads trend over 12 months
const leadsTrendData = [
  { month: 'Jan', Leads: 45 },
  { month: 'Feb', Leads: 62 },
  { month: 'Mar', Leads: 58 },
  { month: 'Apr', Leads: 75 },
  { month: 'May', Leads: 88 },
  { month: 'Jun', Leads: 95 },
  { month: 'Jul', Leads: 82 },
  { month: 'Aug', Leads: 110 },
  { month: 'Sep', Leads: 98 },
  { month: 'Oct', Leads: 125 },
  { month: 'Nov', Leads: 138 },
  { month: 'Dec', Leads: 150 },
];

// Deal distribution by property type
const dealDistributionData = [
  { name: 'Apartment', value: 45 },
  { name: 'Villa', value: 25 },
  { name: 'Penthouse', value: 15 },
  { name: 'Townhouse', value: 10 },
  { name: 'Office', value: 5 },
];

// Transactions per team
const transactionsPerTeamData = [
  { name: 'Sales Team A', Transactions: 48 },
  { name: 'Sales Team B', Transactions: 35 },
  { name: 'Leasing Team', Transactions: 22 },
];

// Top agents by revenue - built dynamically from loaded users
function buildTopAgentRevenueData(users: User[]) {
  const defaultRevenues = [4200000, 3500000, 2800000, 1900000, 1100000];
  return users.map((user, idx) => ({
    name: user.name.split(' ')[0],
    Revenue: defaultRevenues[idx] ?? 1000000,
  }));
}

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
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, profilesRes] = await Promise.all([
          teamsService.getAll(),
          profilesService.getAll(),
        ]);
        if (teamsRes.data) setTeams(teamsRes.data.map((t) => ({ id: t.id, name: t.name, created_at: t.created_at })));
        if (profilesRes.data) setUsers(profilesRes.data.map(profileToUser));
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const topAgentRevenueData = buildTopAgentRevenueData(users);

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
              value="12.5M"
              prefix="AED"
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.teal }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <FileTextOutlined style={{ fontSize: 28, color: COLORS.blue, marginBottom: 8 }} />
            <Statistic
              title="Total Deals"
              value={42}
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.blue }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <BarChartOutlined style={{ fontSize: 28, color: COLORS.purple, marginBottom: 8 }} />
            <Statistic
              title="Avg Deal Size"
              value="297K"
              prefix="AED"
              valueStyle={{ fontSize: 26, fontWeight: 700, color: COLORS.purple }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <TeamOutlined style={{ fontSize: 28, color: COLORS.yellow, marginBottom: 8 }} />
            <Statistic
              title="Active Leads"
              value={513}
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
                  <Tooltip formatter={(value: any) => `${value}%`} />
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
