import React, { useState, useMemo, useEffect } from 'react';
import {
  Input,
  Select,
  DatePicker,
  Button,
  Tag,
  Card,
  Row,
  Col,
  Table,
  Pagination,
  Space,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { Lead } from '../../types';
import { leadsService } from '../../services/supabaseService';
import { supabaseLeadToLead } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;

const portalSources = ['Property Finder', 'Bayut', 'Dubizzle'];

const PortalsLeads: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<string | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Data state
  const [portalLeads, setPortalLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const leadsRes = await leadsService.getPortalLeads();

        if (leadsRes.data) {
          setPortalLeads(leadsRes.data.map((l: any) => supabaseLeadToLead(l)));
        }
      } catch (error) {
        console.error('Error fetching portal leads data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter by search text
  const filteredBySearch = useMemo(() => {
    if (!searchText) return portalLeads;
    const lower = searchText.toLowerCase();
    return portalLeads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(lower) ||
        lead.id.toLowerCase().includes(lower) ||
        (lead.phone && lead.phone.includes(searchText)) ||
        (lead.email && lead.email.toLowerCase().includes(lower))
    );
  }, [portalLeads, searchText]);

  // Filter by portal
  const filteredLeads = useMemo(() => {
    if (!selectedPortal) return filteredBySearch;
    return filteredBySearch.filter(
      (lead) =>
        lead.source_of_lead &&
        lead.source_of_lead.toLowerCase() === selectedPortal.toLowerCase()
    );
  }, [filteredBySearch, selectedPortal]);

  // Pagination
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  const handleReset = () => {
    setSearchText('');
    setSelectedPortal(undefined);
    setCurrentPage(1);
  };

  const formatBudget = (budget?: number) => {
    if (!budget) return 'N/A';
    if (budget >= 1000000) return `AED ${(budget / 1000000).toFixed(1)}M`;
    if (budget >= 1000) return `AED ${(budget / 1000).toFixed(0)}K`;
    return `AED ${budget}`;
  };

  const getPortalColor = (source?: string) => {
    if (!source) return 'default';
    switch (source.toLowerCase()) {
      case 'property finder':
        return '#e74c3c';
      case 'bayut':
        return '#3498db';
      case 'dubizzle':
        return '#e67e22';
      default:
        return 'default';
    }
  };

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
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Portal Source',
      dataIndex: 'source_of_lead',
      key: 'source_of_lead',
      width: 150,
      render: (source: string) => (
        <Tag color={getPortalColor(source)} style={{ fontWeight: 500 }}>
          {source}
        </Tag>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string) => phone || 'N/A',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => email || 'N/A',
    },
    {
      title: 'Property Type',
      dataIndex: 'preferred_property_type',
      key: 'preferred_property_type',
      width: 130,
      render: (type: string) => type || 'N/A',
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 130,
      render: (budget: number) => formatBudget(budget),
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
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

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
      <h2 style={{ margin: 0, marginBottom: 20, fontWeight: 600, fontSize: 22 }}>Portals Leads</h2>

      {/* Filter Bar */}
      <Card bodyStyle={{ padding: 16 }} style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search by Name, ID, Phone or Email"
              prefix={<SearchOutlined style={{ color: '#bbb' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ maxWidth: 320 }}
            />
          </Col>
          <Col>
            <RangePicker style={{ width: 240 }} />
          </Col>
          <Col>
            <Select
              placeholder="Filter by Portal"
              allowClear
              value={selectedPortal}
              onChange={(val) => {
                setSelectedPortal(val);
                setCurrentPage(1);
              }}
              style={{ width: 180 }}
              options={portalSources.map((p) => ({ label: p, value: p }))}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              Reset
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Portal summary cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {portalSources.map((portal) => {
          const count = portalLeads.filter(
            (l) => l.source_of_lead && l.source_of_lead.toLowerCase() === portal.toLowerCase()
          ).length;
          return (
            <Col xs={24} sm={8} key={portal}>
              <Card
                size="small"
                style={{
                  borderRadius: 8,
                  borderLeft: `4px solid ${getPortalColor(portal)}`,
                  cursor: 'pointer',
                  backgroundColor: selectedPortal === portal ? '#f6ffed' : '#fff',
                }}
                bodyStyle={{ padding: '12px 16px' }}
                onClick={() => {
                  setSelectedPortal(selectedPortal === portal ? undefined : portal);
                  setCurrentPage(1);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{portal}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 20,
                      color: getPortalColor(portal),
                    }}
                  >
                    {count}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: '#999' }}>leads from this portal</span>
              </Card>
            </Col>
          );
        })}
      </Row>

      {/* Table */}
      <Table
        columns={tableColumns}
        dataSource={paginatedLeads}
        rowKey="id"
        pagination={false}
        size="middle"
        scroll={{ x: 1200 }}
      />

      {/* Pagination */}
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
          Total <strong>{filteredLeads.length}</strong> portal leads
        </span>
        <Space>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={filteredLeads.length}
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
        </Space>
      </div>
    </div>
  );
};

export default PortalsLeads;
