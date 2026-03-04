import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  message,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { listingsService } from '../../services/supabaseService';

interface AreaData {
  id: string;
  name: string;
  city: string;
  property_types: string[];
  image_url?: string;
  new_projects_count: number;
  sell_count: number;
  rent_count: number;
}

const { Text } = Typography;

const CITY_OPTIONS = [
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Sharjah', value: 'Sharjah' },
];

const PROPERTY_TYPE_OPTIONS = [
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Penthouse', value: 'Penthouse' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Office', value: 'Office' },
];

interface AreaFilters {
  name: string;
  city: string | undefined;
  propertyType: string | undefined;
}

const AreasList: React.FC = () => {
  const [filters, setFilters] = useState<AreaFilters>({
    name: '',
    city: undefined,
    propertyType: undefined,
  });
  const [areas, setAreas] = useState<AreaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await listingsService.getAll();
        if (error) throw error;

        // Derive unique areas from listings and count sell/rent per area
        const areaMap = new Map<string, { sell: number; rent: number; types: Set<string> }>();
        for (const listing of data || []) {
          const areaName = listing.area;
          if (!areaName) continue;
          const existing = areaMap.get(areaName) || { sell: 0, rent: 0, types: new Set<string>() };
          if (listing.type === 'sale') existing.sell++;
          if (listing.type === 'rent') existing.rent++;
          if (listing.property_type) existing.types.add(listing.property_type);
          areaMap.set(areaName, existing);
        }

        const derivedAreas: AreaData[] = Array.from(areaMap.entries()).map(([name, counts], idx) => ({
          id: String(idx + 1),
          name,
          city: 'Dubai',
          property_types: Array.from(counts.types),
          new_projects_count: 0,
          sell_count: counts.sell,
          rent_count: counts.rent,
        }));

        setAreas(derivedAreas);
      } catch {
        message.error('Failed to load areas');
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const filteredAreas: AreaData[] = useMemo(() => {
    return areas.filter((area) => {
      const matchesName =
        !filters.name ||
        area.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesCity = !filters.city || area.city === filters.city;
      const matchesType =
        !filters.propertyType ||
        area.property_types.includes(filters.propertyType);
      return matchesName && matchesCity && matchesType;
    });
  }, [filters, areas]);

  const handleReset = () => {
    setFilters({ name: '', city: undefined, propertyType: undefined });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
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
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="City"
              allowClear
              value={filters.city}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, city: value }))
              }
              options={CITY_OPTIONS}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
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

      {/* Areas Grid */}
      <Row gutter={[16, 16]}>
        {filteredAreas.map((area) => (
          <Col xs={24} sm={12} md={12} lg={6} key={area.id}>
            <Card
              hoverable
              style={{ borderRadius: 12, overflow: 'hidden' }}
              styles={{ body: { padding: 0 } }}
            >
              {/* Area Image */}
              <div
                style={{
                  width: '100%',
                  height: 180,
                  overflow: 'hidden',
                  position: 'relative',
                  background: '#f0f0f0',
                }}
              >
                {area.image_url ? (
                  <img
                    src={area.image_url}
                    alt={area.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.style.display = 'flex';
                        parent.style.alignItems = 'center';
                        parent.style.justifyContent = 'center';
                      }
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#e8e8e8',
                    }}
                  >
                    <EnvironmentOutlined
                      style={{ fontSize: 48, color: '#bfbfbf' }}
                    />
                  </div>
                )}
              </div>

              {/* Area Info */}
              <div style={{ padding: '12px 16px' }}>
                <Text
                  strong
                  style={{
                    fontSize: 16,
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  {area.name}
                </Text>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, marginBottom: 8, display: 'block' }}
                >
                  {area.city}
                </Text>

                {/* Property Type Tags */}
                <div style={{ marginBottom: 10 }}>
                  {area.property_types.map((type) => (
                    <Tag
                      key={type}
                      style={{
                        borderRadius: 4,
                        fontSize: 11,
                        marginBottom: 4,
                      }}
                    >
                      {type}
                    </Tag>
                  ))}
                </div>

                {/* Stats Row */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: 10,
                  }}
                >
                  <Space size={4}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>New:</Text>
                    <Text
                      strong
                      style={{ fontSize: 13, color: '#1890ff' }}
                    >
                      {area.new_projects_count}
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
                  <Space size={4}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Sell:</Text>
                    <Text
                      strong
                      style={{ fontSize: 13, color: '#fa8c16' }}
                    >
                      {area.sell_count}
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>|</Text>
                  <Space size={4}>
                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>Rent:</Text>
                    <Text
                      strong
                      style={{ fontSize: 13, color: '#52c41a' }}
                    >
                      {area.rent_count}
                    </Text>
                  </Space>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Empty State */}
      {filteredAreas.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <EnvironmentOutlined
            style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}
          />
          <div>
            <Text type="secondary">No areas found matching your filters.</Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default AreasList;
