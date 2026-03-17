import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Button,
  Card,
  Row,
  Col,
  Typography,
  message,
  Space,
} from 'antd';
import {
  CheckCircleOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { tasksService, profilesService, leadsService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title } = Typography;
const { TextArea } = Input;

interface UserOption {
  id: string;
  name: string;
}

interface LeadOption {
  id: string;
  name: string;
}

const AddTask: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, leadsRes] = await Promise.all([
          profilesService.getAll(),
          leadsService.getAll(),
        ]);

        if (usersRes.data) {
          setUsers(
            usersRes.data.map((u: any) => ({
              id: u.id,
              name: u.full_name,
            }))
          );
        }

        if (leadsRes.data) {
          setLeads(
            leadsRes.data.map((l: any) => ({
              id: l.id,
              name: l.name || l.full_name || `Lead #${l.id.substring(0, 8)}`,
            }))
          );
        }
      } catch {
        message.error('Failed to load form data');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      form.setFieldsValue({ assigned_to: user.id });
    }
  }, [user, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description || null,
        type: values.type,
        priority: values.priority,
        assigned_to: values.assigned_to,
        due_date: values.due_date ? dayjs(values.due_date).format('YYYY-MM-DD') : null,
        due_time: values.due_time ? dayjs(values.due_time).format('HH:mm') : null,
        reminder_at: values.reminder_at ? dayjs(values.reminder_at).toISOString() : null,
        lead_id: values.lead_id || null,
        created_by: user?.id || null,
        status: 'pending',
      };

      const { error } = await tasksService.create(payload as any);
      if (error) throw error;

      message.success('Task created successfully');
      navigate('/tasks/list');
    } catch (err: any) {
      if (err?.errorFields) return; // Form validation error
      message.error('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/tasks/list')}
            >
              Back
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              <CheckCircleOutlined style={{ marginRight: 8, color: '#00C4A1' }} />
              Add Task
            </Title>
          </Space>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12, maxWidth: 900, margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ priority: 'medium' }}
        >
          <Row gutter={24}>
            <Col xs={24}>
              <Form.Item
                name="title"
                label="Title"
                rules={[{ required: true, message: 'Please enter a task title' }]}
              >
                <Input placeholder="Enter task title" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <TextArea rows={3} placeholder="Enter task description" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="type"
                label="Type"
                rules={[{ required: true, message: 'Please select a task type' }]}
              >
                <Select placeholder="Select type">
                  <Select.Option value="follow_up">Follow Up</Select.Option>
                  <Select.Option value="viewing">Viewing</Select.Option>
                  <Select.Option value="call">Call</Select.Option>
                  <Select.Option value="meeting">Meeting</Select.Option>
                  <Select.Option value="email">Email</Select.Option>
                  <Select.Option value="other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="priority"
                label="Priority"
                rules={[{ required: true, message: 'Please select a priority' }]}
              >
                <Select placeholder="Select priority">
                  <Select.Option value="low">Low</Select.Option>
                  <Select.Option value="medium">Medium</Select.Option>
                  <Select.Option value="high">High</Select.Option>
                  <Select.Option value="urgent">Urgent</Select.Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="assigned_to"
                label="Assigned To"
                rules={[{ required: true, message: 'Please select an assignee' }]}
              >
                <Select
                  placeholder="Select assignee"
                  showSearch
                  optionFilterProp="children"
                >
                  {users.map((u) => (
                    <Select.Option key={u.id} value={u.id}>
                      {u.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="due_date"
                label="Due Date"
                rules={[{ required: true, message: 'Please select a due date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="due_time" label="Due Time">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="reminder_at" label="Reminder">
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="lead_id" label="Related Lead">
                <Select
                  placeholder="Select lead (optional)"
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {leads.map((l) => (
                    <Select.Option key={l.id} value={l.id}>
                      {l.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row justify="end" style={{ marginTop: 24 }}>
            <Space>
              <Button onClick={() => navigate('/tasks/list')}>Cancel</Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSubmit}
                loading={loading}
                style={{ backgroundColor: '#00C4A1', borderColor: '#00C4A1' }}
              >
                Save Task
              </Button>
            </Space>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default AddTask;
