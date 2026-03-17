import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Button, Space, Badge, Tabs, Empty, Spin, Popconfirm, message, Avatar } from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { notificationsService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

const TYPE_CONFIG: Record<string, { color: string; icon: React.ComponentType<any> }> = {
  info: { color: 'blue', icon: InfoCircleOutlined },
  success: { color: 'green', icon: CheckCircleOutlined },
  warning: { color: 'orange', icon: WarningOutlined },
  error: { color: 'red', icon: CloseCircleOutlined },
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  entity_type?: string;
  entity_id?: string;
  read: boolean;
  created_at: string;
}

const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');

  const { user } = useAuthStore();

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationsService.getByUser(user.id);
      const mapped = (res.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        entity_type: n.entity_type,
        entity_id: n.entity_id,
        read: n.read,
        created_at: n.created_at,
      }));
      setNotifications(mapped);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      message.success('Marked as read');
    } catch (err) {
      message.error('Failed to mark as read');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await notificationsService.markAllAsRead(user.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      message.success('All notifications marked as read');
    } catch (err) {
      message.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      message.success('Notification deleted');
    } catch (err) {
      message.error('Failed to delete notification');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.read;
    if (activeTab === 'read') return n.read;
    return true;
  });

  const tabItems = [
    {
      key: 'all',
      label: (
        <Space>
          All
          <Badge count={notifications.length} showZero style={{ backgroundColor: '#8c8c8c' }} />
        </Space>
      ),
    },
    {
      key: 'unread',
      label: (
        <Space>
          Unread
          <Badge count={unreadCount} style={{ backgroundColor: '#ff4d4f' }} />
        </Space>
      ),
    },
    {
      key: 'read',
      label: <span>Read</span>,
    },
  ];

  const getEntityLink = (entityType?: string, entityId?: string) => {
    if (!entityType || !entityId) return null;
    const routes: Record<string, string> = {
      lead: `/leads/${entityId}`,
      contact: `/contacts/${entityId}`,
      transaction: `/transactions/${entityId}`,
      listing: `/sell-listings/${entityId}`,
      task: `/tasks/${entityId}`,
      viewing: `/viewings/${entityId}`,
    };
    return routes[entityType] || null;
  };

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      <Card
        style={{ borderRadius: 12 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <BellOutlined style={{ fontSize: 24 }} />
              <Title level={4} style={{ margin: 0 }}>Notifications</Title>
            </Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              disabled={unreadCount === 0}
              onClick={markAllAsRead}
            >
              Mark All Read
            </Button>
          </div>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'all' | 'unread' | 'read')}
          items={tabItems}
        />

        <Spin spinning={loading}>
          {filteredNotifications.length === 0 ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                activeTab === 'unread'
                  ? 'No unread notifications'
                  : activeTab === 'read'
                  ? 'No read notifications'
                  : 'No notifications'
              }
            />
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={filteredNotifications}
              renderItem={(item) => {
                const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
                const IconComponent = config.icon;
                const entityLink = getEntityLink(item.entity_type, item.entity_id);

                return (
                  <List.Item
                    style={{
                      padding: '12px 16px',
                      borderRadius: 8,
                      marginBottom: 8,
                      background: !item.read ? 'rgba(24,144,255,0.04)' : 'transparent',
                    }}
                    actions={[
                      !item.read && (
                        <Button
                          key="read"
                          type="link"
                          size="small"
                          icon={<CheckOutlined />}
                          onClick={() => markAsRead(item.id)}
                        >
                          Mark Read
                        </Button>
                      ),
                      <Popconfirm
                        key="delete"
                        title="Delete this notification?"
                        onConfirm={() => deleteNotification(item.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button
                          type="link"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                        >
                          Delete
                        </Button>
                      </Popconfirm>,
                    ].filter(Boolean)}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ backgroundColor: config.color }}
                          icon={<IconComponent />}
                        />
                      }
                      title={
                        <Space>
                          <Text strong={!item.read}>{item.title}</Text>
                          {item.entity_type && (
                            <Tag color={config.color}>{item.entity_type}</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <div>
                          <Text type="secondary">{item.message}</Text>
                          <br />
                          <Space style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {dayjs(item.created_at).fromNow()}
                            </Text>
                            {entityLink && (
                              <a href={entityLink} style={{ fontSize: 12 }}>
                                View {item.entity_type}
                              </a>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default NotificationCenter;
