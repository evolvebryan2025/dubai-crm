import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Spin,
  Pagination,
  message,
} from 'antd';
import {
  SearchOutlined,
  EnvironmentOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { areasService } from '../../services/supabaseService';
import type { Area } from '../../types/database';

const { Text } = Typography;

const CITY_OPTIONS = [
  { label: 'Dubai', value: 'Dubai' },
  { label: 'Abu Dhabi', value: 'Abu Dhabi' },
  { label: 'Sharjah', value: 'Sharjah' },
];

interface AreaFilters {
  name: string;
  city: string | undefined;
}

const AreasList: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<AreaFilters>({
    name: '',
    city: undefined,
  });
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 24;

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const { data, error } = await areasService.getAll();
        if (error) throw error;
        setAreas(data || []);
      } catch {
        message.error('Failed to load areas');
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  // Deduplicate areas by name, keeping the one with an image
  const uniqueAreas = useMemo(() => {
    const map = new Map<string, Area>();
    for (const area of areas) {
      const key = area.name.toLowerCase();
      const existing = map.get(key);
      if (!existing || (!existing.image_url && area.image_url)) {
        map.set(key, area);
      }
    }
    return Array.from(map.values());
  }, [areas]);

  const filteredAreas = useMemo(() => {
    const filtered = uniqueAreas.filter((area) => {
      const matchesName =
        !filters.name ||
        area.name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesCity = !filters.city || area.city === filters.city;
      return matchesName && matchesCity;
    });
    // Show areas with images first, then alphabetically
    return filtered.sort((a, b) => {
      if (a.image_url && !b.image_url) return -1;
      if (!a.image_url && b.image_url) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filters, uniqueAreas]);

  const paginatedAreas = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAreas.slice(start, start + pageSize);
  }, [filteredAreas, currentPage]);

  const handleReset = () => {
    setFilters({ name: '', city: undefined });
    setCurrentPage(1);
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
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, name: e.target.value }));
                setCurrentPage(1);
              }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={5}>
            <Select
              placeholder="City"
              allowClear
              value={filters.city}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, city: value }));
                setCurrentPage(1);
              }}
              options={CITY_OPTIONS}
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
        {paginatedAreas.map((area) => (
          <Col xs={24} sm={12} md={12} lg={6} key={area.id}>
            <Card
              hoverable
              onClick={() => navigate(`/areas/${area.id}`)}
              style={{ borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
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
                      {area.new_count}
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

      {/* Pagination */}
      {filteredAreas.length > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={currentPage}
            total={filteredAreas.length}
            pageSize={pageSize}
            onChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            showSizeChanger={false}
            showTotal={(total) => `${total} areas`}
          />
        </div>
      )}

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
