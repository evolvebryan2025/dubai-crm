import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Table,
  Tabs,
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Avatar,
  Space,
  Badge,
  Spin,
  message,
  Row,
  Col,
} from 'antd';
import { SearchOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Transaction, User } from '../../types';
import { transactionsService, profilesService } from '../../services/supabaseService';
import { supabaseTransactionToTransaction, profileToUser } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;

const PURPOSE_COLORS: Record<string, string> = {
  'New Project': '#1890ff',
  Sell: '#fa8c16',
  Rent: '#52c41a',
};

const STATUS_COLORS: Record<string, string> = {
  Approved: '#52c41a',
  Pending: '#faad14',
  Rejected: '#ff4d4f',
};

const TransactionApproval: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Pending');
  const [searchId, setSearchId] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [txnRes, profilesRes] = await Promise.all([
          transactionsService.getAll(),
          profilesService.getAll(),
        ]);
        if (txnRes.data) {
          setTransactions(txnRes.data.map((t) => supabaseTransactionToTransaction(t as any)));
        }
        if (profilesRes.data) {
          setUsers(profilesRes.data.map((p) => profileToUser(p as any)));
        }
      } catch (err) {
        console.error('Failed to fetch transaction approval data:', err);
        message.error('Failed to load transaction data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let data = transactions.filter((t) => t.approval_status === activeTab);

    if (searchId) {
      data = data.filter((t) => t.id.toLowerCase().includes(searchId.toLowerCase()));
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((t) => {
        const dealDate = dayjs(t.deal_date);
        return dealDate.isAfter(dateRange[0]!) && dealDate.isBefore(dateRange[1]!);
      });
    }

    if (selectedAgent) {
      data = data.filter((t) => t.agent_id === selectedAgent);
    }

    return data;
  }, [transactions, activeTab, searchId, dateRange, selectedAgent]);

  const counts = useMemo(() => {
    const pending = transactions.filter((t) => t.approval_status === 'Pending').length;
    const approved = transactions.filter((t) => t.approval_status === 'Approved').length;
    const rejected = transactions.filter((t) => t.approval_status === 'Rejected').length;
    return { Pending: pending, Approved: approved, Rejected: rejected };
  }, [transactions]);

  const handleReset = () => {
    setSearchId('');
    setDateRange(null);
    setSelectedApprover(undefined);
    setSelectedAgent(undefined);
  };

  const handleApprove = (record: Transaction) => {
    message.success(`Transaction ${record.id} has been approved`);
  };

  const handleReject = (record: Transaction) => {
    message.error(`Transaction ${record.id} has been rejected`);
  };

  const columns: ColumnsType<Transaction> = [
    {
      title: 'Transaction ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => <span style={{ fontWeight: 600, color: '#00C4A1' }}>{id}</span>,
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose: string) => (
        <Tag color={PURPOSE_COLORS[purpose] || '#999'}>{purpose}</Tag>
      ),
    },
    {
      title: 'Deal Date',
      dataIndex: 'deal_date',
      key: 'deal_date',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
      sorter: (a, b) => dayjs(a.deal_date).unix() - dayjs(b.deal_date).unix(),
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_: unknown, record: Transaction) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ background: '#e6f7ff', color: '#1890ff' }} />
          <span>{record.agent?.name || 'N/A'}</span>
        </Space>
      ),
    },
    {
      title: 'Deal Price (AED)',
      dataIndex: 'deal_price',
      key: 'deal_price',
      render: (price: number) => (
        <span style={{ fontWeight: 600 }}>
          {price.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
        </span>
      ),
      sorter: (a, b) => a.deal_price - b.deal_price,
    },
    {
      title: 'Status',
      dataIndex: 'approval_status',
      key: 'approval_status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: Transaction) => {
        if (activeTab !== 'Pending') return null;
        return (
          <Space>
            <Button
              size="small"
              type="primary"
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => handleApprove(record)}
            >
              Approve
            </Button>
            <Button
              size="small"
              danger
              onClick={() => handleReject(record)}
            >
              Reject
            </Button>
          </Space>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div style={{ background: '#f5f7fa', minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Filters */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Input
              placeholder="Search by ID"
              prefix={<SearchOutlined />}
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
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
              placeholder="All Approvers"
              allowClear
              value={selectedApprover}
              onChange={setSelectedApprover}
              style={{ width: 180 }}
              options={users.map((u) => ({ label: u.name, value: u.id }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Filter by agent"
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

      {/* Table with Tabs */}
      <Card
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '0 16px 16px' } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'Pending',
              label: (
                <span>
                  Pending <Badge count={counts.Pending} style={{ backgroundColor: '#faad14', marginLeft: 6 }} />
                </span>
              ),
            },
            {
              key: 'Approved',
              label: (
                <span>
                  Approved <Badge count={counts.Approved} style={{ backgroundColor: '#52c41a', marginLeft: 6 }} />
                </span>
              ),
            },
            {
              key: 'Rejected',
              label: (
                <span>
                  Rejected <Badge count={counts.Rejected} style={{ backgroundColor: '#ff4d4f', marginLeft: 6 }} showZero />
                </span>
              ),
            },
          ]}
        />

        <Table<Transaction>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          locale={{ emptyText: `No ${activeTab.toLowerCase()} transactions` }}
        />
      </Card>
    </div>
  );
};

export default TransactionApproval;
