import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Button,
  Form,
  Typography,
  Space,
  Divider,
  message,
} from 'antd';
import {
  SwapOutlined,
  TeamOutlined,
  HomeOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  FileOutlined,
  PlusOutlined,
  InboxOutlined,
  SaveOutlined,
  DeleteOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload';
import { useNavigate } from 'react-router-dom';
import { profilesService, leadsService, transactionsService } from '../../services/supabaseService';
import { profileToUser, supabaseLeadToLead } from '../../utils/typeAdapters';
import { useAuthStore } from '../../stores/useAuthStore';
import type { User, Lead } from '../../types';

const { Title, Text } = Typography;
const { Dragger } = Upload;

interface AgentCommissionRow {
  key: string;
  agent_name: string;
  role: string;
  percentage: number;
  amount: number;
}

const PROPERTY_TYPES = [
  { label: 'Apartment', value: 'Apartment' },
  { label: 'Villa', value: 'Villa' },
  { label: 'Penthouse', value: 'Penthouse' },
  { label: 'Townhouse', value: 'Townhouse' },
  { label: 'Office', value: 'Office' },
];

const BEDROOM_OPTIONS = [
  { label: 'Studio', value: 0 },
  { label: '1', value: 1 },
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 },
];

const PURPOSE_OPTIONS = [
  { label: 'New Project', value: 'New Project' },
  { label: 'Sell', value: 'Sell' },
  { label: 'Rent', value: 'Rent' },
];

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
  <Space>
    <span style={{ color: '#00C4A1', fontSize: 18 }}>{icon}</span>
    <Title level={5} style={{ margin: 0 }}>{title}</Title>
  </Space>
);

const MOCK_DEVELOPERS = [
  { id: '1', name: 'Emaar Properties' },
  { id: '2', name: 'DAMAC Properties' },
  { id: '3', name: 'Sobha Realty' },
  { id: '4', name: 'Binghatti' },
  { id: '5', name: 'Aldar Properties' },
  { id: '6', name: 'Ellington Properties' },
  { id: '7', name: 'Meraas' },
  { id: '8', name: 'Nshama' },
];

const AddTransaction: React.FC = () => {
  const [form] = Form.useForm();
  const [agentRows, setAgentRows] = useState<AgentCommissionRow[]>([
    { key: '1', agent_name: '', role: '', percentage: 0, amount: 0 },
  ]);
  const [pictureFileList, setPictureFileList] = useState<UploadFile[]>([]);
  const [docFileList, setDocFileList] = useState<UploadFile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesRes, leadsRes] = await Promise.all([
          profilesService.getAll(),
          leadsService.getAll(),
        ]);
        if (profilesRes.data) setUsers(profilesRes.data.map(profileToUser));
        if (leadsRes.data) setLeads(leadsRes.data.map(supabaseLeadToLead));
      } catch {
        message.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDealPriceChange = (value: number | null) => {
    const pct = form.getFieldValue('commission_total_percentage') || 0;
    if (value && pct) {
      form.setFieldValue('commission_total_amount', (value * pct) / 100);
    }
  };

  const handleCommissionPercentageChange = (value: number | null) => {
    const dealPrice = form.getFieldValue('deal_price') || 0;
    if (value && dealPrice) {
      form.setFieldValue('commission_total_amount', (dealPrice * value) / 100);
    }
  };

  const handleAddAgentRow = () => {
    const newRow: AgentCommissionRow = {
      key: String(Date.now()),
      agent_name: '',
      role: '',
      percentage: 0,
      amount: 0,
    };
    setAgentRows([...agentRows, newRow]);
  };

  const handleRemoveAgentRow = (key: string) => {
    if (agentRows.length <= 1) return;
    setAgentRows(agentRows.filter((r) => r.key !== key));
  };

  const handleAgentRowChange = (
    key: string,
    field: keyof AgentCommissionRow,
    value: string | number,
  ) => {
    setAgentRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const updated = { ...r, [field]: value };
        // auto-calculate amount if percentage changes
        if (field === 'percentage') {
          const totalCommission = form.getFieldValue('commission_total_amount') || 0;
          updated.amount = (totalCommission * (value as number)) / 100;
        }
        return updated;
      }),
    );
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { error } = await transactionsService.create({
        type: values.purpose === 'Sell' || values.purpose === 'New Project' ? 'sale' : 'rent',
        deal_date: values.deal_date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
        agent_id: values.agent_id || user?.id || '',
        lead_id: values.lead_id || null,
        deal_value: values.deal_price || 0,
        commission_pct: values.commission_total_percentage || null,
        commission_amount: values.commission_total_amount || 0,
        status: 'pending',
        created_by: user?.id || '',
      });
      if (error) throw error;
      message.success('Transaction created successfully!');
      navigate('/transactions');
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('Please fill all required fields');
      } else {
        message.error(err?.message || 'Failed to create transaction.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Top bar with save button */}
      <Row justify="end" style={{ marginBottom: 16 }}>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            onClick={handleSave}
            style={{
              backgroundColor: '#00C4A1',
              borderColor: '#00C4A1',
              fontWeight: 600,
            }}
          >
            Save Transaction
          </Button>
        </Col>
      </Row>

      <Form
        form={form}
        layout="vertical"
        requiredMark={(label, { required }) => (
          <>
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
          </>
        )}
      >
        {/* ============================================================
            SECTION: TYPE
            ============================================================ */}
        <Card
          title={<SectionTitle icon={<SwapOutlined />} title="Type" />}
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Purpose"
                name="purpose"
                rules={[{ required: true, message: 'Please select a purpose' }]}
              >
                <Select placeholder="Select purpose" options={PURPOSE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Deal Date"
                name="deal_date"
                rules={[{ required: true, message: 'Please select a deal date' }]}
              >
                <DatePicker
                  showTime
                  style={{ width: '100%' }}
                  placeholder="Select deal date and time"
                  format="DD/MM/YYYY HH:mm"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Agent" name="agent_id">
                <Select
                  placeholder="Select agent"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={users.map((u) => ({
                    label: u.name,
                    value: u.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ============================================================
            SECTION: LEADS
            ============================================================ */}
        <Card
          title={<SectionTitle icon={<TeamOutlined />} title="Leads" />}
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Buy Lead"
                name="lead_id"
                rules={[{ required: true, message: 'Please select a lead' }]}
              >
                <Select
                  placeholder="Search for a lead..."
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={leads.map((l) => ({
                    label: `${l.name} (${l.id})`,
                    value: l.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ============================================================
            SECTION: PROPERTY
            ============================================================ */}
        <Card
          title={<SectionTitle icon={<HomeOutlined />} title="Property" />}
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item label="Developer" name="developer_id">
                <Select
                  placeholder="Select developer"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={MOCK_DEVELOPERS.map((d) => ({
                    label: d.name,
                    value: d.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Property Type"
                name="property_type"
                rules={[{ required: true, message: 'Please select property type' }]}
              >
                <Select placeholder="Select property type" options={PROPERTY_TYPES} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Unit Number" name="unit_number">
                <Input placeholder="Enter unit number" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Picture" name="picture">
                <Upload
                  listType="picture-card"
                  fileList={pictureFileList}
                  onChange={({ fileList }) => setPictureFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  {pictureFileList.length < 1 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Project Name" name="project_name">
                <Input placeholder="Enter project name" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Property Address" name="property_address">
                <Input placeholder="Community / Area / City" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Deal Price"
                name="deal_price"
                rules={[{ required: true, message: 'Please enter deal price' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="AED"
                  placeholder="0"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
                  onChange={handleDealPriceChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Bedrooms" name="bedrooms">
                <Select placeholder="Select bedrooms" options={BEDROOM_OPTIONS} allowClear />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ============================================================
            SECTION: COMMISSION DETAILS
            ============================================================ */}
        <Card
          title={<SectionTitle icon={<DollarOutlined />} title="Commission Details" />}
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          {/* Total Commission Row */}
          <Row gutter={24} align="middle" style={{ marginBottom: 16 }}>
            <Col xs={24} md={8}>
              <Form.Item label="Commission %" name="commission_total_percentage" style={{ marginBottom: 0 }}>
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  placeholder="0"
                  addonAfter="%"
                  onChange={handleCommissionPercentageChange}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Total Commission" name="commission_total_amount" style={{ marginBottom: 0 }}>
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="AED"
                  placeholder="Auto-calculated"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="VAT" name="vat" style={{ marginBottom: 0 }}>
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="AED"
                  placeholder="0"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '16px 0' }} />

          {/* Agent Commission Rows */}
          <Text strong style={{ display: 'block', marginBottom: 12 }}>
            Agent Commissions
          </Text>

          {agentRows.map((row) => (
            <Row
              gutter={[12, 12]}
              key={row.key}
              align="middle"
              style={{
                marginBottom: 12,
                background: '#fafafa',
                padding: '12px 8px',
                borderRadius: 8,
              }}
            >
              <Col xs={24} sm={6}>
                <Input
                  placeholder="Agent name"
                  prefix={<UserOutlined />}
                  value={row.agent_name}
                  onChange={(e) =>
                    handleAgentRowChange(row.key, 'agent_name', e.target.value)
                  }
                />
              </Col>
              <Col xs={24} sm={6}>
                <Input
                  placeholder="Role"
                  value={row.role}
                  onChange={(e) =>
                    handleAgentRowChange(row.key, 'role', e.target.value)
                  }
                />
              </Col>
              <Col xs={24} sm={5}>
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0"
                  min={0}
                  max={100}
                  addonAfter="%"
                  value={row.percentage}
                  onChange={(val) =>
                    handleAgentRowChange(row.key, 'percentage', val ?? 0)
                  }
                />
              </Col>
              <Col xs={24} sm={5}>
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="AED"
                  placeholder="0"
                  min={0}
                  value={row.amount}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
                  onChange={(val) =>
                    handleAgentRowChange(row.key, 'amount', val ?? 0)
                  }
                />
              </Col>
              <Col xs={24} sm={2} style={{ textAlign: 'center' }}>
                {agentRows.length > 1 && (
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveAgentRow(row.key)}
                    size="small"
                  />
                )}
              </Col>
            </Row>
          ))}

          <Button
            type="dashed"
            onClick={handleAddAgentRow}
            icon={<PlusOutlined />}
            style={{ width: '100%', marginTop: 8 }}
          >
            + Add Agent
          </Button>
        </Card>

        {/* ============================================================
            SECTION: COMMISSION STATUS
            ============================================================ */}
        <Card
          title={<SectionTitle icon={<CheckCircleOutlined />} title="Commission Status" />}
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          {agentRows.map((row) => (
            <Row
              gutter={[12, 12]}
              key={`status-${row.key}`}
              align="middle"
              style={{
                marginBottom: 12,
                background: '#fafafa',
                padding: '12px 16px',
                borderRadius: 8,
              }}
            >
              <Col xs={12} sm={8}>
                <Text strong>{row.agent_name || `Agent ${row.key}`}</Text>
              </Col>
              <Col xs={12} sm={8}>
                <Text type="secondary">
                  Commission: AED {row.amount.toLocaleString('en-US')}
                </Text>
              </Col>
              <Col xs={24} sm={8}>
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="AED"
                  placeholder="Received amount"
                  min={0}
                  formatter={(value) =>
                    `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
                />
              </Col>
            </Row>
          ))}
        </Card>

        {/* ============================================================
            SECTION: DOCUMENTS
            ============================================================ */}
        <Card
          title={<SectionTitle icon={<FileOutlined />} title="Documents" />}
          style={{ borderRadius: 12, marginBottom: 16 }}
          styles={{ body: { padding: 24 } }}
        >
          <Dragger
            multiple
            fileList={docFileList}
            onChange={({ fileList }) => setDocFileList(fileList)}
            beforeUpload={() => false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: '#00C4A1', fontSize: 48 }} />
            </p>
            <p className="ant-upload-text">
              Click or drag files to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for single or bulk upload. Upload transaction-related documents here.
            </p>
          </Dragger>
        </Card>
      </Form>
    </div>
  );
};

export default AddTransaction;
