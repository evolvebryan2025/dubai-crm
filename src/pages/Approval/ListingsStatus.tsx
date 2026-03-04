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
import { profilesService, listingsService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;

const STATUS_TAG_COLORS: Record<string, string> = {
  Active: '#52c41a',
  Inactive: '#d9d9d9',
  Sold: '#1890ff',
  Rented: '#722ed1',
  Draft: '#8c8c8c',
  active: '#52c41a',
  draft: '#8c8c8c',
  under_offer: '#faad14',
  sold: '#1890ff',
  rented: '#722ed1',
  archived: '#d9d9d9',
};

interface ListingStatusRequest {
  id: string;
  listing_id: string;
  property_type: string;
  current_status: string;
  requested_status: string;
  requested_by: string;
  requested_by_id: string;
  date: string;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
}

const capitalizeStatus = (status: string): string => {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const ListingsStatus: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Pending');
  const [searchId, setSearchId] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [statusRequests, setStatusRequests] = useState<ListingStatusRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profilesRes, listingsRes] = await Promise.all([
          profilesService.getAll(),
          listingsService.getAll(),
        ]);

        let fetchedUsers: User[] = [];
        if (profilesRes.data) {
          fetchedUsers = profilesRes.data.map((p) => profileToUser(p as any));
          setUsers(fetchedUsers);
        }

        // Derive status change requests from listings data
        // In a full implementation, there would be a dedicated status_change_requests table
        // For now, we derive from listings with various statuses
        if (listingsRes.data) {
          const requests: ListingStatusRequest[] = listingsRes.data.map((listing: any) => {
            const agent = fetchedUsers.find((u) => u.id === listing.assigned_agent_id);
            // Map listing status to an approval status
            let approvalStatus: 'Pending' | 'Approved' | 'Rejected' = 'Approved';
            if (listing.status === 'draft') approvalStatus = 'Pending';
            else if (listing.status === 'archived') approvalStatus = 'Rejected';

            return {
              id: listing.id,
              listing_id: listing.reference_no || listing.id,
              property_type: listing.property_type ? listing.property_type.charAt(0).toUpperCase() + listing.property_type.slice(1) : 'Unknown',
              current_status: capitalizeStatus(listing.status || 'draft'),
              requested_status: capitalizeStatus(listing.status || 'active'),
              requested_by: agent?.name || 'Unknown',
              requested_by_id: listing.assigned_agent_id || '',
              date: listing.updated_at || listing.created_at,
              approval_status: approvalStatus,
            };
          });
          setStatusRequests(requests);
        }
      } catch (err) {
        console.error('Failed to fetch listing status data:', err);
        message.error('Failed to load listing status requests');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let data = statusRequests.filter((r) => r.approval_status === activeTab);

    if (searchId) {
      data = data.filter((r) => r.listing_id.toLowerCase().includes(searchId.toLowerCase()));
    }

    if (selectedAgent) {
      data = data.filter((r) => r.requested_by_id === selectedAgent);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((r) => {
        const reqDate = dayjs(r.date);
        return reqDate.isAfter(dateRange[0]!) && reqDate.isBefore(dateRange[1]!);
      });
    }

    return data;
  }, [statusRequests, activeTab, searchId, selectedAgent, dateRange]);

  const counts = useMemo(() => {
    const pending = statusRequests.filter((r) => r.approval_status === 'Pending').length;
    const approved = statusRequests.filter((r) => r.approval_status === 'Approved').length;
    const rejected = statusRequests.filter((r) => r.approval_status === 'Rejected').length;
    return { Pending: pending, Approved: approved, Rejected: rejected };
  }, [statusRequests]);

  const handleReset = () => {
    setSearchId('');
    setDateRange(null);
    setSelectedApprover(undefined);
    setSelectedAgent(undefined);
  };

  const handleApprove = (record: ListingStatusRequest) => {
    message.success(`Status change for ${record.listing_id} has been approved`);
  };

  const handleReject = (record: ListingStatusRequest) => {
    message.error(`Status change for ${record.listing_id} has been rejected`);
  };

  const columns: ColumnsType<ListingStatusRequest> = [
    {
      title: 'Listing ID',
      dataIndex: 'listing_id',
      key: 'listing_id',
      render: (id: string) => <span style={{ fontWeight: 600, color: '#00C4A1' }}>{id}</span>,
    },
    {
      title: 'Property Type',
      dataIndex: 'property_type',
      key: 'property_type',
    },
    {
      title: 'Current Status',
      dataIndex: 'current_status',
      key: 'current_status',
      render: (status: string) => (
        <Tag color={STATUS_TAG_COLORS[status] || STATUS_TAG_COLORS[status.toLowerCase()] || '#999'}>{status}</Tag>
      ),
    },
    {
      title: 'Requested Status',
      dataIndex: 'requested_status',
      key: 'requested_status',
      render: (status: string) => (
        <Tag color={STATUS_TAG_COLORS[status] || STATUS_TAG_COLORS[status.toLowerCase()] || '#999'} style={{ fontWeight: 600 }}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Requested By',
      key: 'requested_by',
      render: (_: unknown, record: ListingStatusRequest) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ background: '#e6f7ff', color: '#1890ff' }} />
          <span>{record.requested_by}</span>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
      sorter: (a, b) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: ListingStatusRequest) => {
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

        <Table<ListingStatusRequest>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          locale={{ emptyText: `No ${activeTab.toLowerCase()} status requests` }}
        />
      </Card>
    </div>
  );
};

export default ListingsStatus;
