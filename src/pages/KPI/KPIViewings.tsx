import React, { useState, useEffect, useMemo } from 'react';
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
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import {
  profilesService,
  teamsService,
  viewingsService,
  transactionsService,
} from '../../services/supabaseService';
import { profileToUser, supabaseTeamToTeam } from '../../utils/typeAdapters';
import type { User, Team } from '../../types';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const PRIMARY_COLOR = '#00C4A1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RawViewing {
  id: string;
  agent_id: string;
  contact_name?: string;
  viewing_date: string;
  viewing_time?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  property_address?: string;
  area?: string;
  profiles?: { full_name: string; avatar_url?: string; team_id?: string } | null;
  [key: string]: unknown;
}

interface RawTransaction {
  id: string;
  agent_id: string;
  [key: string]: unknown;
}

interface AgentViewingData {
  key: string;
  agentName: string;
  totalViewings: number;
  completed: number;
  cancelled: number;
  noShows: number;
  conversionRate: number;
}

interface TrendPoint {
  day: string;
  Completed: number;
  Cancelled: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const KPIViewings: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allViewings, setAllViewings] = useState<RawViewing[]>([]);
  const [allTransactions, setAllTransactions] = useState<RawTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // ---- Fetch all data once ----
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesRes, teamsRes, viewingsRes, transactionsRes] = await Promise.all([
          profilesService.getAll(),
          teamsService.getAll(),
          viewingsService.getAll(),
          transactionsService.getAll(),
        ]);
        if (profilesRes.data) setUsers(profilesRes.data.map(profileToUser));
        if (teamsRes.data) setTeams(teamsRes.data.map(supabaseTeamToTeam));
        if (viewingsRes.data) setAllViewings(viewingsRes.data as unknown as RawViewing[]);
        if (transactionsRes.data) setAllTransactions(transactionsRes.data as unknown as RawTransaction[]);
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---- Build a lookup: profile id -> team_id ----
  const profileTeamMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    users.forEach((u) => map.set(u.id, u.team_id));
    return map;
  }, [users]);

  // ---- Filtered viewings ----
  const filteredViewings = useMemo(() => {
    let result = allViewings;

    // Date range filter
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      result = result.filter((v) => {
        const d = dayjs(v.viewing_date);
        return d.isAfter(start.subtract(1, 'millisecond')) && d.isBefore(end.add(1, 'millisecond'));
      });
    }

    // Team filter
    if (selectedTeam) {
      result = result.filter((v) => {
        const teamId = v.profiles?.team_id ?? profileTeamMap.get(v.agent_id);
        return teamId === selectedTeam;
      });
    }

    // Agent filter
    if (selectedAgent) {
      result = result.filter((v) => v.agent_id === selectedAgent);
    }

    return result;
  }, [allViewings, dateRange, selectedTeam, selectedAgent, profileTeamMap]);

  // ---- Filtered transactions (same agent / date scope) ----
  const filteredTransactions = useMemo(() => {
    let result = allTransactions;
    if (selectedTeam) {
      result = result.filter((t) => {
        const teamId = profileTeamMap.get(t.agent_id);
        return teamId === selectedTeam;
      });
    }
    if (selectedAgent) {
      result = result.filter((t) => t.agent_id === selectedAgent);
    }
    return result;
  }, [allTransactions, selectedTeam, selectedAgent, profileTeamMap]);

  // ---- Summary stats ----
  const summaryTotalViewings = useMemo(() => filteredViewings.length, [filteredViewings]);
  const summaryCompleted = useMemo(
    () => filteredViewings.filter((v) => v.status === 'completed').length,
    [filteredViewings],
  );
  const summaryCancelled = useMemo(
    () => filteredViewings.filter((v) => v.status === 'cancelled').length,
    [filteredViewings],
  );
  const summaryConversionRate = useMemo(() => {
    if (summaryCompleted === 0) return 0;
    return Math.round((filteredTransactions.length / summaryCompleted) * 1000) / 10;
  }, [filteredTransactions, summaryCompleted]);

  // ---- Viewings Over Time (group by day-of-week for last 7 days from filtered data) ----
  const viewingsTrendData = useMemo<TrendPoint[]>(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: Record<string, { Completed: number; Cancelled: number }> = {};

    // Build 7-day buckets ending today
    for (let i = 6; i >= 0; i--) {
      const label = dayjs().subtract(i, 'day').format('ddd');
      const dateKey = dayjs().subtract(i, 'day').format('YYYY-MM-DD');
      // Use dateKey as unique key, label for display
      buckets[dateKey] = { Completed: 0, Cancelled: 0 };
      void label; // used below
    }

    filteredViewings.forEach((v) => {
      const dateKey = dayjs(v.viewing_date).format('YYYY-MM-DD');
      if (buckets[dateKey]) {
        if (v.status === 'completed') buckets[dateKey].Completed += 1;
        if (v.status === 'cancelled') buckets[dateKey].Cancelled += 1;
      }
    });

    return Object.entries(buckets).map(([dateKey, counts]) => ({
      day: dayjs(dateKey).format('ddd') as (typeof dayNames)[number],
      ...counts,
    }));
  }, [filteredViewings]);

  // ---- Agent Viewing Details table data ----
  const agentViewingData = useMemo<AgentViewingData[]>(() => {
    const agentMap = new Map<string, { total: number; completed: number; cancelled: number; noShows: number }>();

    filteredViewings.forEach((v) => {
      const existing = agentMap.get(v.agent_id) ?? { total: 0, completed: 0, cancelled: 0, noShows: 0 };
      existing.total += 1;
      if (v.status === 'completed') existing.completed += 1;
      if (v.status === 'cancelled') existing.cancelled += 1;
      if (v.status === 'no_show') existing.noShows += 1;
      agentMap.set(v.agent_id, existing);
    });

    // Count transactions per agent
    const txnCountByAgent = new Map<string, number>();
    filteredTransactions.forEach((t) => {
      txnCountByAgent.set(t.agent_id, (txnCountByAgent.get(t.agent_id) ?? 0) + 1);
    });

    const userNameMap = new Map<string, string>();
    users.forEach((u) => userNameMap.set(u.id, u.name));

    const rows: AgentViewingData[] = [];
    agentMap.forEach((counts, agentId) => {
      const convRate = counts.completed > 0
        ? Math.round(((txnCountByAgent.get(agentId) ?? 0) / counts.completed) * 1000) / 10
        : 0;
      rows.push({
        key: agentId,
        agentName: userNameMap.get(agentId) ?? 'Unknown Agent',
        totalViewings: counts.total,
        completed: counts.completed,
        cancelled: counts.cancelled,
        noShows: counts.noShows,
        conversionRate: convRate,
      });
    });

    // Sort descending by totalViewings
    rows.sort((a, b) => b.totalViewings - a.totalViewings);
    return rows;
  }, [filteredViewings, filteredTransactions, users]);

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
      title: 'No Shows',
      dataIndex: 'noShows',
      key: 'noShows',
      width: 120,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#faad14', fontWeight: 500 }}>{val}</span>,
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
