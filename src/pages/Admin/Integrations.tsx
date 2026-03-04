import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Menu,
  Button,
  Input,
  Avatar,
  Space,
  Typography,
  Divider,
  Dropdown,
  Tooltip,
  Spin,
  message,
} from 'antd';
import {
  PlusOutlined,
  CopyOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  ApiOutlined,
  GlobalOutlined,
  PhoneOutlined,
  SyncOutlined,
  LineChartOutlined,
  FormOutlined,
  MessageOutlined,
  ThunderboltOutlined,
  CustomerServiceOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { CompanyProfile, User } from '../../types';
import { settingsService, profilesService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';

const { Text, Title } = Typography;
const TEAL = '#00C4A1';

type IntegrationTab =
  | 'company-profile'
  | 'meta'
  | 'tiktok'
  | 'callgear'
  | 'leads-rotation'
  | 'google-ads'
  | 'pixxi-forms'
  | 'wazzup'
  | 'brightcall'
  | 'sleekflow';

const MENU_ITEMS: { key: IntegrationTab; label: string; icon: React.ReactNode }[] = [
  { key: 'company-profile', label: 'Company Profile', icon: <BankOutlined /> },
  { key: 'meta', label: 'Meta', icon: <GlobalOutlined /> },
  { key: 'tiktok', label: 'TikTok', icon: <ThunderboltOutlined /> },
  { key: 'callgear', label: 'Callgear', icon: <PhoneOutlined /> },
  { key: 'leads-rotation', label: 'Leads Rotation', icon: <SyncOutlined /> },
  { key: 'google-ads', label: 'Google Ads', icon: <LineChartOutlined /> },
  { key: 'pixxi-forms', label: 'Pixxi Forms', icon: <FormOutlined /> },
  { key: 'wazzup', label: 'Wazzup', icon: <MessageOutlined /> },
  { key: 'brightcall', label: 'Brightcall', icon: <CustomerServiceOutlined /> },
  { key: 'sleekflow', label: 'SleekFlow', icon: <ApiOutlined /> },
];

const WEBHOOK_URLS: { label: string; value: string }[] = [
  {
    label: 'Property Finder Sync URL',
    value: 'https://api.realcrm.com/webhooks/pf-sync/abc123',
  },
  {
    label: 'Bayut & Dubizzle All Branches URL',
    value: 'https://api.realcrm.com/webhooks/bayut-dubizzle/all/abc123',
  },
  {
    label: 'Bayut & Dubizzle Branch URL',
    value: 'https://api.realcrm.com/webhooks/bayut-dubizzle/branch/abc123',
  },
  {
    label: 'Bayut Whatsapp Webhook URL',
    value: 'https://api.realcrm.com/webhooks/bayut-whatsapp/abc123',
  },
  {
    label: 'Dubizzle Whatsapp Webhook URL',
    value: 'https://api.realcrm.com/webhooks/dubizzle-whatsapp/abc123',
  },
];

const Integrations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<IntegrationTab>('company-profile');
  const [companyProfiles, setCompanyProfiles] = useState<CompanyProfile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [settingsRes, profilesRes] = await Promise.all([
          settingsService.getByCategory('integrations'),
          profilesService.getAll(),
        ]);

        if (profilesRes.data) {
          setUsers(profilesRes.data.map((p) => profileToUser(p as any)));
        }

        if (settingsRes.data) {
          // Each settings row with category='integrations' stores a company profile as JSON value
          const profiles: CompanyProfile[] = settingsRes.data
            .filter((s) => s.key.startsWith('company_profile_'))
            .map((s) => {
              try {
                return typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
              } catch {
                return null;
              }
            })
            .filter(Boolean);
          setCompanyProfiles(profiles);
        }
      } catch (err) {
        console.error('Failed to fetch integrations data:', err);
        message.error('Failed to load integrations data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('Copied to clipboard');
    }).catch(() => {
      message.error('Failed to copy');
    });
  };

  const getCardMenuItems = (profile: CompanyProfile): MenuProps['items'] => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => message.info(`Edit company: ${profile.company_name}`),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => message.success(`Company ${profile.company_name} deleted`),
    },
  ];

  const getAssignedUsers = (userIds: string[]) => {
    return userIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const renderCompanyProfile = () => (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Company Profile
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ backgroundColor: TEAL, borderColor: TEAL }}
        >
          + Add
        </Button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : companyProfiles.length === 0 ? (
        <Card style={{ borderRadius: 12, textAlign: 'center', padding: 40 }}>
          <BankOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
          <div>
            <Text type="secondary">No company profiles configured yet.</Text>
          </div>
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Add a company profile to manage portal integrations.
            </Text>
          </div>
        </Card>
      ) : (
        companyProfiles.map((profile) => {
          const assignedUsers = getAssignedUsers(profile.assigned_users);

          return (
            <Card
              key={profile.id}
              style={{ borderRadius: 12, marginBottom: 16 }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 16,
                }}
              >
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    {profile.company_name}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ID: {profile.id}
                  </Text>
                </div>
                <Dropdown
                  menu={{ items: getCardMenuItems(profile) }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <Button
                    type="text"
                    icon={<MoreOutlined style={{ fontSize: 18 }} />}
                  />
                </Dropdown>
              </div>

              {/* Fields */}
              <Row gutter={[24, 12]} style={{ marginBottom: 16 }}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    PF Token
                  </Text>
                  <div>
                    <Text code style={{ fontSize: 13 }}>
                      {profile.pf_token || '-'}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    PF Secret Token
                  </Text>
                  <div>
                    <Text code style={{ fontSize: 13 }}>
                      {profile.pf_secret_token || '-'}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bayut Token
                  </Text>
                  <div>
                    <Text code style={{ fontSize: 13 }}>
                      {profile.bayut_token || '-'}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Bayut Whatsapp Api Key
                  </Text>
                  <div>
                    <Text code style={{ fontSize: 13 }}>
                      {profile.bayut_whatsapp_api_key || '-'}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Dubizzle Whatsapp Api Key
                  </Text>
                  <div>
                    <Text code style={{ fontSize: 13 }}>
                      {profile.dubizzle_whatsapp_api_key || '-'}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Trade License Number
                  </Text>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {profile.trade_license_number || '-'}
                    </Text>
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Broker ORN
                  </Text>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {profile.broker_orn || '-'}
                    </Text>
                  </div>
                </Col>
              </Row>

              {/* Assigned Users */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                  Assigned Users
                </Text>
                <Avatar.Group
                  max={{
                    count: 5,
                    style: { backgroundColor: TEAL },
                  }}
                >
                  {assignedUsers.map((user) =>
                    user ? (
                      <Tooltip title={user.name} key={user.id}>
                        <Avatar style={{ backgroundColor: TEAL }}>
                          {getInitials(user.name)}
                        </Avatar>
                      </Tooltip>
                    ) : null
                  )}
                </Avatar.Group>
              </div>

              <Divider style={{ margin: '12px 0' }} />

              {/* Portal Webhook URLs */}
              <div>
                <Text
                  strong
                  style={{
                    fontSize: 14,
                    display: 'block',
                    marginBottom: 12,
                  }}
                >
                  Portal Webhook URLs
                </Text>
                <Space direction="vertical" style={{ width: '100%' }} size={10}>
                  {WEBHOOK_URLS.map((webhook) => (
                    <div key={webhook.label}>
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                      >
                        {webhook.label}
                      </Text>
                      <Input
                        readOnly
                        value={webhook.value}
                        addonAfter={
                          <CopyOutlined
                            style={{ cursor: 'pointer', color: TEAL }}
                            onClick={() => handleCopy(webhook.value)}
                          />
                        }
                        style={{ fontSize: 12 }}
                      />
                    </div>
                  ))}
                </Space>
              </div>
            </Card>
          );
        })
      )}
    </div>
  );

  const renderComingSoon = (tabKey: IntegrationTab) => {
    const menuItem = MENU_ITEMS.find((m) => m.key === tabKey);
    return (
      <Card
        style={{
          borderRadius: 12,
          textAlign: 'center',
          padding: 60,
        }}
      >
        <div style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}>
          <ApiOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
        </div>
        <Title level={4} style={{ color: '#999', margin: 0, marginBottom: 8 }}>
          {menuItem?.label || 'Integration'}
        </Title>
        <Text type="secondary" style={{ fontSize: 15 }}>
          Coming Soon
        </Text>
      </Card>
    );
  };

  const menuItems: MenuProps['items'] = MENU_ITEMS.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      <h2 style={{ margin: 0, marginBottom: 20, fontWeight: 600, fontSize: 22 }}>
        Integrations
      </h2>

      <Row gutter={16}>
        {/* Left Sidebar */}
        <Col span={6}>
          <Card
            style={{ borderRadius: 12 }}
            styles={{ body: { padding: 0 } }}
          >
            <Menu
              mode="vertical"
              selectedKeys={[activeTab]}
              onClick={({ key }) => setActiveTab(key as IntegrationTab)}
              items={menuItems}
              style={{
                border: 'none',
                borderRadius: 12,
              }}
            />
          </Card>
        </Col>

        {/* Right Content */}
        <Col span={18}>
          {activeTab === 'company-profile'
            ? renderCompanyProfile()
            : renderComingSoon(activeTab)}
        </Col>
      </Row>
    </div>
  );
};

export default Integrations;
