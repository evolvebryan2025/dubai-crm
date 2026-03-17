import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Typography,
  message,
  Space,
} from 'antd';
import { UserOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { contactsService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title } = Typography;
const { TextArea } = Input;

const COUNTRY_CODES = [
  { label: '+971 UAE', value: '+971' },
  { label: '+966 Saudi', value: '+966' },
  { label: '+968 Oman', value: '+968' },
  { label: '+974 Qatar', value: '+974' },
  { label: '+973 Bahrain', value: '+973' },
  { label: '+965 Kuwait', value: '+965' },
  { label: '+44 UK', value: '+44' },
  { label: '+1 US', value: '+1' },
  { label: '+91 India', value: '+91' },
  { label: '+92 Pakistan', value: '+92' },
  { label: '+63 Philippines', value: '+63' },
];

const SOURCES = [
  { label: 'Website', value: 'Website' },
  { label: 'Portal', value: 'Portal' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Walk-in', value: 'Walk-in' },
  { label: 'Social Media', value: 'Social Media' },
  { label: 'Cold Call', value: 'Cold Call' },
  { label: 'Exhibition', value: 'Exhibition' },
  { label: 'Other', value: 'Other' },
];

const NATIONALITIES = [
  { label: 'United Arab Emirates', value: 'UAE' },
  { label: 'United Kingdom', value: 'British' },
  { label: 'United States', value: 'American' },
  { label: 'Saudi Arabia', value: 'Saudi' },
  { label: 'India', value: 'Indian' },
  { label: 'Pakistan', value: 'Pakistani' },
  { label: 'Philippines', value: 'Filipino' },
  { label: 'China', value: 'Chinese' },
  { label: 'Russia', value: 'Russian' },
  { label: 'Germany', value: 'German' },
  { label: 'France', value: 'French' },
  { label: 'Spain', value: 'Spanish' },
  { label: 'Italy', value: 'Italian' },
  { label: 'Canada', value: 'Canadian' },
  { label: 'Australia', value: 'Australian' },
  { label: 'Japan', value: 'Japanese' },
  { label: 'South Korea', value: 'Korean' },
  { label: 'Brazil', value: 'Brazilian' },
  { label: 'Egypt', value: 'Egyptian' },
  { label: 'Jordan', value: 'Jordanian' },
  { label: 'Lebanon', value: 'Lebanese' },
  { label: 'Iran', value: 'Iranian' },
  { label: 'Turkey', value: 'Turkish' },
  { label: 'Nigeria', value: 'Nigerian' },
  { label: 'South Africa', value: 'South African' },
  { label: 'Oman', value: 'Omani' },
  { label: 'Qatar', value: 'Qatari' },
  { label: 'Bahrain', value: 'Bahraini' },
  { label: 'Kuwait', value: 'Kuwaiti' },
];

const AddContact: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const phone = values.phone
        ? `${values.country_code}${values.phone}`
        : undefined;

      const { error } = await contactsService.create({
        full_name: values.full_name,
        email: values.email || null,
        phone: phone || null,
        company: values.company || null,
        designation: values.designation || null,
        nationality: values.nationality || null,
        source: values.source || null,
        area_tags: values.area_tags || [],
        notes: values.notes || null,
        assigned_agent_id: user?.id ?? '',
        created_by: user?.id ?? '',
      });

      if (error) throw error;
      message.success('Contact created successfully!');
      navigate('/contacts/list');
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('Please fill all required fields');
      } else {
        message.error(err?.message || 'Failed to create contact.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Back button */}
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/contacts/list')}
        style={{ marginBottom: 16 }}
      >
        Back to Contacts
      </Button>

      <Form
        form={form}
        layout="vertical"
        initialValues={{ country_code: '+971' }}
        requiredMark={(label, { required }) => (
          <>
            {label}
            {required && <span style={{ color: '#ff4d4f', marginLeft: 4 }}>*</span>}
          </>
        )}
      >
        <Card
          title={
            <Space>
              <UserOutlined style={{ color: '#00C4A1' }} />
              <Title level={5} style={{ margin: 0 }}>
                Contact Info
              </Title>
            </Space>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: '24px' } }}
        >
          <Row gutter={24}>
            {/* Left column */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Full Name"
                name="full_name"
                rules={[{ required: true, message: 'Please enter contact name' }]}
              >
                <Input placeholder="Enter full name" />
              </Form.Item>

              <Form.Item label="Phone" style={{ marginBottom: 0 }}>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item name="country_code" noStyle>
                    <Select style={{ width: 150 }} options={COUNTRY_CODES} />
                  </Form.Item>
                  <Form.Item name="phone" noStyle>
                    <Input
                      style={{ width: 'calc(100% - 150px)' }}
                      placeholder="Enter phone number"
                      type="number"
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
              <div style={{ marginBottom: 24 }} />

              <Form.Item label="Company" name="company">
                <Input placeholder="Enter company name" />
              </Form.Item>

              <Form.Item label="Designation" name="designation">
                <Input placeholder="Enter designation" />
              </Form.Item>

              <Form.Item label="Notes" name="notes">
                <TextArea rows={4} placeholder="Enter notes" />
              </Form.Item>
            </Col>

            {/* Right column */}
            <Col xs={24} md={12}>
              <Form.Item label="Email" name="email">
                <Input placeholder="Enter email address" type="email" />
              </Form.Item>

              <Form.Item label="Nationality" name="nationality">
                <Select
                  placeholder="Select nationality"
                  options={NATIONALITIES}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Source" name="source">
                <Select
                  placeholder="Select source"
                  options={SOURCES}
                  allowClear
                />
              </Form.Item>

              <Form.Item label="Area Tags" name="area_tags">
                <Select
                  mode="tags"
                  placeholder="Type and press enter to add area tags"
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Save button */}
          <Row justify="end" style={{ marginTop: 16 }}>
            <Col>
              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                style={{
                  backgroundColor: '#00C4A1',
                  borderColor: '#00C4A1',
                  minWidth: 150,
                  fontWeight: 600,
                }}
              >
                Save All
              </Button>
            </Col>
          </Row>
        </Card>
      </Form>
    </div>
  );
};

export default AddContact;
