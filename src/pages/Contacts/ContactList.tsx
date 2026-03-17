import React, { useState, useMemo, useEffect } from 'react';
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
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Contact, User, Team } from '../../types';
import { contactsService, teamsService, profilesService } from '../../services/supabaseService';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const ContactList: React.FC = () => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, teamsRes, profilesRes] = await Promise.all([
        contactsService.getAll(),
        teamsService.getAll(),
        profilesService.getAll(),
      ]);

      if (contactsRes.data) {
        setContacts(
          contactsRes.data.map((c: any) => ({
            id: c.id,
            name: c.full_name,
            email: c.email,
            phone: c.phone,
            company: c.company,
            designation: c.designation,
            nationality: c.nationality,
            area_tags: Array.isArray(c.area_tags) ? (c.area_tags as string[]) : [],
            source: c.source,
            notes: c.notes,
            agent_id: c.assigned_agent_id,
            agent: c.profiles
              ? ({
                  id: c.profiles.id,
                  name: c.profiles.full_name,
                  email: c.profiles.email,
                  phone: c.profiles.phone || '',
                  is_active: c.profiles.is_active,
                  created_at: c.profiles.created_at,
                } as User)
              : undefined,
            created_at: c.created_at,
          }))
        );
      }

      if (teamsRes.data) {
        setTeams(
          teamsRes.data.map((t: any) => ({
            id: t.id,
            name: t.name,
            created_at: t.created_at,
          }))
        );
      }

      if (profilesRes.data) {
        setUsers(
          profilesRes.data.map(
            (p: any) =>
              ({
                id: p.id,
                name: p.full_name,
                email: p.email,
                phone: p.phone || '',
                is_active: p.is_active,
                created_at: p.created_at,
              } as User)
          )
        );
      }
    } catch (error) {
      console.error('Error fetching contacts data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = () => {
    setSearchText('');
    setSelectedTeam(undefined);
    setSelectedUser(undefined);
    setDateRange(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await contactsService.delete(id);
      if (error) throw error;
      message.success('Contact deleted successfully');
      fetchData();
    } catch (err: any) {
      message.error(err?.message || 'Failed to delete contact');
    }
  };

  const filteredContacts = useMemo(() => {
    let data = [...contacts];

    if (searchText) {
      const lower = searchText.toLowerCase();
      data = data.filter(
        (c) =>
          c.name.toLowerCase().includes(lower) ||
          (c.phone && c.phone.includes(searchText)) ||
          (c.email && c.email.toLowerCase().includes(lower)) ||
          (c.company && c.company.toLowerCase().includes(lower))
      );
    }

    if (selectedTeam) {
      const teamUserIds = users
        .filter((u: any) => u.team_id === selectedTeam)
        .map((u) => u.id);
      data = data.filter((c) => c.agent_id && teamUserIds.includes(c.agent_id));
    }

    if (selectedUser) {
      data = data.filter((c) => c.agent_id === selectedUser);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((c) => {
        const created = dayjs(c.created_at);
        return (
          created.isAfter(dateRange[0]!.startOf('day')) &&
          created.isBefore(dateRange[1]!.endOf('day'))
        );
      });
    }

    return data;
  }, [contacts, searchText, selectedTeam, selectedUser, dateRange, users]);

  const columns: ColumnsType<Contact> = [
    {
      title: 'Profile',
      dataIndex: 'name',
      key: 'profile',
      width: 70,
      render: (name: string) => (
        <Avatar style={{ backgroundColor: '#00C4A1' }}>
          {name?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record: Contact) => (
        <div>
          <Text strong>{name}</Text>
          {record.company && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.company}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => email || '-',
    },
    {
      title: 'Designation',
      dataIndex: 'designation',
      key: 'designation',
      render: (designation: string) => designation || '-',
    },
    {
      title: 'Nationality',
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality: string) => nationality || '-',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (source: string) => (source ? <Tag>{source}</Tag> : '-'),
    },
    {
      title: 'Area Tags',
      dataIndex: 'area_tags',
      key: 'area_tags',
      render: (tags: string[]) =>
        tags && tags.length > 0
          ? tags.map((tag) => (
              <Tag color="cyan" key={tag}>
                {tag}
              </Tag>
            ))
          : '-',
    },
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      render: (agent: User | undefined) => (agent ? agent.name : 'Unassigned'),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Contact) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Contact"
            description="Are you sure you want to delete this contact?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button danger size="small" icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ background: '#f5f7fa', minHeight: '100%', textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Space align="center">
            <Title level={4} style={{ margin: 0 }}>
              Contacts
            </Title>
            <Badge
              count={contacts.length}
              style={{ backgroundColor: '#00C4A1' }}
              overflowCount={9999}
            />
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/contacts/add')}
            style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
          >
            Add Contact
          </Button>
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Input
              placeholder="Search by Name / Phone / Email / Company"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              allowClear
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
              placeholder="Select User"
              allowClear
              value={selectedUser}
              onChange={setSelectedUser}
              style={{ width: 180 }}
              options={users.map((u) => ({ label: u.name, value: u.id }))}
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
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Card>

      {/* Contacts Table */}
      <Card
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<Contact>
          columns={columns}
          dataSource={filteredContacts}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} contacts`,
          }}
          style={{ borderRadius: 12 }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
};

export default ContactList;
