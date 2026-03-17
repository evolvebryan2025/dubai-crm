import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Button,
  Table,
  Tag,
  Avatar,
  Space,
  Typography,
  Popconfirm,
  message,
  Spin,
  Badge,
  Tabs,
  Radio,
  Rate,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
  PlusOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { Viewing, User, Team } from '../../types';
import { viewingsService, teamsService, profilesService } from '../../services/supabaseService';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'red',
  no_show: 'orange',
};

const ViewingsList: React.FC = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [viewingsRes, teamsRes, usersRes] = await Promise.all([
        viewingsService.getAll(),
        teamsService.getAll(),
        profilesService.getAll(),
      ]);

      if (viewingsRes.data) {
        const mapped: Viewing[] = (viewingsRes.data as any[]).map((v: any) => ({
          id: v.id,
          listing_id: v.listing_id,
          lead_id: v.lead_id,
          agent_id: v.agent_id,
          agent: v.profiles
            ? ({
                id: v.profiles.id,
                name: v.profiles.full_name,
                email: v.profiles.email,
                phone: v.profiles.phone || '',
                is_active: v.profiles.is_active,
                created_at: v.profiles.created_at,
              } as User)
            : undefined,
          contact_name: v.contact_name,
          contact_phone: v.contact_phone,
          contact_email: v.contact_email,
          viewing_date: v.viewing_date,
          viewing_time: v.viewing_time,
          duration_minutes: v.duration_minutes,
          status: v.status,
          feedback: v.feedback,
          rating: v.rating,
          notes: v.notes,
          property_address: v.property_address,
          property_type: v.property_type,
          area: v.area,
          created_at: v.created_at,
        }));
        setViewings(mapped);
      }

      if (teamsRes.data) {
        setTeams(
          teamsRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            leader_id: t.leader_id,
            created_at: t.created_at,
          }))
        );
      }

      if (usersRes.data) {
        setUsers(
          usersRes.data.map((u: any) => ({
            id: u.id,
            name: u.full_name,
            email: u.email,
            phone: u.phone || '',
            is_active: u.is_active,
            created_at: u.created_at,
          }))
        );
      }
    } catch (err) {
      message.error('Failed to load viewings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredViewings = viewings.filter((v) => {
    if (searchText) {
      const search = searchText.toLowerCase();
      const matchesSearch =
        v.contact_name?.toLowerCase().includes(search) ||
        v.property_address?.toLowerCase().includes(search) ||
        v.area?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }
    if (selectedStatus && v.status !== selectedStatus) return false;
    if (dateRange) {
      const viewDate = dayjs(v.viewing_date);
      if (viewDate.isBefore(dateRange[0], 'day') || viewDate.isAfter(dateRange[1], 'day'))
        return false;
    }
    return true;
  });

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await viewingsService.updateStatus(id, newStatus);
      message.success('Viewing status updated');
      fetchData();
    } catch {
      message.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await viewingsService.delete(id);
      message.success('Viewing deleted');
      fetchData();
    } catch {
      message.error('Failed to delete viewing');
    }
  };

  const handleTabChange = (key: string) => {
    setSelectedStatus(key === 'all' ? undefined : key);
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedTeam(undefined);
    setSelectedUser(undefined);
    setSelectedStatus(undefined);
    setDateRange(null);
  };

  const statusCounts = {
    scheduled: viewings.filter((v) => v.status === 'scheduled').length,
    completed: viewings.filter((v) => v.status === 'completed').length,
    cancelled: viewings.filter((v) => v.status === 'cancelled').length,
    no_show: viewings.filter((v) => v.status === 'no_show').length,
  };

  const columns = [
    {
      title: 'Contact',
      dataIndex: 'contact_name',
      key: 'contact_name',
      render: (_: any, record: Viewing) => (
        <Space>
          <Avatar style={{ backgroundColor: '#00C4A1' }} icon={<UserOutlined />}>
            {record.contact_name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <Text strong>{record.contact_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.contact_phone}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Property',
      dataIndex: 'property_address',
      key: 'property_address',
      render: (_: any, record: Viewing) => (
        <div>
          <Text>{record.property_address || 'N/A'}</Text>
          <br />
          {record.area && <Tag>{record.area}</Tag>}
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'property_type',
      key: 'property_type',
      render: (type: string) => (type ? <Tag>{type}</Tag> : '-'),
    },
    {
      title: 'Date',
      dataIndex: 'viewing_date',
      key: 'viewing_date',
      render: (date: string) => (date ? dayjs(date).format('DD MMM YYYY') : '-'),
      sorter: (a: Viewing, b: Viewing) =>
        dayjs(a.viewing_date).unix() - dayjs(b.viewing_date).unix(),
    },
    {
      title: 'Time',
      dataIndex: 'viewing_time',
      key: 'viewing_time',
    },
    {
      title: 'Duration',
      dataIndex: 'duration_minutes',
      key: 'duration_minutes',
      render: (mins: number) => (mins ? `${mins} min` : '-'),
    },
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      render: (_: any, record: Viewing) => record.agent?.name || 'Unassigned',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] || 'default'}>
          {status?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => (
        <Rate disabled value={rating || 0} style={{ fontSize: 14 }} />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Viewing) => (
        <Space>
          {record.status === 'scheduled' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleStatusUpdate(record.id, 'completed')}
            >
              Mark Complete
            </Button>
          )}
          <Popconfirm
            title="Delete this viewing?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `All (${viewings.length})` },
    {
      key: 'scheduled',
      label: (
        <Badge count={statusCounts.scheduled} color="blue" offset={[10, 0]}>
          Scheduled
        </Badge>
      ),
    },
    {
      key: 'completed',
      label: (
        <Badge count={statusCounts.completed} color="green" offset={[10, 0]}>
          Completed
        </Badge>
      ),
    },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'no_show', label: 'No Show' },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space align="center">
            <Title level={3} style={{ margin: 0 }}>
              Viewings
            </Title>
            <Badge
              count={filteredViewings.length}
              style={{ backgroundColor: '#00C4A1' }}
              overflowCount={9999}
            />
          </Space>
        </Col>
        <Col>
          <Space>
            <Radio.Group
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            >
              <Radio.Button value="table">
                <UnorderedListOutlined />
              </Radio.Button>
              <Radio.Button value="card">
                <AppstoreOutlined />
              </Radio.Button>
            </Radio.Group>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => navigate('/viewings/add')}
              style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
            >
              Add Viewing
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={selectedStatus || 'all'}
        onChange={handleTabChange}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* Filter Bar */}
      <Card style={{ marginBottom: 16, borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Input
              placeholder="Search contacts, properties, areas..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="Status"
              value={selectedStatus}
              onChange={(val) => setSelectedStatus(val)}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="scheduled">Scheduled</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="cancelled">Cancelled</Select.Option>
              <Select.Option value="no_show">No Show</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="Team"
              value={selectedTeam}
              onChange={(val) => setSelectedTeam(val)}
              allowClear
              style={{ width: '100%' }}
            >
              {teams.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="User"
              value={selectedUser}
              onChange={(val) => setSelectedUser(val)}
              allowClear
              style={{ width: '100%' }}
            >
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <RangePicker
              value={dateRange}
              onChange={(dates) =>
                setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
              }
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={2}>
            <Button onClick={resetFilters}>Reset</Button>
          </Col>
        </Row>
      </Card>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin size="large" />
        </div>
      ) : viewMode === 'table' ? (
        <Card style={{ borderRadius: 12 }}>
          <Table
            dataSource={filteredViewings}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
          />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredViewings.map((v) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={v.id}>
              <Card
                hoverable
                style={{ borderRadius: 12 }}
                title={v.contact_name}
                extra={
                  <Tag color={STATUS_COLORS[v.status] || 'default'}>
                    {v.status?.replace('_', ' ').toUpperCase()}
                  </Tag>
                }
              >
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Property:</Text>{' '}
                  <Text>{v.property_address || 'N/A'}</Text>
                </div>
                {v.area && (
                  <div style={{ marginBottom: 8 }}>
                    <Text type="secondary">Area:</Text> <Tag>{v.area}</Tag>
                  </div>
                )}
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Date/Time:</Text>{' '}
                  <Text>
                    {dayjs(v.viewing_date).format('DD MMM YYYY')} {v.viewing_time}
                  </Text>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text type="secondary">Agent:</Text>{' '}
                  <Text>{v.agent?.name || 'Unassigned'}</Text>
                </div>
                {v.rating != null && v.rating > 0 && (
                  <div>
                    <Rate disabled value={v.rating} style={{ fontSize: 14 }} />
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ViewingsList;
