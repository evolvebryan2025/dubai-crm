import React from 'react';
import { Menu, Layout } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  HomeOutlined,
  ProjectOutlined,
  UserOutlined,
  TeamOutlined,
  DatabaseOutlined,
  TransactionOutlined,
  BarChartOutlined,
  SettingOutlined,
  EnvironmentOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTabStore } from '../../stores/useTabStore';
import { useAppStore } from '../../stores/useAppStore';

const { Sider } = Layout;

const menuItems = [
  {
    key: '/index',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: 'areas',
    icon: <EnvironmentOutlined />,
    label: 'Areas',
    children: [
      { key: '/areas/list', label: 'Areas List' },
    ],
  },
  {
    key: 'sell',
    icon: <ShopOutlined />,
    label: 'Sell Listings',
    children: [
      { key: '/sell/list', label: 'Sell List' },
      { key: '/sell/add', label: 'Add Sell' },
    ],
  },
  {
    key: 'rent',
    icon: <HomeOutlined />,
    label: 'Rent Listings',
    children: [
      { key: '/rent/list', label: 'Rent List' },
      { key: '/rent/add', label: 'Add Rent' },
    ],
  },
  {
    key: 'off-plan',
    icon: <ProjectOutlined />,
    label: 'Off-Plan Projects',
    children: [
      { key: '/new-project/list', label: 'Projects List' },
      { key: '/new-project/add', label: 'Add Project' },
    ],
  },
  {
    key: 'owners',
    icon: <UserOutlined />,
    label: 'Owners',
    children: [
      { key: '/owners/list', label: 'Owner List' },
      { key: '/owners/add', label: 'Add Potential Owner' },
    ],
  },
  {
    key: 'leads',
    icon: <TeamOutlined />,
    label: 'Leads',
    children: [
      { key: '/leads/buy', label: 'Buy Leads' },
      { key: '/leads/rent', label: 'Rent Leads' },
      { key: '/leads/portalsLeads', label: 'Portal Leads' },
      { key: '/leads/add', label: 'Add Lead' },
    ],
  },
  {
    key: 'database',
    icon: <DatabaseOutlined />,
    label: 'Database',
    children: [{ key: '/database/projects', label: 'Database' }],
  },
  {
    key: 'transactions',
    icon: <TransactionOutlined />,
    label: 'Transactions',
    children: [
      { key: '/transactions/list', label: 'Transactions List' },
      { key: '/transactions/add', label: 'Add Transaction' },
    ],
  },
  {
    key: 'kpi',
    icon: <BarChartOutlined />,
    label: 'KPI Reports',
    children: [
      { key: '/kpi/call', label: 'Contacts' },
      { key: '/kpi/viewings', label: 'Viewings' },
      { key: '/kpi/genaral', label: 'Insight Board' },
    ],
  },
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: 'Admin',
    children: [
      { key: '/system/staff', label: 'Staff' },
      { key: '/system/teams', label: 'Teams' },
      { key: '/system/roles', label: 'Roles' },
      { key: '/system/watermark', label: 'Watermark' },
      { key: '/system/integrations/company-profile', label: 'Integrations' },
      { key: '/system/data-import', label: 'Data Import' },
      { key: '/system/activity-log', label: 'Activity Log' },
    ],
  },
];

const labelMap: Record<string, string> = {};
function buildLabelMap(items: typeof menuItems) {
  for (const item of items) {
    if ('children' in item && item.children) {
      for (const child of item.children) {
        labelMap[child.key] = child.label;
      }
    } else {
      labelMap[item.key] = item.label;
    }
  }
}
buildLabelMap(menuItems);

export { labelMap };

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addTab } = useTabStore();
  const { sidebarCollapsed } = useAppStore();

  const handleMenuClick = ({ key }: { key: string }) => {
    const label = labelMap[key] || key;
    addTab({ key, label, path: key, closable: key !== '/index' });
    navigate(key);
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={sidebarCollapsed}
      width={260}
      collapsedWidth={80}
      style={{
        background: 'linear-gradient(180deg, #0d1b35 0%, #122045 100%)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1
          style={{
            color: '#00C4A1',
            margin: 0,
            fontSize: sidebarCollapsed ? 18 : 24,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          {sidebarCollapsed ? 'RC' : 'RealCRM'}
        </h1>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={[]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
        }}
        theme="dark"
      />
    </Sider>
  );
};

export default Sidebar;
