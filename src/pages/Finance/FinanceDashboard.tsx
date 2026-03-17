import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Statistic,
  Space,
  Select,
  DatePicker,
  Spin,
  Progress,
  Tabs,
  Badge,
  Button,
} from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  BankOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  transactionsService,
  commissionApprovalsService,
  profilesService,
} from '../../services/supabaseService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const formatAED = (value: number) =>
  new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 0,
  }).format(value);

const COLORS = {
  primary: '#00C4A1',
  blue: '#1890ff',
  orange: '#fa8c16',
  red: '#f5222d',
  green: '#52c41a',
};

const statusColorMap: Record<string, string> = {
  pending: 'orange',
  owner_approved: 'blue',
  finance_cleared: 'green',
  rejected: 'red',
};

const FinanceDashboard: React.FC = () => {
  const navigate = useNavigate();

  // ---- State ----
  const [transactions, setTransactions] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);

  // ---- Data Fetching ----
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [txRes, commRes, agentRes] = await Promise.all([
          transactionsService.getAll(),
          commissionApprovalsService.getAll(),
          profilesService.getAll(),
        ]);
        setTransactions(txRes.data ?? []);
        setCommissions(commRes.data ?? []);
        setAgents(agentRes.data ?? []);
      } catch (err) {
        console.error('Finance dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---- Filtered data ----
  const filteredTransactions = useMemo(() => {
    let data = [...transactions];
    if (dateRange) {
      const [start, end] = dateRange;
      data = data.filter((t) => {
        const d = dayjs(t.deal_date ?? t.created_at);
        return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day'));
      });
    }
    if (selectedAgent) {
      data = data.filter((t) => t.agent_id === selectedAgent);
    }
    return data;
  }, [transactions, dateRange, selectedAgent]);

  const filteredCommissions = useMemo(() => {
    let data = [...commissions];
    if (dateRange) {
      const [start, end] = dateRange;
      data = data.filter((c) => {
        const d = dayjs(c.created_at);
        return d.isAfter(start.startOf('day')) && d.isBefore(end.endOf('day'));
      });
    }
    if (selectedAgent) {
      data = data.filter((c) => c.agent_id === selectedAgent);
    }
    return data;
  }, [commissions, dateRange, selectedAgent]);

  // ---- Computed Stats ----
  const stats = useMemo(() => {
    const totalDealValue = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.deal_value) || 0),
      0,
    );
    const totalCommissions = filteredTransactions.reduce(
      (sum, t) => sum + (Number(t.commission_amount) || 0),
      0,
    );
    const pendingCommissions = filteredCommissions
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (Number(c.commission_amount ?? c.transactions?.commission_amount) || 0), 0);
    const approvedCommissions = filteredCommissions
      .filter((c) => c.status === 'owner_approved' || c.status === 'finance_cleared')
      .reduce((sum, c) => sum + (Number(c.commission_amount ?? c.transactions?.commission_amount) || 0), 0);
    const totalDeals = filteredTransactions.length;
    const avgDealValue = totalDeals > 0 ? totalDealValue / totalDeals : 0;
    const saleDeals = filteredTransactions.filter((t) => t.type === 'sale').length;
    const rentDeals = filteredTransactions.filter((t) => t.type === 'rent').length;

    return {
      totalDealValue,
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      totalDeals,
      avgDealValue,
      saleDeals,
      rentDeals,
    };
  }, [filteredTransactions, filteredCommissions]);

  // ---- Monthly Revenue Chart Data ----
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; dealValue: number; commission: number }> = {};
    filteredTransactions.forEach((t) => {
      const month = dayjs(t.deal_date ?? t.created_at).format('MMM YYYY');
      if (!map[month]) map[month] = { month, dealValue: 0, commission: 0 };
      map[month].dealValue += Number(t.deal_value) || 0;
      map[month].commission += Number(t.commission_amount) || 0;
    });
    return Object.values(map).sort((a, b) =>
      dayjs(a.month, 'MMM YYYY').unix() - dayjs(b.month, 'MMM YYYY').unix(),
    );
  }, [filteredTransactions]);

  // ---- Pie Chart Data ----
  const dealTypeData = useMemo(
    () => [
      { name: 'Sale', value: stats.saleDeals },
      { name: 'Rent', value: stats.rentDeals },
    ],
    [stats.saleDeals, stats.rentDeals],
  );
  const PIE_COLORS = [COLORS.primary, COLORS.blue];

  // ---- Agent Performance Table Data ----
  const agentTableData = useMemo(() => {
    const map: Record<
      string,
      { agentId: string; agentName: string; totalDeals: number; totalDealValue: number; commission: number }
    > = {};
    filteredTransactions.forEach((t) => {
      const id = t.agent_id ?? 'unknown';
      if (!map[id]) {
        const profile = t.profiles ?? agents.find((a) => a.id === id);
        const name = profile
          ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email || id
          : id;
        map[id] = { agentId: id, agentName: name, totalDeals: 0, totalDealValue: 0, commission: 0 };
      }
      map[id].totalDeals += 1;
      map[id].totalDealValue += Number(t.deal_value) || 0;
      map[id].commission += Number(t.commission_amount) || 0;
    });
    return Object.values(map).sort((a, b) => b.totalDealValue - a.totalDealValue);
  }, [filteredTransactions, agents]);

  // ---- Agent select options ----
  const agentOptions = useMemo(
    () =>
      agents.map((a) => ({
        label: `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() || a.email || a.id,
        value: a.id,
      })),
    [agents],
  );

  // ---- Commission table columns ----
  const commissionColumns = [
    {
      title: 'Reference',
      dataIndex: ['transactions', 'reference_no'],
      key: 'reference',
      render: (val: string) => val ?? '-',
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_: any, record: any) => {
        const p = record.profiles ?? agents.find((a: any) => a.id === record.agent_id);
        return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email : '-';
      },
    },
    {
      title: 'Commission Amount',
      key: 'amount',
      render: (_: any, record: any) =>
        formatAED(Number(record.commission_amount ?? record.transactions?.commission_amount) || 0),
      sorter: (a: any, b: any) =>
        (Number(a.commission_amount ?? a.transactions?.commission_amount) || 0) -
        (Number(b.commission_amount ?? b.transactions?.commission_amount) || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] ?? 'default'}>
          {(status ?? '').replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Owner Approved', value: 'owner_approved' },
        { text: 'Finance Cleared', value: 'finance_cleared' },
        { text: 'Rejected', value: 'rejected' },
      ],
      onFilter: (value: any, record: any) => record.status === value,
    },
    {
      title: 'Owner Approved Date',
      dataIndex: 'owner_approved_at',
      key: 'owner_approved_at',
      render: (val: string) => (val ? dayjs(val).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Finance Cleared Date',
      dataIndex: 'finance_cleared_at',
      key: 'finance_cleared_at',
      render: (val: string) => (val ? dayjs(val).format('DD MMM YYYY') : '-'),
    },
  ];

  // ---- Agent table columns ----
  const agentColumns = [
    { title: 'Agent Name', dataIndex: 'agentName', key: 'agentName' },
    { title: 'Total Deals', dataIndex: 'totalDeals', key: 'totalDeals', sorter: (a: any, b: any) => a.totalDeals - b.totalDeals },
    {
      title: 'Total Deal Value',
      dataIndex: 'totalDealValue',
      key: 'totalDealValue',
      render: (v: number) => formatAED(v),
      sorter: (a: any, b: any) => a.totalDealValue - b.totalDealValue,
    },
    {
      title: 'Commission Earned',
      dataIndex: 'commission',
      key: 'commission',
      render: (v: number) => formatAED(v),
      sorter: (a: any, b: any) => a.commission - b.commission,
    },
    {
      title: 'Avg Deal Value',
      key: 'avgDealValue',
      render: (_: any, record: any) =>
        formatAED(record.totalDeals > 0 ? record.totalDealValue / record.totalDeals : 0),
    },
  ];

  // ---- Recent Transactions columns ----
  const recentTxColumns = [
    {
      title: 'Ref#',
      dataIndex: 'reference_no',
      key: 'reference_no',
      render: (val: string) => val ?? '-',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'sale' ? 'green' : 'blue'}>
          {(type ?? '').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Deal Value',
      dataIndex: 'deal_value',
      key: 'deal_value',
      render: (v: number) => formatAED(Number(v) || 0),
    },
    {
      title: 'Commission',
      dataIndex: 'commission_amount',
      key: 'commission_amount',
      render: (v: number) => formatAED(Number(v) || 0),
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_: any, record: any) => {
        const p = record.profiles ?? agents.find((a: any) => a.id === record.agent_id);
        return p ? `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email : '-';
      },
    },
    {
      title: 'Deal Date',
      dataIndex: 'deal_date',
      key: 'deal_date',
      render: (val: string) => (val ? dayjs(val).format('DD MMM YYYY') : '-'),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColorMap[status] ?? 'default'}>
          {(status ?? '').replace(/_/g, ' ').toUpperCase()}
        </Tag>
      ),
    },
  ];

  // ---- Pie label renderer ----
  const renderPieLabel = ({
    name,
    percent,
  }: {
    name?: string;
    percent?: number;
  }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Loading finance data..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        Finance Dashboard
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Track deals, commissions, and payments across all agents.
      </Text>

      {/* ---- Filter Bar ---- */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }} bodyStyle={{ padding: '12px 24px' }}>
        <Space wrap size="middle">
          <Select
            placeholder="Filter by Agent"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ minWidth: 220 }}
            value={selectedAgent}
            onChange={(val) => setSelectedAgent(val)}
            options={agentOptions}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
          />
          <Button
            onClick={() => {
              setSelectedAgent(undefined);
              setDateRange(null);
            }}
          >
            Reset
          </Button>
        </Space>
      </Card>

      {/* ---- Summary Cards ---- */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Deal Value"
              value={stats.totalDealValue}
              prefix={<DollarOutlined style={{ color: COLORS.primary }} />}
              formatter={(v) => formatAED(Number(v))}
              valueStyle={{ color: COLORS.primary }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Commission"
              value={stats.totalCommissions}
              prefix={<BankOutlined style={{ color: COLORS.blue }} />}
              formatter={(v) => formatAED(Number(v))}
              valueStyle={{ color: COLORS.blue }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Pending Payouts"
              value={stats.pendingCommissions}
              prefix={<ClockCircleOutlined style={{ color: COLORS.orange }} />}
              formatter={(v) => formatAED(Number(v))}
              valueStyle={{ color: COLORS.orange }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Deals"
              value={stats.totalDeals}
              prefix={<CheckCircleOutlined style={{ color: COLORS.primary }} />}
              valueStyle={{ color: COLORS.primary }}
            />
          </Card>
        </Col>
      </Row>

      {/* ---- Tabs ---- */}
      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: 'Overview',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Card title="Monthly Revenue" style={{ borderRadius: 12 }} variant="borderless">
                      <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value) => formatAED(Number(value))} />
                          <Legend />
                          <Bar dataKey="dealValue" name="Deal Value" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="commission" name="Commission" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card title="Deal Type Breakdown" style={{ borderRadius: 12 }} variant="borderless">
                      <ResponsiveContainer width="100%" height={350}>
                        <PieChart>
                          <Pie
                            data={dealTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine
                            label={renderPieLabel}
                            outerRadius={110}
                            dataKey="value"
                          >
                            {dealTypeData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'by-agent',
              label: 'By Agent',
              children: (
                <Table
                  dataSource={agentTableData}
                  columns={agentColumns}
                  rowKey="agentId"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 700 }}
                />
              ),
            },
            {
              key: 'commissions',
              label: (
                <span>
                  Commissions{' '}
                  <Badge
                    count={filteredCommissions.filter((c) => c.status === 'pending').length}
                    style={{ backgroundColor: COLORS.orange }}
                    size="small"
                    offset={[4, -2]}
                  />
                </span>
              ),
              children: (
                <Table
                  dataSource={filteredCommissions}
                  columns={commissionColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 800 }}
                />
              ),
            },
          ]}
        />
      </Card>

      {/* ---- Recent Transactions ---- */}
      <Card title="Recent Transactions" style={{ borderRadius: 12 }}>
        <Table
          dataSource={filteredTransactions.slice(0, 10)}
          columns={recentTxColumns}
          rowKey="id"
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default FinanceDashboard;
