import React from 'react';
import { Layout, Badge, Dropdown, Avatar, Breadcrumb, Popover, List, Select, Button } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';
import { useAppStore } from '../../stores/useAppStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { labelMap } from './Sidebar';

const { Header: AntHeader } = Layout;

const langOptions = [
  { value: 'en', label: '🇬🇧 EN' },
  { value: 'ar', label: '🇦🇪 AR' },
  { value: 'cn', label: '🇨🇳 CN' },
];

const Header: React.FC = () => {
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar, notifications, language, setLanguage, markNotificationRead } = useAppStore();
  const { user, logout } = useAuthStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { title: <Link to="/index">Home</Link> },
    ...pathParts.map((part, idx) => {
      const path = '/' + pathParts.slice(0, idx + 1).join('/');
      const label = labelMap[path] || part.charAt(0).toUpperCase() + part.slice(1);
      return { title: idx === pathParts.length - 1 ? label : <Link to={path}>{label}</Link> };
    }),
  ];

  const notificationContent = (
    <List
      style={{ width: 300, maxHeight: 400, overflow: 'auto' }}
      dataSource={notifications}
      renderItem={(item) => (
        <List.Item
          style={{
            background: item.read ? 'transparent' : '#f0faf7',
            cursor: 'pointer',
            padding: '8px 12px',
          }}
          onClick={() => markNotificationRead(item.id)}
        >
          <List.Item.Meta
            title={<span style={{ fontWeight: item.read ? 400 : 600 }}>{item.title}</span>}
            description={item.message}
          />
        </List.Item>
      )}
    />
  );

  const userMenuItems = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', danger: true },
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') logout();
    },
  };

  return (
    <AntHeader
      style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f0f0f0',
        position: 'sticky',
        top: 0,
        zIndex: 99,
        height: 56,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: 18 }}
        />
        <Breadcrumb items={breadcrumbItems} separator=">" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <CalendarOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />

        <Popover content={notificationContent} title="Notifications" trigger="click" placement="bottomRight">
          <Badge count={unreadCount} size="small">
            <BellOutlined style={{ fontSize: 18, color: '#666', cursor: 'pointer' }} />
          </Badge>
        </Popover>

        <Select
          value={language}
          onChange={setLanguage}
          options={langOptions}
          style={{ width: 80 }}
          suffixIcon={<GlobalOutlined />}
          variant="borderless"
          size="small"
        />

        <Dropdown menu={userMenuItems} trigger={['click']}>
          <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={32} icon={<UserOutlined />} style={{ background: '#00C4A1' }} />
            <span style={{ fontSize: 13, color: '#333' }}>{user?.full_name || 'User'}</span>
          </div>
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
