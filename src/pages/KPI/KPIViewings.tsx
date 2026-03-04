import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Select,
  Button,
  Avatar,
  Space,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  RiseOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Dayjs } from 'dayjs';
import { profilesService, teamsService } from '../../services/supabaseService';
import { profileToUser, supabaseTeamToTeam } from '../../utils/typeAdapters';
import type { User, Team } from '../../types';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const PRIMARY_COLOR = '#00C4A1';

// ---------------------------------------------------------------------------
// Mock data for viewings over the last 7 days
// ---------------------------------------------------------------------------
const viewingsTrendData = [
  { day: 'Mon', Completed: 28, Cancelled: 5 },
  { day: 'Tue', Completed: 35, Cancelled: 8 },
  { day: 'Wed', Completed: 22, Cancelled: 4 },
  { day: 'Thu', Completed: 31, Cancelled: 6 },
  { day: 'Fri', Completed: 40, Cancelled: 3 },
  { day: 'Sat', Completed: 25, Cancelled: 7 },
  { day: 'Sun', Completed: 17, Cancelled: 3 },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AgentViewingData {
  key: string;
  agentName: string;
  totalViewings: number;
  completed: number;
  cancelled: number;
  conversionRate: number;
  topProperty: string;
}

const topProperties = [
  'Marina Heights 2BR',
  'Palm Villas V12',
  'Bay Tower 1BR',
  'Burj Vista PH1',
  'Marina Gate 2BR',
];

function buildAgentViewingData(users: User[]): AgentViewingData[] {
  const totals = [58, 49, 42, 38, 27];
  const completedArr = [50, 41, 36, 32, 21];
  const conversions = [15.2, 12.8, 11.5, 10.3, 8.7];

  return users.map((user, idx) => {
    const total = totals[idx] ?? 30;
    const completed = completedArr[idx] ?? 25;
    const cancelled = total - completed;
    return {
      key: user.id,
      agentName: user.name,
      totalViewings: total,
      completed,
      cancelled,
      conversionRate: conversions[idx] ?? 10.0,
      topProperty: topProperties[idx] ?? 'N/A',
    };
  });
}

// Summary totals
const summaryTotalViewings = 234;
const summaryCompleted = 198;
const summaryCancelled = 36;
const summaryConversionRate = 12.5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const KPIViewings: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesRes, teamsRes] = await Promise.all([
          profilesService.getAll(),
          teamsService.getAll(),
        ]);
        if (profilesRes.data) setUsers(profilesRes.data.map(profileToUser));
        if (teamsRes.data) setTeams(teamsRes.data.map(supabaseTeamToTeam));
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const agentViewingData = buildAgentViewingData(users);

  const handleReset = () => {
    setDateRange(null);
    setSelectedTeam(undefined);
    setSelectedAgent(undefined);
  };

  // Table columns
  const columns = [
    {
      title: 'Agent Name',
      dataIndex: 'agentName',
      key: 'agentName',
      render: (name: string) => (
        <Space>
          <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: PRIMARY_COLOR }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      ),
    },
    {
      title: 'Total Viewings',
      dataIndex: 'totalViewings',
      key: 'totalViewings',
      width: 130,
      align: 'center' as const,
      sorter: (a: AgentViewingData, b: AgentViewingData) => a.totalViewings - b.totalViewings,
    },
    {
      title: 'Completed',
      dataIndex: 'completed',
      key: 'completed',
      width: 120,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: 'Cancelled',
      dataIndex: 'cancelled',
      key: 'cancelled',
      width: 120,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: 'Conversion Rate (%)',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      width: 160,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#1890ff', fontWeight: 500 }}>{val}%</span>,
      sorter: (a: AgentViewingData, b: AgentViewingData) => a.conversionRate - b.conversionRate,
    },
    {
      title: 'Top Property',
      dataIndex: 'topProperty',
      key: 'topProperty',
      width: 180,
    },
  ];

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
        KPI - Viewings
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
              placeholder="Select Agent"
              allowClear
              value={selectedAgent}
              onChange={setSelectedAgent}
              style={{ width: 180 }}
              options={users.map((u) => ({ label: u.name, value: u.id }))}
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
          SUMMARY CARDS
          ---------------------------------------------------------------- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <EyeOutlined style={{ fontSize: 28, color: '#722ed1', marginBottom: 8 }} />
            <Statistic
              title="Total Viewings"
              value={summaryTotalViewings}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
            <Statistic
              title="Completed"
              value={summaryCompleted}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <CloseCircleOutlined style={{ fontSize: 28, color: '#ff4d4f', marginBottom: 8 }} />
            <Statistic
              title="Cancelled"
              value={summaryCancelled}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <RiseOutlined style={{ fontSize: 28, color: PRIMARY_COLOR, marginBottom: 8 }} />
            <Statistic
              title="Conversion Rate"
              value={summaryConversionRate}
              suffix="%"
              valueStyle={{ fontSize: 28, fontWeight: 700, color: PRIMARY_COLOR }}
            />
          </Card>
        </Col>
      </Row>

      {/* ----------------------------------------------------------------
          LINE CHART - Viewings Over Time (Last 7 Days)
          ---------------------------------------------------------------- */}
      <Card
        title="Viewings Over Time (Last 7 Days)"
        style={{ borderRadius: 12, marginBottom: 24 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={viewingsTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Completed"
                stroke={PRIMARY_COLOR}
                strokeWidth={2}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line
                type="monotone"
                dataKey="Cancelled"
                stroke="#ff4d4f"
                strokeWidth={2}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ----------------------------------------------------------------
          TABLE - Agent Viewing Details
          ---------------------------------------------------------------- */}
      <Card
        title="Agent Viewing Details"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={agentViewingData}
          rowKey="key"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} agents` }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default KPIViewings;
