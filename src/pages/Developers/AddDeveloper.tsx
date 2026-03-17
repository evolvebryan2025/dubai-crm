import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Typography,
  message,
  Space,
} from 'antd';
import { BankOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { developersService } from '../../services/supabaseService';

const { Title } = Typography;

interface DeveloperFormValues {
  name: string;
  logo_url?: string;
}

const AddDeveloper: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: DeveloperFormValues) => {
    setSaving(true);
    try {
      const { error } = await developersService.create({
        name: values.name,
        logo_url: values.logo_url || null,
      });
      if (error) throw error;
      message.success('Developer created successfully');
      navigate('/developers/list');
    } catch (error) {
      console.error('Error creating developer:', error);
      message.error('Failed to create developer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/developers/list')}
        >
          Back to Developers
        </Button>
      </div>

      <Card
        title={
          <Space>
            <BankOutlined style={{ color: '#00C4A1' }} />
            <span>Add Developer</span>
          </Space>
        }
        style={{ borderRadius: 12, maxWidth: 600 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            label="Developer Name"
            name="name"
            rules={[{ required: true, message: 'Please enter the developer name' }]}
          >
            <Input placeholder="e.g. Emaar Properties" />
          </Form.Item>

          <Form.Item
            label="Logo URL"
            name="logo_url"
          >
            <Input placeholder="https://example.com/logo.png" />
          </Form.Item>

          <Row justify="end">
            <Col>
              <Space>
                <Button onClick={() => navigate('/developers/list')}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  style={{ background: '#00C4A1', borderColor: '#00C4A1' }}
                >
                  Save Developer
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default AddDeveloper;
