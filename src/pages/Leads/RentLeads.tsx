import React, { useState, useMemo, useEffect } from 'react';
import {
  Input,
  Select,
  DatePicker,
  Button,
  Tabs,
  Tag,
  Badge,
  Card,
  Row,
  Col,
  Radio,
  Table,
  Pagination,
  Avatar,
  Space,
  Tooltip,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  ColumnWidthOutlined,
  SortAscendingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { Lead, User, Team } from '../../types';
import { leadsService, teamsService, profilesService } from '../../services/supabaseService';
import { supabaseLeadToLead, supabaseTeamToTeam, profileToUser, mapUIStatusToSupabase } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;

type ViewMode = 'card' | 'table' | 'kanban';

const RentLeads: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string | undefined>(undefined);
  const [selectedUser, setSelectedUser] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [goToPage, setGoToPage] = useState('');

  // Data state
  const [rentLeads, setRentLeads] = useState<Lead[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leadsRes, teamsRes, profilesRes] = await Promise.all([
          leadsService.getRentLeads(),
          teamsService.getAll(),
          profilesService.getAll(),
        ]);

        if (leadsRes.data) {
          setRentLeads(leadsRes.data.map((l: any) => supabaseLeadToLead(l)));
        }
        if (teamsRes.data) {
          setTeams(teamsRes.data.map((t: any) => supabaseTeamToTeam(t)));
        }
        if (profilesRes.data) {
          setUsers(profilesRes.data.map((p: any) => profileToUser(p)));
        }
      } catch (error) {
        console.error('Error fetching rent leads data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter by search text
  const filteredBySearch = useMemo(() => {
    if (!searchText) return rentLeads;
    const lower = searchText.toLowerCase();
    return rentLeads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(lower) ||
        lead.id.toLowerCase().includes(lower) ||
        (lead.phone && lead.phone.includes(searchText))
    );
  }, [rentLeads, searchText]);

  // Filter by team
  const filteredByTeam = useMemo(() => {
    if (!selectedTeam) return filteredBySearch;
    const team = teams.find((t) => t.id === selectedTeam);
    if (!team || !team.members) return filteredBySearch;
    const memberIds = team.members.map((m) => m.id);
    return filteredBySearch.filter((lead) => lead.agent_id && memberIds.includes(lead.agent_id));
  }, [filteredBySearch, selectedTeam, teams]);

  // Filter by user
  const filteredByUser = useMemo(() => {
    if (!selectedUser) return filteredByTeam;
    return filteredByTeam.filter((lead) => lead.agent_id === selectedUser);
  }, [filteredByTeam, selectedUser]);

  // Tab counts
  const activeLeads = filteredByUser.filter((l) => l.status === 'Active');
  const dealLeads = filteredByUser.filter((l) => l.status === 'Deal');
  const poolLeads = filteredByUser.filter((l) => l.status === 'Pool');

  // Select by tab
  const tabLeads = useMemo(() => {
    switch (activeTab) {
      case 'active':
        return activeLeads;
      case 'deal':
        return dealLeads;
      case 'pool':
        return poolLeads;
      default:
        return activeLeads;
    }
  }, [activeTab, activeLeads, dealLeads, poolLeads]);

  // Tag filter
  const allTags = useMemo(() => {
    const tags: Record<string, number> = {};
    tabLeads.forEach((lead) => {
      lead.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });
    return tags;
  }, [tabLeads]);

  const displayedLeads = useMemo(() => {
    if (selectedTag === 'all') return tabLeads;
    return tabLeads.filter((lead) => lead.tags.includes(selectedTag));
  }, [tabLeads, selectedTag]);

  // Pagination
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedLeads.slice(start, start + pageSize);
  }, [displayedLeads, currentPage, pageSize]);

  const handleReset = () => {
    setSearchText('');
    setSelectedTeam(undefined);
    setSelectedUser(undefined);
    setActiveTab('active');
    setSelectedTag('all');
    setCurrentPage(1);
  };

  const handleGoToPage = () => {
    const page = parseInt(goToPage, 10);
    if (page > 0 && page <= Math.ceil(displayedLeads.length / pageSize)) {
      setCurrentPage(page);
    }
    setGoToPage('');
  };

  // Kanban drag and drop state
  const [kanbanLeads, setKanbanLeads] = useState<Lead[]>([]);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);

  // Initialize kanban leads when rentLeads loads
  useEffect(() => {
    setKanbanLeads(rentLeads);
  }, [rentLeads]);

  const handleDragStart = (leadId: string) => {
    setDraggedLead(leadId);
  };

  const handleDrop = async (targetStatus: 'Active' | 'Pool' | 'Deal') => {
    if (!draggedLead) return;
    // Optimistic UI update
    setKanbanLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggedLead ? { ...lead, status: targetStatus } : lead
      )
    );
    // Persist to Supabase
    try {
      await leadsService.updateStatus(draggedLead, mapUIStatusToSupabase(targetStatus));
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
    setDraggedLead(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const getDaysAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return 'N/A';
    if (budget >= 1000000) return `AED ${(budget / 1000000).toFixed(1)}M`;
    if (budget >= 1000) return `AED ${(budget / 1000).toFixed(0)}K`;
    return `AED ${budget}`;
  };

  // -- Render Card View --
  const renderCardView = () => (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      {paginatedLeads.map((lead) => (
        <Col xs={24} sm={12} lg={8} xl={6} key={lead.id}>
          <Card
            size="small"
            style={{
              borderRadius: 8,
              border: '1px solid #f0f0f0',
              height: '100%',
            }}
            bodyStyle={{ padding: 16 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{lead.name}</span>
                {lead.tags.map((tag) => (
                  <Tag
                    key={tag}
                    color={tag === 'VIP' ? 'gold' : 'blue'}
                    style={{ marginLeft: 6, fontSize: 11 }}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
              <span style={{ color: '#999', fontSize: 12, whiteSpace: 'nowrap' }}>
                {getDaysAgo(lead.created_at)} days ago
              </span>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: 13 }}>
              <div>
                <span style={{ color: '#999' }}>Budget: </span>
                <span style={{ fontWeight: 500 }}>{formatBudget(lead.budget)}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Rooms: </span>
                <span style={{ fontWeight: 500 }}>{lead.preferred_rooms || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Size: </span>
                <span style={{ fontWeight: 500 }}>{lead.preferred_size || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Location: </span>
                <span style={{ fontWeight: 500 }}>{lead.preferred_location.join(', ') || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Property: </span>
                <span style={{ fontWeight: 500 }}>{lead.preferred_property_type || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Project: </span>
                <span style={{ fontWeight: 500 }}>{lead.project_type || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Buyer: </span>
                <span style={{ fontWeight: 500 }}>{lead.buyer_type || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Payment: </span>
                <span style={{ fontWeight: 500 }}>{lead.payment_method || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Nationality: </span>
                <span style={{ fontWeight: 500 }}>{lead.nationality || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: '#999' }}>Form: </span>
                <span style={{ fontWeight: 500 }}>{lead.form_name || 'N/A'}</span>
              </div>
            </div>

            {/* Source */}
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <span style={{ color: '#999' }}>Source: </span>
              <Tag color="green" style={{ fontSize: 11 }}>{lead.source_of_lead || 'N/A'}</Tag>
            </div>

            {/* Agent */}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={24} icon={<UserOutlined />} style={{ backgroundColor: '#00C4A1' }} />
              <span style={{ fontSize: 13 }}>{lead.agent?.name || 'Unassigned'}</span>
            </div>

            {/* Keywords */}
            {lead.keywords && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <span style={{ color: '#999' }}>Keywords: </span>
                <span style={{ color: '#666' }}>{lead.keywords}</span>
              </div>
            )}

            {/* Last follow up */}
            {lead.last_follow_up_at && (
              <div style={{ marginTop: 4, fontSize: 12 }}>
                <span style={{ color: '#999' }}>Last follow up: </span>
                <span style={{ color: '#666' }}>{new Date(lead.last_follow_up_at).toLocaleDateString()}</span>
              </div>
            )}

            {/* Details button */}
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Button
                type="primary"
                size="small"
                style={{
                  backgroundColor: '#00C4A1',
                  borderColor: '#00C4A1',
                  borderRadius: 6,
                }}
              >
                Details
              </Button>
            </div>
          </Card>
        </Col>
      ))}
      {paginatedLeads.length === 0 && (
        <Col span={24}>
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            No leads found.
          </div>
        </Col>
      )}
    </Row>
  );

  // -- Render Table View --
  const tableColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Lead) => (
        <Space>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.tags.map((tag) => (
            <Tag key={tag} color={tag === 'VIP' ? 'gold' : 'blue'} style={{ fontSize: 11 }}>
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const colorMap: Record<string, string> = { Active: 'green', Pool: 'orange', Deal: 'blue' };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 130,
      render: (budget: number) => formatBudget(budget),
    },
    {
      title: 'Location',
      dataIndex: 'preferred_location',
      key: 'preferred_location',
      render: (locations: string[]) => locations.join(', '),
    },
    {
      title: 'Property Type',
      dataIndex: 'preferred_property_type',
      key: 'preferred_property_type',
      width: 130,
    },
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      width: 160,
      render: (_: unknown, record: Lead) => (
        <Space>
          <Avatar size={22} icon={<UserOutlined />} style={{ backgroundColor: '#00C4A1' }} />
          <span>{record.agent?.name || 'Unassigned'}</span>
        </Space>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source_of_lead',
      key: 'source_of_lead',
      width: 130,
      render: (source: string) => <Tag color="green">{source}</Tag>,
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: () => (
        <Button
          type="primary"
          size="small"
          style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
        >
          Details
        </Button>
      ),
    },
  ];

  const renderTableView = () => (
    <Table
      columns={tableColumns}
      dataSource={paginatedLeads}
      rowKey="id"
      pagination={false}
      size="middle"
      style={{ marginTop: 16 }}
      scroll={{ x: 1100 }}
    />
  );

  // -- Render Kanban View --
  const kanbanColumns: { title: string; status: 'Active' | 'Pool' | 'Deal'; color: string }[] = [
    { title: 'Active', status: 'Active', color: '#00C4A1' },
    { title: 'Pool', status: 'Pool', color: '#faad14' },
    { title: 'Deal', status: 'Deal', color: '#1890ff' },
  ];

  const renderKanbanView = () => {
    const kanbanRentLeads = kanbanLeads.filter((l) => l.lead_type === 'Rent');
    return (
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 16,
          overflowX: 'auto',
          paddingBottom: 8,
        }}
      >
        {kanbanColumns.map((col) => {
          const colLeads = kanbanRentLeads.filter((l) => l.status === col.status);
          return (
            <div
              key={col.status}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(col.status)}
              style={{
                flex: '1 1 0',
                minWidth: 300,
                backgroundColor: '#fafafa',
                borderRadius: 8,
                padding: 12,
                border: `2px solid ${draggedLead ? col.color + '44' : '#f0f0f0'}`,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Column header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: `2px solid ${col.color}`,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 15, color: '#1a1a1a' }}>{col.title}</span>
                <Badge count={colLeads.length} style={{ backgroundColor: col.color }} />
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 8,
                      padding: 12,
                      border: '1px solid #e8e8e8',
                      cursor: 'grab',
                      boxShadow: draggedLead === lead.id ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.08)',
                      opacity: draggedLead === lead.id ? 0.6 : 1,
                      transition: 'box-shadow 0.2s, opacity 0.2s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{lead.name}</span>
                      <span style={{ color: '#999', fontSize: 11 }}>{lead.id}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      {formatBudget(lead.budget)} | {lead.preferred_rooms || 'N/A'}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                      {lead.preferred_location.join(', ')}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <Avatar size={18} icon={<UserOutlined />} style={{ backgroundColor: '#00C4A1' }} />
                      <span style={{ fontSize: 12, color: '#888' }}>{lead.agent?.name || 'Unassigned'}</span>
                    </div>
                    {lead.tags.map((tag) => (
                      <Tag
                        key={tag}
                        color={tag === 'VIP' ? 'gold' : 'blue'}
                        style={{ fontSize: 10, marginTop: 6 }}
                      >
                        {tag}
                      </Tag>
                    ))}
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 20, color: '#ccc', fontSize: 13 }}>
                    No leads
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', marginTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      {/* Page title */}
      <h2 style={{ margin: 0, marginBottom: 20, fontWeight: 600, fontSize: 22 }}>Rent Leads</h2>

      {/* Filter Bar */}
      <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search by Name, ID or Phone"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 280 }}
            />
          </Col>
          <Col>
            <RangePicker style={{ width: 240 }} />
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
              placeholder="Select User"
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
        onChange={(key) => {
          setActiveTab(key);
          setCurrentPage(1);
        }}
        items={[
          {
            key: 'active',
            label: (
              <span>
                Active Leads <Badge count={activeLeads.length} style={{ backgroundColor: '#00C4A1', marginLeft: 6 }} />
              </span>
            ),
          },
          {
            key: 'deal',
            label: (
              <span>
                Deal Leads <Badge count={dealLeads.length} style={{ backgroundColor: '#1890ff', marginLeft: 6 }} />
              </span>
            ),
          },
          {
            key: 'pool',
            label: (
              <span>
                Leads Pool <Badge count={poolLeads.length} style={{ backgroundColor: '#faad14', marginLeft: 6 }} />
              </span>
            ),
          },
        ]}
      />

      {/* Tag filter + View controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 8,
        }}
      >
        {/* Tag filter */}
        <Space wrap>
          <Button
            type={selectedTag === 'all' ? 'primary' : 'default'}
            size="small"
            onClick={() => setSelectedTag('all')}
            style={
              selectedTag === 'all'
                ? { backgroundColor: '#00C4A1', borderColor: '#00C4A1' }
                : {}
            }
          >
            All
          </Button>
          {Object.entries(allTags).map(([tag, count]) => (
            <Tag
              key={tag}
              color={selectedTag === tag ? '#00C4A1' : undefined}
              style={{
                cursor: 'pointer',
                padding: '2px 10px',
                fontSize: 13,
                borderRadius: 12,
                backgroundColor: selectedTag === tag ? '#00C4A1' : '#f0f5ff',
                color: selectedTag === tag ? '#fff' : '#333',
                border: selectedTag === tag ? '1px solid #00C4A1' : '1px solid #d9d9d9',
              }}
              onClick={() => setSelectedTag(tag)}
            >
              {tag} <Badge count={count} size="small" style={{ backgroundColor: selectedTag === tag ? '#fff' : '#00C4A1', color: selectedTag === tag ? '#00C4A1' : '#fff', marginLeft: 4 }} />
            </Tag>
          ))}
        </Space>

        {/* View switcher + Sort */}
        <Space>
          <Tooltip title="Sort">
            <Button icon={<SortAscendingOutlined />} size="small" />
          </Tooltip>
          <Radio.Group
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            size="small"
            optionType="button"
            buttonStyle="solid"
          >
            <Tooltip title="Card View">
              <Radio.Button value="card">
                <AppstoreOutlined />
              </Radio.Button>
            </Tooltip>
            <Tooltip title="Table View">
              <Radio.Button value="table">
                <UnorderedListOutlined />
              </Radio.Button>
            </Tooltip>
            <Tooltip title="Kanban View">
              <Radio.Button value="kanban">
                <ColumnWidthOutlined />
              </Radio.Button>
            </Tooltip>
          </Radio.Group>
        </Space>
      </div>

      {/* Content */}
      {viewMode === 'card' && renderCardView()}
      {viewMode === 'table' && renderTableView()}
      {viewMode === 'kanban' && renderKanbanView()}

      {/* Pagination (not shown for Kanban) */}
      {viewMode !== 'kanban' && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 20,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span style={{ color: '#666', fontSize: 13 }}>
            Total <strong>{displayedLeads.length}</strong> leads
          </span>
          <Space>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={displayedLeads.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
              size="small"
            />
            <Select
              value={pageSize}
              onChange={(val) => {
                setPageSize(val);
                setCurrentPage(1);
              }}
              size="small"
              style={{ width: 90 }}
              options={[
                { label: '10 / page', value: 10 },
                { label: '20 / page', value: 20 },
                { label: '50 / page', value: 50 },
              ]}
            />
            <Space size={4}>
              <span style={{ fontSize: 13, color: '#666' }}>Go to</span>
              <Input
                size="small"
                style={{ width: 50 }}
                value={goToPage}
                onChange={(e) => setGoToPage(e.target.value)}
                onPressEnter={handleGoToPage}
              />
            </Space>
          </Space>
        </div>
      )}
    </div>
  );
};

export default RentLeads;
