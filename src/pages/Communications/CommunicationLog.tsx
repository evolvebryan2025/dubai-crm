import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Tabs,
  Badge,
  Select,
  DatePicker,
  Button,
  Input,
  Space,
  Avatar,
  Spin,
  Empty,
  Statistic,
} from 'antd';
import {
  PhoneOutlined,
  MessageOutlined,
  WhatsAppOutlined,
  MailOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import { callLogsService, messagesService, profilesService, teamsService } from '../../services/supabaseService';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface CommunicationItem {
  id: string;
  type: 'call' | 'whatsapp' | 'sms' | 'email';
  direction: 'inbound' | 'outbound';
  agentName: string;
  agentId: string;
  contactName: string;
  contactPhone: string;
  status: string;
  content?: string;
  duration?: number;
  created_at: string;
}

const CommunicationLog: React.FC = () => {
  const navigate = useNavigate();

  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'whatsapp' | 'sms' | 'email'>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [selectedDirection, setSelectedDirection] = useState<'inbound' | 'outbound' | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const safeQuery = async (query: PromiseLike<any>) => {
        try { return await query; } catch { return { data: [] }; }
      };
      const [callLogsRes, messagesRes, profilesRes, teamsRes] = await Promise.all([
        safeQuery(callLogsService.getAll()),
        safeQuery(messagesService.getAll()),
        safeQuery(profilesService.getAll()),
        safeQuery(teamsService.getAll()),
      ]);
      setCallLogs(callLogsRes?.data || []);
      setMessages(messagesRes?.data || []);
      setAgents(profilesRes?.data || []);
      setTeams(teamsRes?.data || []);
    } catch (err) {
      console.error('Error fetching communication data:', err);
      setCallLogs([]);
      setMessages([]);
      setAgents([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const unifiedData = useMemo<CommunicationItem[]>(() => {
    const mappedCalls: CommunicationItem[] = (callLogs || []).map((call: any) => ({
      id: call.id,
      type: 'call' as const,
      direction: call.direction || 'outbound',
      agentName: call.agent_name || call.agentName || 'Unknown',
      agentId: call.agent_id || call.agentId || '',
      contactName: call.contact_name || call.contactName || 'Unknown',
      contactPhone: call.contact_phone || call.contactPhone || call.phone || '',
      status: call.status || 'unknown',
      content: undefined,
      duration: call.duration || 0,
      created_at: call.created_at || call.createdAt || '',
    }));

    const mappedMessages: CommunicationItem[] = (messages || []).map((msg: any) => ({
      id: msg.id,
      type: (msg.channel || msg.type || 'sms') as 'whatsapp' | 'sms' | 'email',
      direction: msg.direction || 'outbound',
      agentName: msg.agent_name || msg.agentName || 'Unknown',
      agentId: msg.agent_id || msg.agentId || '',
      contactName: msg.contact_name || msg.contactName || 'Unknown',
      contactPhone: msg.contact_phone || msg.contactPhone || msg.phone || '',
      status: msg.status || 'sent',
      content: msg.content || msg.body || msg.message || '',
      duration: undefined,
      created_at: msg.created_at || msg.createdAt || '',
    }));

    return [...mappedCalls, ...mappedMessages].sort(
      (a, b) => dayjs(b.created_at).valueOf() - dayjs(a.created_at).valueOf()
    );
  }, [callLogs, messages]);

  const filteredData = useMemo(() => {
    let data = unifiedData;

    if (activeTab !== 'all') {
      if (activeTab === 'calls') {
        data = data.filter((item) => item.type === 'call');
      } else {
        data = data.filter((item) => item.type === activeTab);
      }
    }

    if (searchText) {
      const lower = searchText.toLowerCase();
      data = data.filter(
        (item) =>
          item.contactName.toLowerCase().includes(lower) ||
          item.contactPhone.toLowerCase().includes(lower)
      );
    }

    if (selectedAgent) {
      data = data.filter((item) => item.agentId === selectedAgent || item.agentName === selectedAgent);
    }

    if (selectedDirection) {
      data = data.filter((item) => item.direction === selectedDirection);
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      const start = dateRange[0].startOf('day');
      const end = dateRange[1].endOf('day');
      data = data.filter((item) => {
        const d = dayjs(item.created_at);
        return d.isAfter(start) && d.isBefore(end);
      });
    }

    return data;
  }, [unifiedData, activeTab, searchText, selectedAgent, selectedDirection, dateRange]);

  const counts = useMemo(() => {
    const callCount = unifiedData.filter((i) => i.type === 'call').length;
    const whatsappCount = unifiedData.filter((i) => i.type === 'whatsapp').length;
    const smsCount = unifiedData.filter((i) => i.type === 'sms').length;
    const emailCount = unifiedData.filter((i) => i.type === 'email').length;
    return {
      total: unifiedData.length,
      calls: callCount,
      whatsapp: whatsappCount,
      sms: smsCount,
      email: emailCount,
    };
  }, [unifiedData]);

  const resetFilters = () => {
    setSearchText('');
    setSelectedAgent(undefined);
    setSelectedDirection(undefined);
    setDateRange(null);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneOutlined style={{ color: '#1890ff', fontSize: 16 }} />;
      case 'whatsapp':
        return <WhatsAppOutlined style={{ color: '#25D366', fontSize: 16 }} />;
      case 'email':
        return <MailOutlined style={{ color: '#faad14', fontSize: 16 }} />;
      case 'sms':
      default:
        return <MessageOutlined style={{ color: '#722ed1', fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'answered':
      case 'read':
        return 'green';
      case 'missed':
      case 'failed':
        return 'red';
      case 'sent':
        return 'blue';
      case 'delivered':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 70,
      render: (type: string) => getTypeIcon(type),
    },
    {
      title: 'Direction',
      dataIndex: 'direction',
      key: 'direction',
      width: 100,
      render: (direction: string) =>
        direction === 'outbound' ? (
          <Space>
            <ArrowUpOutlined style={{ color: '#52c41a' }} />
            <Text style={{ color: '#52c41a' }}>Out</Text>
          </Space>
        ) : (
          <Space>
            <ArrowDownOutlined style={{ color: '#1890ff' }} />
            <Text style={{ color: '#1890ff' }}>In</Text>
          </Space>
        ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 200,
      render: (_: any, record: CommunicationItem) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <div>
            <div><Text strong>{record.contactName}</Text></div>
            <div><Text type="secondary" style={{ fontSize: 12 }}>{record.contactPhone}</Text></div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Agent',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 150,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status?.toUpperCase() || 'UNKNOWN'}</Tag>
      ),
    },
    {
      title: 'Content / Notes',
      key: 'content',
      width: 220,
      render: (_: any, record: CommunicationItem) => {
        if (record.type === 'call') {
          return <Text type="secondary">Duration: {formatDuration(record.duration || 0)}</Text>;
        }
        if (record.content) {
          return (
            <Text type="secondary" ellipsis>
              {record.content.length > 50 ? `${record.content.slice(0, 50)}...` : record.content}
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Date / Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 170,
      sorter: (a: CommunicationItem, b: CommunicationItem) =>
        dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      defaultSortOrder: 'descend' as const,
      render: (date: string) =>
        date ? dayjs(date).format('DD MMM YYYY HH:mm') : '-',
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All <Badge count={counts.total} style={{ marginLeft: 6, backgroundColor: '#00C4A1' }} />
        </span>
      ),
    },
    {
      key: 'calls',
      label: (
        <span>
          <PhoneOutlined /> Calls <Badge count={counts.calls} style={{ marginLeft: 6, backgroundColor: '#1890ff' }} />
        </span>
      ),
    },
    {
      key: 'whatsapp',
      label: (
        <span>
          <WhatsAppOutlined /> WhatsApp <Badge count={counts.whatsapp} style={{ marginLeft: 6, backgroundColor: '#25D366' }} />
        </span>
      ),
    },
    {
      key: 'sms',
      label: (
        <span>
          <MessageOutlined /> SMS <Badge count={counts.sms} style={{ marginLeft: 6, backgroundColor: '#722ed1' }} />
        </span>
      ),
    },
    {
      key: 'email',
      label: (
        <span>
          <MailOutlined /> Email <Badge count={counts.email} style={{ marginLeft: 6, backgroundColor: '#faad14' }} />
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="Loading communications..." />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Communication Log</Title>
          <Text type="secondary">All calls and messages in one unified view</Text>
        </Col>
        <Col>
          <Button icon={<ReloadOutlined />} onClick={fetchData} style={{ borderRadius: 8 }}>
            Refresh
          </Button>
        </Col>
      </Row>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Total Communications"
              value={counts.total}
              valueStyle={{ color: '#00C4A1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Calls"
              value={counts.calls}
              prefix={<PhoneOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="WhatsApp Messages"
              value={counts.whatsapp}
              prefix={<WhatsAppOutlined />}
              valueStyle={{ color: '#25D366' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card style={{ borderRadius: 12, textAlign: 'center' }}>
            <Statistic
              title="Emails"
              value={counts.email}
              prefix={<MailOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Card style={{ borderRadius: 12, marginBottom: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as typeof activeTab)}
          items={tabItems}
        />

        {/* Filter Bar */}
        <Space wrap style={{ marginBottom: 16, width: '100%' }}>
          <Input
            placeholder="Search contact name or phone..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250, borderRadius: 8 }}
            allowClear
          />
          <Select
            placeholder="Select Agent"
            value={selectedAgent}
            onChange={(val) => setSelectedAgent(val)}
            style={{ width: 180 }}
            allowClear
          >
            {agents.map((agent: any) => (
              <Select.Option key={agent.id} value={agent.id}>
                {agent.full_name || agent.fullName || agent.name || agent.email || 'Agent'}
              </Select.Option>
            ))}
          </Select>
          <Select
            placeholder="Direction"
            value={selectedDirection}
            onChange={(val) => setSelectedDirection(val)}
            style={{ width: 140 }}
            allowClear
          >
            <Select.Option value="inbound">Inbound</Select.Option>
            <Select.Option value="outbound">Outbound</Select.Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
            style={{ borderRadius: 8 }}
          />
          <Button onClick={resetFilters} icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>
            Reset
          </Button>
        </Space>

        {/* Table */}
        {filteredData.length === 0 && !loading ? (
          <Empty
            description="No communications found"
            style={{ padding: 40 }}
          />
        ) : (
          <Table
            dataSource={filteredData}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
            }}
            size="middle"
            scroll={{ x: 1000 }}
          />
        )}
      </Card>
    </div>
  );
};

export default CommunicationLog;
