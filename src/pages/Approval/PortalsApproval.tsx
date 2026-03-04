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
import type { User } from '../../types';
import { profilesService, listingsService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;

const PORTAL_COLORS: Record<string, string> = {
  'Property Finder': '#e91e63',
  Bayut: '#2196f3',
  Dubizzle: '#ff9800',
  property_finder: '#e91e63',
  bayut: '#2196f3',
  dubizzle: '#ff9800',
};

const STATUS_COLORS: Record<string, string> = {
  Approved: '#52c41a',
  Pending: '#faad14',
  Rejected: '#ff4d4f',
};

interface PortalSubmission {
  id: string;
  listing_id: string;
  property_type: string;
  community: string;
  portal: string;
  submitted_by: string;
  submitted_by_id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
}

const PortalsApproval: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('Pending');
  const [searchId, setSearchId] = useState('');
  const [dateRange, setDateRange] = useState<[import('dayjs').Dayjs | null, import('dayjs').Dayjs | null] | null>(null);
  const [selectedApprover, setSelectedApprover] = useState<string | undefined>(undefined);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<User[]>([]);
  const [portalSubmissions, setPortalSubmissions] = useState<PortalSubmission[]>([]);
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

        // Derive portal submissions from listings that have portal data
        if (listingsRes.data) {
          const submissions: PortalSubmission[] = [];
          listingsRes.data.forEach((listing: any) => {
            // If the listing has portal-related fields, create submission entries
            const portals = listing.portals || listing.published_portals;
            if (Array.isArray(portals)) {
              portals.forEach((portal: string, idx: number) => {
                const agent = fetchedUsers.find((u) => u.id === listing.assigned_agent_id);
                const portalLabel = portal === 'property_finder' ? 'Property Finder'
                  : portal === 'bayut' ? 'Bayut'
                  : portal === 'dubizzle' ? 'Dubizzle'
                  : portal;
                submissions.push({
                  id: `${listing.id}-${portal}-${idx}`,
                  listing_id: listing.reference_no || listing.id,
                  property_type: listing.property_type ? listing.property_type.charAt(0).toUpperCase() + listing.property_type.slice(1) : 'Unknown',
                  community: listing.community || listing.area || '-',
                  portal: portalLabel,
                  submitted_by: agent?.name || 'Unknown',
                  submitted_by_id: listing.assigned_agent_id || '',
                  status: listing.status === 'active' ? 'Approved' : listing.status === 'draft' ? 'Pending' : 'Pending',
                  created_at: listing.created_at,
                });
              });
            }
          });
          setPortalSubmissions(submissions);
        }
      } catch (err) {
        console.error('Failed to fetch portal approval data:', err);
        message.error('Failed to load portal submissions');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let data = portalSubmissions.filter((p) => p.status === activeTab);

    if (searchId) {
      data = data.filter((p) => p.listing_id.toLowerCase().includes(searchId.toLowerCase()));
    }

    if (selectedAgent) {
      data = data.filter((p) => p.submitted_by_id === selectedAgent);
    }

    return data;
  }, [portalSubmissions, activeTab, searchId, selectedAgent]);

  const counts = useMemo(() => {
    const pending = portalSubmissions.filter((p) => p.status === 'Pending').length;
    const approved = portalSubmissions.filter((p) => p.status === 'Approved').length;
    const rejected = portalSubmissions.filter((p) => p.status === 'Rejected').length;
    return { Pending: pending, Approved: approved, Rejected: rejected };
  }, [portalSubmissions]);

  const handleReset = () => {
    setSearchId('');
    setDateRange(null);
    setSelectedApprover(undefined);
    setSelectedAgent(undefined);
  };

  const handleApprove = (record: PortalSubmission) => {
    message.success(`Portal submission ${record.listing_id} has been approved`);
  };

  const handleReject = (record: PortalSubmission) => {
    message.error(`Portal submission ${record.listing_id} has been rejected`);
  };

  const columns: ColumnsType<PortalSubmission> = [
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
      title: 'Community',
      dataIndex: 'community',
      key: 'community',
    },
    {
      title: 'Portal',
      dataIndex: 'portal',
      key: 'portal',
      render: (portal: string) => (
        <Tag color={PORTAL_COLORS[portal] || '#999'}>{portal}</Tag>
      ),
    },
    {
      title: 'Submitted By',
      key: 'submitted_by',
      render: (_: unknown, record: PortalSubmission) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ background: '#e6f7ff', color: '#1890ff' }} />
          <span>{record.submitted_by}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: PortalSubmission) => {
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

        <Table<PortalSubmission>
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          size="middle"
          locale={{ emptyText: `No ${activeTab.toLowerCase()} portal submissions` }}
        />
      </Card>
    </div>
  );
};

export default PortalsApproval;
