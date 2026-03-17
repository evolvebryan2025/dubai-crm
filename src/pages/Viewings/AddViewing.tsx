import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Typography,
  message,
  Space,
} from 'antd';
import { CalendarOutlined, SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  viewingsService,
  profilesService,
  listingsService,
  leadsService,
} from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface AgentOption {
  id: string;
  full_name: string;
}

interface ListingOption {
  id: string;
  reference_no: string;
  title_en?: string;
}

interface LeadOption {
  id: string;
  full_name: string;
}

const AddViewing: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuthStore();

  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [listings, setListings] = useState<ListingOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [agentsRes, listingsRes, leadsRes] = await Promise.all([
          profilesService.getAll(),
          listingsService.getAll(),
          leadsService.getAll(),
        ]);

        if (agentsRes.data) {
          setAgents(
            (agentsRes.data as any[]).map((a: any) => ({
              id: a.id,
              full_name: a.full_name,
            }))
          );
        }

        if (listingsRes.data) {
          setListings(
            (listingsRes.data as any[]).map((l: any) => ({
              id: l.id,
              reference_no: l.reference_no,
              title_en: l.title_en,
            }))
          );
        }

        if (leadsRes.data) {
          setLeads(
            (leadsRes.data as any[]).map((l: any) => ({
              id: l.id,
              full_name: l.full_name,
            }))
          );
        }
      } catch {
        message.error('Failed to load form options');
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    if (user?.id) {
      form.setFieldsValue({ agent_id: user.id });
    }
  }, [user, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload: any = {
        contact_name: values.contact_name,
        contact_phone: values.contact_phone,
        contact_email: values.contact_email,
        listing_id: values.listing_id,
        lead_id: values.lead_id,
        agent_id: values.agent_id,
        property_address: values.property_address,
        property_type: values.property_type,
        area: values.area,
        viewing_date: values.viewing_date
          ? dayjs(values.viewing_date).format('YYYY-MM-DD')
          : undefined,
        viewing_time: values.viewing_time
          ? dayjs(values.viewing_time).format('HH:mm')
          : undefined,
        duration_minutes: values.duration_minutes,
        notes: values.notes,
        created_by: user?.id,
      };

      const { error } = await viewingsService.create(payload);
      if (error) throw error;

      message.success('Viewing created successfully');
      navigate('/viewings/list');
    } catch (err: any) {
      if (err?.errorFields) return; // validation error
      message.error('Failed to create viewing');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      <Space style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/viewings/list')}>
          Back
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          <CalendarOutlined style={{ marginRight: 8 }} />
          Add Viewing
        </Title>
      </Space>

      <Card style={{ borderRadius: 12, maxWidth: 900, margin: '0 auto' }}>
        <Form form={form} layout="vertical" initialValues={{ duration_minutes: 30 }}>
          <Row gutter={[16, 0]}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Contact Name"
                name="contact_name"
                rules={[{ required: true, message: 'Please enter contact name' }]}
              >
                <Input placeholder="Enter contact name" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Contact Phone" name="contact_phone">
                <Input placeholder="+971 XX XXX XXXX" addonBefore="+971" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Contact Email" name="contact_email">
                <Input placeholder="Enter email address" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Listing" name="listing_id">
                <Select
                  placeholder="Select listing"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                  options={listings.map((l) => ({
                    value: l.id,
                    label: `${l.reference_no}${l.title_en ? ' - ' + l.title_en : ''}`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Lead" name="lead_id">
                <Select
                  placeholder="Select lead"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)?.toLowerCase().includes(input.toLowerCase()) ?? false
                  }
                  options={leads.map((l) => ({
                    value: l.id,
                    label: l.full_name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Agent" name="agent_id">
                <Select
                  placeholder="Select agent"
                  allowClear
                  options={agents.map((a) => ({
                    value: a.id,
                    label: a.full_name,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Property Address" name="property_address">
                <Input placeholder="Enter property address" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Property Type" name="property_type">
                <Select placeholder="Select type" allowClear>
                  <Select.Option value="Apartment">Apartment</Select.Option>
                  <Select.Option value="Villa">Villa</Select.Option>
                  <Select.Option value="Townhouse">Townhouse</Select.Option>
                  <Select.Option value="Penthouse">Penthouse</Select.Option>
                  <Select.Option value="Studio">Studio</Select.Option>
                  <Select.Option value="Office">Office</Select.Option>
                  <Select.Option value="Land">Land</Select.Option>
                  <Select.Option value="Warehouse">Warehouse</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Area" name="area">
                <Input placeholder="Enter area" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Viewing Date"
                name="viewing_date"
                rules={[{ required: true, message: 'Please select viewing date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Viewing Time"
                name="viewing_time"
                rules={[{ required: true, message: 'Please select viewing time' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Duration" name="duration_minutes">
                <InputNumber
                  min={15}
                  max={120}
                  addonAfter="minutes"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Notes" name="notes">
                <TextArea rows={4} placeholder="Add any notes about the viewing..." />
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" style={{ marginTop: 16 }}>
            <Space>
              <Button onClick={() => navigate('/viewings/list')}>Cancel</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
                style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
              >
                Save Viewing
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default AddViewing;
