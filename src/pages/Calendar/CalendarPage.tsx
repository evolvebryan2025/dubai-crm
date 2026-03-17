import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Space,
  Badge,
  Select,
  Spin,
  Tooltip,
  Modal,
  Descriptions,
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  TeamOutlined,
  MailOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { viewingsService, tasksService } from '../../services/supabaseService';
import type { Viewing, Task } from '../../types';

const { Title, Text } = Typography;

interface CalendarItem {
  id: string;
  title: string;
  time: string;
  type: 'viewing' | 'task';
  status: string;
  color: string;
  original: Viewing | Task;
}

const COLOR_MAP: Record<string, string> = {
  viewing: '#1890ff',
  follow_up: '#722ed1',
  call: '#52c41a',
  meeting: '#13c2c2',
  email: '#faad14',
  other: '#8c8c8c',
};

const LEGEND_ITEMS = [
  { label: 'Viewing', color: COLOR_MAP.viewing },
  { label: 'Follow Up', color: COLOR_MAP.follow_up },
  { label: 'Call', color: COLOR_MAP.call },
  { label: 'Meeting', color: COLOR_MAP.meeting },
  { label: 'Email', color: COLOR_MAP.email },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<dayjs.Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const start = currentDate.startOf('month').startOf('week').format('YYYY-MM-DD');
      const end = currentDate.endOf('month').endOf('week').format('YYYY-MM-DD');

      const [viewingsRes, tasksRes] = await Promise.all([
        viewingsService.getByDateRange(start, end),
        tasksService.getByDateRange(start, end),
      ]);

      if (viewingsRes.data) {
        setViewings(
          viewingsRes.data.map((v: any) => ({
            id: v.id,
            contact_name: v.contact_name,
            viewing_date: v.viewing_date,
            viewing_time: v.viewing_time,
            status: v.status,
            property_address: v.property_address,
            area: v.area,
            agent_id: v.agent_id,
            duration_minutes: v.duration_minutes,
            created_at: v.created_at,
          })) as Viewing[]
        );
      }

      if (tasksRes.data) {
        setTasks(
          tasksRes.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            type: t.type,
            priority: t.priority,
            status: t.status,
            due_date: t.due_date,
            due_time: t.due_time,
            assigned_to: t.assigned_to,
            created_at: t.created_at,
          })) as Task[]
        );
      }
    } catch (err) {
      console.error('Failed to fetch calendar data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getEventsForDate = (date: dayjs.Dayjs): CalendarItem[] => {
    const dateStr = date.format('YYYY-MM-DD');

    const viewingItems: CalendarItem[] = viewings
      .filter((v) => v.viewing_date === dateStr)
      .map((v) => ({
        id: v.id,
        title: `${v.contact_name} - Viewing`,
        time: v.viewing_time || '',
        type: 'viewing' as const,
        status: v.status,
        color: COLOR_MAP.viewing,
        original: v,
      }));

    const taskItems: CalendarItem[] = tasks
      .filter((t) => t.due_date === dateStr)
      .map((t) => ({
        id: t.id,
        title: t.title,
        time: t.due_time || '',
        type: 'task' as const,
        status: t.status,
        color: COLOR_MAP[t.type] || COLOR_MAP.other,
        original: t,
      }));

    return [...viewingItems, ...taskItems].sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleEventClick = (item: CalendarItem) => {
    setSelectedEvent(item);
    setModalVisible(true);
  };

  const handleMarkComplete = async () => {
    if (!selectedEvent) return;
    try {
      if (selectedEvent.type === 'viewing') {
        await viewingsService.updateStatus(selectedEvent.id, 'completed');
      } else {
        await tasksService.updateStatus(selectedEvent.id, 'completed');
      }
      setModalVisible(false);
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleNavigateToRecord = () => {
    if (!selectedEvent) return;
    if (selectedEvent.type === 'viewing') {
      navigate(`/viewings/${selectedEvent.id}`);
    } else {
      navigate(`/tasks/${selectedEvent.id}`);
    }
    setModalVisible(false);
  };

  const navigateMonth = (direction: number) => {
    if (viewMode === 'month') {
      setCurrentDate((prev) => prev.add(direction, 'month'));
    } else {
      setCurrentDate((prev) => prev.add(direction, 'week'));
    }
  };

  const goToToday = () => {
    setCurrentDate(dayjs());
  };

  // Build the month grid: 6 rows x 7 cols
  const getMonthGrid = (): dayjs.Dayjs[][] => {
    const startOfGrid = currentDate.startOf('month').startOf('week');
    const rows: dayjs.Dayjs[][] = [];
    for (let week = 0; week < 6; week++) {
      const row: dayjs.Dayjs[] = [];
      for (let day = 0; day < 7; day++) {
        row.push(startOfGrid.add(week * 7 + day, 'day'));
      }
      rows.push(row);
    }
    return rows;
  };

  // Build week grid: 7 days of the current week
  const getWeekDays = (): dayjs.Dayjs[] => {
    const startOfWeek = currentDate.startOf('week');
    const days: dayjs.Dayjs[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(startOfWeek.add(i, 'day'));
    }
    return days;
  };

  const isToday = (date: dayjs.Dayjs): boolean => date.isSame(dayjs(), 'day');
  const isCurrentMonth = (date: dayjs.Dayjs): boolean => date.isSame(currentDate, 'month');
  const isWeekend = (date: dayjs.Dayjs): boolean => date.day() === 0 || date.day() === 6;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'viewing':
        return <EyeOutlined />;
      case 'call':
        return <PhoneOutlined />;
      case 'meeting':
        return <TeamOutlined />;
      case 'email':
        return <MailOutlined />;
      case 'follow_up':
        return <CheckCircleOutlined />;
      default:
        return <CalendarOutlined />;
    }
  };

  const renderEventTag = (item: CalendarItem) => (
    <Tooltip
      key={item.id}
      title={`${item.time ? dayjs(item.time, 'HH:mm:ss').format('h:mm A') + ' - ' : ''}${item.title}`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleEventClick(item);
        }}
        style={{
          padding: '2px 6px',
          marginBottom: 2,
          borderLeft: `3px solid ${item.color}`,
          background: `${item.color}10`,
          borderRadius: '0 4px 4px 0',
          cursor: 'pointer',
          fontSize: 11,
          lineHeight: '16px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = `${item.color}25`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = `${item.color}10`;
        }}
      >
        <span style={{ color: item.color, marginRight: 4 }}>{getTypeIcon(item.type === 'viewing' ? 'viewing' : (item.original as Task).type)}</span>
        <Text style={{ fontSize: 11 }}>{item.title}</Text>
      </div>
    </Tooltip>
  );

  const renderMonthCell = (date: dayjs.Dayjs) => {
    const events = getEventsForDate(date);
    const maxVisible = 3;
    const visibleEvents = events.slice(0, maxVisible);
    const overflowCount = events.length - maxVisible;
    const today = isToday(date);
    const inMonth = isCurrentMonth(date);
    const weekend = isWeekend(date);

    return (
      <div
        key={date.format('YYYY-MM-DD')}
        style={{
          minHeight: 100,
          padding: '4px 8px',
          border: '1px solid #f0f0f0',
          background: today
            ? 'rgba(0,196,161,0.08)'
            : weekend
            ? '#fafafa'
            : '#fff',
          position: 'relative',
        }}
      >
        <div style={{ marginBottom: 4 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: today ? 24 : 'auto',
              height: today ? 24 : 'auto',
              borderRadius: '50%',
              background: today ? '#00C4A1' : 'transparent',
              color: today ? '#fff' : inMonth ? '#262626' : '#bfbfbf',
              fontWeight: today || inMonth ? 600 : 400,
              fontSize: 13,
            }}
          >
            {date.date()}
          </span>
        </div>
        <div>
          {visibleEvents.map(renderEventTag)}
          {overflowCount > 0 && (
            <Text
              style={{
                fontSize: 11,
                color: '#8c8c8c',
                cursor: 'pointer',
                display: 'block',
                paddingLeft: 6,
              }}
            >
              +{overflowCount} more
            </Text>
          )}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const grid = getMonthGrid();
    return (
      <div>
        {/* Day headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              style={{
                padding: '8px 8px',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: 13,
                color: '#8c8c8c',
                borderBottom: '2px solid #f0f0f0',
              }}
            >
              {day}
            </div>
          ))}
        </div>
        {/* Week rows */}
        {grid.map((week, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {week.map((date) => renderMonthCell(date))}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0 }}>
        {days.map((date) => {
          const events = getEventsForDate(date);
          const today = isToday(date);
          const weekend = isWeekend(date);
          return (
            <div
              key={date.format('YYYY-MM-DD')}
              style={{
                border: '1px solid #f0f0f0',
                background: today
                  ? 'rgba(0,196,161,0.08)'
                  : weekend
                  ? '#fafafa'
                  : '#fff',
                minHeight: 400,
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: '10px 8px',
                  textAlign: 'center',
                  borderBottom: '2px solid #f0f0f0',
                }}
              >
                <Text style={{ fontSize: 12, color: '#8c8c8c', display: 'block' }}>
                  {date.format('ddd')}
                </Text>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: today ? 28 : 'auto',
                    height: today ? 28 : 'auto',
                    borderRadius: '50%',
                    background: today ? '#00C4A1' : 'transparent',
                    color: today ? '#fff' : '#262626',
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {date.date()}
                </span>
              </div>
              {/* Events */}
              <div style={{ padding: '6px 4px' }}>
                {events.length === 0 && (
                  <Text style={{ fontSize: 11, color: '#bfbfbf', padding: '8px 4px', display: 'block', textAlign: 'center' }}>
                    No events
                  </Text>
                )}
                {events.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleEventClick(item)}
                    style={{
                      padding: '6px 8px',
                      marginBottom: 6,
                      borderLeft: `3px solid ${item.color}`,
                      background: `${item.color}10`,
                      borderRadius: '0 6px 6px 0',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = `${item.color}25`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.background = `${item.color}10`;
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>
                      {item.time ? dayjs(item.time, 'HH:mm:ss').format('h:mm A') : 'All day'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>
                      <span style={{ color: item.color, marginRight: 4 }}>
                        {getTypeIcon(item.type === 'viewing' ? 'viewing' : (item.original as Task).type)}
                      </span>
                      {item.title}
                    </div>
                    <Tag
                      style={{ fontSize: 10, marginTop: 4, borderRadius: 4 }}
                      color={
                        item.status === 'completed'
                          ? 'green'
                          : item.status === 'cancelled'
                          ? 'red'
                          : item.status === 'scheduled' || item.status === 'pending'
                          ? 'blue'
                          : 'default'
                      }
                    >
                      {item.status}
                    </Tag>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDetailModal = () => {
    if (!selectedEvent) return null;
    const isViewing = selectedEvent.type === 'viewing';
    const original = selectedEvent.original;

    return (
      <Modal
        title={
          <Space>
            <span style={{ color: selectedEvent.color }}>{getTypeIcon(isViewing ? 'viewing' : (original as Task).type)}</span>
            <span>{selectedEvent.title}</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedEvent(null);
        }}
        footer={
          <Space>
            <Button onClick={() => { setModalVisible(false); setSelectedEvent(null); }}>
              Close
            </Button>
            {selectedEvent.status !== 'completed' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkComplete}
                style={{ background: '#00C4A1', borderColor: '#00C4A1' }}
              >
                Mark Complete
              </Button>
            )}
            <Button type="primary" icon={<EyeOutlined />} onClick={handleNavigateToRecord}>
              View Full Record
            </Button>
          </Space>
        }
      >
        {isViewing ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Contact">{(original as Viewing).contact_name}</Descriptions.Item>
            <Descriptions.Item label="Property">{(original as Viewing).property_address || '—'}</Descriptions.Item>
            <Descriptions.Item label="Area">{(original as Viewing).area || '—'}</Descriptions.Item>
            <Descriptions.Item label="Date">{dayjs((original as Viewing).viewing_date).format('DD MMM YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Time">
              {(original as Viewing).viewing_time
                ? dayjs((original as Viewing).viewing_time, 'HH:mm:ss').format('h:mm A')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  (original as Viewing).status === 'completed'
                    ? 'green'
                    : (original as Viewing).status === 'cancelled'
                    ? 'red'
                    : (original as Viewing).status === 'no_show'
                    ? 'orange'
                    : 'blue'
                }
              >
                {(original as Viewing).status}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Title">{(original as Task).title}</Descriptions.Item>
            <Descriptions.Item label="Description">{(original as Task).description || '—'}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={COLOR_MAP[(original as Task).type] || COLOR_MAP.other}>
                {(original as Task).type?.replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag
                color={
                  (original as Task).priority === 'urgent'
                    ? 'red'
                    : (original as Task).priority === 'high'
                    ? 'orange'
                    : (original as Task).priority === 'medium'
                    ? 'blue'
                    : 'default'
                }
              >
                {(original as Task).priority}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              {(original as Task).due_date
                ? dayjs((original as Task).due_date).format('DD MMM YYYY')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Due Time">
              {(original as Task).due_time
                ? dayjs((original as Task).due_time, 'HH:mm:ss').format('h:mm A')
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag
                color={
                  (original as Task).status === 'completed'
                    ? 'green'
                    : (original as Task).status === 'cancelled'
                    ? 'red'
                    : (original as Task).status === 'in_progress'
                    ? 'processing'
                    : 'blue'
                }
              >
                {(original as Task).status?.replace('_', ' ')}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    );
  };

  const headerTitle = viewMode === 'month'
    ? currentDate.format('MMMM YYYY')
    : `${currentDate.startOf('week').format('MMM D')} – ${currentDate.endOf('week').format('MMM D, YYYY')}`;

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, marginBottom: 4 }}>
          <CalendarOutlined style={{ marginRight: 8, color: '#00C4A1' }} />
          Calendar
        </Title>
        <Text type="secondary">Viewings, tasks, and events at a glance</Text>
      </div>

      {/* Navigation Header */}
      <Card
        bodyStyle={{ padding: '12px 20px' }}
        style={{ marginBottom: 16, borderRadius: 12 }}
      >
        <Row justify="space-between" align="middle" wrap>
          <Col>
            <Space size="middle">
              <Button
                icon={<LeftOutlined />}
                onClick={() => navigateMonth(-1)}
                size="small"
              />
              <Title level={4} style={{ margin: 0, minWidth: 180, textAlign: 'center' }}>
                {headerTitle}
              </Title>
              <Button
                icon={<RightOutlined />}
                onClick={() => navigateMonth(1)}
                size="small"
              />
              <Button
                size="small"
                onClick={goToToday}
                style={{ borderColor: '#00C4A1', color: '#00C4A1' }}
              >
                Today
              </Button>
            </Space>
          </Col>
          <Col>
            <Space size="middle">
              {/* Legend */}
              <Space size="small" wrap>
                {LEGEND_ITEMS.map((item) => (
                  <Space key={item.label} size={4}>
                    <Badge color={item.color} />
                    <Text style={{ fontSize: 12 }}>{item.label}</Text>
                  </Space>
                ))}
              </Space>
              {/* View toggle */}
              <Select
                value={viewMode}
                onChange={(val) => setViewMode(val)}
                size="small"
                style={{ width: 100 }}
                options={[
                  { value: 'month', label: 'Month' },
                  { value: 'week', label: 'Week' },
                ]}
              />
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Calendar Grid */}
      <Card bodyStyle={{ padding: 0 }} style={{ borderRadius: 12, overflow: 'hidden' }}>
        <Spin spinning={loading}>
          {viewMode === 'month' ? renderMonthView() : renderWeekView()}
        </Spin>
      </Card>

      {/* Detail Modal */}
      {renderDetailModal()}
    </div>
  );
};

export default CalendarPage;
