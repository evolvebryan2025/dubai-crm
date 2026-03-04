import React, { useState, useEffect, useCallback } from 'react';
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Tag,
  Tooltip,
  message,
  Divider,
  Typography,
  Descriptions,
} from 'antd';
import {
  InboxOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  StarFilled,
  CloseCircleFilled,
  FileTextOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { listingsService, profilesService, developersService } from '../../services/supabaseService';
import { storageService } from '../../services/storageService';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/useAuthStore';
import type { Profile, Developer } from '../../types/database';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title, Text } = Typography;

const PRIMARY_COLOR = '#00C4A1';

const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Office',
  'Retail',
  'Warehouse',
  'Plot',
  'Full Building',
];

const COMPLETION_STATUSES = ['Ready', 'Off Plan', 'Under Construction', 'Completed'];

const BEDROOM_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6+'];

const BATHROOM_OPTIONS = ['1', '2', '3', '4', '5+'];

const LISTING_STATUSES = ['Active', 'Inactive', 'Sold'];

const STEP_ITEMS = [
  { title: 'Information' },
  { title: 'Description' },
  { title: 'Media' },
  { title: 'Portals' },
  { title: 'Review' },
];

// Fields that must be validated per step
const STEP_FIELDS: string[][] = [
  // Step 0: Information
  ['property_type', 'completion_status', 'price'],
  // Step 1: Description
  ['title'],
  // Step 2: Media
  [],
  // Step 3: Portals
  [],
  // Step 4: Review
  [],
];

interface ImageFile {
  uid: string;
  file: File;
  previewUrl: string;
}

interface DocumentFile {
  uid: string;
  file: File;
  name: string;
}

const AddSell: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Data from Supabase
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [agents, setAgents] = useState<Profile[]>([]);

  // Media state
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);

  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Watch permit_number for portal toggle logic
  const permitNumber = Form.useWatch('permit_number', form);

  // Fetch developers and agents on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devResult, agentResult] = await Promise.all([
          developersService.getAll(),
          profilesService.getAll(),
        ]);
        if (devResult.data) {
          setDevelopers(devResult.data);
        }
        if (agentResult.data) {
          const activeAgents = agentResult.data.filter(
            (p: Profile) => p.is_active
          );
          setAgents(activeAgents);
        }
      } catch (err) {
        console.error('Failed to fetch lookup data:', err);
      }
    };
    fetchData();
  }, []);

  // Generate a placeholder listing ID
  const generatedListingId = `DXB-S-${String(Math.floor(10000 + Math.random() * 90000))}`;

  // ---- Navigation ----

  const handleNext = async () => {
    try {
      const fieldsToValidate = STEP_FIELDS[currentStep];
      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    } catch {
      message.warning('Please fill in the required fields before proceeding.');
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepClick = async (step: number) => {
    // Only allow clicking completed (previous) steps or current step
    if (step < currentStep) {
      setCurrentStep(step);
    } else if (step > currentStep) {
      // Validate all steps between current and target
      try {
        for (let i = currentStep; i < step; i++) {
          const fieldsToValidate = STEP_FIELDS[i];
          if (fieldsToValidate.length > 0) {
            await form.validateFields(fieldsToValidate);
          }
        }
        setCurrentStep(step);
      } catch {
        message.warning('Please fill in the required fields in earlier steps first.');
      }
    }
  };

  // ---- Save Logic ----

  const handleSave = async (saveAsDraft: boolean) => {
    try {
      setSaving(true);
      const values = form.getFieldsValue(true);

      // Map bedrooms
      let bedroomsValue: number | null = null;
      if (values.bedrooms === 'Studio') {
        bedroomsValue = 0;
      } else if (values.bedrooms === '6+') {
        bedroomsValue = 6;
      } else if (values.bedrooms) {
        bedroomsValue = parseInt(values.bedrooms, 10);
      }

      // Map bathrooms
      let bathroomsValue: number | null = null;
      if (values.bathrooms === '5+') {
        bathroomsValue = 5;
      } else if (values.bathrooms) {
        bathroomsValue = parseInt(values.bathrooms, 10);
      }

      // Determine status and published flag
      const listingStatus = saveAsDraft ? 'draft' : (values.listing_status?.toLowerCase() || 'active');
      const isPublished = !saveAsDraft;

      // Build portal config
      const publishPortals = {
        property_finder: values.portals?.property_finder ?? false,
        bayut: values.portals?.bayut ?? false,
        dubizzle: values.portals?.dubizzle ?? false,
      };

      // If saving as draft, disable all portals
      if (saveAsDraft) {
        publishPortals.property_finder = false;
        publishPortals.bayut = false;
        publishPortals.dubizzle = false;
      }

      const insertData = {
        title: values.title || 'Untitled Listing',
        type: 'sale' as const,
        property_type: values.property_type,
        area: values.community || '',
        community: values.community || null,
        building_name: values.building_name || null,
        unit_number: values.public_unit_number || null,
        private_unit_number: values.private_unit_number || null,
        floor_number: values.floor_number || null,
        size_sqft: values.size_sqft || null,
        bedrooms: bedroomsValue,
        bathrooms: bathroomsValue,
        developer_id: values.developer_id || null,
        assigned_agent_id: values.assigned_agent_id || user?.id || '',
        permit_number: values.permit_number || null,
        price: values.price || 0,
        description: values.description || null,
        keywords: values.keywords || [],
        status: listingStatus,
        is_published: isPublished,
        publish_portals: publishPortals,
        watermark_enabled: values.watermark_enabled !== false,
        completion_status: values.completion_status || null,
        created_by: user?.id || '',
      };

      const { data: listing, error } = await listingsService.create(insertData as any);
      if (error) throw error;

      // Upload images if any
      const listingId = (listing as any)?.id;
      if (listingId && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          try {
            const imgFile = imageFiles[i];
            const result = await storageService.uploadImage(imgFile.file, listingId);

            await supabase.from('listing_images').insert({
              listing_id: listingId,
              storage_path: result.storagePath,
              url: result.url,
              display_order: i,
              is_primary: i === 0,
              is_watermarked: values.watermark_enabled !== false,
            } as any);
          } catch (uploadErr) {
            console.error(`Failed to upload image ${i}:`, uploadErr);
          }
        }
      }

      message.success(
        saveAsDraft
          ? 'Listing saved as draft successfully!'
          : 'Listing published successfully!'
      );
      navigate('/sell/list');
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('Please complete all required fields.');
      } else {
        message.error(err?.message || 'Failed to create listing.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ---- Image Handling ----

  const handleImageBeforeUpload = useCallback(
    (file: File) => {
      if (imageFiles.length >= 20) {
        message.warning('Maximum 20 images allowed.');
        return false;
      }

      const isAllowed =
        file.type === 'image/jpeg' ||
        file.type === 'image/png' ||
        file.type === 'image/webp';

      if (!isAllowed) {
        message.error('Only JPG, PNG, and WEBP images are accepted.');
        return false;
      }

      const previewUrl = URL.createObjectURL(file);
      const uid = `img-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      setImageFiles((prev) => [...prev, { uid, file, previewUrl }]);

      return false; // Prevent ant upload default behavior
    },
    [imageFiles.length]
  );

  const handleRemoveImage = useCallback((uid: string) => {
    setImageFiles((prev) => {
      const item = prev.find((img) => img.uid === uid);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter((img) => img.uid !== uid);
    });
  }, []);

  // ---- Document Handling ----

  const handleDocBeforeUpload = useCallback((file: File) => {
    if (file.type !== 'application/pdf') {
      message.error('Only PDF files are accepted.');
      return false;
    }

    const uid = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setDocumentFiles((prev) => [...prev, { uid, file, name: file.name }]);

    return false;
  }, []);

  const handleRemoveDocument = useCallback((uid: string) => {
    setDocumentFiles((prev) => prev.filter((doc) => doc.uid !== uid));
  }, []);

  // ---- Helper: get form values for review ----

  const getFormValues = () => form.getFieldsValue(true);

  // ========================================
  // STEP 1 - Information
  // ========================================
  const renderInformation = () => (
    <>
      <Title level={5} style={{ marginBottom: 16 }}>
        Property Details
      </Title>

      {/* Listing ID */}
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label="Listing ID">
            <Input
              value={generatedListingId}
              disabled
              suffix={
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Auto-generated on save
                </Text>
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label="Property Type"
            name="property_type"
            rules={[{ required: true, message: 'Property type is required' }]}
          >
            <Select
              placeholder="Select property type"
              options={PROPERTY_TYPES.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            label={
              <span>
                Completion Status{' '}
                <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>
                  IMPORTANT
                </Tag>
              </span>
            }
            name="completion_status"
            rules={[{ required: true, message: 'Completion status is required' }]}
          >
            <Select
              placeholder="Select completion status"
              options={COMPLETION_STATUSES.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label="Community" name="community">
            <Input placeholder="Search Dubai areas..." />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Building / Project Name" name="building_name">
            <Input placeholder="Enter building or project name" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Public Unit Number" name="public_unit_number">
            <Input placeholder="Visible on portals" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Private Unit Number"
            name="private_unit_number"
            extra={
              <Text type="secondary" style={{ fontSize: 12 }}>
                Internal only - never shown publicly on portals
              </Text>
            }
          >
            <Input placeholder="Internal reference only" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Floor Number" name="floor_number">
            <Input placeholder="e.g. 12" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Size (sqft)" name="size_sqft">
            <InputNumber
              placeholder="0"
              style={{ width: '100%' }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) =>
                Number(value?.replace(/,/g, '') || 0) as any
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Bedrooms" name="bedrooms">
            <Select
              placeholder="Select"
              options={BEDROOM_OPTIONS.map((b) => ({ label: b, value: b }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Bathrooms" name="bathrooms">
            <Select
              placeholder="Select"
              options={BATHROOM_OPTIONS.map((b) => ({ label: b, value: b }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Developer" name="developer_id">
            <Select
              placeholder="Search developer..."
              showSearch
              optionFilterProp="label"
              allowClear
              options={developers.map((d) => ({
                label: d.name,
                value: d.id,
              }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Agent Assignment" name="assigned_agent_id">
            <Select
              placeholder="Assign agent"
              showSearch
              optionFilterProp="label"
              allowClear
              options={agents.map((a) => ({
                label: a.full_name,
                value: a.id,
              }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5} style={{ marginBottom: 16 }}>
        Pricing & Status
      </Title>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Permit Number"
            name="permit_number"
            extra={
              !permitNumber ? (
                <Text type="secondary" style={{ fontSize: 12, color: '#999' }}>
                  Without permit, listing will be saved as draft and cannot be
                  published to portals
                </Text>
              ) : null
            }
          >
            <Input placeholder="Enter permit number" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Price (AED)"
            name="price"
            rules={[{ required: true, message: 'Price is required' }]}
          >
            <InputNumber
              placeholder="0"
              style={{ width: '100%' }}
              min={0}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) =>
                Number(value?.replace(/,/g, '') || 0) as any
              }
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Status" name="listing_status" initialValue="Active">
            <Select
              options={LISTING_STATUSES.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // ========================================
  // STEP 2 - Description
  // ========================================
  const renderDescription = () => {
    const titleValue: string = form.getFieldValue('title') || '';
    const descValue: string = form.getFieldValue('description') || '';

    return (
      <>
        <Title level={5} style={{ marginBottom: 16 }}>
          Listing Title
        </Title>

        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item
              label="Title"
              name="title"
              rules={[{ required: true, message: 'Title is required' }]}
            >
              <Input
                placeholder="Enter listing title"
                maxLength={150}
                onChange={() => form.getFieldValue('title')}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12, marginTop: -20, display: 'block', marginBottom: 16 }}>
              {titleValue.length}/150 characters
            </Text>
          </Col>
        </Row>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>
          Description
        </Title>

        <Row gutter={[16, 0]}>
          <Col xs={24}>
            <Form.Item label="Description" name="description">
              <TextArea
                rows={8}
                placeholder="Enter property description"
                maxLength={2000}
                onChange={() => form.getFieldValue('description')}
              />
            </Form.Item>
            <Text type="secondary" style={{ fontSize: 12, marginTop: -20, display: 'block', marginBottom: 16 }}>
              {descValue.length}/2000 characters
            </Text>
          </Col>
        </Row>

        <Divider />

        <Title level={5} style={{ marginBottom: 16 }}>
          Keywords / Tags
        </Title>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={16}>
            <Form.Item label="Keywords" name="keywords">
              <Select
                mode="tags"
                placeholder="Type and press enter to add tags"
                style={{ width: '100%' }}
                tokenSeparators={[',']}
              />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  };

  // ========================================
  // STEP 3 - Media & Documents
  // ========================================
  const renderMedia = () => (
    <>
      <Title level={5} style={{ marginBottom: 16 }}>
        Property Images
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Drag images to reorder. First image will be the cover photo.
      </Text>

      <Dragger
        accept="image/jpeg,image/png,image/webp"
        multiple
        showUploadList={false}
        beforeUpload={handleImageBeforeUpload as any}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: PRIMARY_COLOR }} />
        </p>
        <p className="ant-upload-text">Click or drag images to upload</p>
        <p className="ant-upload-hint">
          Accepted: JPG, PNG, WEBP | Maximum 20 images
        </p>
      </Dragger>

      {imageFiles.length > 0 && (
        <div style={{ marginTop: 16, marginBottom: 24 }}>
          <Text type="secondary" style={{ marginBottom: 8, display: 'block' }}>
            {imageFiles.length}/20 images selected
          </Text>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            {imageFiles.map((img, idx) => (
              <div
                key={img.uid}
                style={{
                  position: 'relative',
                  width: 100,
                  height: 100,
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: idx === 0 ? `2px solid ${PRIMARY_COLOR}` : '1px solid #d9d9d9',
                }}
              >
                <img
                  src={img.previewUrl}
                  alt={`Upload ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
                {idx === 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      background: PRIMARY_COLOR,
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <StarFilled style={{ color: '#fff', fontSize: 12 }} />
                  </div>
                )}
                <CloseCircleFilled
                  onClick={() => handleRemoveImage(img.uid)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    color: '#ff4d4f',
                    fontSize: 18,
                    cursor: 'pointer',
                    background: '#fff',
                    borderRadius: '50%',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <Row gutter={[16, 0]} style={{ marginTop: 8 }}>
        <Col xs={24} md={8}>
          <Form.Item
            name="watermark_enabled"
            valuePropName="checked"
            initialValue={true}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Switch
                defaultChecked
                onChange={(checked) =>
                  form.setFieldsValue({ watermark_enabled: checked })
                }
              />
              <Text>Apply company watermark</Text>
            </div>
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5} style={{ marginBottom: 16 }}>
        Documents
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Floor Plan, Title Deed, NOC (PDF only)
      </Text>

      <Dragger
        accept=".pdf"
        multiple
        showUploadList={false}
        beforeUpload={handleDocBeforeUpload as any}
        style={{ marginBottom: 16 }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ color: PRIMARY_COLOR }} />
        </p>
        <p className="ant-upload-text">Click or drag documents to upload</p>
        <p className="ant-upload-hint">PDF files only</p>
      </Dragger>

      {documentFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {documentFiles.map((doc) => (
            <div
              key={doc.uid}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #d9d9d9',
                marginBottom: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileTextOutlined style={{ color: PRIMARY_COLOR }} />
                <Text>{doc.name}</Text>
              </div>
              <CloseCircleFilled
                onClick={() => handleRemoveDocument(doc.uid)}
                style={{
                  color: '#ff4d4f',
                  fontSize: 16,
                  cursor: 'pointer',
                }}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  // ========================================
  // STEP 4 - Portals
  // ========================================
  const renderPortals = () => {
    const hasPermit = !!permitNumber && permitNumber.trim() !== '';

    const portals = [
      { key: 'property_finder', abbr: 'PF', name: 'Property Finder' },
      { key: 'bayut', abbr: 'B', name: 'Bayut' },
      { key: 'dubizzle', abbr: 'D', name: 'Dubizzle' },
    ];

    return (
      <>
        <Title level={5} style={{ marginBottom: 8 }}>
          Portal Publishing
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Enable the portals where you want this listing to be published.
        </Text>

        <Row gutter={[16, 16]}>
          {portals.map((portal) => (
            <Col xs={24} sm={12} md={8} key={portal.key}>
              <Card
                hoverable
                styles={{ body: { padding: 24, textAlign: 'center' } }}
              >
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: '#f0f0f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 12px',
                      fontSize: 18,
                      fontWeight: 700,
                      color: '#595959',
                    }}
                  >
                    {portal.abbr}
                  </div>
                  <Text strong style={{ fontSize: 16, display: 'block' }}>
                    {portal.name}
                  </Text>
                </div>

                <Form.Item
                  name={['portals', portal.key]}
                  valuePropName="checked"
                  noStyle
                >
                  {hasPermit ? (
                    <Switch
                      checkedChildren="ON"
                      unCheckedChildren="OFF"
                    />
                  ) : (
                    <Tooltip title="Permit number required to publish to portals">
                      <Switch
                        checkedChildren="ON"
                        unCheckedChildren="OFF"
                        disabled
                      />
                    </Tooltip>
                  )}
                </Form.Item>

                <div style={{ marginTop: 12 }}>
                  <PortalStatusLabel
                    portalKey={portal.key}
                    form={form}
                    hasPermit={hasPermit}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </>
    );
  };

  // ========================================
  // STEP 5 - Review & Save
  // ========================================
  const renderReview = () => {
    const values = getFormValues();

    const getAgentName = (agentId: string | undefined) => {
      if (!agentId) return 'Not assigned';
      const agent = agents.find((a) => a.id === agentId);
      return agent?.full_name || agentId;
    };

    const getDeveloperName = (devId: string | undefined) => {
      if (!devId) return 'Not selected';
      const dev = developers.find((d) => d.id === devId);
      return dev?.name || devId;
    };

    const enabledPortals: string[] = [];
    if (values.portals?.property_finder) enabledPortals.push('Property Finder');
    if (values.portals?.bayut) enabledPortals.push('Bayut');
    if (values.portals?.dubizzle) enabledPortals.push('Dubizzle');

    const descriptionPreview = values.description
      ? values.description.length > 200
        ? values.description.substring(0, 200) + '...'
        : values.description
      : 'No description provided';

    return (
      <>
        <Title level={5} style={{ marginBottom: 16 }}>
          Review Listing
        </Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Please review all details before saving.
        </Text>

        <Descriptions
          title="Property Information"
          bordered
          column={{ xs: 1, sm: 2, md: 3 }}
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="Property Type">
            {values.property_type || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Completion Status">
            {values.completion_status || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Community">
            {values.community || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Building / Project">
            {values.building_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Public Unit No.">
            {values.public_unit_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Private Unit No.">
            {values.private_unit_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Floor">
            {values.floor_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Size (sqft)">
            {values.size_sqft
              ? Number(values.size_sqft).toLocaleString()
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Bedrooms">
            {values.bedrooms || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Bathrooms">
            {values.bathrooms || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Developer">
            {getDeveloperName(values.developer_id)}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned Agent">
            {getAgentName(values.assigned_agent_id)}
          </Descriptions.Item>
          <Descriptions.Item label="Permit Number">
            {values.permit_number || (
              <Text type="secondary">Not provided</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Price (AED)">
            {values.price
              ? `AED ${Number(values.price).toLocaleString()}`
              : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {values.listing_status || 'Active'}
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="Description"
          bordered
          column={1}
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="Title">
            {values.title || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            {descriptionPreview}
          </Descriptions.Item>
          {values.keywords && values.keywords.length > 0 && (
            <Descriptions.Item label="Keywords">
              {values.keywords.map((kw: string) => (
                <Tag key={kw} color={PRIMARY_COLOR} style={{ marginBottom: 4 }}>
                  {kw}
                </Tag>
              ))}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Descriptions
          title="Media"
          bordered
          column={{ xs: 1, sm: 2 }}
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="Images">
            {imageFiles.length} image{imageFiles.length !== 1 ? 's' : ''}{' '}
            selected
          </Descriptions.Item>
          <Descriptions.Item label="Documents">
            {documentFiles.length} document
            {documentFiles.length !== 1 ? 's' : ''} selected
          </Descriptions.Item>
        </Descriptions>

        <Descriptions
          title="Portals"
          bordered
          column={1}
          size="small"
          style={{ marginBottom: 24 }}
        >
          <Descriptions.Item label="Enabled Portals">
            {enabledPortals.length > 0 ? (
              enabledPortals.map((p) => (
                <Tag key={p} color="green" style={{ marginBottom: 4 }}>
                  {p}
                </Tag>
              ))
            ) : (
              <Text type="secondary">No portals enabled</Text>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}
        >
          <Button
            size="large"
            icon={<SaveOutlined />}
            onClick={() => handleSave(true)}
            loading={saving}
          >
            Save as Draft
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={() => handleSave(false)}
            loading={saving}
            style={{
              backgroundColor: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
          >
            Publish Listing
          </Button>
        </div>
      </>
    );
  };

  // ---- Render Steps ----

  const steps = [
    renderInformation,
    renderDescription,
    renderMedia,
    renderPortals,
    renderReview,
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Add Sell Listing
        </Title>
      </div>

      {/* Progress Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={STEP_ITEMS}
          onChange={handleStepClick}
          style={{
            marginBottom: 8,
          }}
        />
      </Card>

      {/* Form Content */}
      <Card>
        <Form
          form={form}
          layout="vertical"
          requiredMark="optional"
          initialValues={{
            watermark_enabled: true,
            listing_status: 'Active',
            portals: {
              property_finder: false,
              bayut: false,
              dubizzle: false,
            },
          }}
        >
          {steps[currentStep]()}
        </Form>
      </Card>

      {/* Navigation Buttons */}
      {currentStep < 4 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 24,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handlePrev}
            disabled={currentStep === 0}
            size="large"
          >
            Previous
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            size="large"
            style={{
              backgroundColor: PRIMARY_COLOR,
              borderColor: PRIMARY_COLOR,
            }}
          >
            Next <ArrowRightOutlined />
          </Button>
        </div>
      )}

      {currentStep === 4 && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginTop: 24,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handlePrev}
            size="large"
          >
            Previous
          </Button>
        </div>
      )}
    </div>
  );
};

// ========================================
// Helper Component: Portal Status Label
// ========================================
interface PortalStatusLabelProps {
  portalKey: string;
  form: ReturnType<typeof Form.useForm>[0];
  hasPermit: boolean;
}

const PortalStatusLabel: React.FC<PortalStatusLabelProps> = ({
  portalKey,
  form: formInstance,
  hasPermit,
}) => {
  const isEnabled = Form.useWatch(['portals', portalKey], formInstance);

  if (!hasPermit) {
    return (
      <Text type="secondary" style={{ fontSize: 13 }}>
        Not Connected
      </Text>
    );
  }

  return isEnabled ? (
    <Text style={{ fontSize: 13, color: PRIMARY_COLOR, fontWeight: 500 }}>
      Connected
    </Text>
  ) : (
    <Text type="secondary" style={{ fontSize: 13 }}>
      Not Connected
    </Text>
  );
};

export default AddSell;
