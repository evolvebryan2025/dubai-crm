import React, { useState, useEffect, useCallback } from 'react';
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
  Checkbox,
  Progress,
} from 'antd';
import {
  SearchOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  UserOutlined,
  PlusOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ColumnWidthOutlined,
  ClockCircleOutlined,
  FlagOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Task, User, Team } from '../../types';
import { tasksService, teamsService, profilesService } from '../../services/supabaseService';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PRIORITY_COLORS: Record<string, string> = {
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
};

const TYPE_COLORS: Record<string, string> = {
  follow_up: 'purple',
  viewing: 'cyan',
  call: 'green',
  meeting: 'blue',
  email: 'gold',
  other: 'default',
};

const TYPE_LABELS: Record<string, string> = {
  follow_up: 'Follow Up',
  viewing: 'Viewing',
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'error',
};

const KANBAN_BORDER_COLORS: Record<string, string> = {
  pending: '#faad14',
  in_progress: '#1890ff',
  completed: '#52c41a',
  cancelled: '#ff4d4f',
};

const TasksList: React.FC = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string | undefined>(undefined);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'>('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, teamsRes, usersRes] = await Promise.all([
        tasksService.getAll(),
        teamsService.getAll(),
        profilesService.getAll(),
      ]);

      if (tasksRes.data) {
        const mapped: Task[] = tasksRes.data.map((t: any) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          type: t.type,
          priority: t.priority,
          status: t.status,
          due_date: t.due_date,
          due_time: t.due_time,
          reminder_at: t.reminder_at,
          assigned_to: t.assigned_to,
          assignee: t.profiles
            ? ({
                id: t.profiles.id,
                name: t.profiles.full_name,
                email: t.profiles.email,
                phone: t.profiles.phone || '',
                is_active: t.profiles.is_active,
                created_at: t.profiles.created_at,
              } as User)
            : undefined,
          lead_id: t.lead_id,
          listing_id: t.listing_id,
          contact_id: t.contact_id,
          completed_at: t.completed_at,
          created_at: t.created_at,
        }));
        setTasks(mapped);
      }

      if (teamsRes.data) setTeams(teamsRes.data as unknown as Team[]);
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
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTasks = tasks.filter((task) => {
    if (searchText) {
      const search = searchText.toLowerCase();
      if (
        !task.title.toLowerCase().includes(search) &&
        !(task.description || '').toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    if (selectedPriority && task.priority !== selectedPriority) return false;
    if (selectedType && task.type !== selectedType) return false;
    if (selectedUser && task.assigned_to !== selectedUser) return false;
    if (activeTab !== 'all' && task.status !== activeTab) return false;
    if (dateRange && dateRange[0] && dateRange[1] && task.due_date) {
      const dueDate = dayjs(task.due_date);
      if (dueDate.isBefore(dateRange[0], 'day') || dueDate.isAfter(dateRange[1], 'day')) {
        return false;
      }
    }
    return true;
  });

  const handleStatusToggle = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      await tasksService.updateStatus(id, newStatus);
      message.success(newStatus === 'completed' ? 'Task completed' : 'Task reopened');
      fetchData();
    } catch {
      message.error('Failed to update task status');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await tasksService.updateStatus(id, newStatus);
      message.success('Task status updated');
      fetchData();
    } catch {
      message.error('Failed to update task status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksService.delete(id);
      message.success('Task deleted');
      fetchData();
    } catch {
      message.error('Failed to delete task');
    }
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedPriority(undefined);
    setSelectedType(undefined);
    setSelectedUser(undefined);
    setDateRange(null);
  };

  const statusCounts = {
    pending: tasks.filter((t) => t.status === 'pending').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    cancelled: tasks.filter((t) => t.status === 'cancelled').length,
  };

  const columns = [
    {
      title: '',
      key: 'checkbox',
      width: 40,
      render: (_: unknown, record: Task) => (
        <Checkbox
          checked={record.status === 'completed'}
          onChange={() => handleStatusToggle(record.id, record.status)}
        />
      ),
    },
    {
      title: 'Title',
      key: 'title',
      render: (_: unknown, record: Task) => (
        <div>
          <Text
            strong
            style={{
              textDecoration: record.status === 'completed' ? 'line-through' : 'none',
            }}
          >
            {record.title}
          </Text>
          {record.description && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.description.length > 80
                  ? `${record.description.substring(0, 80)}...`
                  : record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      width: 120,
      render: (_: unknown, record: Task) => (
        <Tag color={TYPE_COLORS[record.type] || 'default'}>
          {TYPE_LABELS[record.type] || record.type}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      key: 'priority',
      width: 110,
      render: (_: unknown, record: Task) => (
        <Tag
          color={PRIORITY_COLORS[record.priority] || 'default'}
          icon={<FlagOutlined />}
        >
          {record.priority.charAt(0).toUpperCase() + record.priority.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      key: 'due_date',
      width: 130,
      render: (_: unknown, record: Task) => {
        if (!record.due_date) return <Text type="secondary">-</Text>;
        const isOverdue =
          dayjs(record.due_date).isBefore(dayjs(), 'day') && record.status !== 'completed';
        return (
          <Text style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {dayjs(record.due_date).format('DD MMM YYYY')}
          </Text>
        );
      },
    },
    {
      title: 'Due Time',
      key: 'due_time',
      width: 100,
      render: (_: unknown, record: Task) =>
        record.due_time ? (
          <Text>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {record.due_time}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: 'Assignee',
      key: 'assignee',
      width: 160,
      render: (_: unknown, record: Task) =>
        record.assignee ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{record.assignee.name}</Text>
          </Space>
        ) : (
          <Text type="secondary">Unassigned</Text>
        ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: unknown, record: Task) => (
        <Tag color={STATUS_COLORS[record.status]}>
          {record.status === 'in_progress'
            ? 'In Progress'
            : record.status.charAt(0).toUpperCase() + record.status.slice(1)}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, record: Task) => (
        <Space>
          {record.status !== 'completed' && (
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              onClick={() => handleStatusToggle(record.id, record.status)}
            />
          )}
          <Popconfirm
            title="Delete this task?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Kanban drag handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      handleStatusChange(taskId, newStatus);
    }
  };

  const renderKanbanColumn = (status: string, title: string) => {
    const columnTasks = filteredTasks.filter((t) => t.status === status);
    return (
      <Col xs={24} sm={12} lg={6} key={status}>
        <Card
          style={{
            borderRadius: 12,
            borderTop: `3px solid ${KANBAN_BORDER_COLORS[status]}`,
            minHeight: 400,
          }}
          bodyStyle={{ padding: 12 }}
          title={
            <Space>
              <Text strong>{title}</Text>
              <Badge count={columnTasks.length} style={{ backgroundColor: KANBAN_BORDER_COLORS[status] }} />
            </Space>
          }
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          {columnTasks.map((task) => (
            <Card
              key={task.id}
              size="small"
              style={{
                marginBottom: 8,
                borderRadius: 8,
                cursor: 'grab',
              }}
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
            >
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {task.title}
              </Text>
              <Space wrap size={4} style={{ marginBottom: 4 }}>
                <Tag color={PRIORITY_COLORS[task.priority]} icon={<FlagOutlined />}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Tag>
                <Tag color={TYPE_COLORS[task.type]}>
                  {TYPE_LABELS[task.type] || task.type}
                </Tag>
              </Space>
              {task.due_date && (
                <div style={{ marginBottom: 4 }}>
                  <Text
                    type="secondary"
                    style={{
                      fontSize: 12,
                      color:
                        dayjs(task.due_date).isBefore(dayjs(), 'day') && task.status !== 'completed'
                          ? '#ff4d4f'
                          : undefined,
                    }}
                  >
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {dayjs(task.due_date).format('DD MMM YYYY')}
                  </Text>
                </div>
              )}
              {task.assignee && (
                <Space size={4}>
                  <Avatar size={20} icon={<UserOutlined />} />
                  <Text style={{ fontSize: 12 }}>{task.assignee.name}</Text>
                </Space>
              )}
            </Card>
          ))}
        </Card>
      </Col>
    );
  };

  const renderKanbanView = () => (
    <Row gutter={16}>
      {renderKanbanColumn('pending', 'Pending')}
      {renderKanbanColumn('in_progress', 'In Progress')}
      {renderKanbanColumn('completed', 'Completed')}
      {renderKanbanColumn('cancelled', 'Cancelled')}
    </Row>
  );

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All <Badge count={tasks.length} style={{ marginLeft: 4 }} />
        </span>
      ),
    },
    {
      key: 'pending',
      label: (
        <span>
          Pending <Badge count={statusCounts.pending} style={{ marginLeft: 4, backgroundColor: '#faad14' }} />
        </span>
      ),
    },
    {
      key: 'in_progress',
      label: (
        <span>
          In Progress <Badge count={statusCounts.in_progress} style={{ marginLeft: 4, backgroundColor: '#1890ff' }} />
        </span>
      ),
    },
    {
      key: 'completed',
      label: (
        <span>
          Completed <Badge count={statusCounts.completed} style={{ marginLeft: 4, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'cancelled',
      label: (
        <span>
          Cancelled <Badge count={statusCounts.cancelled} style={{ marginLeft: 4, backgroundColor: '#ff4d4f' }} />
        </span>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space align="center">
            <Title level={3} style={{ margin: 0 }}>
              Tasks
            </Title>
            <Badge
              count={tasks.length}
              style={{ backgroundColor: '#00C4A1' }}
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
                <UnorderedListOutlined /> Table
              </Radio.Button>
              <Radio.Button value="kanban">
                <AppstoreOutlined /> Kanban
              </Radio.Button>
            </Radio.Group>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/tasks/add')}
              style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
            >
              Add Task
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as typeof activeTab)}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* Filter Bar */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search tasks..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Priority"
              value={selectedPriority}
              onChange={setSelectedPriority}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="urgent">Urgent</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Type"
              value={selectedType}
              onChange={setSelectedType}
              allowClear
              style={{ width: '100%' }}
            >
              <Select.Option value="follow_up">Follow Up</Select.Option>
              <Select.Option value="viewing">Viewing</Select.Option>
              <Select.Option value="call">Call</Select.Option>
              <Select.Option value="meeting">Meeting</Select.Option>
              <Select.Option value="email">Email</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Assignee"
              value={selectedUser}
              onChange={setSelectedUser}
              allowClear
              showSearch
              optionFilterProp="children"
              style={{ width: '100%' }}
            >
              {users.map((u) => (
                <Select.Option key={u.id} value={u.id}>
                  {u.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={2}>
            <Button onClick={resetFilters} block>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Content */}
      <Spin spinning={loading}>
        {viewMode === 'table' ? (
          <Card style={{ borderRadius: 12 }}>
            <Table
              dataSource={filteredTasks}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} tasks` }}
              scroll={{ x: 1000 }}
            />
          </Card>
        ) : (
          renderKanbanView()
        )}
      </Spin>
    </div>
  );
};

export default TasksList;
