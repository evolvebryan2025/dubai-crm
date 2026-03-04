import React, { useState, useEffect, useCallback } from 'react';
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Table,
  Typography,
  message,
  Divider,
  Descriptions,
  Tooltip,
} from 'antd';
import type { UploadFile } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  InboxOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  TeamOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { newProjectsService, developersService, profilesService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';
import { supabase } from '../../lib/supabase';
import GooglePlacesInput from '../../components/common/GooglePlacesInput';
import type { PlaceResult } from '../../components/common/GooglePlacesInput';
import type { Database } from '../../types/database';

// ----------------------------------------------------------------
// Constants
// ----------------------------------------------------------------
const PRIMARY_COLOR = '#00C4A1';

const { TextArea } = Input;
const { Text, Title } = Typography;
const { Dragger } = Upload;

const PROPERTY_TYPE_OPTIONS = ['Apartment', 'Villa', 'Townhouse', 'Penthouse'] as const;

const COMPLETION_STATUS_OPTIONS = [
  { label: 'Under Construction', value: 'under_construction' },
  { label: 'Near Completion', value: 'near_completion' },
  { label: 'Completed', value: 'completed' },
  { label: 'Off Plan', value: 'off_plan' },
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'active' },
  { label: 'Pool', value: 'pool' },
  { label: 'Sold Out', value: 'sold_out' },
];

const STEP_ITEMS = [
  { title: 'Project Info', icon: <InfoCircleOutlined /> },
  { title: 'Description', icon: <FileTextOutlined /> },
  { title: 'Media', icon: <PictureOutlined /> },
  { title: 'Agent & Status', icon: <TeamOutlined /> },
  { title: 'Review & Save', icon: <CheckCircleOutlined /> },
];

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------
interface PaymentPlanRow {
  key: string;
  description: string;
  percentage: number;
  milestone: string;
}

interface DeveloperOption {
  id: string;
  name: string;
}

interface AgentOption {
  id: string;
  full_name: string;
}

interface ProjectFormData {
  // Step 1 - Project Information
  name: string;
  developer_id: string | undefined;
  area: string;
  city: string;
  property_types: string[];
  starting_price: number | null;
  handover_date: string | null;
  completion_status: string | undefined;
  payment_plan: PaymentPlanRow[];

  // Step 2 - Description
  title: string;
  description: string;
  key_features: string[];

  // Step 3 - Media
  media_files: UploadFile[];
  floor_plan_files: UploadFile[];
  brochure_file: UploadFile[];

  // Step 4 - Agent & Status
  agent_id: string | undefined;
  status: string;
  tags: string[];
}

// ----------------------------------------------------------------
// Initial State
// ----------------------------------------------------------------
const initialFormData: ProjectFormData = {
  name: '',
  developer_id: undefined,
  area: '',
  city: '',
  property_types: [],
  starting_price: null,
  handover_date: null,
  completion_status: undefined,
  payment_plan: [],
  title: '',
  description: '',
  key_features: [],
  media_files: [],
  floor_plan_files: [],
  brochure_file: [],
  agent_id: undefined,
  status: 'pool',
  tags: [],
};

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------
const AddProject: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [saving, setSaving] = useState(false);

  // Loaded data from Supabase
  const [developers, setDevelopers] = useState<DeveloperOption[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loadingDevelopers, setLoadingDevelopers] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // ----------------------------------------------------------------
  // Fetch developers and agents on mount
  // ----------------------------------------------------------------
  useEffect(() => {
    const fetchDevelopers = async () => {
      setLoadingDevelopers(true);
      try {
        const { data, error } = await developersService.getAll();
        if (error) throw error;
        if (data) {
          setDevelopers((data as any[]).map((d) => ({ id: d.id, name: d.name })));
        }
      } catch (err) {
        console.error('Failed to load developers:', err);
        message.error('Failed to load developers');
      } finally {
        setLoadingDevelopers(false);
      }
    };

    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const { data, error } = await profilesService.getAll();
        if (error) throw error;
        if (data) {
          const activeAgents = (data as any[]).filter((p) => p.is_active);
          setAgents(activeAgents.map((a) => ({ id: a.id, full_name: a.full_name })));
        }
      } catch (err) {
        console.error('Failed to load agents:', err);
        message.error('Failed to load agents');
      } finally {
        setLoadingAgents(false);
      }
    };

    fetchDevelopers();
    fetchAgents();
  }, []);

  // ----------------------------------------------------------------
  // Helpers
  // ----------------------------------------------------------------
  const updateField = <K extends keyof ProjectFormData>(
    field: K,
    value: ProjectFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlaceSelect = useCallback((place: PlaceResult) => {
    setFormData((prev) => ({
      ...prev,
      area: place.community || place.area || place.fullAddress,
      city: place.city || 'Dubai',
    }));
  }, []);

  // ----------------------------------------------------------------
  // Payment plan helpers
  // ----------------------------------------------------------------
  const addPaymentRow = () => {
    const newRow: PaymentPlanRow = {
      key: Date.now().toString(),
      description: '',
      percentage: 0,
      milestone: '',
    };
    updateField('payment_plan', [...formData.payment_plan, newRow]);
  };

  const removePaymentRow = (key: string) => {
    updateField(
      'payment_plan',
      formData.payment_plan.filter((r) => r.key !== key),
    );
  };

  const updatePaymentRow = (
    key: string,
    field: keyof PaymentPlanRow,
    value: string | number,
  ) => {
    updateField(
      'payment_plan',
      formData.payment_plan.map((r) =>
        r.key === key ? { ...r, [field]: value } : r,
      ),
    );
  };

  const totalPercentage = formData.payment_plan.reduce(
    (sum, r) => sum + (r.percentage || 0),
    0,
  );

  // ----------------------------------------------------------------
  // Key features helpers
  // ----------------------------------------------------------------
  const addKeyFeature = () => {
    updateField('key_features', [...formData.key_features, '']);
  };

  const removeKeyFeature = (index: number) => {
    updateField(
      'key_features',
      formData.key_features.filter((_, i) => i !== index),
    );
  };

  const updateKeyFeature = (index: number, value: string) => {
    const updated = [...formData.key_features];
    updated[index] = value;
    updateField('key_features', updated);
  };

  // ----------------------------------------------------------------
  // Navigation
  // ----------------------------------------------------------------
  const handleNext = () => {
    if (currentStep === 0 && !formData.name.trim()) {
      message.warning('Please enter the project name.');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = (step: number) => {
    if (step > 0 && !formData.name.trim()) {
      message.warning('Please enter the project name first.');
      return;
    }
    setCurrentStep(step);
  };

  // ----------------------------------------------------------------
  // File upload helpers
  // ----------------------------------------------------------------
  const uploadFilesToStorage = async (
    files: UploadFile[],
    folder: string,
  ): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      if (file.originFileObj) {
        const fileName = `${folder}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('listing-images')
          .upload(fileName, file.originFileObj);
        if (error) {
          console.error(`Upload failed for ${file.name}:`, error);
          continue;
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from('listing-images').getPublicUrl(data.path);
        urls.push(publicUrl);
      }
    }
    return urls;
  };

  // ----------------------------------------------------------------
  // Save handler
  // ----------------------------------------------------------------
  const handleSave = async (statusOverride?: string) => {
    if (!formData.name.trim()) {
      message.error('Project name is required.');
      setCurrentStep(0);
      return;
    }

    setSaving(true);
    try {
      // 1. Upload media files
      const projectSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .slice(0, 40);
      const timestamp = Date.now();
      const folderBase = `projects/${projectSlug}-${timestamp}`;

      const [mediaUrls, floorPlanUrls, brochureUrls] = await Promise.all([
        uploadFilesToStorage(formData.media_files, `${folderBase}/images`),
        uploadFilesToStorage(formData.floor_plan_files, `${folderBase}/floor-plans`),
        uploadFilesToStorage(formData.brochure_file, `${folderBase}/brochure`),
      ]);

      // 2. Build the insert payload
      const finalStatus = statusOverride || formData.status || 'pool';

      const payload: Database['public']['Tables']['new_projects']['Insert'] = {
        name: formData.name.trim(),
        developer_id: formData.developer_id || null,
        area_id: formData.area || null,
        city: formData.city || 'Dubai',
        property_types: formData.property_types as unknown as Database['public']['Tables']['new_projects']['Insert']['property_types'],
        starting_price: formData.starting_price ?? null,
        handover_date: formData.handover_date || null,
        completion_status: formData.completion_status || null,
        payment_plan: formData.payment_plan.map(({ key: _key, ...rest }) => rest) as unknown as Database['public']['Tables']['new_projects']['Insert']['payment_plan'],
        title: formData.title || null,
        description: formData.description || null,
        key_features: formData.key_features.filter((f) => f.trim()) as unknown as Database['public']['Tables']['new_projects']['Insert']['key_features'],
        media_urls: mediaUrls as unknown as Database['public']['Tables']['new_projects']['Insert']['media_urls'],
        floor_plan_urls: floorPlanUrls as unknown as Database['public']['Tables']['new_projects']['Insert']['floor_plan_urls'],
        brochure_url: brochureUrls.length > 0 ? brochureUrls[0] : null,
        agent_id: formData.agent_id || null,
        status: finalStatus,
        tags: formData.tags as unknown as Database['public']['Tables']['new_projects']['Insert']['tags'],
        created_by: user?.id || null,
      };

      // 3. Insert into Supabase
      const { error } = await newProjectsService.create(payload);
      if (error) throw error;

      message.success('Project saved successfully!');
      navigate('/new-project/list');
    } catch (err) {
      console.error('Failed to save project:', err);
      message.error('Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // Step 1 — Project Information
  // ----------------------------------------------------------------
  const paymentPlanColumns: ColumnsType<PaymentPlanRow> = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_: unknown, record: PaymentPlanRow) => (
        <Input
          placeholder="e.g., Down Payment"
          value={record.description}
          onChange={(e) =>
            updatePaymentRow(record.key, 'description', e.target.value)
          }
          size="small"
        />
      ),
    },
    {
      title: 'Percentage (%)',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 140,
      render: (_: unknown, record: PaymentPlanRow) => (
        <InputNumber
          placeholder="%"
          min={0}
          max={100}
          value={record.percentage}
          onChange={(value) =>
            updatePaymentRow(record.key, 'percentage', value ?? 0)
          }
          size="small"
          style={{ width: '100%' }}
          suffix="%"
        />
      ),
    },
    {
      title: 'Date / Milestone',
      dataIndex: 'milestone',
      key: 'milestone',
      width: 200,
      render: (_: unknown, record: PaymentPlanRow) => (
        <Input
          placeholder="e.g., On Booking / Q2 2026"
          value={record.milestone}
          onChange={(e) =>
            updatePaymentRow(record.key, 'milestone', e.target.value)
          }
          size="small"
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 50,
      render: (_: unknown, record: PaymentPlanRow) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePaymentRow(record.key)}
          size="small"
        />
      ),
    },
  ];

  const renderStep1 = () => (
    <div>
      <Title level={5} style={{ marginBottom: 20, color: PRIMARY_COLOR }}>
        <InfoCircleOutlined style={{ marginRight: 8 }} />
        Project Information
      </Title>
      <Row gutter={[24, 16]}>
        {/* Project Name */}
        <Col xs={24} md={12}>
          <Form.Item label="Project Name" required style={{ marginBottom: 16 }}>
            <Input
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              size="large"
            />
          </Form.Item>
        </Col>

        {/* Developer */}
        <Col xs={24} md={12}>
          <Form.Item label="Developer" style={{ marginBottom: 16 }}>
            <Select
              placeholder="Search developer..."
              allowClear
              showSearch
              optionFilterProp="label"
              loading={loadingDevelopers}
              value={formData.developer_id}
              onChange={(value: string | undefined) => updateField('developer_id', value)}
              options={developers.map((d) => ({
                label: d.name,
                value: d.id,
              }))}
              size="large"
            />
          </Form.Item>
        </Col>

        {/* Area / Community */}
        <Col xs={24} md={12}>
          <Form.Item label="Area / Community" style={{ marginBottom: 16 }}>
            <GooglePlacesInput
              value={formData.area}
              onChange={(value) => updateField('area', value)}
              onPlaceSelect={handlePlaceSelect}
              placeholder="Search area or community..."
            />
          </Form.Item>
        </Col>

        {/* City */}
        <Col xs={24} md={12}>
          <Form.Item label="City" style={{ marginBottom: 16 }}>
            <Tooltip title="Auto-filled from area selection. You can also edit manually.">
              <Input
                placeholder="City"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                size="large"
              />
            </Tooltip>
          </Form.Item>
        </Col>

        {/* Property Types Available */}
        <Col xs={24}>
          <Form.Item
            label="Property Types Available"
            style={{ marginBottom: 16 }}
          >
            <Space wrap>
              {PROPERTY_TYPE_OPTIONS.map((pt) => {
                const isSelected = formData.property_types.includes(pt);
                return (
                  <Tag.CheckableTag
                    key={pt}
                    checked={isSelected}
                    onChange={(checked) => {
                      const next = checked
                        ? [...formData.property_types, pt]
                        : formData.property_types.filter((t) => t !== pt);
                      updateField('property_types', next);
                    }}
                    style={{
                      padding: '6px 16px',
                      fontSize: 14,
                      borderRadius: 6,
                      border: `1px solid ${isSelected ? PRIMARY_COLOR : '#d9d9d9'}`,
                      background: isSelected ? PRIMARY_COLOR : '#fff',
                      color: isSelected ? '#fff' : '#595959',
                      cursor: 'pointer',
                    }}
                  >
                    {pt}
                  </Tag.CheckableTag>
                );
              })}
            </Space>
          </Form.Item>
        </Col>

        {/* Starting Price */}
        <Col xs={24} md={8}>
          <Form.Item
            label="Starting Price (AED)"
            style={{ marginBottom: 16 }}
          >
            <InputNumber
              placeholder="e.g. 1,500,000"
              min={0}
              value={formData.starting_price}
              onChange={(value) => updateField('starting_price', value)}
              style={{ width: '100%' }}
              size="large"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) =>
                Number(value?.replace(/,/g, '') ?? 0)
              }
            />
          </Form.Item>
        </Col>

        {/* Handover Date */}
        <Col xs={24} md={8}>
          <Form.Item label="Handover Date" style={{ marginBottom: 16 }}>
            <DatePicker
              picker="month"
              style={{ width: '100%' }}
              size="large"
              placeholder="Select month & year"
              onChange={(_date, dateString) =>
                updateField(
                  'handover_date',
                  typeof dateString === 'string' && dateString
                    ? dateString
                    : null,
                )
              }
            />
          </Form.Item>
        </Col>

        {/* Completion Status */}
        <Col xs={24} md={8}>
          <Form.Item label="Completion Status" style={{ marginBottom: 16 }}>
            <Select
              placeholder="Select status"
              allowClear
              value={formData.completion_status}
              onChange={(value: string | undefined) =>
                updateField('completion_status', value)
              }
              options={COMPLETION_STATUS_OPTIONS}
              size="large"
            />
          </Form.Item>
        </Col>

        {/* Payment Plan */}
        <Col xs={24}>
          <Divider orientation={"left" as any} style={{ color: PRIMARY_COLOR }}>
            Payment Plan
          </Divider>
          <Table<PaymentPlanRow>
            columns={paymentPlanColumns}
            dataSource={formData.payment_plan}
            pagination={false}
            bordered
            size="small"
            locale={{ emptyText: 'No payment plan rows added yet.' }}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addPaymentRow}
            style={{
              width: '100%',
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
            }}
          >
            Add Payment Row
          </Button>

          {formData.payment_plan.length > 0 && (
            <div
              style={{
                marginTop: 16,
                padding: '12px 16px',
                background:
                  totalPercentage === 100 ? '#f6ffed' : '#fffbe6',
                borderRadius: 8,
                border: `1px solid ${totalPercentage === 100 ? '#b7eb8f' : '#ffe58f'}`,
              }}
            >
              <Text type="secondary">Total Percentage: </Text>
              <Text
                strong
                style={{
                  color: totalPercentage === 100 ? '#52c41a' : '#fa8c16',
                }}
              >
                {totalPercentage}%
              </Text>
              {totalPercentage !== 100 && (
                <Text
                  type="secondary"
                  style={{ marginLeft: 12, fontSize: 12 }}
                >
                  (Should total 100%)
                </Text>
              )}
            </div>
          )}
        </Col>
      </Row>
    </div>
  );

  // ----------------------------------------------------------------
  // Step 2 — Description
  // ----------------------------------------------------------------
  const renderStep2 = () => (
    <div>
      <Title level={5} style={{ marginBottom: 20, color: PRIMARY_COLOR }}>
        <FileTextOutlined style={{ marginRight: 8 }} />
        Description
      </Title>
      <Row gutter={[24, 16]}>
        {/* Project Title */}
        <Col xs={24}>
          <Form.Item
            label={
              <span>
                Project Title{' '}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({formData.title.length}/150)
                </Text>
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Input
              placeholder="Enter a compelling project title"
              value={formData.title}
              onChange={(e) => {
                if (e.target.value.length <= 150) {
                  updateField('title', e.target.value);
                }
              }}
              size="large"
              showCount
              maxLength={150}
            />
          </Form.Item>
        </Col>

        {/* Project Description */}
        <Col xs={24}>
          <Form.Item
            label={
              <span>
                Project Description{' '}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({formData.description.length}/2000)
                </Text>
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <TextArea
              rows={6}
              placeholder="Describe the project, its vision, location advantages, amenities..."
              value={formData.description}
              onChange={(e) => {
                if (e.target.value.length <= 2000) {
                  updateField('description', e.target.value);
                }
              }}
              showCount
              maxLength={2000}
            />
          </Form.Item>
        </Col>

        {/* Key Features */}
        <Col xs={24}>
          <Divider orientation={"left" as any} style={{ color: PRIMARY_COLOR }}>
            Key Features
          </Divider>
          {formData.key_features.map((feature, index) => (
            <Row
              key={index}
              gutter={8}
              style={{ marginBottom: 8 }}
              align="middle"
            >
              <Col flex="auto">
                <Input
                  placeholder={`Feature ${index + 1}`}
                  value={feature}
                  onChange={(e) => updateKeyFeature(index, e.target.value)}
                  prefix={
                    <span style={{ color: PRIMARY_COLOR, fontWeight: 600 }}>
                      {'\u2022'}
                    </span>
                  }
                />
              </Col>
              <Col>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removeKeyFeature(index)}
                  size="small"
                />
              </Col>
            </Row>
          ))}
          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={addKeyFeature}
            style={{
              width: '100%',
              borderColor: PRIMARY_COLOR,
              color: PRIMARY_COLOR,
              marginTop: 8,
            }}
          >
            Add Feature
          </Button>
        </Col>
      </Row>
    </div>
  );

  // ----------------------------------------------------------------
  // Step 3 — Media
  // ----------------------------------------------------------------
  const renderStep3 = () => (
    <div>
      <Title level={5} style={{ marginBottom: 20, color: PRIMARY_COLOR }}>
        <PictureOutlined style={{ marginRight: 8 }} />
        Media
      </Title>
      <Row gutter={[24, 24]}>
        {/* Project Images */}
        <Col xs={24}>
          <Form.Item
            label={
              <span>
                Project Images{' '}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  (up to 30 images)
                </Text>
              </span>
            }
            style={{ marginBottom: 16 }}
          >
            <Dragger
              multiple
              accept="image/*"
              fileList={formData.media_files}
              onChange={({ fileList }) => {
                if (fileList.length <= 30) {
                  updateField('media_files', fileList);
                } else {
                  message.warning('Maximum 30 images allowed.');
                }
              }}
              beforeUpload={() => false}
              listType="picture"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: PRIMARY_COLOR, fontSize: 40 }} />
              </p>
              <p className="ant-upload-text">
                Click or drag images to upload
              </p>
              <p className="ant-upload-hint">
                Supports JPG, PNG, WEBP. Up to 30 files.
              </p>
            </Dragger>
            {formData.media_files.length > 0 && (
              <Text
                type="secondary"
                style={{ display: 'block', marginTop: 8, fontSize: 12 }}
              >
                {formData.media_files.length} / 30 images selected
              </Text>
            )}
          </Form.Item>
        </Col>

        {/* Floor Plans */}
        <Col xs={24} md={12}>
          <Form.Item label="Floor Plans (PDF)" style={{ marginBottom: 16 }}>
            <Dragger
              multiple
              accept=".pdf"
              fileList={formData.floor_plan_files}
              onChange={({ fileList }) =>
                updateField('floor_plan_files', fileList)
              }
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: PRIMARY_COLOR, fontSize: 36 }} />
              </p>
              <p className="ant-upload-text">Upload floor plans</p>
              <p className="ant-upload-hint">PDF files</p>
            </Dragger>
          </Form.Item>
        </Col>

        {/* Brochure */}
        <Col xs={24} md={12}>
          <Form.Item label="Brochure (PDF)" style={{ marginBottom: 16 }}>
            <Dragger
              accept=".pdf"
              maxCount={1}
              fileList={formData.brochure_file}
              onChange={({ fileList }) =>
                updateField('brochure_file', fileList)
              }
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: PRIMARY_COLOR, fontSize: 36 }} />
              </p>
              <p className="ant-upload-text">Upload brochure</p>
              <p className="ant-upload-hint">Single PDF file</p>
            </Dragger>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );

  // ----------------------------------------------------------------
  // Step 4 — Agent & Status
  // ----------------------------------------------------------------
  const renderStep4 = () => (
    <div>
      <Title level={5} style={{ marginBottom: 20, color: PRIMARY_COLOR }}>
        <TeamOutlined style={{ marginRight: 8 }} />
        Agent & Status
      </Title>
      <Row gutter={[24, 16]}>
        {/* Assign Agent */}
        <Col xs={24} md={12}>
          <Form.Item label="Assign Agent" style={{ marginBottom: 16 }}>
            <Select
              placeholder="Search agent..."
              allowClear
              showSearch
              optionFilterProp="label"
              loading={loadingAgents}
              value={formData.agent_id}
              onChange={(value: string | undefined) => updateField('agent_id', value)}
              options={agents.map((a) => ({
                label: a.full_name,
                value: a.id,
              }))}
              size="large"
            />
          </Form.Item>
        </Col>

        {/* Status */}
        <Col xs={24} md={12}>
          <Form.Item label="Status" style={{ marginBottom: 16 }}>
            <Select
              placeholder="Select status"
              value={formData.status}
              onChange={(value: string) => updateField('status', value)}
              options={STATUS_OPTIONS}
              size="large"
            />
          </Form.Item>
        </Col>

        {/* Tags */}
        <Col xs={24}>
          <Form.Item label="Tags" style={{ marginBottom: 16 }}>
            <Select
              mode="tags"
              placeholder="Type to add tags..."
              value={formData.tags}
              onChange={(value: string[]) => updateField('tags', value)}
              style={{ width: '100%' }}
              size="large"
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Col>

        {/* Info Note */}
        <Col xs={24}>
          <div
            style={{
              marginTop: 8,
              padding: '16px 20px',
              background: '#f0f9ff',
              border: '1px solid #bae0ff',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <InfoCircleOutlined
              style={{ color: '#1677ff', fontSize: 18, marginTop: 2 }}
            />
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                API Integration
              </Text>
              <Text type="secondary">
                Project data can be synced via Reli API &mdash; API configuration
                available in Admin &gt; Integrations
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  // ----------------------------------------------------------------
  // Step 5 — Review & Save
  // ----------------------------------------------------------------
  const getCompletionStatusLabel = (value: string | undefined): string => {
    if (!value) return '-';
    const found = COMPLETION_STATUS_OPTIONS.find((o) => o.value === value);
    return found?.label ?? value;
  };

  const getStatusLabel = (value: string): string => {
    const found = STATUS_OPTIONS.find((o) => o.value === value);
    return found?.label ?? value;
  };

  const getDeveloperName = (id: string | undefined): string => {
    if (!id) return '-';
    return developers.find((d) => d.id === id)?.name ?? '-';
  };

  const getAgentName = (id: string | undefined): string => {
    if (!id) return '-';
    return agents.find((a) => a.id === id)?.full_name ?? '-';
  };

  const renderStep5 = () => (
    <div>
      <Title level={5} style={{ marginBottom: 20, color: PRIMARY_COLOR }}>
        <CheckCircleOutlined style={{ marginRight: 8 }} />
        Review & Save
      </Title>

      {/* Project Information */}
      <Descriptions
        title="Project Information"
        bordered
        column={{ xs: 1, sm: 2, md: 2 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Project Name">
          {formData.name || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Developer">
          {getDeveloperName(formData.developer_id)}
        </Descriptions.Item>
        <Descriptions.Item label="Area / Community">
          {formData.area || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="City">
          {formData.city || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Property Types">
          {formData.property_types.length > 0 ? (
            <Space wrap>
              {formData.property_types.map((pt) => (
                <Tag key={pt} color={PRIMARY_COLOR}>
                  {pt}
                </Tag>
              ))}
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Starting Price (AED)">
          {formData.starting_price
            ? `AED ${formData.starting_price.toLocaleString()}`
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Handover Date">
          {formData.handover_date || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Completion Status">
          {getCompletionStatusLabel(formData.completion_status)}
        </Descriptions.Item>
      </Descriptions>

      {/* Payment Plan */}
      {formData.payment_plan.length > 0 && (
        <>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Payment Plan
          </Text>
          <Table<PaymentPlanRow>
            columns={[
              { title: 'Description', dataIndex: 'description', key: 'description' },
              {
                title: 'Percentage',
                dataIndex: 'percentage',
                key: 'percentage',
                width: 120,
                render: (val: number) => `${val}%`,
              },
              { title: 'Milestone', dataIndex: 'milestone', key: 'milestone' },
            ]}
            dataSource={formData.payment_plan}
            pagination={false}
            bordered
            size="small"
            style={{ marginBottom: 24 }}
          />
        </>
      )}

      {/* Description */}
      <Descriptions
        title="Description"
        bordered
        column={1}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Title">
          {formData.title || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          {formData.description ? (
            <div style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
              {formData.description}
            </div>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Key Features">
          {formData.key_features.filter((f) => f.trim()).length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {formData.key_features
                .filter((f) => f.trim())
                .map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
            </ul>
          ) : (
            '-'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Media */}
      <Descriptions
        title="Media"
        bordered
        column={{ xs: 1, sm: 2 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Project Images">
          {formData.media_files.length > 0
            ? `${formData.media_files.length} file(s)`
            : 'None'}
        </Descriptions.Item>
        <Descriptions.Item label="Floor Plans">
          {formData.floor_plan_files.length > 0
            ? `${formData.floor_plan_files.length} file(s)`
            : 'None'}
        </Descriptions.Item>
        <Descriptions.Item label="Brochure">
          {formData.brochure_file.length > 0
            ? formData.brochure_file[0]?.name ?? '1 file'
            : 'None'}
        </Descriptions.Item>
      </Descriptions>

      {/* Agent & Status */}
      <Descriptions
        title="Agent & Status"
        bordered
        column={{ xs: 1, sm: 2 }}
        size="small"
        style={{ marginBottom: 24 }}
      >
        <Descriptions.Item label="Assigned Agent">
          {getAgentName(formData.agent_id)}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          {getStatusLabel(formData.status)}
        </Descriptions.Item>
        <Descriptions.Item label="Tags" span={2}>
          {formData.tags.length > 0 ? (
            <Space wrap>
              {formData.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* Action Buttons */}
      <Divider />
      <Row gutter={16} justify="center">
        <Col>
          <Button
            size="large"
            icon={<SaveOutlined />}
            onClick={() => handleSave('pool')}
            loading={saving}
            style={{ borderRadius: 8, minWidth: 180 }}
          >
            Save as Draft
          </Button>
        </Col>
        <Col>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={() => handleSave('active')}
            loading={saving}
            style={{
              background: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
              borderRadius: 8,
              minWidth: 180,
            }}
          >
            Publish Project
          </Button>
        </Col>
      </Row>
    </div>
  );

  // ----------------------------------------------------------------
  // Step content router
  // ----------------------------------------------------------------
  const stepContent: Record<number, React.ReactNode> = {
    0: renderStep1(),
    1: renderStep2(),
    2: renderStep3(),
    3: renderStep4(),
    4: renderStep5(),
  };

  // ----------------------------------------------------------------
  // Progress calculation
  // ----------------------------------------------------------------
  const progressPercent = Math.round(((currentStep + 1) / STEP_ITEMS.length) * 100);

  // ----------------------------------------------------------------
  // Main Render
  // ----------------------------------------------------------------
  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Top Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 20px' } }}
      >
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              Add New Project
            </Title>
          </Col>
          <Col>
            {/* Progress indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 200,
                  height: 6,
                  background: '#f0f0f0',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progressPercent}%`,
                    height: '100%',
                    background: PRIMARY_COLOR,
                    borderRadius: 3,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                {progressPercent}%
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Steps Indicator */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '16px 24px' } }}
      >
        <Steps
          current={currentStep}
          onChange={handleStepClick}
          size="small"
          items={STEP_ITEMS.map((step, index) => ({
            title: step.title,
            icon: (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background:
                    index === currentStep
                      ? PRIMARY_COLOR
                      : index < currentStep
                        ? '#e6fff9'
                        : '#f5f5f5',
                  color:
                    index === currentStep
                      ? '#fff'
                      : index < currentStep
                        ? PRIMARY_COLOR
                        : '#bfbfbf',
                  fontSize: 16,
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
              >
                {step.icon}
              </div>
            ),
          }))}
        />
      </Card>

      {/* Step Content */}
      <Card
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '24px 32px' } }}
      >
        <Form layout="vertical">{stepContent[currentStep]}</Form>
      </Card>

      {/* Navigation Buttons */}
      <Card
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: '12px 20px' } }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handlePrev}
              disabled={currentStep === 0}
              size="large"
              style={{ borderRadius: 8 }}
            >
              Previous
            </Button>
          </Col>
          <Col>
            <Text type="secondary">
              Step {currentStep + 1} of {STEP_ITEMS.length}
            </Text>
          </Col>
          <Col>
            {currentStep < 4 ? (
              <Button
                type="primary"
                onClick={handleNext}
                size="large"
                style={{
                  background: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR,
                  borderRadius: 8,
                }}
              >
                Next
                <ArrowRightOutlined />
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleSave('active')}
                loading={saving}
                size="large"
                style={{
                  background: PRIMARY_COLOR,
                  borderColor: PRIMARY_COLOR,
                  borderRadius: 8,
                }}
              >
                Publish Project
              </Button>
            )}
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default AddProject;
