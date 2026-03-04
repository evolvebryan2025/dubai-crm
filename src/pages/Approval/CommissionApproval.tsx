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
import type { User } from '../../types';
import { commissionApprovalsService, profilesService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  Approved: '#52c41a',
  Pending: '#faad14',
  Rejected: '#ff4d4f',
  owner_approved: '#52c41a',
  pending: '#faad14',
  finance_cleared: '#1890ff',
  rejected: '#ff4d4f',
};

interface CommissionApprovalRow {
  id: string;
  transaction_id: string;
  agent_id: string;
  agent_name: string;
  commission_amount: number;
  commission_pct: number;
  status: string;
  created_at: string;
}

const CommissionApproval: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [searchId, setSearchId] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [approvals, setApprovals] = useState<CommissionApprovalRow[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [approvalsRes, profilesRes] = await Promise.all([
          commissionApprovalsService.getAll(),
          profilesService.getAll(),
        ]);

        if (profilesRes.data) {
          setUsers(profilesRes.data.map((p) => profileToUser(p as any)));
        }

        if (approvalsRes.data) {
          const rows: CommissionApprovalRow[] = approvalsRes.data.map((a: any) => ({
            id: a.id,
            transaction_id: a.transaction_id ?? a.transactions?.id ?? '',
            agent_id: a.agent_id ?? '',
            agent_name: a.profiles?.full_name ?? 'N/A',
            commission_amount: Number(a.amount ?? a.transactions?.commission_amount ?? 0),
            commission_pct: Number(a.percentage ?? a.transactions?.commission_pct ?? 0),
            status: a.status ?? 'pending',
            created_at: a.created_at,
          }));
          setApprovals(rows);
        }
      } catch (err) {
        console.error('Failed to fetch commission approval data:', err);
        message.error('Failed to load commission data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getDisplayStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'owner_approved': return 'Approved';
      case 'finance_cleared': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const getTabStatus = (status: string): string => {
    switch (status) {
      case 'owner_approved':
      case 'finance_cleared':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending';
    }
  };

  const filteredData = useMemo(() => {
    const tabMap: Record<string, string[]> = {
      pending: ['pending'],
      Approved: ['owner_approved', 'finance_cleared'],
      Rejected: ['rejected'],
    };
    const validStatuses = tabMap[activeTab] || [activeTab];
    let data = approvals.filter((a) => validStatuses.includes(a.status));

    if (searchId) {
      data = data.filter((a) => a.id.toLowerCase().includes(searchId.toLowerCase()) || a.transaction_id.toLowerCase().includes(searchId.toLowerCase()));
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((a) => {
        const date = dayjs(a.created_at);
        return date.isAfter(dateRange[0]!) && date.isBefore(dateRange[1]!);
      });
    }

    if (selectedAgent) {
      data = data.filter((a) => a.agent_id === selectedAgent);
    }

    return data;
  }, [approvals, activeTab, searchId, dateRange, selectedAgent]);

  const counts = useMemo(() => {
    const pending = approvals.filter((a) => a.status === 'pending').length;
    const approved = approvals.filter((a) => a.status === 'owner_approved' || a.status === 'finance_cleared').length;
    const rejected = approvals.filter((a) => a.status === 'rejected').length;
    return { pending, Approved: approved, Rejected: rejected };
  }, [approvals]);

  const handleReset = () => {
    setSearchId('');
    setDateRange(null);
    setSelectedApprover(undefined);
    setSelectedAgent(undefined);
  };

  const handleApprove = (record: CommissionApprovalRow) => {
    message.success(`Commission for transaction ${record.transaction_id} has been approved`);
  };

  const handleReject = (record: CommissionApprovalRow) => {
    message.error(`Commission for transaction ${record.transaction_id} has been rejected`);
  };

  const columns: ColumnsType<CommissionApprovalRow> = [
    {
      title: 'Transaction ID',
      dataIndex: 'transaction_id',
      key: 'transaction_id',
      render: (id: string) => <span style={{ fontWeight: 600, color: '#00C4A1' }}>{id}</span>,
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_: unknown, record: CommissionApprovalRow) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ background: '#e6f7ff', color: '#1890ff' }} />
          <span>{record.agent_name}</span>
        </Space>
      ),
    },
    {
      title: 'Commission Amount (AED)',
      key: 'commission_amount',
      render: (_: unknown, record: CommissionApprovalRow) => (
        <span style={{ fontWeight: 600 }}>
          {(record.commission_amount || 0).toLocaleString('en-AE', { minimumFractionDigits: 0 })}
        </span>
      ),
      sorter: (a, b) => (a.commission_amount || 0) - (b.commission_amount || 0),
    },
    {
      title: 'Commission %',
      key: 'commission_percentage',
      render: (_: unknown, record: CommissionApprovalRow) => (
        <span>{record.commission_pct || 0}%</span>
      ),
      sorter: (a, b) => (a.commission_pct || 0) - (b.commission_pct || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || STATUS_COLORS[getDisplayStatus(status)] || '#999'}>
          {getDisplayStatus(status)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: CommissionApprovalRow) => {
        if (activeTab !== 'pending') return null;
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
              key: 'pending',
              label: (
                <span>
                  Pending <Badge count={counts.pending} style={{ backgroundColor: '#faad14', marginLeft: 6 }} />
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

        <Table<CommissionApprovalRow>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          locale={{ emptyText: `No ${activeTab.toLowerCase()} commissions` }}
        />
      </Card>
    </div>
  );
};

export default CommissionApproval;
