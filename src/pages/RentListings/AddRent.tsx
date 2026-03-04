import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Steps,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Upload,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Space,
  Divider,
  Typography,
  message,
  Tag,
  Descriptions,
  Badge,
  Tooltip,
  Image,
} from 'antd';
import {
  SaveOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  DeleteOutlined,
  EyeOutlined,
  HolderOutlined,
  FileTextOutlined,
  PictureOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  listingsService,
  profilesService,
  developersService,
} from '../../services/supabaseService';
import { storageService } from '../../services/storageService';
import { useAuthStore } from '../../stores/useAuthStore';
import type { Database } from '../../types/database';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { TextArea } = Input;
const { Dragger } = Upload;
const { Title, Text } = Typography;

const PRIMARY_COLOR = '#00C4A1';

// --------------- Constants ---------------

const DUBAI_AREAS = [
  'Al Barsha', 'Al Furjan', 'Al Quoz', 'Arabian Ranches', 'Business Bay',
  'City Walk', 'DIFC', 'Discovery Gardens', 'Downtown Dubai', 'Dubai Hills',
  'Dubai Marina', 'Dubai Silicon Oasis', 'Dubai Sports City', 'Emirates Hills',
  'International City', 'JBR', 'JLT', 'JVC', 'Jumeirah', 'Jumeirah Village Triangle',
  'Meydan', 'Motor City', 'Palm Jumeirah', 'Production City', 'Studio City',
  'The Greens', 'The Springs', 'Town Square', 'Umm Suqeim',
];

const propertyTypes = ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Office', 'Retail', 'Land', 'Warehouse'];
const completionStatuses = ['Ready', 'Off Plan', 'Under Construction'];
const occupancyOptions = ['Vacant', 'Occupied', 'Tenant'];
const furnitureOptions = ['Furnished', 'Unfurnished', 'Semi-Furnished'];
const sourceOptions = ['Direct Owner', 'Referral', 'Website', 'Walk-in', 'Property Finder', 'Bayut', 'Dubizzle'];
const bedroomOptions = ['Studio', '1', '2', '3', '4', '5', '6+'];
const bathroomOptions = ['1', '2', '3', '4', '5', '6', '7', '8+'];
const parkingOptions = ['0', '1', '2', '3', '4', '5+'];
const rentalFrequencyOptions = ['Yearly', 'Monthly', 'Weekly', 'Daily'];
const chequesOptions = [1, 2, 3, 4, 6, 12];
const statusOptions = ['Active', 'Inactive', 'Rented'];

const amenityOptions = [
  'Pool', 'Gym', 'Parking', 'Concierge', 'Beach Access',
  'Garden', 'Spa', 'Kids Play Area', 'BBQ Area', 'Jogging Track',
  'Security', 'Balcony', 'Built-in Wardrobes', 'Central A/C',
  'Covered Parking', 'Maid\'s Room', 'Shared Pool', 'View of Landmark',
];

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 5000;

const stepItems = [
  { title: 'Information' },
  { title: 'Description' },
  { title: 'Media' },
  { title: 'Portals' },
  { title: 'Review' },
];

// --------------- Helper: generate listing reference ---------------

const generateListingId = (): string => {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `DXB-R-${num}`;
};

// --------------- Sortable image item ---------------

interface SortableImageProps {
  id: string;
  url: string;
  onRemove: (id: string) => void;
}

const SortableImageItem: React.FC<SortableImageProps> = ({ id, url, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid #d9d9d9',
    cursor: 'grab',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        {...listeners}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          zIndex: 2,
          background: 'rgba(0,0,0,0.45)',
          borderRadius: 4,
          padding: '2px 4px',
          cursor: 'grab',
          color: '#fff',
          fontSize: 14,
        }}
      >
        <HolderOutlined />
      </div>
      <Image
        src={url}
        alt="property"
        width={120}
        height={120}
        style={{ objectFit: 'cover' }}
        preview={{ mask: <EyeOutlined /> }}
      />
      <Tooltip title="Remove">
        <Button
          type="text"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => onRemove(id)}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 4,
          }}
        />
      </Tooltip>
    </div>
  );
};

// --------------- Main Component ---------------

const AddRent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Auto-generated reference
  const [referenceNo] = useState<string>(generateListingId);

  // Agents & developers
  const [agents, setAgents] = useState<{ label: string; value: string }[]>([]);
  const [developers, setDevelopers] = useState<{ label: string; value: string }[]>([]);

  // Images (local previews before upload)
  const [imageFiles, setImageFiles] = useState<{ id: string; file: File; url: string }[]>([]);
  // Documents
  const [docFiles, setDocFiles] = useState<{ id: string; file: File; name: string }[]>([]);

  // Character counts
  const [titleLen, setTitleLen] = useState(0);
  const [descLen, setDescLen] = useState(0);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // --------------- Data fetching ---------------

  useEffect(() => {
    const fetchAgents = async () => {
      const { data } = await profilesService.getAll();
      if (data) {
        setAgents(
          data.map((p: any) => ({
            label: p.full_name || p.email || p.id,
            value: p.id,
          })),
        );
      }
    };
    const fetchDevelopers = async () => {
      const { data } = await developersService.getAll();
      if (data) {
        setDevelopers(
          data.map((d: any) => ({
            label: d.name,
            value: d.id,
          })),
        );
      }
    };
    fetchAgents();
    fetchDevelopers();
  }, []);

  // Set default agent to current user
  useEffect(() => {
    if (user?.id) {
      form.setFieldsValue({ agent_id: user.id });
    }
  }, [user, form]);

  // --------------- Image drag & drop reorder ---------------

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImageFiles((prev) => {
        const oldIndex = prev.findIndex((i) => i.id === active.id);
        const newIndex = prev.findIndex((i) => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, []);

  const handleRemoveImage = useCallback((id: string) => {
    setImageFiles((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleRemoveDoc = useCallback((id: string) => {
    setDocFiles((prev) => prev.filter((d) => d.id !== id));
  }, []);

  // --------------- Step validation fields ---------------

  const stepFields: string[][] = useMemo(() => [
    // Step 1 - Information
    ['property_type', 'completion_status', 'community', 'bedrooms', 'rental_price', 'rent_frequency'],
    // Step 2 - Description
    ['title'],
    // Step 3 - Media (no required fields)
    [],
    // Step 4 - Portals
    [],
    // Step 5 - Review (no required fields - final)
    [],
  ], []);

  // --------------- Navigation ---------------

  const handleNext = () => {
    const fieldsToValidate = stepFields[currentStep];
    if (fieldsToValidate.length === 0) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      return;
    }
    form
      .validateFields(fieldsToValidate)
      .then(() => {
        setCurrentStep((prev) => Math.min(prev + 1, 4));
      })
      .catch(() => {
        message.warning('Please fill in the required fields before proceeding.');
      });
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  // --------------- Status mapping ---------------

  const mapStatus = (uiStatus: string): string => {
    switch (uiStatus) {
      case 'Active':
        return 'active';
      case 'Inactive':
        return 'draft';
      case 'Rented':
        return 'rented';
      default:
        return 'active';
    }
  };

  // --------------- Save ---------------

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Determine bedrooms number
      let bedroomsVal: number | null = null;
      if (values.bedrooms === 'Studio') {
        bedroomsVal = 0;
      } else if (values.bedrooms === '6+') {
        bedroomsVal = 6;
      } else if (values.bedrooms) {
        bedroomsVal = Number(values.bedrooms);
      }

      // Build amenities JSONB with cheques included
      const amenitiesPayload: Record<string, any> = {};
      if (values.amenities && values.amenities.length > 0) {
        amenitiesPayload.list = values.amenities;
      }
      if (values.cheques) {
        amenitiesPayload.cheques = values.cheques;
      }

      // Build portals JSONB
      const portalsPayload = values.portals || {
        property_finder: false,
        bayut: false,
        dubizzle: false,
      };

      // Build keywords JSONB array
      const keywordsPayload = values.keywords || [];

      // Create the listing record
      const insertData: Database['public']['Tables']['listings']['Insert'] = {
        title: values.title,
        description: values.description || null,
        type: 'rent',
        property_type: values.property_type,
        area: values.community,
        community: values.community,
        building_name: values.building || null,
        unit_number: values.public_unit_number || null,
        private_unit_number: values.private_unit_number || null,
        floor_number: values.floor_number || null,
        size_sqft: values.size_sqft || null,
        bedrooms: bedroomsVal,
        bathrooms: values.bathrooms ? Number(values.bathrooms.replace('+', '')) : null,
        parking_spaces: values.parking ? Number(values.parking.replace('+', '')) : 0,
        furnished: values.furniture || null,
        completion_status: values.completion_status || null,
        developer_id: values.developer_id || null,
        price: values.rental_price,
        rent_frequency: values.rent_frequency?.toLowerCase() || 'yearly',
        amenities: amenitiesPayload,
        publish_portals: portalsPayload,
        watermark_enabled: values.watermark ?? false,
        permit_number: values.permit_number || null,
        keywords: keywordsPayload,
        status: mapStatus(values.status || 'Active'),
        assigned_agent_id: values.agent_id || user?.id || '',
        created_by: user?.id || '',
      };

      const { data: listing, error } = await listingsService.create(insertData as any);
      if (error) throw error;

      // Upload images if any
      const listingId = (listing as any)?.id;
      if (listingId && imageFiles.length > 0) {
        for (const img of imageFiles) {
          try {
            await storageService.uploadImage(img.file, listingId);
          } catch (uploadErr) {
            console.error('Image upload failed:', uploadErr);
          }
        }
      }

      message.success('Rent listing created successfully!');
      navigate('/rent/list');
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

  // --------------- Step 1: Information ---------------

  const renderInformation = () => (
    <>
      <Title level={5}>Property Details</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Property Type"
            name="property_type"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder="Select property type"
              options={propertyTypes.map((t) => ({ label: t, value: t }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Completion Status"
            name="completion_status"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder="Select status"
              options={completionStatuses.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Listing ID">
            <Input
              value={referenceNo}
              disabled
              style={{ fontWeight: 600, color: '#333', background: '#fafafa' }}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={8}>
          <Form.Item
            label="Community"
            name="community"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder="Select community"
              showSearch
              optionFilterProp="label"
              options={DUBAI_AREAS.map((a) => ({ label: a, value: a }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Form.Item label="Building" name="building">
            <Input placeholder="Enter building name" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Form.Item label="Floor" name="floor_number">
            <Input placeholder="Floor" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Form.Item label="Public Unit No" name="public_unit_number">
            <Input placeholder="Unit No" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={4}>
          <Form.Item label="Private Unit No" name="private_unit_number">
            <Input placeholder="Private unit" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Form.Item label="Size (sqft)" name="size_sqft">
            <InputNumber
              placeholder="0"
              style={{ width: '100%' }}
              min={0}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Form.Item
            label="Bedrooms"
            name="bedrooms"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder="Select"
              options={bedroomOptions.map((b) => ({ label: b, value: b }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Form.Item label="Bathrooms" name="bathrooms">
            <Select
              placeholder="Select"
              options={bathroomOptions.map((b) => ({ label: b, value: b }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8} md={4}>
          <Form.Item label="Parking" name="parking">
            <Select
              placeholder="Select"
              options={parkingOptions.map((p) => ({ label: p, value: p }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Form.Item label="Occupancy" name="occupancy">
            <Select
              placeholder="Select"
              options={occupancyOptions.map((o) => ({ label: o, value: o }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Furniture" name="furniture">
            <Select
              placeholder="Select"
              options={furnitureOptions.map((f) => ({ label: f, value: f }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Availability Date" name="availability_date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Developer" name="developer_id">
            <Select
              placeholder="Select developer"
              showSearch
              optionFilterProp="label"
              allowClear
              options={developers}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Source" name="source_of_listing">
            <Select
              placeholder="Select source"
              options={sourceOptions.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Assigned Agent" name="agent_id">
            <Select
              placeholder="Select agent"
              showSearch
              optionFilterProp="label"
              allowClear
              options={agents}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Status" name="status" initialValue="Active">
            <Select
              placeholder="Select status"
              options={statusOptions.map((s) => ({ label: s, value: s }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Rental Pricing</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            label="Rental Price (AED)"
            name="rental_price"
            rules={[{ required: true, message: 'Required' }]}
          >
            <InputNumber
              placeholder="0"
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
              min={0}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item
            label="Rental Frequency"
            name="rent_frequency"
            rules={[{ required: true, message: 'Required' }]}
          >
            <Select
              placeholder="Select frequency"
              options={rentalFrequencyOptions.map((f) => ({ label: f, value: f }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Cheques" name="cheques">
            <Select
              placeholder="Select cheques"
              allowClear
              options={chequesOptions.map((c) => ({ label: `${c}`, value: c }))}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Form.Item label="Service Charge (AED)" name="service_charge">
            <InputNumber
              placeholder="0"
              style={{ width: '100%' }}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
              min={0}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // --------------- Step 2: Description ---------------

  const renderDescription = () => (
    <>
      <Title level={5}>Listing Title</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}>
          <Form.Item
            label={
              <Space>
                <span>Title (English)</span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {titleLen}/{TITLE_MAX}
                </Text>
              </Space>
            }
            name="title"
            rules={[
              { required: true, message: 'Title is required' },
              { max: TITLE_MAX, message: `Max ${TITLE_MAX} characters` },
            ]}
          >
            <Input
              placeholder="e.g. Spacious 2BR in Dubai Marina with Full Sea View"
              maxLength={TITLE_MAX}
              onChange={(e) => setTitleLen(e.target.value.length)}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Description</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24}>
          <Form.Item
            label={
              <Space>
                <span>Description (English)</span>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {descLen}/{DESCRIPTION_MAX}
                </Text>
              </Space>
            }
            name="description"
            rules={[{ max: DESCRIPTION_MAX, message: `Max ${DESCRIPTION_MAX} characters` }]}
          >
            <TextArea
              rows={8}
              placeholder="Enter a detailed property description..."
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescLen(e.target.value.length)}
              showCount
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Keywords</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={16}>
          <Form.Item
            label="Keywords"
            name="keywords"
            tooltip="Add keywords to improve search visibility"
          >
            <Select
              mode="tags"
              placeholder="Type and press Enter to add keywords"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>Amenities</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24}>
          <Form.Item label="Amenities" name="amenities">
            <Select
              mode="multiple"
              placeholder="Select amenities"
              options={amenityOptions.map((a) => ({ label: a, value: a }))}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // --------------- Step 3: Media ---------------

  const renderMedia = () => (
    <>
      <Title level={5}>Property Images</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Drag and drop to reorder images. The first image will be used as the cover photo.
      </Text>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Dragger
            name="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            beforeUpload={(file) => {
              const isValid = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
              if (!isValid) {
                message.error('Only JPG, PNG, and WEBP images are allowed.');
                return Upload.LIST_IGNORE;
              }
              if (file.size > 10 * 1024 * 1024) {
                message.error('Image must be smaller than 10MB.');
                return Upload.LIST_IGNORE;
              }
              const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
              const url = URL.createObjectURL(file);
              setImageFiles((prev) => [...prev, { id, file, url }]);
              return false;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <PictureOutlined style={{ color: PRIMARY_COLOR, fontSize: 40 }} />
            </p>
            <p className="ant-upload-text">Click or drag images to upload</p>
            <p className="ant-upload-hint">
              Accepted formats: JPG, PNG, WEBP (max 10MB each)
            </p>
          </Dragger>
        </Col>
      </Row>

      {imageFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            {imageFiles.length} image{imageFiles.length > 1 ? 's' : ''} selected
          </Text>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={imageFiles.map((i) => i.id)}
              strategy={rectSortingStrategy}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {imageFiles.map((img, idx) => (
                  <div key={img.id} style={{ position: 'relative' }}>
                    {idx === 0 && (
                      <Tag
                        color={PRIMARY_COLOR}
                        style={{
                          position: 'absolute',
                          bottom: 4,
                          left: 4,
                          zIndex: 3,
                          fontSize: 10,
                        }}
                      >
                        Cover
                      </Tag>
                    )}
                    <SortableImageItem
                      id={img.id}
                      url={img.url}
                      onRemove={handleRemoveImage}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <Divider />

      <Title level={5}>Documents</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Dragger
            name="file"
            multiple
            accept=".pdf,.doc,.docx"
            beforeUpload={(file) => {
              const isValid = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              ].includes(file.type);
              if (!isValid) {
                message.error('Only PDF, DOC, and DOCX files are allowed.');
                return Upload.LIST_IGNORE;
              }
              const id = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
              setDocFiles((prev) => [...prev, { id, file, name: file.name }]);
              return false;
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <FileTextOutlined style={{ color: PRIMARY_COLOR, fontSize: 40 }} />
            </p>
            <p className="ant-upload-text">Click or drag documents to upload</p>
            <p className="ant-upload-hint">Accepted formats: PDF, DOC, DOCX</p>
          </Dragger>
        </Col>
      </Row>

      {docFiles.length > 0 && (
        <div style={{ marginTop: 16 }}>
          {docFiles.map((doc) => (
            <div
              key={doc.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#fafafa',
                borderRadius: 6,
                marginBottom: 6,
                border: '1px solid #f0f0f0',
              }}
            >
              <Space>
                <FileTextOutlined style={{ color: PRIMARY_COLOR }} />
                <Text>{doc.name}</Text>
              </Space>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveDoc(doc.id)}
              />
            </div>
          ))}
        </div>
      )}

      <Divider />

      <Title level={5}>Watermark</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item
            label="Enable watermark on images"
            name="watermark"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="ON"
              unCheckedChildren="OFF"
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider />

      <Title level={5}>360 Tour</Title>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={16}>
          <Form.Item label="360 Tour URL" name="tour_url">
            <Input placeholder="https://my.matterport.com/show/?m=..." />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // --------------- Step 4: Portals ---------------

  const renderPortals = () => {
    const portalCards: { key: string; label: string; shortLabel: string }[] = [
      { key: 'property_finder', label: 'Property Finder', shortLabel: 'PF' },
      { key: 'bayut', label: 'Bayut', shortLabel: 'B' },
      { key: 'dubizzle', label: 'Dubizzle', shortLabel: 'D' },
    ];

    return (
      <>
        <Title level={5}>Portal Publishing</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Enable the portals where you want this listing to be published.
        </Text>

        <Row gutter={[16, 16]}>
          {portalCards.map((portal) => (
            <Col xs={24} sm={12} md={8} key={portal.key}>
              <Card hoverable bodyStyle={{ padding: 24, textAlign: 'center' }}>
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
                      fontSize: 14,
                      fontWeight: 600,
                      color: '#595959',
                    }}
                  >
                    {portal.shortLabel}
                  </div>
                  <Text strong style={{ fontSize: 16 }}>{portal.label}</Text>
                </div>
                <Form.Item
                  name={['portals', portal.key]}
                  valuePropName="checked"
                  noStyle
                >
                  <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                </Form.Item>
              </Card>
            </Col>
          ))}
        </Row>

        <Divider />

        <Title level={5}>Permit Details</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          A valid permit number is required to publish on portals.
        </Text>
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Permit Number"
              name="permit_number"
              rules={[
                {
                  validator: async (_, value) => {
                    const portals = form.getFieldValue('portals') || {};
                    const anyPortalEnabled =
                      portals.property_finder || portals.bayut || portals.dubizzle;
                    if (anyPortalEnabled && !value) {
                      throw new Error(
                        'Permit number is required when publishing to portals',
                      );
                    }
                  },
                },
              ]}
            >
              <Input placeholder="Enter RERA / DLD permit number" />
            </Form.Item>
          </Col>
        </Row>
      </>
    );
  };

  // --------------- Step 5: Review ---------------

  const renderReview = () => {
    const values = form.getFieldsValue(true);
    const portals = values.portals || {};
    const enabledPortals: string[] = [];
    if (portals.property_finder) enabledPortals.push('Property Finder');
    if (portals.bayut) enabledPortals.push('Bayut');
    if (portals.dubizzle) enabledPortals.push('Dubizzle');

    const formatPrice = (val: number | undefined): string => {
      if (!val) return '-';
      return `AED ${val.toLocaleString()}`;
    };

    return (
      <>
        <Title level={5}>Review Your Listing</Title>
        <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
          Please review all information before saving.
        </Text>

        <Card
          title="Property Information"
          size="small"
          style={{ marginBottom: 16 }}
          headStyle={{ background: '#fafafa' }}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
            <Descriptions.Item label="Listing ID">
              <Text strong>{referenceNo}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Property Type">
              {values.property_type || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Completion Status">
              {values.completion_status || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Community">
              {values.community || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Building">
              {values.building || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Floor">
              {values.floor_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Public Unit No">
              {values.public_unit_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Private Unit No">
              {values.private_unit_number || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Size">
              {values.size_sqft ? `${values.size_sqft.toLocaleString()} sqft` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Bedrooms">
              {values.bedrooms || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Bathrooms">
              {values.bathrooms || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Parking">
              {values.parking || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Furniture">
              {values.furniture || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Developer">
              {developers.find((d) => d.value === values.developer_id)?.label || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Badge
                color={
                  values.status === 'Active'
                    ? PRIMARY_COLOR
                    : values.status === 'Rented'
                    ? '#faad14'
                    : '#d9d9d9'
                }
                text={values.status || 'Active'}
              />
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Rental Pricing"
          size="small"
          style={{ marginBottom: 16 }}
          headStyle={{ background: '#fafafa' }}
        >
          <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small">
            <Descriptions.Item label="Rental Price">
              <Text strong style={{ color: PRIMARY_COLOR, fontSize: 16 }}>
                {formatPrice(values.rental_price)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Frequency">
              {values.rent_frequency || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Cheques">
              {values.cheques || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Service Charge">
              {formatPrice(values.service_charge)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Description"
          size="small"
          style={{ marginBottom: 16 }}
          headStyle={{ background: '#fafafa' }}
        >
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Title">
              {values.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Description">
              <div style={{ maxHeight: 150, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                {values.description || '-'}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Keywords">
              {values.keywords && values.keywords.length > 0
                ? values.keywords.map((kw: string) => (
                    <Tag key={kw} style={{ marginBottom: 4 }}>{kw}</Tag>
                  ))
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Amenities">
              {values.amenities && values.amenities.length > 0
                ? values.amenities.map((a: string) => (
                    <Tag key={a} color={PRIMARY_COLOR} style={{ marginBottom: 4 }}>{a}</Tag>
                  ))
                : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Media"
          size="small"
          style={{ marginBottom: 16 }}
          headStyle={{ background: '#fafafa' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Images">
              {imageFiles.length > 0 ? `${imageFiles.length} image(s)` : 'No images'}
            </Descriptions.Item>
            <Descriptions.Item label="Documents">
              {docFiles.length > 0 ? `${docFiles.length} document(s)` : 'No documents'}
            </Descriptions.Item>
            <Descriptions.Item label="Watermark">
              {values.watermark ? (
                <Tag icon={<CheckCircleOutlined />} color="success">Enabled</Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="default">Disabled</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="360 Tour">
              {values.tour_url || 'Not provided'}
            </Descriptions.Item>
          </Descriptions>
          {imageFiles.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {imageFiles.slice(0, 6).map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 6,
                    overflow: 'hidden',
                    border: '1px solid #d9d9d9',
                    position: 'relative',
                  }}
                >
                  <img
                    src={img.url}
                    alt={`preview-${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {idx === 0 && (
                    <Tag
                      color={PRIMARY_COLOR}
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        fontSize: 9,
                        lineHeight: '14px',
                        padding: '0 4px',
                      }}
                    >
                      Cover
                    </Tag>
                  )}
                </div>
              ))}
              {imageFiles.length > 6 && (
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 6,
                    border: '1px dashed #d9d9d9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#fafafa',
                  }}
                >
                  <Text type="secondary">+{imageFiles.length - 6}</Text>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card
          title="Portals"
          size="small"
          style={{ marginBottom: 16 }}
          headStyle={{ background: '#fafafa' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Published To">
              {enabledPortals.length > 0
                ? enabledPortals.map((p) => (
                    <Tag key={p} color={PRIMARY_COLOR} style={{ marginBottom: 4 }}>{p}</Tag>
                  ))
                : <Text type="secondary">None</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Permit Number">
              {values.permit_number || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        <Card
          title="Agent"
          size="small"
          headStyle={{ background: '#fafafa' }}
        >
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="Assigned Agent">
              {agents.find((a) => a.value === values.agent_id)?.label || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </>
    );
  };

  // --------------- Step renderer array ---------------

  const steps = [
    renderInformation,
    renderDescription,
    renderMedia,
    renderPortals,
    renderReview,
  ];

  const isLastStep = currentStep === 4;

  // --------------- Render ---------------

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
          Add Rent Listing
        </Title>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={handleSave}
          loading={saving}
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
        >
          Save
        </Button>
      </div>

      {/* Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          items={stepItems}
          style={{ marginBottom: 8 }}
          onChange={(step) => {
            if (step < currentStep) {
              setCurrentStep(step);
            }
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
            rent_frequency: 'Yearly',
            status: 'Active',
            watermark: false,
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
          onClick={isLastStep ? handleSave : handleNext}
          loading={isLastStep ? saving : false}
          size="large"
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
        >
          {isLastStep ? (
            <>
              <SaveOutlined /> Save Listing
            </>
          ) : (
            <>
              Next <ArrowRightOutlined />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AddRent;
