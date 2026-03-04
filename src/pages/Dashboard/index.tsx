import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Tag,
  Avatar,
  List,
  Badge,
  Statistic,
  Typography,
  Space,
  Checkbox,
  Spin,
} from 'antd';
import {
  SwapOutlined,
  UnorderedListOutlined,
  TeamOutlined,
  EyeOutlined,
  ContactsOutlined,
  DownloadOutlined,
  LeftOutlined,
  RightOutlined,
  PhoneOutlined,
  CalendarOutlined,
  FileTextOutlined,
  UserOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import type { DashboardStats, LeadChartData, AgentPerformance, FollowUpTask, User, Team } from '../../types';
import { dashboardService, teamsService, profilesService } from '../../services/supabaseService';
import { supabaseTeamToTeam, profileToUser } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------
const CHART_COLORS = {
  green: '#52c41a',
  blue: '#1890ff',
  gray: '#d9d9d9',
};

const LEGEND_ITEMS: { label: string; color: string }[] = [
  { label: 'New', color: '#1890ff' },
  { label: 'Sell', color: '#fa8c16' },
  { label: 'Rent', color: '#52c41a' },
  { label: 'Buy', color: '#722ed1' },
  { label: 'Contacts', color: '#f5222d' },
];

const STAT_CARDS: {
  key: keyof DashboardStats;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    key: 'transactions',
    label: 'Transactions',
    icon: <SwapOutlined style={{ fontSize: 22, color: '#00C4A1' }} />,
    color: '#00C4A1',
  },
  {
    key: 'listings',
    label: 'Listings',
    icon: <UnorderedListOutlined style={{ fontSize: 22, color: '#1890ff' }} />,
    color: '#1890ff',
  },
  {
    key: 'leads',
    label: 'Leads',
    icon: <TeamOutlined style={{ fontSize: 22, color: '#fa8c16' }} />,
    color: '#fa8c16',
  },
  {
    key: 'viewings',
    label: 'Viewings',
    icon: <EyeOutlined style={{ fontSize: 22, color: '#722ed1' }} />,
    color: '#722ed1',
  },
  {
    key: 'contacts',
    label: 'Contacts',
    icon: <ContactsOutlined style={{ fontSize: 22, color: '#f5222d' }} />,
    color: '#f5222d',
  },
];

// ------------------------------------------------------------------
// Helper: build the week around a given date (Mon-Sat)
// ------------------------------------------------------------------
function getWeekDays(base: Dayjs): Dayjs[] {
  const monday = base.startOf('week').add(base.day() === 0 ? -6 : 1, 'day');
  return Array.from({ length: 6 }, (_, i) => monday.add(i, 'day'));
}

// ------------------------------------------------------------------
// Donut chart card for leads / listings
// ------------------------------------------------------------------
const DonutCard: React.FC<{
  title: string;
  total: number;
  active: number;
  pool: number;
  deal: number;
}> = ({ title, total, active, pool, deal }) => {
  const data = [
    { name: 'Active', value: active },
    { name: 'Pool', value: pool },
    { name: 'Deal', value: deal },
  ];
  const colors = [CHART_COLORS.green, CHART_COLORS.blue, CHART_COLORS.gray];

  return (
    <Card
      size="small"
      style={{ borderRadius: 12, height: '100%' }}
      styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' } }}
    >
      <Text strong style={{ fontSize: 14, marginBottom: 4 }}>
        {title}
      </Text>
      <div style={{ width: 130, height: 130, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={38}
              outerRadius={58}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={colors[idx]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700 }}>{total}</div>
          <div style={{ fontSize: 10, color: '#8c8c8c' }}>Total</div>
        </div>
      </div>

      <Space direction="vertical" size={2} style={{ width: '100%', marginTop: 8 }}>
        {data.map((entry, idx) => (
          <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Space size={4}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: colors[idx],
                }}
              />
              <Text style={{ fontSize: 12 }}>{entry.name}</Text>
            </Space>
            <Text strong style={{ fontSize: 12 }}>
              {entry.value}
            </Text>
          </div>
        ))}
      </Space>
    </Card>
  );
};

// ------------------------------------------------------------------
// Task type icon helper
// ------------------------------------------------------------------
function taskIcon(type: string): React.ReactNode {
  switch (type) {
    case 'Call':
      return <PhoneOutlined style={{ color: '#1890ff' }} />;
    case 'Viewing':
      return <EyeOutlined style={{ color: '#722ed1' }} />;
    case 'Meeting':
      return <CalendarOutlined style={{ color: '#fa8c16' }} />;
    case 'Task':
    default:
      return <FileTextOutlined style={{ color: '#52c41a' }} />;
  }
}

// ------------------------------------------------------------------
// Main Dashboard component
// ------------------------------------------------------------------
const Dashboard: React.FC = () => {
  // Filter state
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [selectedTag, setSelectedTag] = useState<string>('all');

  // Active Tasks state
  const [weekBase, setWeekBase] = useState<Dayjs>(dayjs('2024-12-02'));
  const [selectedDay, setSelectedDay] = useState<Dayjs>(dayjs('2024-12-02'));

  // Performance date range (display only)
  const [perfRange, setPerfRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Data state
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({ transactions: 0, listings: 0, leads: 0, viewings: 0, contacts: 0 });
  const [leadCharts, setLeadCharts] = useState<LeadChartData[]>([]);
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [stats, charts, performance, teamsRes, profilesRes] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getLeadCharts(),
          dashboardService.getAgentPerformance(),
          teamsService.getAll(),
          profilesService.getAll(),
        ]);

        setDashboardStats(stats);
        setLeadCharts(charts);
        setAgentPerformance(performance);

        if (teamsRes.data) {
          setTeams(teamsRes.data.map((t: any) => supabaseTeamToTeam(t)));
        }
        if (profilesRes.data) {
          setUsers(profilesRes.data.map((p: any) => profileToUser(p)));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const weekDays = useMemo(() => getWeekDays(weekBase), [weekBase]);

  const tasksForDay = useMemo<FollowUpTask[]>(
    () => [],
    [selectedDay],
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (loading) {
    return (
      <div style={{ background: '#f5f7fa', minHeight: '100%', textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* ============================================================
          FILTER BAR
          ============================================================ */}
      <Card
        size="small"
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
              placeholder="Team"
              allowClear
              value={selectedTeam}
              onChange={setSelectedTeam}
              style={{ width: 180 }}
              options={teams.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="All Users"
              allowClear
              value={selectedUser}
              onChange={setSelectedUser}
              style={{ width: 180 }}
              options={users.map((u) => ({ label: u.name, value: u.id }))}
            />
          </Col>
          <Col flex="auto" />
          <Col>
            <Button icon={<DownloadOutlined />}>Export to Excel</Button>
          </Col>
        </Row>
      </Card>

      {/* ============================================================
          MAIN GRID: content (left 16) + sidebar (right 8)
          ============================================================ */}
      <Row gutter={16}>
        {/* ----- LEFT COLUMN ----- */}
        <Col xs={24} lg={16}>
          {/* --- STATS ROW --- */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {STAT_CARDS.map((s) => (
              <Col xs={12} sm={8} md={4} lg={4} xl={4} key={s.key} style={{ minWidth: 0 }}>
                <Card
                  size="small"
                  style={{ borderRadius: 12, height: '100%' }}
                  styles={{ body: { padding: '16px 12px', textAlign: 'center' } }}
                >
                  <div style={{ marginBottom: 8 }}>{s.icon}</div>
                  <Statistic
                    value={dashboardStats[s.key]}
                    valueStyle={{ fontSize: 22, fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {s.label}
                  </Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* --- LEGEND ROW --- */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {LEGEND_ITEMS.map((item) => (
              <Space key={item.label} size={4}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: item.color,
                  }}
                />
                <Text style={{ fontSize: 13 }}>{item.label}</Text>
              </Space>
            ))}
          </div>

          {/* --- LEAD / LISTING DONUT CARDS --- */}
          <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
            {leadCharts.map((chart) => (
              <Col xs={12} sm={12} md={6} key={chart.title}>
                <DonutCard
                  title={chart.title}
                  total={chart.total}
                  active={chart.active}
                  pool={chart.pool}
                  deal={chart.deal}
                />
              </Col>
            ))}
          </Row>

          {/* --- TAGS FILTER --- */}
          <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              type={selectedTag === 'all' ? 'primary' : 'default'}
              size="small"
              style={
                selectedTag === 'all'
                  ? { borderRadius: 16, background: '#00C4A1', borderColor: '#00C4A1' }
                  : { borderRadius: 16 }
              }
              onClick={() => setSelectedTag('all')}
            >
              All
            </Button>
            <Tag
              style={{
                borderRadius: 16,
                cursor: 'pointer',
                background: selectedTag === 'default' ? '#e6f7ff' : undefined,
                borderColor: selectedTag === 'default' ? '#1890ff' : undefined,
              }}
              onClick={() => setSelectedTag('default')}
            >
              Default tag <Badge count={48} size="small" style={{ marginLeft: 4, backgroundColor: '#1890ff' }} />
            </Tag>
          </div>
        </Col>

        {/* ----- RIGHT COLUMN (SIDEBAR WIDGETS) ----- */}
        <Col xs={24} lg={8}>
          {/* ===== ACTIVE TASKS WIDGET ===== */}
          <Card
            size="small"
            title={
              <Space>
                <CalendarOutlined />
                <span>Active Tasks</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 16 }}
            styles={{ body: { padding: '8px 16px 16px' } }}
          >
            {/* Week navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Button
                type="text"
                size="small"
                icon={<LeftOutlined />}
                onClick={() => {
                  setWeekBase((prev) => prev.subtract(7, 'day'));
                  setSelectedDay((prev) => prev.subtract(7, 'day'));
                }}
              />
              <Text strong style={{ fontSize: 13 }}>
                {weekDays[0].format('DD MMM')} - {weekDays[5].format('DD MMM YYYY')}
              </Text>
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={() => {
                  setWeekBase((prev) => prev.add(7, 'day'));
                  setSelectedDay((prev) => prev.add(7, 'day'));
                }}
              />
            </div>

            {/* Day pills */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
                gap: 4,
              }}
            >
              {weekDays.map((d) => {
                const isSelected = d.isSame(selectedDay, 'day');
                return (
                  <div
                    key={d.format('YYYY-MM-DD')}
                    onClick={() => setSelectedDay(d)}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '6px 0',
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: isSelected ? '#00C4A1' : 'transparent',
                      color: isSelected ? '#fff' : undefined,
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{ fontSize: 11, opacity: 0.7 }}>{d.format('ddd')}</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{d.format('DD')}</div>
                  </div>
                );
              })}
            </div>

            {/* Tasks list */}
            {tasksForDay.length === 0 ? (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 16 }}>
                No tasks for this day
              </Text>
            ) : (
              <List
                size="small"
                dataSource={tasksForDay}
                renderItem={(task) => (
                  <List.Item
                    style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}
                    extra={<Text type="secondary" style={{ fontSize: 12 }}>{task.time}</Text>}
                  >
                    <List.Item.Meta
                      avatar={
                        <Checkbox
                          defaultChecked={task.completed}
                          style={{ marginTop: 4 }}
                        />
                      }
                      title={
                        <Space size={6}>
                          {taskIcon(task.type)}
                          <Text
                            style={{
                              fontSize: 13,
                              textDecoration: task.completed ? 'line-through' : undefined,
                            }}
                          >
                            {task.title}
                          </Text>
                        </Space>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {task.lead_name}
                        </Text>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          {/* ===== PERFORMANCE WIDGET ===== */}
          <Card
            size="small"
            title={
              <Space>
                <TrophyOutlined style={{ color: '#fa8c16' }} />
                <span>Performance</span>
              </Space>
            }
            extra={
              <RangePicker
                size="small"
                value={perfRange}
                onChange={(vals) => setPerfRange(vals)}
                style={{ width: 220 }}
                placeholder={['From', 'To']}
              />
            }
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: '8px 16px 16px' } }}
          >
            <List
              size="small"
              dataSource={agentPerformance}
              renderItem={(agent) => {
                let rankColor = '#8c8c8c';
                if (agent.rank === 1) rankColor = '#faad14';
                else if (agent.rank === 2) rankColor = '#bfbfbf';
                else if (agent.rank === 3) rankColor = '#d48806';

                return (
                  <List.Item style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <Badge
                          count={agent.rank}
                          style={{
                            backgroundColor: rankColor,
                            fontSize: 10,
                            minWidth: 20,
                            height: 20,
                            lineHeight: '20px',
                          }}
                          offset={[-4, 28]}
                        >
                          <Avatar
                            size={36}
                            icon={<UserOutlined />}
                            style={{ background: '#e6f7ff', color: '#1890ff' }}
                          />
                        </Badge>
                      }
                      title={
                        <Text style={{ fontSize: 13 }}>{agent.name}</Text>
                      }
                      description={
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {agent.deals} deals closed
                        </Text>
                      }
                    />
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        color: '#00C4A1',
                        minWidth: 30,
                        textAlign: 'right',
                      }}
                    >
                      {agent.deals}
                    </Title>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
