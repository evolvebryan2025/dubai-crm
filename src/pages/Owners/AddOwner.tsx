import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Button,
  Form,
  Typography,
  message,
  Space,
} from 'antd';
import { UserOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ownersService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title } = Typography;

const COUNTRY_CODES = [
  { label: '\u{1F1E6}\u{1F1EA} +971', value: '+971' },
  { label: '\u{1F1EC}\u{1F1E7} +44', value: '+44' },
  { label: '\u{1F1FA}\u{1F1F8} +1', value: '+1' },
  { label: '\u{1F1E8}\u{1F1F3} +86', value: '+86' },
  { label: '\u{1F1F7}\u{1F1FA} +7', value: '+7' },
  { label: '\u{1F1F8}\u{1F1E6} +966', value: '+966' },
  { label: '\u{1F1EE}\u{1F1F3} +91', value: '+91' },
  { label: '\u{1F1F5}\u{1F1F0} +92', value: '+92' },
];

const SOURCES = [
  { label: 'Direct', value: 'Direct' },
  { label: 'Referral', value: 'Referral' },
  { label: 'Website', value: 'Website' },
  { label: 'Walk-in', value: 'Walk-in' },
  { label: 'Portal', value: 'Portal' },
];

const NATIONALITIES = [
  { label: 'United Arab Emirates', value: 'UAE' },
  { label: 'United Kingdom', value: 'British' },
  { label: 'United States', value: 'American' },
  { label: 'China', value: 'Chinese' },
  { label: 'Russia', value: 'Russian' },
  { label: 'Saudi Arabia', value: 'Saudi' },
  { label: 'India', value: 'Indian' },
  { label: 'Pakistan', value: 'Pakistani' },
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
  { label: 'Philippines', value: 'Filipino' },
  { label: 'Nigeria', value: 'Nigerian' },
  { label: 'South Africa', value: 'South African' },
];

const GENDERS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
];

const LANGUAGES = [
  { label: 'Arabic', value: 'Arabic' },
  { label: 'English', value: 'English' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Russian', value: 'Russian' },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Urdu', value: 'Urdu' },
  { label: 'French', value: 'French' },
  { label: 'Spanish', value: 'Spanish' },
  { label: 'Korean', value: 'Korean' },
  { label: 'German', value: 'German' },
];

const AddOwner: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const { error } = await ownersService.create({
        full_name: values.name,
        email: values.email,
        phone: values.phone,
        nationality: values.nationality,
        source: values.source_of_owner,
        assigned_agent_id: user?.id ?? '',
        created_by: user?.id ?? '',
      });
      if (error) throw error;
      message.success('Owner created successfully!');
      navigate('/owners');
    } catch (err: any) {
      if (err?.errorFields) {
        message.error('Please fill all required fields');
      } else {
        message.error(err?.message || 'Failed to create owner.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{ country_code: '+971', country_code_secondary: '+971' }}
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
              <Title level={5} style={{ margin: 0 }}>Owner Info</Title>
            </Space>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: '24px' } }}
        >
          <Row gutter={24}>
            {/* Left column */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Please enter owner name' }]}
              >
                <Input placeholder="Enter owner name" />
              </Form.Item>

              <Form.Item
                label="Phone"
                required
                style={{ marginBottom: 0 }}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="country_code"
                    noStyle
                    rules={[{ required: true, message: 'Select code' }]}
                  >
                    <Select
                      style={{ width: 140 }}
                      options={COUNTRY_CODES}
                    />
                  </Form.Item>
                  <Form.Item
                    name="phone"
                    noStyle
                    rules={[{ required: true, message: 'Please enter phone number' }]}
                  >
                    <Input
                      style={{ width: 'calc(100% - 140px)' }}
                      placeholder="Enter phone number"
                      type="number"
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
              {/* manual margin for the compact group */}
              <div style={{ marginBottom: 24 }} />

              <Form.Item
                label="Source Of Owner"
                name="source_of_owner"
              >
                <Select
                  placeholder="Select source"
                  options={SOURCES}
                  allowClear
                />
              </Form.Item>

              <Form.Item
                label="Gender"
                name="gender"
              >
                <Select
                  placeholder="Select gender"
                  options={GENDERS}
                  allowClear
                />
              </Form.Item>

              <Form.Item
                label="Spoken Languages"
                name="spoken_languages"
              >
                <Select
                  mode="multiple"
                  placeholder="Select languages"
                  options={LANGUAGES}
                  allowClear
                />
              </Form.Item>
            </Col>

            {/* Right column */}
            <Col xs={24} md={12}>
              <Form.Item
                label="Email"
                name="email"
              >
                <Input placeholder="Enter email address" type="email" />
              </Form.Item>

              <Form.Item
                label="Phone Secondary"
                style={{ marginBottom: 0 }}
              >
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="country_code_secondary"
                    noStyle
                  >
                    <Select
                      style={{ width: 140 }}
                      options={COUNTRY_CODES}
                    />
                  </Form.Item>
                  <Form.Item
                    name="phone_secondary"
                    noStyle
                  >
                    <Input
                      style={{ width: 'calc(100% - 140px)' }}
                      placeholder="Enter secondary phone"
                      type="number"
                    />
                  </Form.Item>
                </Space.Compact>
              </Form.Item>
              <div style={{ marginBottom: 24 }} />

              <Form.Item
                label="Nationality"
                name="nationality"
              >
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

              <Form.Item
                label="Birthdate"
                name="birthdate"
              >
                <DatePicker
                  style={{ width: '100%' }}
                  placeholder="Select birthdate"
                  format="DD/MM/YYYY"
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

export default AddOwner;
