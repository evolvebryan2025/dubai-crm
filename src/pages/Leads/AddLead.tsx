import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Upload,
  Button,
  Card,
  Row,
  Col,
  Space,
  message,
  Divider,
  Spin,
} from 'antd';
import {
  InboxOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd/es/upload/interface';
import { useNavigate } from 'react-router-dom';
import { leadsService, profilesService } from '../../services/supabaseService';
import { profileToUser } from '../../utils/typeAdapters';
import { useAuthStore } from '../../stores/useAuthStore';
import type { User } from '../../types';

const DUBAI_AREAS = [
  'Al Barsha', 'Al Furjan', 'Al Quoz', 'Arabian Ranches', 'Business Bay',
  'City Walk', 'DIFC', 'Discovery Gardens', 'Downtown Dubai', 'Dubai Hills',
  'Dubai Marina', 'Dubai Silicon Oasis', 'Dubai Sports City', 'Emirates Hills',
  'International City', 'JBR', 'JLT', 'JVC', 'Jumeirah', 'Jumeirah Village Triangle',
  'Meydan', 'Motor City', 'Palm Jumeirah', 'Production City', 'Studio City',
  'The Greens', 'The Springs', 'Town Square', 'Umm Suqeim',
];

const { TextArea } = Input;
const { Dragger } = Upload;

const AddLead: React.FC = () => {
  const [form] = Form.useForm();
  const [keywordsLength, setKeywordsLength] = useState(0);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await profilesService.getAll();
        if (error) throw error;
        setUsers((data || []).map(profileToUser));
      } catch {
        message.error('Failed to load agents');
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      setSaving(true);
      const { error } = await leadsService.create({
        full_name: values.name as string,
        email: values.email as string,
        phone: values.phone as string,
        purpose: (values.lead_type as string) === 'Buy' ? 'buy' : 'rent',
        budget_max: values.budget ? Number(values.budget) : null,
        preferred_areas: values.preferred_location as string[] || [],
        property_type: values.preferred_property_type as string,
        source: values.source_of_lead as string,
        nationality: values.nationality as string,
        notes: values.keywords as string,
        assigned_agent_id: user?.id ?? '',
        created_by: user?.id ?? '',
      });
      if (error) throw error;
      message.success('Lead created successfully!');
      navigate('/leads');
    } catch (err: any) {
      message.error(err?.message || 'Failed to create lead.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 1000) {
      setKeywordsLength(val.length);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Page title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0, fontWeight: 600, fontSize: 22 }}>Add Lead</h2>
        <Space>
          <Button icon={<CloseOutlined />}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
          >
            Save Lead
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        requiredMark="optional"
        initialValues={{
          lead_type: 'Buy',
        }}
      >
        {/* Type Section */}
        <Card
          title={
            <span style={{ fontWeight: 600, fontSize: 16 }}>Lead Type & Assignment</span>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="lead_type"
                label="Lead Type"
                rules={[{ required: true, message: 'Please select a lead type' }]}
              >
                <Select
                  placeholder="Select lead type"
                  options={[
                    { label: 'Buy', value: 'Buy' },
                    { label: 'Rent', value: 'Rent' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="agent_id"
                label="Agent"
                rules={[{ required: true, message: 'Please select an agent' }]}
              >
                <Select
                  placeholder="Select agent"
                  showSearch
                  optionFilterProp="label"
                  loading={loadingUsers}
                  options={users.map((u) => ({
                    label: u.name,
                    value: u.id,
                  }))}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Contact Information */}
        <Card
          title={
            <span style={{ fontWeight: 600, fontSize: 16 }}>Contact Information</span>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter the lead name' }]}
              >
                <Input placeholder="Enter full name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="phone"
                label="Phone"
              >
                <Input placeholder="Enter phone number" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="email"
                label="Email"
                rules={[{ type: 'email', message: 'Please enter a valid email' }]}
              >
                <Input placeholder="Enter email address" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item name="nationality" label="Nationality">
                <Input placeholder="Enter nationality" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="source_of_lead" label="Source of Lead">
                <Select
                  placeholder="Select source"
                  options={[
                    { label: 'Website', value: 'Website' },
                    { label: 'Property Finder', value: 'Property Finder' },
                    { label: 'Bayut', value: 'Bayut' },
                    { label: 'Dubizzle', value: 'Dubizzle' },
                    { label: 'Referral', value: 'Referral' },
                    { label: 'Walk-in', value: 'Walk-in' },
                    { label: 'Social Media', value: 'Social Media' },
                    { label: 'Cold Call', value: 'Cold Call' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="form_name" label="Form Name">
                <Input placeholder="Enter form name" size="large" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Preferences */}
        <Card
          title={
            <span style={{ fontWeight: 600, fontSize: 16 }}>Preferences</span>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item name="budget" label="Budget (AED)">
                <Input placeholder="Enter budget" type="number" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="preferred_rooms" label="Preferred Rooms">
                <Select
                  placeholder="Select rooms"
                  options={[
                    { label: 'Studio', value: 'Studio' },
                    { label: '1BR', value: '1BR' },
                    { label: '2BR', value: '2BR' },
                    { label: '3BR', value: '3BR' },
                    { label: '4BR', value: '4BR' },
                    { label: '5BR+', value: '5BR+' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="preferred_size" label="Preferred Size">
                <Input placeholder="e.g. 1200-1500 sqft" size="large" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item name="preferred_property_type" label="Property Type">
                <Select
                  placeholder="Select property type"
                  options={[
                    { label: 'Apartment', value: 'Apartment' },
                    { label: 'Villa', value: 'Villa' },
                    { label: 'Townhouse', value: 'Townhouse' },
                    { label: 'Penthouse', value: 'Penthouse' },
                    { label: 'Office', value: 'Office' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="project_type" label="Project Type">
                <Select
                  placeholder="Select project type"
                  options={[
                    { label: 'Ready', value: 'Ready' },
                    { label: 'Off Plan', value: 'Off Plan' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="buyer_type" label="Buyer Type">
                <Select
                  placeholder="Select buyer type"
                  options={[
                    { label: 'End User', value: 'End User' },
                    { label: 'Investor', value: 'Investor' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item name="payment_method" label="Payment Method">
                <Select
                  placeholder="Select payment method"
                  options={[
                    { label: 'Cash', value: 'Cash' },
                    { label: 'Mortgage', value: 'Mortgage' },
                    { label: 'Cheques', value: 'Cheques' },
                  ]}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Location Section */}
        <Card
          title={
            <span style={{ fontWeight: 600, fontSize: 16 }}>Preferred Location</span>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
          bodyStyle={{ padding: 20 }}
        >
          <Form.Item
            name="preferred_location"
            label="Select preferred areas"
          >
            <Select
              mode="multiple"
              placeholder="Search and select locations"
              showSearch
              optionFilterProp="label"
              size="large"
              style={{ width: '100%' }}
              options={DUBAI_AREAS.map((area) => ({
                label: area,
                value: area,
              }))}
            />
          </Form.Item>
        </Card>

        {/* Keywords Section */}
        <Card
          title={
            <span style={{ fontWeight: 600, fontSize: 16 }}>Keywords</span>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
          bodyStyle={{ padding: 20 }}
        >
          <Form.Item name="keywords" label="Keywords / Notes">
            <TextArea
              rows={4}
              placeholder="Enter keywords or notes about this lead (e.g. sea view, high floor, near metro...)"
              maxLength={1000}
              onChange={handleKeywordsChange}
              showCount={false}
              size="large"
            />
          </Form.Item>
          <div style={{ textAlign: 'right', color: '#999', fontSize: 12, marginTop: -8 }}>
            {keywordsLength}/1000
          </div>
        </Card>

        {/* Documents Section */}
        <Card
          title={
            <span style={{ fontWeight: 600, fontSize: 16 }}>Documents</span>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
          bodyStyle={{ padding: 20 }}
        >
          <Form.Item name="documents">
            <Dragger
              multiple
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              style={{ borderColor: '#00C4A1' }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined style={{ color: '#00C4A1', fontSize: 48 }} />
              </p>
              <p className="ant-upload-text" style={{ fontSize: 15 }}>
                Click or drag files to this area to upload
              </p>
              <p className="ant-upload-hint" style={{ color: '#999' }}>
                Support for single or bulk upload. Upload documents such as passport copies, Emirates ID, or any related files.
              </p>
            </Dragger>
          </Form.Item>
        </Card>

        {/* Submit buttons (bottom) */}
        <Divider />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <Button size="large" icon={<CloseOutlined />}>
            Cancel
          </Button>
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            htmlType="submit"
            style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
          >
            Save Lead
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default AddLead;
