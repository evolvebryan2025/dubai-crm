import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Button, Avatar, Space, Empty } from 'antd';
import {
  BellOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { notificationsService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

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

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await notificationsService.getByUser(user.id);
      const mapped: Notification[] = (res.data || [])
        .slice(0, 10)
        .map((n: any) => ({
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
      setUnreadCount(mapped.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    try {
      const count = await notificationsService.getUnreadCount(user.id);
      setUnreadCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  const dropdownContent = (
    <div
      style={{
        width: 360,
        maxHeight: 400,
        overflow: 'auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text strong style={{ fontSize: 16 }}>Notifications</Text>
        <Button type="link" size="small" onClick={() => navigate('/notifications')}>
          View All
        </Button>
      </div>

      {recentNotifications.length === 0 ? (
        <div style={{ padding: '24px 16px' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No notifications" />
        </div>
      ) : (
        <List
          loading={loading}
          dataSource={recentNotifications}
          renderItem={(item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info;
            const IconComponent = config.icon;

            return (
              <List.Item
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  borderLeft: !item.read ? '3px solid #1890ff' : '3px solid transparent',
                  background: 'transparent',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = '#fafafa';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      size="small"
                      style={{ backgroundColor: config.color }}
                      icon={<IconComponent />}
                    />
                  }
                  title={
                    <Space size={4}>
                      <Text
                        strong={!item.read}
                        style={{ fontSize: 13 }}
                        ellipsis
                      >
                        {item.title}
                      </Text>
                      {!item.read && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#1890ff',
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.created_at).fromNow()}
                    </Text>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}

      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center',
        }}
      >
        <Button type="link" block onClick={() => navigate('/notifications')}>
          See all notifications
        </Button>
      </div>
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomRight"
      onOpenChange={(open) => {
        if (open) fetchNotifications();
      }}
    >
      <div style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
        <Badge count={unreadCount} size="small" offset={[-2, 2]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </div>
    </Dropdown>
  );
};

export default NotificationBell;
