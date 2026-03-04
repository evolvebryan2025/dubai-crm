import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Space,
  Typography,
  Badge,
  Avatar,
  Tooltip,
  Spin,
  Modal,
  Dropdown,
  message,
  Image,
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  CalendarOutlined,
  HomeOutlined,
  UserOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  BankOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  MoreOutlined,
  PictureOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  newProjectsService,
  developersService,
  profilesService,
} from '../../services/supabaseService';

const { Text } = Typography;

const PRIMARY_COLOR = '#00C4A1';

// --- Status color mappings ---
const STATUS_COLOR_MAP: Record<string, string> = {
  active: 'green',
  pool: 'blue',
  sold_out: 'red',
};

const COMPLETION_STATUS_COLOR_MAP: Record<string, string> = {
  under_construction: 'gold',
  near_completion: 'orange',
  completed: 'blue',
  off_plan: 'purple',
};

// --- Filter option sets ---
const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Pool', value: 'pool' },
  { label: 'Sold Out', value: 'sold_out' },
];

const COMPLETION_STATUS_OPTIONS = [
  { label: 'Under Construction', value: 'under_construction' },
  { label: 'Near Completion', value: 'near_completion' },
  { label: 'Completed', value: 'completed' },
  { label: 'Off Plan', value: 'off_plan' },
];

// --- Helpers ---
const formatStatusLabel = (status: string): string => {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const formatPrice = (price: number | null | undefined): string => {
  if (price == null) return '-';
  return `AED ${price.toLocaleString('en-US')}`;
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

interface ProjectFilters {
  search: string;
  developer: string | undefined;
  status: string | undefined;
  completionStatus: string | undefined;
}

type ViewMode = 'grid' | 'list';

const ProjectList: React.FC = () => {
  const navigate = useNavigate();

  // --- Supabase data ---
  const [projects, setProjects] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- UI state ---
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    developer: undefined,
    status: undefined,
    completionStatus: undefined,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // --- Data fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes, devsRes, profilesRes] = await Promise.all([
        newProjectsService.getAll(),
        developersService.getAll(),
        profilesService.getAll(),
      ]);
      if (projectsRes.data) setProjects(projectsRes.data as any[]);
      if (devsRes.data) setDevelopers(devsRes.data as any[]);
      if (profilesRes.data)
        setAgents((profilesRes.data as any[]).filter((p: any) => p.is_active));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Lookup maps ---
  const developerMap = useMemo(() => {
    const map = new Map<string, string>();
    developers.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [developers]);

  const agentMap = useMemo(() => {
    const map = new Map<string, string>();
    agents.forEach((a) => map.set(a.id, a.full_name));
    return map;
  }, [agents]);

  // --- Developer filter options ---
  const developerOptions = useMemo(() => {
    return developers.map((d) => ({ label: d.name, value: d.id }));
  }, [developers]);

  // --- Filtered projects ---
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const devName = developerMap.get(project.developer_id) || '';
      const agentName = agentMap.get(project.agent_id) || '';
      const location = project.city || project.area_id || '';

      const matchesSearch =
        !filters.search ||
        (project.name || '')
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        devName.toLowerCase().includes(filters.search.toLowerCase()) ||
        agentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        location.toLowerCase().includes(filters.search.toLowerCase());

      const matchesDeveloper =
        !filters.developer || project.developer_id === filters.developer;

      const matchesStatus =
        !filters.status || project.status === filters.status;

      const matchesCompletion =
        !filters.completionStatus ||
        project.completion_status === filters.completionStatus;

      return matchesSearch && matchesDeveloper && matchesStatus && matchesCompletion;
    });
  }, [projects, filters, developerMap, agentMap]);

  // --- Actions ---
  const handleReset = () => {
    setFilters({
      search: '',
      developer: undefined,
      status: undefined,
      completionStatus: undefined,
    });
  };

  const handleEdit = (projectId: string) => {
    navigate(`/new-project/add?id=${projectId}`);
  };

  const handleClone = async (project: any) => {
    try {
      const {
        id: _id,
        created_at: _ca,
        updated_at: _ua,
        ...rest
      } = project;
      const { error } = await newProjectsService.create({
        ...rest,
        name: `${project.name} (Copy)`,
        status: 'pool',
      } as any);
      if (error) {
        message.error('Failed to clone project');
        return;
      }
      message.success('Project cloned successfully');
      fetchData();
    } catch {
      message.error('Failed to clone project');
    }
  };

  const handleDelete = (projectId: string, projectName: string) => {
    Modal.confirm({
      title: 'Delete Project',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to delete "${projectName}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { error } = await newProjectsService.delete(projectId);
          if (error) {
            message.error('Failed to delete project');
            return;
          }
          message.success('Project deleted successfully');
          fetchData();
        } catch {
          message.error('Failed to delete project');
        }
      },
    });
  };

  // --- Dropdown menu for actions ---
  const getActionMenuItems = (project: any) => [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => handleEdit(project.id),
    },
    {
      key: 'clone',
      label: 'Clone',
      icon: <CopyOutlined />,
      onClick: () => handleClone(project),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: () => handleDelete(project.id, project.name),
    },
  ];

  // --- Thumbnail renderer ---
  const renderThumbnail = (mediaUrls: string[] | null | undefined) => {
    const firstImage = mediaUrls?.[0];
    if (firstImage) {
      return (
        <Image
          src={firstImage}
          alt="Project thumbnail"
          width={64}
          height={48}
          style={{ objectFit: 'cover', borderRadius: 6 }}
          preview={false}
          fallback="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNDgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iMzIiIHk9IjI4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjYmZiZmJmIiBmb250LXNpemU9IjEyIj5OL0E8L3RleHQ+PC9zdmc+"
        />
      );
    }
    return (
      <div
        style={{
          width: 64,
          height: 48,
          borderRadius: 6,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <PictureOutlined style={{ fontSize: 20, color: '#d9d9d9' }} />
      </div>
    );
  };

  // --- Property types renderer ---
  const renderPropertyTypes = (types: string[] | null | undefined) => {
    if (!types || types.length === 0) return <Text type="secondary">-</Text>;
    return (
      <Space size={4} wrap>
        {types.map((t: string, i: number) => (
          <Tag key={`${t}-${i}`} style={{ borderRadius: 4, fontSize: 11 }}>
            {t}
          </Tag>
        ))}
      </Space>
    );
  };

  // ----- Grid Card -----
  const renderGridCard = (project: any) => (
    <Col xs={24} sm={12} md={12} lg={8} key={project.id}>
      <Card
        hoverable
        style={{ borderRadius: 12, height: '100%', cursor: 'pointer' }}
        styles={{ body: { padding: '16px 20px' } }}
        onClick={() => navigate(`/new-project/add?id=${project.id}`)}
      >
        {/* Header: Thumbnail + Name + Status + Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 12,
          }}
        >
          <div style={{ display: 'flex', gap: 12, flex: 1 }}>
            {renderThumbnail(project.media_urls)}
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text
                strong
                style={{
                  fontSize: 16,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {project.name}
              </Text>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {project.title || project.id?.slice(0, 8)}
              </Text>
            </div>
          </div>
          <Space size={4}>
            <Tag
              color={STATUS_COLOR_MAP[project.status] || 'default'}
              style={{ borderRadius: 4, marginLeft: 8 }}
            >
              {formatStatusLabel(project.status || '')}
            </Tag>
            <Dropdown
              menu={{ items: getActionMenuItems(project) }}
              trigger={['click']}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Space>
        </div>

        {/* Info Rows */}
        <Space direction="vertical" size={6} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <EnvironmentOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            <Text style={{ fontSize: 13 }}>
              {project.city || project.area_id || '-'}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BankOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            <Text style={{ fontSize: 13 }}>
              {developerMap.get(project.developer_id) || 'Unknown'}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HomeOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            {renderPropertyTypes(project.property_types)}
            {project.completion_status && (
              <Tag
                color={
                  COMPLETION_STATUS_COLOR_MAP[project.completion_status] ||
                  'default'
                }
                style={{ borderRadius: 4, fontSize: 11 }}
              >
                {formatStatusLabel(project.completion_status)}
              </Tag>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <DollarOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            <Text style={{ fontSize: 13 }}>
              {formatPrice(project.starting_price)}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            <Text style={{ fontSize: 13 }}>
              {agentMap.get(project.agent_id) || 'Unassigned'}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarOutlined style={{ color: '#8c8c8c', fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDate(project.created_at)}
            </Text>
          </div>
        </Space>

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {(project.tags as string[]).map((tag: string, i: number) => (
              <Tag
                key={`${tag}-${i}`}
                style={{ borderRadius: 4, fontSize: 11 }}
              >
                {tag}
              </Tag>
            ))}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            borderTop: '1px solid #f0f0f0',
            marginTop: 14,
            paddingTop: 12,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(project.id);
            }}
            style={{
              borderRadius: 6,
              background: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
          >
            Details
          </Button>
        </div>
      </Card>
    </Col>
  );

  // ----- List Row -----
  const renderListRow = (project: any) => (
    <Card
      key={project.id}
      size="small"
      hoverable
      style={{ borderRadius: 10, marginBottom: 10, cursor: 'pointer' }}
      styles={{ body: { padding: '12px 20px' } }}
      onClick={() => navigate(`/new-project/add?id=${project.id}`)}
    >
      <Row align="middle" gutter={16}>
        {/* Thumbnail */}
        <Col flex="none" onClick={(e) => e.stopPropagation()}>
          {renderThumbnail(project.media_urls)}
        </Col>

        {/* Name */}
        <Col xs={24} sm={5} md={4}>
          <Text strong style={{ fontSize: 14 }}>
            {project.name}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {project.title || project.id?.slice(0, 8)}
          </Text>
        </Col>

        {/* Location */}
        <Col xs={12} sm={4} md={3}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            Location
          </Text>
          <Text style={{ fontSize: 13 }}>
            {project.city || project.area_id || '-'}
          </Text>
        </Col>

        {/* Developer */}
        <Col xs={12} sm={4} md={3}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            Developer
          </Text>
          <Text style={{ fontSize: 13 }}>
            {developerMap.get(project.developer_id) || 'Unknown'}
          </Text>
        </Col>

        {/* Property Types */}
        <Col xs={12} sm={3} md={3}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            Type
          </Text>
          {renderPropertyTypes(project.property_types)}
        </Col>

        {/* Completion Status */}
        <Col xs={12} sm={3} md={2}>
          {project.completion_status && (
            <Tag
              color={
                COMPLETION_STATUS_COLOR_MAP[project.completion_status] ||
                'default'
              }
              style={{ borderRadius: 4 }}
            >
              {formatStatusLabel(project.completion_status)}
            </Tag>
          )}
        </Col>

        {/* Starting Price */}
        <Col xs={12} sm={3} md={2}>
          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
            Price
          </Text>
          <Text style={{ fontSize: 13 }}>
            {formatPrice(project.starting_price)}
          </Text>
        </Col>

        {/* Agent */}
        <Col xs={12} sm={3} md={2}>
          <Tooltip title={agentMap.get(project.agent_id) || 'Unassigned'}>
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{ background: '#e6f7ff', color: '#1890ff' }}
            />
          </Tooltip>
        </Col>

        {/* Status */}
        <Col xs={12} sm={2} md={2}>
          <Badge
            status={
              project.status === 'active'
                ? 'success'
                : project.status === 'pool'
                  ? 'processing'
                  : 'error'
            }
            text={
              <Text style={{ fontSize: 12 }}>
                {formatStatusLabel(project.status || '')}
              </Text>
            }
          />
        </Col>

        {/* Date + Actions */}
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Space>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formatDate(project.created_at)}
            </Text>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(project.id);
              }}
              style={{
                borderRadius: 6,
                background: PRIMARY_COLOR,
                borderColor: PRIMARY_COLOR,
              }}
            >
              Details
            </Button>
            <Dropdown
              menu={{ items: getActionMenuItems(project) }}
              trigger={['click']}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Dropdown>
          </Space>
        </Col>
      </Row>
    </Card>
  );

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
              placeholder="Search projects..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              allowClear
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Developer"
              allowClear
              showSearch
              optionFilterProp="label"
              value={filters.developer}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, developer: value }))
              }
              options={developerOptions}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Status"
              allowClear
              value={filters.status}
              onChange={(value) =>
                setFilters((prev) => ({ ...prev, status: value }))
              }
              options={STATUS_OPTIONS}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Completion"
              allowClear
              value={filters.completionStatus}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  completionStatus: value,
                }))
              }
              options={COMPLETION_STATUS_OPTIONS}
              style={{ width: '100%' }}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
          <Col flex="auto" />
          <Col>
            <Space size={4}>
              <Tooltip title="Grid View">
                <Button
                  type={viewMode === 'grid' ? 'primary' : 'default'}
                  icon={<AppstoreOutlined />}
                  onClick={() => setViewMode('grid')}
                  style={
                    viewMode === 'grid'
                      ? {
                          background: PRIMARY_COLOR,
                          borderColor: PRIMARY_COLOR,
                        }
                      : {}
                  }
                />
              </Tooltip>
              <Tooltip title="List View">
                <Button
                  type={viewMode === 'list' ? 'primary' : 'default'}
                  icon={<UnorderedListOutlined />}
                  onClick={() => setViewMode('list')}
                  style={
                    viewMode === 'list'
                      ? {
                          background: PRIMARY_COLOR,
                          borderColor: PRIMARY_COLOR,
                        }
                      : {}
                  }
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Project Count */}
      <div style={{ marginBottom: 12 }}>
        <Text type="secondary" style={{ fontSize: 13 }}>
          Showing {filteredProjects.length} project
          {filteredProjects.length !== 1 ? 's' : ''}
        </Text>
      </div>

      {/* Loading Spinner */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Spin size="large" tip="Loading projects..." />
        </div>
      )}

      {/* Projects - Grid View */}
      {!loading && viewMode === 'grid' && (
        <Row gutter={[16, 16]}>
          {filteredProjects.map(renderGridCard)}
        </Row>
      )}

      {/* Projects - List View */}
      {!loading && viewMode === 'list' && (
        <div>{filteredProjects.map(renderListRow)}</div>
      )}

      {/* Empty State */}
      {!loading && filteredProjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <AppstoreOutlined
            style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }}
          />
          <div>
            <Text type="secondary">
              No projects found matching your filters.
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
