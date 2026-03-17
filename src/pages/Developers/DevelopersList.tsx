import React, { useState, useEffect, useMemo } from 'react';
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
  Spin,
  message,
  Popconfirm,
  Badge,
} from 'antd';
import { SearchOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { developersService, newProjectsService, listingsService } from '../../services/supabaseService';

const { Text, Title } = Typography;

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

interface EnrichedDeveloper {
  id: string;
  name: string;
  logo_url: string;
  property_types: string[];
  new_count: number;
  sell_count: number;
  rent_count: number;
  created_at: string;
}

interface DeveloperFilters {
  name: string;
  propertyType: string | undefined;
}

const DevelopersList: React.FC = () => {
  const navigate = useNavigate();
  const [developers, setDevelopers] = useState<EnrichedDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DeveloperFilters>({
    name: '',
    propertyType: undefined,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [devsRes, projectsRes, listingsRes] = await Promise.all([
        developersService.getAll(),
        newProjectsService.getAll(),
        listingsService.getAll(),
      ]);

      const devs = (devsRes.data || []).map((d: any) => {
        const projects = (projectsRes.data || []).filter((p: any) => p.developer_id === d.id);
        const devListings = (listingsRes.data || []).filter((l: any) => l.developer_id === d.id);
        return {
          id: d.id,
          name: d.name,
          logo_url: d.logo_url || '',
          property_types: [...new Set(
            projects
              .map((p: any) => {
                const types = Array.isArray(p.property_types) ? p.property_types : [];
                return types;
              })
              .flat(),
          )] as string[],
          new_count: projects.length,
          sell_count: devListings.filter((l: any) => l.type === 'sale').length,
          rent_count: devListings.filter((l: any) => l.type === 'rent').length,
          created_at: d.created_at,
        };
      });
      setDevelopers(devs);
    } catch (error) {
      console.error('Error fetching developers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredDevelopers = useMemo(() => {
    return developers.filter((dev) => {
      const matchesName =
        !filters.name ||
        dev.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesType =
        !filters.propertyType ||
        dev.property_types.includes(filters.propertyType);
      return matchesName && matchesType;
    });
  }, [filters, developers]);

  const handleReset = () => {
    setFilters({ name: '', propertyType: undefined });
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await developersService.delete(id);
      if (error) throw error;
      message.success('Developer deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting developer:', error);
      message.error('Failed to delete developer');
    }
  };

  const getAvatarColor = (index: number): string => {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space align="center">
          <Title level={4} style={{ margin: 0 }}>Developers</Title>
          <Badge
            count={developers.length}
            style={{ backgroundColor: '#00C4A1' }}
            overflowCount={999}
          />
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/developers/add')}
          style={{ background: '#00C4A1', borderColor: '#00C4A1' }}
        >
          Add Developer
        </Button>
      </div>

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

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Developers Grid */}
          <Row gutter={[16, 16]}>
            {filteredDevelopers.map((dev, index) => (
              <Col xs={24} sm={12} md={12} lg={6} key={dev.id}>
                <Card
                  hoverable
                  style={{ borderRadius: 12, textAlign: 'center', position: 'relative' }}
                  styles={{ body: { padding: '24px 16px' } }}
                >
                  {/* Delete Button */}
                  <Popconfirm
                    title="Delete this developer?"
                    description="This action cannot be undone."
                    onConfirm={() => handleDelete(dev.id)}
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    cancelText="Cancel"
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<DeleteOutlined />}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: '#bfbfbf',
                      }}
                    />
                  </Popconfirm>

                  {/* Developer Logo / Avatar */}
                  {dev.logo_url ? (
                    <Avatar
                      size={72}
                      src={dev.logo_url}
                      style={{ marginBottom: 16 }}
                    />
                  ) : (
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
                  )}

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
                      {dev.property_types.length > 0
                        ? dev.property_types.join(' / ')
                        : 'No property types'}
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
        </>
      )}
    </div>
  );
};

export default DevelopersList;
