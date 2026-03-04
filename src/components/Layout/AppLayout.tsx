import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TabBar from './TabBar';
import { useAppStore } from '../../stores/useAppStore';

const { Content } = Layout;

const AppLayout: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout
        style={{
          marginLeft: sidebarCollapsed ? 80 : 260,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header />
        <TabBar />
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: '#f5f7fa',
            minHeight: 'calc(100vh - 120px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
