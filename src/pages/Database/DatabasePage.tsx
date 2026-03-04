import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Table,
  Avatar,
  Space,
  Typography,
  Tabs,
  Spin,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { contactsService, teamsService, profilesService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';
import type { User, Team } from '../../types';

interface Contact {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  assigned_agent_id: string | null;
  created_at: string;
  profiles?: { full_name: string } | null;
}

const { Text } = Typography;

const DatabasePage: React.FC = () => {
  const [contactName, setContactName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('project');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, teamsRes, profilesRes] = await Promise.all([
          contactsService.getAll(),
          teamsService.getAll(),
          profilesService.getAll(),
        ]);
        if (contactsRes.data) setContacts(contactsRes.data as unknown as Contact[]);
        if (teamsRes.data) setTeams(teamsRes.data.map((t) => ({ id: t.id, name: t.name, created_at: t.created_at })));
        if (profilesRes.data) setUsers(profilesRes.data.map(profileToUser));
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = () => {
    setContactName('');
    setLocation('');
    setSelectedTeam(undefined);
    setSelectedUser(undefined);
  };

  const filteredContacts = useMemo(() => {
    let data = [...contacts];

    if (contactName) {
      const lower = contactName.toLowerCase();
      data = data.filter((c) => (c.full_name || '').toLowerCase().includes(lower));
    }

    if (selectedUser) {
      data = data.filter((c) => c.assigned_agent_id === selectedUser);
    }

    return data;
  }, [contactName, location, selectedTeam, selectedUser, contacts]);

  const columns: ColumnsType<Contact> = [
    {
      title: 'Name',
      dataIndex: 'full_name',
      key: 'full_name',
      sorter: (a, b) => (a.full_name || '').localeCompare(b.full_name || ''),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string | null) => email || '-',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string | null) => phone || '-',
    },
    {
      title: 'Agent',
      key: 'agent',
      render: (_: unknown, record: Contact) => {
        const agentName = record.profiles?.full_name;
        return (
          <Space>
            <Avatar
              size="small"
              style={{ backgroundColor: '#00C4A1' }}
              icon={<UserOutlined />}
            >
              {agentName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Text>{agentName || '-'}</Text>
          </Space>
        );
      },
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
      width: 120,
      render: () => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          style={{
            borderColor: '#00C4A1',
            color: '#00C4A1',
          }}
        >
          View
        </Button>
      ),
    },
  ];

  // Card grid layout
  const renderProjectView = () => (
    <Row gutter={[16, 16]}>
      {filteredContacts.map((contact) => (
        <Col xs={24} sm={12} md={8} lg={6} key={contact.id}>
          <Card
            hoverable
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 16 } }}
          >
            <div
              style={{
                height: 120,
                background: 'linear-gradient(135deg, #00C4A1 0%, #00a389 100%)',
                borderRadius: 8,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HomeIcon />
            </div>
            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 4 }}>
              {contact.full_name}
            </Text>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              {contact.email || '-'}
            </Text>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space size={4}>
                <Avatar size="small" style={{ backgroundColor: '#00C4A1' }} icon={<UserOutlined />}>
                  {contact.profiles?.full_name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <Text style={{ fontSize: 12 }}>{contact.profiles?.full_name || '-'}</Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {dayjs(contact.created_at).format('DD MMM YYYY')}
              </Text>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // List View: table layout
  const renderListView = () => (
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
        scroll={{ x: 800 }}
      />
    </Card>
  );

  const tabItems = [
    {
      key: 'project',
      label: (
        <Space>
          <AppstoreOutlined />
          Card View
        </Space>
      ),
      children: renderProjectView(),
    },
    {
      key: 'list',
      label: (
        <Space>
          <UnorderedListOutlined />
          List View
        </Space>
      ),
      children: renderListView(),
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
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Input
              placeholder="Contact Name"
              prefix={<SearchOutlined />}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              style={{ width: 200 }}
              allowClear
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
          <Col>
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Card>

      {/* Tabs: Project View / List View */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 0 }}
      />
    </div>
  );
};

/** Simple SVG home icon for the project card placeholder */
const HomeIcon: React.FC = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    stroke="rgba(255,255,255,0.7)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

export default DatabasePage;
