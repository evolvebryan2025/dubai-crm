import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Spin,
  message,
  Tabs,
  Table,
  Tag,
  Button,
  Empty,
} from 'antd';
import {
  EnvironmentOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { areasService, listingsService, newProjectsService } from '../../services/supabaseService';
import type { Area } from '../../types/database';

const { Title, Text } = Typography;

const AreaDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [area, setArea] = useState<Area | null>(null);
  const [listings, setListings] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: areaData, error: areaError } = await areasService.getById(id!);
        if (areaError) throw areaError;
        setArea(areaData);

        const [listingsRes, projectsRes] = await Promise.all([
          listingsService.getAll(),
          newProjectsService.getAll(),
        ]);

        if (listingsRes.data) {
          setListings(listingsRes.data.filter((l: any) => l.area === areaData.name));
        }
        if (projectsRes.data) {
          setProjects(projectsRes.data.filter((p: any) => {
            const areaMatch = p.area_id === id;
            const nameMatch = p.name?.toLowerCase().includes(areaData.name.toLowerCase());
            return areaMatch || nameMatch;
          }));
        }
      } catch {
        message.error('Failed to load area details');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!area) {
    return <Empty description="Area not found" />;
  }

  const imageUrl = area.image_url;

  const sellListings = listings.filter(l => l.type === 'sale');
  const rentListings = listings.filter(l => l.type === 'rent');

  const listingColumns = [
    { title: 'Title', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: 'Type', dataIndex: 'property_type', key: 'property_type' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (v: number) => v ? `AED ${v.toLocaleString()}` : '-',
    },
    { title: 'Bedrooms', dataIndex: 'bedrooms', key: 'bedrooms', render: (v: number | null) => v ?? '-' },
    {
      title: 'Size',
      dataIndex: 'size_sqft',
      key: 'size_sqft',
      render: (v: number | null) => v ? `${v.toLocaleString()} sqft` : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : v === 'draft' ? 'default' : 'orange'}>{v}</Tag>
      ),
    },
  ];

  const projectColumns = [
    { title: 'Project', dataIndex: 'name', key: 'name', ellipsis: true },
    {
      title: 'Starting Price',
      dataIndex: 'starting_price',
      key: 'starting_price',
      render: (v: number | null) => v ? `AED ${v.toLocaleString()}` : '-',
    },
    { title: 'Handover', dataIndex: 'handover_date', key: 'handover_date', render: (v: string | null) => v ?? '-' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === 'active' ? 'green' : v === 'sold_out' ? 'red' : 'default'}>{v}</Tag>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'projects',
      label: `New Projects (${projects.length})`,
      children: (
        <Table
          dataSource={projects}
          columns={projectColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No new projects in this area' }}
        />
      ),
    },
    {
      key: 'sell',
      label: `Sell Listings (${sellListings.length})`,
      children: (
        <Table
          dataSource={sellListings}
          columns={listingColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No sell listings in this area' }}
        />
      ),
    },
    {
      key: 'rent',
      label: `Rent Listings (${rentListings.length})`,
      children: (
        <Table
          dataSource={rentListings}
          columns={listingColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No rent listings in this area' }}
        />
      ),
    },
  ];

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        type="text"
        onClick={() => navigate('/areas/list')}
        style={{ marginBottom: 16 }}
      >
        Back to Areas
      </Button>

      {/* Hero Card */}
      <Card
        style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ position: 'relative', height: 280, background: '#e8e8e8' }}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={area.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EnvironmentOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />
            </div>
          )}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '24px 32px',
              background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            }}
          >
            <Title level={2} style={{ color: '#fff', margin: 0 }}>{area.name}</Title>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>{area.city}</Text>
          </div>
        </div>

        {/* Stats Bar */}
        <Row style={{ padding: '16px 32px' }} gutter={32}>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>New Projects</Text>
            <div><Text strong style={{ fontSize: 20, color: '#1890ff' }}>{area.new_count}</Text></div>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>Sell Listings</Text>
            <div><Text strong style={{ fontSize: 20, color: '#fa8c16' }}>{area.sell_count}</Text></div>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>Rent Listings</Text>
            <div><Text strong style={{ fontSize: 20, color: '#52c41a' }}>{area.rent_count}</Text></div>
          </Col>
        </Row>
      </Card>

      {/* Listings Tabs */}
      <Card style={{ borderRadius: 12 }}>
        <Tabs items={tabItems} defaultActiveKey="projects" />
      </Card>
    </div>
  );
};

export default AreaDetail;
