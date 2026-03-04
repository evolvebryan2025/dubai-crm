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
  Switch,
  Dropdown,
  Spin,
  message,
} from 'antd';
import {
  SearchOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import type { User, Team } from '../../types';
import { profilesService, teamsService } from '../../services/supabaseService';
import { profileToUser, supabaseTeamToTeam } from '../../utils/typeAdapters';

const TEAL = '#00C4A1';

const Staff: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [staffData, setStaffData] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profilesRes, teamsRes] = await Promise.all([
          profilesService.getAll(),
          teamsService.getAll(),
        ]);
        if (profilesRes.data) {
          setStaffData(profilesRes.data.map((p) => profileToUser(p as any)));
        }
        if (teamsRes.data) {
          setTeams(teamsRes.data.map((t) => supabaseTeamToTeam(t)));
        }
      } catch (err) {
        console.error('Failed to fetch staff data:', err);
        message.error('Failed to load staff data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleReset = () => {
    setSearchText('');
    setStartDate(null);
    setEndDate(null);
    setSelectedTeam(undefined);
    setCurrentPage(1);
  };

  const handleToggleActive = async (userId: string, checked: boolean) => {
    try {
      const { error } = await profilesService.update(userId, { is_active: checked });
      if (error) throw error;
      setStaffData((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, is_active: checked } : user
        )
      );
      message.success(`User ${checked ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      console.error('Failed to toggle active status:', err);
      message.error('Failed to update user status');
    }
  };

  const handleMenuClick = (key: string, record: User) => {
    switch (key) {
      case 'edit':
        message.info(`Edit staff: ${record.name}`);
        break;
      case 'reset_password':
        message.info(`Reset password for: ${record.name}`);
        break;
      case 'delete':
        message.success(`Staff ${record.name} deleted successfully`);
        break;
      default:
        break;
    }
  };

  const getActionMenuItems = (record: User): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleMenuClick('edit', record),
    },
    {
      key: 'reset_password',
      label: 'Reset Password',
      icon: <KeyOutlined />,
      onClick: () => handleMenuClick('reset_password', record),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleMenuClick('delete', record),
    },
  ];

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const getTeamName = (user: User): string => {
    if (user.team?.name) return user.team.name;
    if (user.team_id) {
      const team = teams.find((t) => t.id === user.team_id);
      return team?.name || '-';
    }
    return '-';
  };

  const getRoleName = (user: User): string => {
    if (user.role?.title) return user.role.title;
    return '-';
  };

  const filteredStaff = useMemo(() => {
    let data = [...staffData];

    if (searchText) {
      const lower = searchText.toLowerCase();
      data = data.filter((u) => u.name.toLowerCase().includes(lower));
    }

    if (startDate) {
      data = data.filter((u) =>
        dayjs(u.created_at).isAfter(startDate.startOf('day').subtract(1, 'millisecond'))
      );
    }

    if (endDate) {
      data = data.filter((u) =>
        dayjs(u.created_at).isBefore(endDate.endOf('day').add(1, 'millisecond'))
      );
    }

    if (selectedTeam) {
      data = data.filter((u) => u.team_id === selectedTeam);
    }

    return data;
  }, [staffData, searchText, startDate, endDate, selectedTeam]);

  const columns: ColumnsType<User> = [
    {
      title: 'Profile',
      dataIndex: 'name',
      key: 'profile',
      width: 70,
      render: (name: string) => (
        <Avatar style={{ backgroundColor: TEAL }} size={36}>
          {getInitials(name)}
        </Avatar>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: 'Team',
      key: 'team',
      render: (_: unknown, record: User) => (
        <Tag color="blue">{getTeamName(record)}</Tag>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_: unknown, record: User) => getRoleName(record),
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Nationality',
      dataIndex: 'nationality',
      key: 'nationality',
      render: (nationality: string) => nationality || '-',
    },
    {
      title: 'State',
      key: 'is_active',
      width: 90,
      render: (_: unknown, record: User) => (
        <Switch
          checked={record.is_active}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Off"
          style={{ backgroundColor: record.is_active ? TEAL : undefined }}
        />
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
      width: 80,
      render: (_: unknown, record: User) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<MoreOutlined style={{ fontSize: 18 }} />}
          />
        </Dropdown>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 22 }}>Staff Management</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ backgroundColor: TEAL, borderColor: TEAL }}
        >
          + Add Staff
        </Button>
      </div>

      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Input
              placeholder="Search by Name"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </Col>
          <Col>
            <DatePicker
              placeholder="Start Date"
              value={startDate}
              onChange={(val) => setStartDate(val)}
              style={{ width: 160 }}
            />
          </Col>
          <Col>
            <DatePicker
              placeholder="End Date"
              value={endDate}
              onChange={(val) => setEndDate(val)}
              style={{ width: 160 }}
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
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Staff Table */}
      <Card
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<User>
          columns={columns}
          dataSource={filteredStaff}
          rowKey="id"
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: filteredStaff.length,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} staff`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>
    </div>
  );
};

export default Staff;
