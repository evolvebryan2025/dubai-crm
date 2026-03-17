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
  PhoneOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { profilesService, teamsService, callLogsService } from '../../services/supabaseService';
import { profileToUser, supabaseTeamToTeam } from '../../utils/typeAdapters';
import type { User, Team } from '../../types';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const PRIMARY_COLOR = '#00C4A1';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CallLog {
  id: string;
  agent_id: string;
  contact_name?: string;
  contact_phone?: string;
  direction?: 'inbound' | 'outbound';
  status: 'answered' | 'missed' | 'voicemail' | 'busy';
  duration_seconds?: number;
  notes?: string;
  source?: string;
  created_at: string;
  profiles?: { full_name?: string; avatar_url?: string; team_id?: string } | null;
}

interface AgentCallData {
  key: string;
  agentId: string;
  agentName: string;
  totalCalls: number;
  answered: number;
  missed: number;
  avgDuration: string;
  lastCallDate: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const KPIContacts: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesRes, teamsRes, callLogsRes] = await Promise.all([
          profilesService.getAll(),
          teamsService.getAll(),
          Promise.resolve(callLogsService.getAll()).catch(() => ({ data: null })),
        ]);
        if (profilesRes.data) setUsers(profilesRes.data.map(profileToUser));
        if (teamsRes.data) setTeams(teamsRes.data.map(supabaseTeamToTeam));
        if (callLogsRes.data) setCallLogs(callLogsRes.data as unknown as CallLog[]);
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Build a map of user id -> team_id for filtering
  const userTeamMap = useMemo(() => {
    const map = new Map<string, string | undefined>();
    users.forEach((u) => map.set(u.id, u.team_id));
    return map;
  }, [users]);

  // Build a map of user id -> name for display
  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => map.set(u.id, u.name));
    return map;
  }, [users]);

  // Filtered call logs based on dateRange, selectedTeam, selectedAgent
  const filteredLogs = useMemo(() => {
    let logs = callLogs;

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day').toISOString();
      const end = dateRange[1].endOf('day').toISOString();
      logs = logs.filter((log) => log.created_at >= start && log.created_at <= end);
    }

    // Filter by team (via agent's team_id)
    if (selectedTeam) {
      logs = logs.filter((log) => {
        const agentTeamId = log.profiles?.team_id ?? userTeamMap.get(log.agent_id);
        return agentTeamId === selectedTeam;
      });
    }

    // Filter by agent
    if (selectedAgent) {
      logs = logs.filter((log) => log.agent_id === selectedAgent);
    }

    return logs;
  }, [callLogs, dateRange, selectedTeam, selectedAgent, userTeamMap]);

  // Summary stats
  const summaryTotalCalls = filteredLogs.length;
  const summaryAnswered = useMemo(
    () => filteredLogs.filter((l) => l.status === 'answered').length,
    [filteredLogs],
  );
  const summaryMissed = useMemo(
    () => filteredLogs.filter((l) => l.status === 'missed').length,
    [filteredLogs],
  );
  const summaryAvgDuration = useMemo(() => {
    const answeredLogs = filteredLogs.filter((l) => l.status === 'answered' && l.duration_seconds);
    if (answeredLogs.length === 0) return '0:00';
    const totalSeconds = answeredLogs.reduce((sum, l) => sum + (l.duration_seconds ?? 0), 0);
    return formatDuration(totalSeconds / answeredLogs.length);
  }, [filteredLogs]);

  // Agent call data (table + chart)
  const agentCallData: AgentCallData[] = useMemo(() => {
    const agentMap = new Map<
      string,
      { totalCalls: number; answered: number; missed: number; totalDuration: number; answeredCount: number; lastCall: string }
    >();

    filteredLogs.forEach((log) => {
      const agentId = log.agent_id;
      if (!agentId) return;

      const existing = agentMap.get(agentId) ?? {
        totalCalls: 0,
        answered: 0,
        missed: 0,
        totalDuration: 0,
        answeredCount: 0,
        lastCall: '',
      };

      existing.totalCalls += 1;
      if (log.status === 'answered') {
        existing.answered += 1;
        if (log.duration_seconds) {
          existing.totalDuration += log.duration_seconds;
          existing.answeredCount += 1;
        }
      }
      if (log.status === 'missed') {
        existing.missed += 1;
      }
      if (!existing.lastCall || log.created_at > existing.lastCall) {
        existing.lastCall = log.created_at;
      }

      agentMap.set(agentId, existing);
    });

    const result: AgentCallData[] = [];
    agentMap.forEach((stats, agentId) => {
      const agentName =
        userNameMap.get(agentId) ?? 'Unknown Agent';
      const avgSec = stats.answeredCount > 0 ? stats.totalDuration / stats.answeredCount : 0;

      result.push({
        key: agentId,
        agentId,
        agentName,
        totalCalls: stats.totalCalls,
        answered: stats.answered,
        missed: stats.missed,
        avgDuration: formatDuration(avgSec),
        lastCallDate: stats.lastCall ? dayjs(stats.lastCall).format('YYYY-MM-DD') : '-',
      });
    });

    // Sort by total calls descending
    result.sort((a, b) => b.totalCalls - a.totalCalls);
    return result;
  }, [filteredLogs, userNameMap]);

  const chartData = useMemo(
    () =>
      agentCallData.map((a) => ({
        name: a.agentName.split(' ')[0],
        Answered: a.answered,
        Missed: a.missed,
      })),
    [agentCallData],
  );

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
      title: 'Total Calls',
      dataIndex: 'totalCalls',
      key: 'totalCalls',
      width: 120,
      align: 'center' as const,
      sorter: (a: AgentCallData, b: AgentCallData) => a.totalCalls - b.totalCalls,
    },
    {
      title: 'Answered',
      dataIndex: 'answered',
      key: 'answered',
      width: 120,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: 'Missed',
      dataIndex: 'missed',
      key: 'missed',
      width: 120,
      align: 'center' as const,
      render: (val: number) => <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{val}</span>,
    },
    {
      title: 'Avg Duration',
      dataIndex: 'avgDuration',
      key: 'avgDuration',
      width: 130,
      align: 'center' as const,
    },
    {
      title: 'Last Call Date',
      dataIndex: 'lastCallDate',
      key: 'lastCallDate',
      width: 140,
      align: 'center' as const,
      render: (date: string) => (date && date !== '-' ? new Date(date).toLocaleDateString() : '-'),
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
        KPI - Contacts / Calls
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
            <PhoneOutlined style={{ fontSize: 28, color: '#1890ff', marginBottom: 8 }} />
            <Statistic
              title="Total Calls"
              value={summaryTotalCalls}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a', marginBottom: 8 }} />
            <Statistic
              title="Answered"
              value={summaryAnswered}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <CloseCircleOutlined style={{ fontSize: 28, color: '#ff4d4f', marginBottom: 8 }} />
            <Statistic
              title="Missed"
              value={summaryMissed}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 20, textAlign: 'center' } }}>
            <ClockCircleOutlined style={{ fontSize: 28, color: '#faad14', marginBottom: 8 }} />
            <Statistic
              title="Avg Duration"
              value={summaryAvgDuration}
              valueStyle={{ fontSize: 28, fontWeight: 700, color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* ----------------------------------------------------------------
          BAR CHART - Calls Per Agent
          ---------------------------------------------------------------- */}
      <Card
        title="Calls Per Agent"
        style={{ borderRadius: 12, marginBottom: 24 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div style={{ width: '100%', height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Answered" fill="#00C4A1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Missed" fill="#ff4d4f" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* ----------------------------------------------------------------
          TABLE - Agent Call Details
          ---------------------------------------------------------------- */}
      <Card
        title="Agent Call Details"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={agentCallData}
          rowKey="key"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} agents` }}
          scroll={{ x: 800 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default KPIContacts;
