import React from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Space,
} from 'antd';
import {
  SafetyCertificateOutlined,
  UserOutlined,
  DollarOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { USER_ROLES, ROLE_LABELS } from '../../types/enums';
import type { UserRole } from '../../types/enums';

const { Text, Title } = Typography;
const TEAL = '#00C4A1';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  super_admin: <SafetyCertificateOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />,
  admin: <TeamOutlined style={{ fontSize: 28, color: '#1890ff' }} />,
  finance: <DollarOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
  agent: <UserOutlined style={{ fontSize: 28, color: '#faad14' }} />,
};

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: '#ff4d4f',
  admin: '#1890ff',
  finance: '#52c41a',
  agent: '#faad14',
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin: 'Full system access. Can manage all settings, users, teams, roles, and approvals.',
  admin: 'Administrative access. Can manage staff, teams, listings, leads, and view reports.',
  finance: 'Finance operations. Can manage transactions, commissions, and financial approvals.',
  agent: 'Agent access. Can manage assigned leads, listings, and submit transactions for approval.',
};

const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    'Dashboard: Full Access',
    'Leads: Full CRUD + Assign',
    'Listings: Full CRUD + Publish',
    'Transactions: Full CRUD + Approve',
    'Owners: Full CRUD',
    'KPI: View All',
    'Admin: Full Access (Staff, Teams, Roles, Integrations)',
    'Approvals: Full Access',
  ],
  admin: [
    'Dashboard: View',
    'Leads: Full CRUD + Assign',
    'Listings: Full CRUD + Publish',
    'Transactions: View + Create + Edit',
    'Owners: Full CRUD',
    'KPI: View All',
    'Admin: Manage Staff + Teams',
  ],
  finance: [
    'Dashboard: View',
    'Transactions: View + Approve',
    'Commissions: View + Approve',
    'KPI: View Financial',
  ],
  agent: [
    'Dashboard: View Own',
    'Leads: View + Edit Assigned',
    'Listings: View + Edit Assigned',
    'Transactions: Create + View Own',
    'Owners: View Assigned',
    'KPI: View Own',
  ],
};

const Roles: React.FC = () => {
  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 22 }}>Roles Management</h2>
        <Tag color="blue" style={{ fontSize: 13, padding: '4px 12px' }}>
          System-defined roles (read-only)
        </Tag>
      </div>

      <Row gutter={[16, 16]}>
        {USER_ROLES.map((role) => (
          <Col span={12} key={role}>
            <Card
              style={{
                borderRadius: 12,
                borderLeft: `4px solid ${ROLE_COLORS[role]}`,
                height: '100%',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                {ROLE_ICONS[role]}
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {ROLE_LABELS[role]}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {role}
                  </Text>
                </div>
              </div>

              {/* Description */}
              <Text style={{ display: 'block', marginBottom: 16, color: '#555' }}>
                {ROLE_DESCRIPTIONS[role]}
              </Text>

              {/* Permissions */}
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  Permissions
                </Text>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {ROLE_PERMISSIONS[role].map((perm, idx) => (
                    <div key={idx} style={{ fontSize: 13, color: '#666' }}>
                      <Tag
                        color={ROLE_COLORS[role]}
                        style={{ marginRight: 8, minWidth: 6, padding: '0 4px' }}
                      >
                        &bull;
                      </Tag>
                      {perm}
                    </div>
                  ))}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Roles;
