import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Input,
  Select,
  DatePicker,
  Button,
  Tabs,
  Tag,
  Radio,
  Table,
  Card,
  Row,
  Col,
  Space,
  Badge,
  Typography,
  Spin,
  Dropdown,
  Modal,
  message,
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  EnvironmentOutlined,
  SortAscendingOutlined,
  ReloadOutlined,
  FilterOutlined,
  HomeOutlined,
  CarOutlined,
  MoreOutlined,
  EditOutlined,
  EyeOutlined,
  CopyOutlined,
  DeleteOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { SellListing, User, Team } from '../../types';
import {
  listingsService,
  teamsService,
  profilesService,
  developersService,
} from '../../services/supabaseService';
import {
  listingToSellListing,
  supabaseTeamToTeam,
  profileToUser,
} from '../../utils/typeAdapters';
import { useNavigate } from 'react-router-dom';

const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const PRIMARY_COLOR = '#00C4A1';

const formatAED = (value: number): string => {
  return `AED ${value.toLocaleString('en-US')}`;
};

// ---------------------------------------------------------------------------
// Types for raw listing data used in table view
// ---------------------------------------------------------------------------
interface RawListingImage {
  id: string;
  url: string;
  is_primary: boolean;
  display_order: number;
}

interface RawListingProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface RawListing {
  id: string;
  reference_no: string;
  title: string;
  description: string | null;
  type: 'sale' | 'rent';
  property_type: string;
  area: string;
  community: string | null;
  building_name: string | null;
  unit_number: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  furnished: string | null;
  parking_spaces: number;
  price: number;
  status: string;
  is_published: boolean;
  publish_portals: any;
  owner_id: string | null;
  assigned_agent_id: string;
  completion_status: string | null;
  developer_id: string | null;
  created_at: string;
  updated_at: string;
  listing_images: RawListingImage[] | null;
  profiles: RawListingProfile | null;
  owners: any;
  latitude: number | null;
  longitude: number | null;
  amenities: any;
}

interface DeveloperRecord {
  id: string;
  name: string;
  logo_url: string | null;
}

// Enriched row type for the table
interface TableRow extends RawListing {
  _developerName: string;
  _agentName: string;
  _thumbnailUrl: string | null;
  _uiStatus: 'Active' | 'Inactive' | 'Sold';
  _completionStatusDisplay: string;
  _publishPortals: { pf: boolean; bayut: boolean; dubizzle: boolean };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStatusToUI(status: string): 'Active' | 'Inactive' | 'Sold' {
  switch (status) {
    case 'active':
    case 'under_offer':
      return 'Active';
    case 'sold':
      return 'Sold';
    default:
      return 'Inactive';
  }
}

function parsePublishPortals(raw: any): {
  pf: boolean;
  bayut: boolean;
  dubizzle: boolean;
} {
  if (!raw) return { pf: false, bayut: false, dubizzle: false };

  // Handle object format: { property_finder: true, bayut: false, dubizzle: true }
  if (typeof raw === 'object' && !Array.isArray(raw)) {
    return {
      pf: !!raw.property_finder,
      bayut: !!raw.bayut,
      dubizzle: !!raw.dubizzle,
    };
  }

  // Handle array format: ["property_finder", "bayut"]
  if (Array.isArray(raw)) {
    const arr = raw.map((s: string) => s.toLowerCase());
    return {
      pf: arr.includes('property_finder') || arr.includes('pf'),
      bayut: arr.includes('bayut'),
      dubizzle: arr.includes('dubizzle'),
    };
  }

  return { pf: false, bayut: false, dubizzle: false };
}

function getCompletionStatusDisplay(raw: RawListing): string {
  if (raw.completion_status) {
    return raw.completion_status;
  }
  // Fallback: derive from listing status
  switch (raw.status) {
    case 'active':
    case 'under_offer':
      return 'Ready';
    case 'sold':
      return 'Completed';
    default:
      return 'Ready';
  }
}

function getCompletionStatusColor(display: string): string {
  const normalized = display.toLowerCase().replace(/[_\s-]/g, '');
  if (normalized === 'ready') return 'green';
  if (normalized === 'offplan') return 'gold';
  if (normalized === 'underconstruction') return 'orange';
  if (normalized === 'completed') return 'blue';
  return 'default';
}

function getThumbnailUrl(images: RawListingImage[] | null): string | null {
  if (!images || images.length === 0) return null;
  // Prefer primary image, then lowest display_order, then first
  const primary = images.find((img) => img.is_primary);
  if (primary) return primary.url;
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  return sorted[0]?.url ?? null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SellList: React.FC = () => {
  const navigate = useNavigate();

  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(
    undefined
  );
  const [selectedUser, setSelectedUser] = useState<string | undefined>(
    undefined
  );
  const [activeTab, setActiveTab] = useState('Active');
  const [viewMode, setViewMode] = useState<'card' | 'table' | 'map'>('card');
  const [selectedTag, setSelectedTag] = useState<string>('All');

  // Data state
  const [rawListings, setRawListings] = useState<RawListing[]>([]);
  const [sellListings, setSellListings] = useState<SellListing[]>([]);
  const [developers, setDevelopers] = useState<DeveloperRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Build a developer lookup map
  const developerMap = useMemo(() => {
    const map = new Map<string, string>();
    developers.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [developers]);

  // ------------------------------------------
  // Fetch data
  // ------------------------------------------
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listingsRes, teamsRes, profilesRes, developersRes] =
        await Promise.all([
          listingsService.getSellListings(),
          teamsService.getAll(),
          profilesService.getAll(),
          developersService.getAll(),
        ]);

      if (listingsRes.data) {
        setRawListings(listingsRes.data as unknown as RawListing[]);
        setSellListings(
          listingsRes.data.map((l: any) => listingToSellListing(l))
        );
      }
      if (teamsRes.data) {
        setTeams(teamsRes.data.map((t: any) => supabaseTeamToTeam(t)));
      }
      if (profilesRes.data) {
        setUsers(profilesRes.data.map((p: any) => profileToUser(p)));
      }
      if (developersRes.data) {
        setDevelopers(developersRes.data as DeveloperRecord[]);
      }
    } catch (error) {
      console.error('Error fetching sell listings data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ------------------------------------------
  // Build enriched table rows from raw data
  // ------------------------------------------
  const tableRows: TableRow[] = useMemo(() => {
    return rawListings.map((raw) => {
      const thumbUrl = getThumbnailUrl(raw.listing_images);
      return {
        ...raw,
        _developerName: raw.developer_id
          ? developerMap.get(raw.developer_id) ?? '-'
          : '-',
        _agentName: raw.profiles?.full_name ?? '-',
        _thumbnailUrl: thumbUrl,
        _uiStatus: mapStatusToUI(raw.status),
        _completionStatusDisplay: getCompletionStatusDisplay(raw),
        _publishPortals: parsePublishPortals(raw.publish_portals),
      };
    });
  }, [rawListings, developerMap]);

  // ------------------------------------------
  // Tab counts (from SellListing adapted data)
  // ------------------------------------------
  const tabCounts = useMemo(() => {
    const active = sellListings.filter((l) => l.status === 'Active').length;
    const inactive = sellListings.filter((l) => l.status === 'Inactive').length;
    const sold = sellListings.filter((l) => l.status === 'Sold').length;
    const my = sellListings.filter((l) => l.agent_id === '1').length;
    return { active, inactive, sold, my };
  }, [sellListings]);

  // Unique tags from adapted listings
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    sellListings.forEach((l) => l.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [sellListings]);

  // ------------------------------------------
  // Filtering (works on both sellListings and tableRows)
  // ------------------------------------------
  const filteredSellListings = useMemo(() => {
    let result = [...sellListings];

    if (activeTab === 'My') {
      result = result.filter((l) => l.agent_id === '1');
    } else {
      result = result.filter((l) => l.status === activeTab);
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (l) =>
          l.community?.toLowerCase().includes(lower) ||
          l.building?.toLowerCase().includes(lower) ||
          l.address?.toLowerCase().includes(lower) ||
          l.listing_id?.toLowerCase().includes(lower)
      );
    }

    if (selectedTeam) {
      const team = teams.find((t) => t.id === selectedTeam);
      const memberIds = team?.members?.map((m) => m.id) || [];
      result = result.filter(
        (l) => l.agent_id && memberIds.includes(l.agent_id)
      );
    }

    if (selectedUser) {
      result = result.filter((l) => l.agent_id === selectedUser);
    }

    if (selectedTag !== 'All') {
      result = result.filter((l) => l.tags.includes(selectedTag));
    }

    return result;
  }, [
    sellListings,
    teams,
    searchText,
    selectedTeam,
    selectedUser,
    activeTab,
    selectedTag,
  ]);

  // Filtered IDs for fast lookup when filtering table rows
  const filteredIdSet = useMemo(() => {
    return new Set(filteredSellListings.map((l) => l.id));
  }, [filteredSellListings]);

  const filteredTableRows = useMemo(() => {
    return tableRows.filter((r) => filteredIdSet.has(r.id));
  }, [tableRows, filteredIdSet]);

  // ------------------------------------------
  // Actions
  // ------------------------------------------
  const handleReset = () => {
    setSearchText('');
    setSelectedTeam(undefined);
    setSelectedUser(undefined);
    setSelectedTag('All');
  };

  const handleEdit = (id: string) => {
    navigate(`/sell/add?id=${id}`);
  };

  const handleClone = async (id: string) => {
    try {
      await listingsService.clone(id);
      message.success('Listing cloned successfully');
      fetchData();
    } catch (error) {
      console.error('Error cloning listing:', error);
      message.error('Failed to clone listing');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Listing',
      content:
        'Are you sure you want to delete this listing? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await listingsService.delete(id);
          message.success('Listing deleted successfully');
          fetchData();
        } catch (error) {
          console.error('Error deleting listing:', error);
          message.error('Failed to delete listing');
        }
      },
    });
  };

  // ------------------------------------------
  // Portal badge helper
  // ------------------------------------------
  const renderPortalBadge = (
    label: string,
    active: boolean
  ) => (
    <Tag
      key={label}
      style={{
        fontSize: 11,
        lineHeight: '18px',
        padding: '0 5px',
        borderRadius: 3,
        margin: '1px',
        backgroundColor: active ? '#f6ffed' : '#fafafa',
        borderColor: active ? '#b7eb8f' : '#d9d9d9',
        color: active ? '#52c41a' : '#bfbfbf',
        fontWeight: 600,
      }}
    >
      {label}
    </Tag>
  );

  // ------------------------------------------
  // Table columns (enriched data)
  // ------------------------------------------
  const columns: ColumnsType<TableRow> = [
    {
      title: '',
      dataIndex: '_thumbnailUrl',
      key: 'thumbnail',
      width: 76,
      render: (url: string | null) =>
        url ? (
          <img
            src={url}
            alt="Thumbnail"
            style={{
              width: 60,
              height: 60,
              objectFit: 'cover',
              borderRadius: 6,
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 6,
              background: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PictureOutlined style={{ fontSize: 22, color: '#bfbfbf' }} />
          </div>
        ),
    },
    {
      title: 'Listing ID',
      dataIndex: 'reference_no',
      key: 'reference_no',
      width: 140,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: 'Property Type',
      dataIndex: 'property_type',
      key: 'property_type',
      width: 130,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Completion',
      key: 'completion_status',
      width: 145,
      render: (_: unknown, record: TableRow) => {
        const display = record._completionStatusDisplay;
        const color = getCompletionStatusColor(display);
        return <Tag color={color}>{display}</Tag>;
      },
    },
    {
      title: 'Community',
      dataIndex: 'community',
      key: 'community',
      width: 150,
      render: (text: string | null) => text ?? '-',
    },
    {
      title: 'Developer',
      key: 'developer',
      width: 140,
      render: (_: unknown, record: TableRow) => record._developerName,
    },
    {
      title: 'Price (AED)',
      dataIndex: 'price',
      key: 'price',
      width: 160,
      render: (value: number) => <Text strong>{value.toLocaleString('en-US')}</Text>,
      sorter: (a: TableRow, b: TableRow) => a.price - b.price,
    },
    {
      title: 'Beds',
      dataIndex: 'bedrooms',
      key: 'bedrooms',
      width: 70,
      align: 'center' as const,
      render: (val: number | null) => val ?? '-',
    },
    {
      title: 'Portals',
      key: 'portals',
      width: 120,
      render: (_: unknown, record: TableRow) => {
        const p = record._publishPortals;
        return (
          <Space size={2} wrap>
            {renderPortalBadge('PF', p.pf)}
            {renderPortalBadge('B', p.bayut)}
            {renderPortalBadge('D', p.dubizzle)}
          </Space>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: TableRow) => {
        const uiStatus = record._uiStatus;
        const colorMap: Record<string, string> = {
          Active: 'green',
          Inactive: 'default',
          Sold: 'red',
        };
        return <Tag color={colorMap[uiStatus] || 'default'}>{uiStatus}</Tag>;
      },
    },
    {
      title: 'Agent',
      key: 'agent',
      width: 140,
      render: (_: unknown, record: TableRow) => record._agentName,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center' as const,
      render: (_: unknown, record: TableRow) => {
        const items = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEdit(record.id),
          },
          {
            key: 'view',
            icon: <EyeOutlined />,
            label: 'View',
            onClick: () => handleEdit(record.id),
          },
          {
            key: 'clone',
            icon: <CopyOutlined />,
            label: 'Clone',
            onClick: () => handleClone(record.id),
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDelete(record.id),
          },
        ];

        return (
          <Dropdown
            menu={{ items: items as any }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button
              type="text"
              icon={<MoreOutlined style={{ fontSize: 18 }} />}
              onClick={(e) => e.stopPropagation()}
              style={{ padding: '4px 8px' }}
            />
          </Dropdown>
        );
      },
    },
  ];

  // ------------------------------------------
  // Card view
  // ------------------------------------------
  const renderCardView = () => (
    <Row gutter={[16, 16]}>
      {filteredSellListings.map((listing) => {
        const thumbUrl =
          listing.media_urls && listing.media_urls.length > 0
            ? listing.media_urls[0]
            : null;

        return (
          <Col xs={24} sm={12} lg={8} xl={6} key={listing.id}>
            <Card
              hoverable
              onClick={() => handleEdit(listing.id)}
              cover={
                <div
                  style={{
                    height: 180,
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={listing.property_type}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <img
                      src="/placeholder-property.jpg"
                      alt="Placeholder"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        // If placeholder image fails, show icon instead
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          const icon = document.createElement('span');
                          icon.innerHTML = '';
                          parent.innerHTML = '';
                          parent.style.display = 'flex';
                          parent.style.alignItems = 'center';
                          parent.style.justifyContent = 'center';
                        }
                      }}
                    />
                  )}
                  <Tag
                    color="blue"
                    style={{ position: 'absolute', top: 10, left: 10 }}
                  >
                    {listing.property_type}
                  </Tag>
                  <Tag
                    color={
                      listing.status === 'Active'
                        ? 'green'
                        : listing.status === 'Sold'
                          ? 'red'
                          : 'default'
                    }
                    style={{ position: 'absolute', top: 10, right: 10 }}
                  >
                    {listing.status}
                  </Tag>
                </div>
              }
              styles={{ body: { padding: 16 } }}
            >
              <Title level={5} style={{ margin: 0, color: PRIMARY_COLOR }}>
                {formatAED(listing.price)}
              </Title>

              <div style={{ margin: '4px 0 8px', fontSize: 12, color: '#8c8c8c' }}>
                {listing.listing_id}
              </div>

              <Space size={16} style={{ margin: '8px 0' }}>
                <Space size={4}>
                  <HomeOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">{listing.bedrooms || 0}</Text>
                </Space>
                <Space size={4}>
                  <HomeOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">{listing.bathrooms || 0}</Text>
                </Space>
                <Space size={4}>
                  <CarOutlined style={{ color: '#8c8c8c' }} />
                  <Text type="secondary">{listing.parking || 0}</Text>
                </Space>
              </Space>

              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {listing.community}
                </Text>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {listing.building}
                </Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Agent: {listing.agent?.name || 'Unassigned'}
                </Text>
              </div>

              <div style={{ marginBottom: 8 }}>
                {listing.tags.map((tag) => (
                  <Tag key={tag} style={{ fontSize: 11 }}>
                    {tag}
                  </Tag>
                ))}
              </div>

              <Button
                type="primary"
                block
                style={{
                  backgroundColor: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(listing.id);
                }}
              >
                Details
              </Button>
            </Card>
          </Col>
        );
      })}
      {filteredSellListings.length === 0 && (
        <Col span={24}>
          <div style={{ textAlign: 'center', padding: 40, color: '#8c8c8c' }}>
            No listings found
          </div>
        </Col>
      )}
    </Row>
  );

  // ------------------------------------------
  // Table view
  // ------------------------------------------
  const renderTableView = () => (
    <Table<TableRow>
      columns={columns}
      dataSource={filteredTableRows}
      rowKey="id"
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total) => `Total ${total} listings`,
      }}
      scroll={{ x: 1500 }}
      size="middle"
      onRow={(record) => ({
        onClick: () => handleEdit(record.id),
        style: { cursor: 'pointer' },
      })}
    />
  );

  // ------------------------------------------
  // Map view placeholder
  // ------------------------------------------
  const renderMapView = () => (
    <div
      style={{
        height: 500,
        background: '#f5f5f5',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #d9d9d9',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <EnvironmentOutlined
          style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }}
        />
        <div>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Map View - Google Maps Integration
          </Text>
        </div>
      </div>
    </div>
  );

  // ------------------------------------------
  // Tab items
  // ------------------------------------------
  const tabItems = [
    { key: 'Active', label: `Active (${tabCounts.active})` },
    { key: 'Inactive', label: `Inactive (${tabCounts.inactive})` },
    { key: 'Sold', label: `Sold (${tabCounts.sold})` },
    { key: 'My', label: `My (${tabCounts.my})` },
  ];

  // ------------------------------------------
  // Loading state
  // ------------------------------------------
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  // ------------------------------------------
  // Render
  // ------------------------------------------
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Sell Listings
        </Title>
      </div>

      {/* Filters Row */}
      <Card style={{ marginBottom: 16 }} styles={{ body: { padding: 16 } }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search Community / Area / City / Ref"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 300 }}
            />
          </Col>
          <Col>
            <RangePicker style={{ width: 260 }} />
          </Col>
          <Col>
            <Select
              placeholder="Select Team"
              allowClear
              value={selectedTeam}
              onChange={setSelectedTeam}
              style={{ width: 160 }}
              options={teams.map((t) => ({ label: t.name, value: t.id }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Select Users"
              allowClear
              value={selectedUser}
              onChange={setSelectedUser}
              style={{ width: 160 }}
              options={users.map((u) => ({ label: u.name, value: u.id }))}
            />
          </Col>
          <Col>
            <Button icon={<FilterOutlined />}>More Filters</Button>
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 8 }}
      />

      {/* Tags & View Switcher Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <Space size={8} wrap>
          <Tag.CheckableTag
            checked={selectedTag === 'All'}
            onChange={() => setSelectedTag('All')}
            style={{
              padding: '2px 12px',
              borderRadius: 12,
              border: '1px solid #d9d9d9',
              backgroundColor:
                selectedTag === 'All' ? PRIMARY_COLOR : undefined,
              color: selectedTag === 'All' ? '#fff' : undefined,
            }}
          >
            All
          </Tag.CheckableTag>
          {allTags.map((tag) => (
            <Tag.CheckableTag
              key={tag}
              checked={selectedTag === tag}
              onChange={() => setSelectedTag(tag)}
              style={{
                padding: '2px 12px',
                borderRadius: 12,
                border: '1px solid #d9d9d9',
                backgroundColor:
                  selectedTag === tag ? PRIMARY_COLOR : undefined,
                color: selectedTag === tag ? '#fff' : undefined,
              }}
            >
              {tag}
            </Tag.CheckableTag>
          ))}
        </Space>

        <Space size={8}>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="card">
              <AppstoreOutlined />
            </Radio.Button>
            <Radio.Button value="table">
              <UnorderedListOutlined />
            </Radio.Button>
            <Radio.Button value="map">
              <EnvironmentOutlined />
            </Radio.Button>
          </Radio.Group>
          <Button icon={<SortAscendingOutlined />}>Sort</Button>
        </Space>
      </div>

      {/* Content */}
      <Badge.Ribbon
        text={`${filteredSellListings.length} listings`}
        color={PRIMARY_COLOR}
        style={{ display: 'none' }}
      >
        <div>
          {viewMode === 'card' && renderCardView()}
          {viewMode === 'table' && renderTableView()}
          {viewMode === 'map' && renderMapView()}
        </div>
      </Badge.Ribbon>
    </div>
  );
};

export default SellList;
