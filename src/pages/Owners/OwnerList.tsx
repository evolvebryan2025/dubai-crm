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
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Owner, User, Team } from '../../types';
import { ownersService, teamsService, profilesService } from '../../services/supabaseService';
import { supabaseOwnerToOwner, supabaseTeamToTeam, profileToUser } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const STATUS_COLOR_MAP: Record<string, string> = {
  Active: 'green',
  Inactive: 'red',
  Pending: 'orange',
};

const OwnerList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Data state
  const [owners, setOwners] = useState<Owner[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [ownersRes, teamsRes, profilesRes] = await Promise.all([
          ownersService.getAll(),
          teamsService.getAll(),
          profilesService.getAll(),
        ]);

        if (ownersRes.data) {
          setOwners(ownersRes.data.map((o: any) => supabaseOwnerToOwner(o)));
        }
        if (teamsRes.data) {
          setTeams(teamsRes.data.map((t: any) => supabaseTeamToTeam(t)));
        }
        if (profilesRes.data) {
          setUsers(profilesRes.data.map((p: any) => profileToUser(p)));
        }
      } catch (error) {
        console.error('Error fetching owners data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReset = () => {
    setSearchText('');
    setSelectedTeam(undefined);
    setSelectedUser(undefined);
    setDateRange(null);
  };

  const handleDelete = (id: string) => {
    message.success(`Owner ${id} deleted successfully`);
  };

  const filteredOwners = useMemo(() => {
    let data = [...owners];

    if (searchText) {
      const lower = searchText.toLowerCase();
      data = data.filter(
        (o) =>
          o.name.toLowerCase().includes(lower) ||
          o.phone.includes(searchText)
      );
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((o) => {
        const created = dayjs(o.created_at);
        return (
          created.isAfter(dateRange[0]!.startOf('day')) &&
          created.isBefore(dateRange[1]!.endOf('day'))
        );
      });
    }

    return data;
  }, [owners, searchText, selectedTeam, selectedUser, dateRange]);

  const columns: ColumnsType<Owner> = [
    {
      title: 'Profile',
      dataIndex: 'name',
      key: 'profile',
      width: 70,
      render: (name: string) => (
        <Avatar
          style={{ backgroundColor: '#00C4A1' }}
          icon={<UserOutlined />}
        >
          {name?.charAt(0)?.toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Source',
      dataIndex: 'source_of_owner',
      key: 'source_of_owner',
      render: (source: string) => source || '-',
    },
    {
      title: 'Nationality',
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality: string) => nationality || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLOR_MAP[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a, b) => dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: Owner) => (
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
            title="Delete Owner"
            description="Are you sure you want to delete this owner?"
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
      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Input
              placeholder="Search by Name / Phone"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
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

      {/* Owners Table */}
      <Card
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<Owner>
          columns={columns}
          dataSource={filteredOwners}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} owners`,
          }}
          style={{ borderRadius: 12 }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default OwnerList;
