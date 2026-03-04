import React, { useState, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Avatar,
  Space,
  Typography,
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Developer } from '../../types';

// Inline mock data - no Supabase table for developers
const mockDevelopers: Developer[] = [
  { id: '1', name: 'Emaar Properties', logo_url: '', property_types: ['Apartment', 'Villa', 'Penthouse'], new_count: 25, sell_count: 120, rent_count: 85, created_at: '2024-01-01T10:00:00Z' },
  { id: '2', name: 'DAMAC Properties', logo_url: '', property_types: ['Apartment', 'Villa'], new_count: 18, sell_count: 95, rent_count: 60, created_at: '2024-01-01T10:00:00Z' },
  { id: '3', name: 'Sobha Realty', logo_url: '', property_types: ['Villa', 'Apartment'], new_count: 12, sell_count: 55, rent_count: 30, created_at: '2024-01-01T10:00:00Z' },
  { id: '4', name: 'Binghatti', logo_url: '', property_types: ['Apartment'], new_count: 15, sell_count: 70, rent_count: 45, created_at: '2024-01-01T10:00:00Z' },
  { id: '5', name: 'Aldar Properties', logo_url: '', property_types: ['Apartment', 'Villa', 'Townhouse'], new_count: 20, sell_count: 88, rent_count: 52, created_at: '2024-01-01T10:00:00Z' },
  { id: '6', name: 'Ellington Properties', logo_url: '', property_types: ['Apartment', 'Villa'], new_count: 8, sell_count: 42, rent_count: 28, created_at: '2024-01-01T10:00:00Z' },
  { id: '7', name: 'Meraas', logo_url: '', property_types: ['Apartment', 'Villa', 'Retail'], new_count: 10, sell_count: 65, rent_count: 40, created_at: '2024-01-01T10:00:00Z' },
  { id: '8', name: 'Nshama', logo_url: '', property_types: ['Apartment', 'Townhouse'], new_count: 14, sell_count: 50, rent_count: 35, created_at: '2024-01-01T10:00:00Z' },
];

const { Text } = Typography;

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Penthouse', value: 'Penthouse' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Office', value: 'Office' },
  { label: 'Retail', value: 'Retail' },
];

const AVATAR_COLORS: string[] = [
  '#00C4A1',
  '#1890ff',
  '#722ed1',
  '#fa8c16',
  '#f5222d',
  '#13c2c2',
  '#eb2f96',
  '#52c41a',
];

interface DeveloperFilters {
  name: string;
  propertyType: string | undefined;
}

const DevelopersList: React.FC = () => {
  const [filters, setFilters] = useState<DeveloperFilters>({
    name: '',
    propertyType: undefined,
  });

  const filteredDevelopers: Developer[] = useMemo(() => {
    return mockDevelopers.filter((dev) => {
      const matchesName =
        !filters.name ||
        dev.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesType =
        !filters.propertyType ||
        dev.property_types.includes(filters.propertyType);
      return matchesName && matchesType;
    });
  }, [filters]);

  const handleReset = () => {
    setFilters({ name: '', propertyType: undefined });
  };

  const getAvatarColor = (index: number): string => {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder="Search by name"
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={filters.name}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, name: e.target.value }))
              }
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Property Type"
              allowClear
              value={filters.propertyType}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, propertyType: value }))
              }
              options={PROPERTY_TYPE_OPTIONS}
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Developers Grid */}
      <Row gutter={[16, 16]}>
        {filteredDevelopers.map((dev, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={dev.id}>
            <Card
              hoverable
              style={{ borderRadius: 12, textAlign: 'center' }}
              styles={{ body: { padding: '24px 16px' } }}
            >
              {/* Developer Logo / Avatar */}
              <Avatar
                size={72}
                style={{
                  backgroundColor: getAvatarColor(index),
                  fontSize: 28,
                  fontWeight: 700,
                  marginBottom: 16,
                }}
              >
                {dev.name.charAt(0).toUpperCase()}
              </Avatar>

              {/* Developer Name */}
              <Text
                strong
                style={{
                  fontSize: 18,
                  display: 'block',
                  marginBottom: 8,
                }}
              >
                {dev.name}
              </Text>

              {/* Property Types */}
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dev.property_types.join(' / ')}
                </Text>
              </div>

              {/* Stats Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderTop: '1px solid #f0f0f0',
                  paddingTop: 14,
                  gap: 8,
                }}
              >
                <Space size={4}>
                  <Text style={{ fontSize: 12, color: '#8c8c8c' }}>New:</Text>
                  <Text strong style={{ fontSize: 13, color: '#1890ff' }}>
                    {dev.new_count}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  |
                </Text>
                <Space size={4}>
                  <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Sell:</Text>
                  <Text strong style={{ fontSize: 13, color: '#fa8c16' }}>
                    {dev.sell_count}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  |
                </Text>
                <Space size={4}>
                  <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Rent:</Text>
                  <Text strong style={{ fontSize: 13, color: '#52c41a' }}>
                    {dev.rent_count}
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Empty State */}
      {filteredDevelopers.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Text type="secondary">
            No developers found matching your filters.
          </Text>
        </div>
      )}
    </div>
  );
};

export default DevelopersList;
