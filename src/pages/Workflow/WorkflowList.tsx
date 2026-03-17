import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Card,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Spin,
  message,
  Popconfirm,
  Input,
  Form,
  Badge,
  Empty,
} from 'antd';
import {
  EditOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import type { Workflow, WorkflowStep } from '../../types';
import { workflowsService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/useAuthStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

const PRIMARY_COLOR = '#00C4A1';

// ---------------------------------------------------------------------------
// Step type to color mapping
// ---------------------------------------------------------------------------
const stepTypeColor: Record<string, string> = {
  start: 'green',
  approval: 'orange',
  end: 'blue',
};

const stepTypeLabel: Record<string, string> = {
  start: 'Start',
  approval: 'Approval',
  end: 'End',
};

const DEFAULT_STEPS: WorkflowStep[] = [
  { id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' },
  { id: 's2', name: 'Approval', type: 'approval', next_step_id: 's3' },
  { id: 's3', name: 'Complete', type: 'end' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const WorkflowList: React.FC = () => {
  const { user } = useAuthStore();

  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [editingSteps, setEditingSteps] = useState<WorkflowStep[]>([]);
  const [saving, setSaving] = useState(false);

  // Create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  // -----------------------------------------------------------------------
  // Fetch workflows
  // -----------------------------------------------------------------------
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await workflowsService.getAll();
      if (error) throw error;
      if (data) {
        setWorkflows(
          data.map((w: any) => ({
            id: w.id,
            name: w.name,
            description: w.description ?? '',
            is_active: w.is_active ?? true,
            steps: Array.isArray(w.steps) ? (w.steps as WorkflowStep[]) : [],
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      message.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -----------------------------------------------------------------------
  // Create workflow
  // -----------------------------------------------------------------------
  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      const { error } = await workflowsService.create({
        name: values.name,
        description: values.description || null,
        steps: DEFAULT_STEPS as any,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
      message.success('Workflow created');
      setCreateModalOpen(false);
      createForm.resetFields();
      fetchData();
    } catch (error: any) {
      if (error?.errorFields) return; // form validation
      console.error('Error creating workflow:', error);
      message.error('Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  // -----------------------------------------------------------------------
  // Delete workflow
  // -----------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    try {
      const { error } = await workflowsService.delete(id);
      if (error) throw error;
      message.success('Workflow deleted');
      fetchData();
    } catch (error) {
      console.error('Error deleting workflow:', error);
      message.error('Failed to delete workflow');
    }
  };

  // -----------------------------------------------------------------------
  // Edit modal
  // -----------------------------------------------------------------------
  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setEditingSteps(workflow.steps.map((s) => ({ ...s })));
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedWorkflow(null);
    setEditingSteps([]);
  };

  const handleStepNameChange = (stepId: string, newName: string) => {
    setEditingSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, name: newName } : s))
    );
  };

  const handleAddStep = () => {
    const newId = `s${Date.now()}`;
    setEditingSteps((prev) => {
      // Insert before the last (end) step, or append
      const endIdx = prev.findIndex((s) => s.type === 'end');
      const newStep: WorkflowStep = {
        id: newId,
        name: 'New Step',
        type: 'approval',
      };

      if (endIdx === -1) {
        return [...prev, newStep];
      }

      // Link the previous step to new step, new step to end step
      const updated = [...prev];
      const endStep = updated[endIdx];

      // Find step that points to the end step
      const prevStep = updated.find((s) => s.next_step_id === endStep.id);
      if (prevStep) {
        prevStep.next_step_id = newId;
      }
      newStep.next_step_id = endStep.id;

      updated.splice(endIdx, 0, newStep);
      return updated;
    });
  };

  const handleRemoveStep = (stepId: string) => {
    setEditingSteps((prev) => {
      const step = prev.find((s) => s.id === stepId);
      if (!step || step.type === 'start' || step.type === 'end') return prev;

      // Re-link: find step that points to this one, point it to this step's next
      const updated = prev
        .filter((s) => s.id !== stepId)
        .map((s) =>
          s.next_step_id === stepId
            ? { ...s, next_step_id: step.next_step_id }
            : s
        );
      return updated;
    });
  };

  const handleSaveSteps = async () => {
    if (!selectedWorkflow) return;
    setSaving(true);
    try {
      const { error } = await workflowsService.update(selectedWorkflow.id, {
        steps: editingSteps as any,
      });
      if (error) throw error;
      message.success('Workflow steps saved');
      handleClose();
      fetchData();
    } catch (error) {
      console.error('Error saving steps:', error);
      message.error('Failed to save steps');
    } finally {
      setSaving(false);
    }
  };

  // -----------------------------------------------------------------------
  // Table columns
  // -----------------------------------------------------------------------
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => (
        <Text strong>#{id.length > 6 ? id.slice(0, 6) : id}</Text>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text style={{ fontWeight: 500 }}>{name}</Text>,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Text type="secondary">{desc || '-'}</Text>
      ),
    },
    {
      title: 'Steps',
      dataIndex: 'steps',
      key: 'steps',
      width: 100,
      align: 'center' as const,
      render: (steps: WorkflowStep[]) => (
        <Badge
          count={steps.length}
          style={{ backgroundColor: PRIMARY_COLOR }}
          showZero
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      align: 'center' as const,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      align: 'center' as const,
      render: (_: unknown, record: any) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this workflow?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Order steps by following next_step_id chain
  const getOrderedSteps = (steps: WorkflowStep[]): WorkflowStep[] => {
    if (steps.length === 0) return [];

    // Find the start step
    const startStep = steps.find((s) => s.type === 'start');
    if (!startStep) return steps;

    const ordered: WorkflowStep[] = [startStep];
    const stepMap = new Map(steps.map((s) => [s.id, s]));
    let current = startStep;

    while (current.next_step_id) {
      const next = stepMap.get(current.next_step_id);
      if (!next) break;
      ordered.push(next);
      current = next;
    }

    return ordered;
  };

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      {/* Page title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>
          Workflows
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR, borderRadius: 8 }}
          onClick={() => setCreateModalOpen(true)}
        >
          Add Workflow
        </Button>
      </div>

      {/* ----------------------------------------------------------------
          WORKFLOW TABLE
          ---------------------------------------------------------------- */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
          </div>
        ) : workflows.length === 0 ? (
          <div style={{ padding: 60 }}>
            <Empty description="No workflows found" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={workflows}
            rowKey="id"
            pagination={false}
            size="middle"
          />
        )}
      </Card>

      {/* ----------------------------------------------------------------
          CREATE WORKFLOW MODAL
          ---------------------------------------------------------------- */}
      <Modal
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={creating}
        title="Create Workflow"
        okText="Create"
        okButtonProps={{ style: { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR } }}
      >
        <Form form={createForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter a workflow name' }]}
          >
            <Input placeholder="e.g. Transaction Approval" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Describe the workflow..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* ----------------------------------------------------------------
          WORKFLOW EDITOR MODAL
          ---------------------------------------------------------------- */}
      <Modal
        open={modalOpen}
        onCancel={handleClose}
        footer={
          <Space>
            <Button onClick={handleClose}>Close</Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
              onClick={handleSaveSteps}
            >
              Save Steps
            </Button>
          </Space>
        }
        width={800}
        title={
          <Space>
            <span>Workflow Editor</span>
            {selectedWorkflow && (
              <Tag color={PRIMARY_COLOR}>
                #{selectedWorkflow.id.length > 6 ? selectedWorkflow.id.slice(0, 6) : selectedWorkflow.id} - {selectedWorkflow.name}
              </Tag>
            )}
          </Space>
        }
        closeIcon={<CloseOutlined />}
        styles={{ body: { padding: '24px 16px' } }}
      >
        {selectedWorkflow && (
          <>
            {/* Visual workflow flow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflowX: 'auto',
                padding: '24px 0',
                gap: 0,
              }}
            >
              {getOrderedSteps(editingSteps).map((step, idx, arr) => (
                <React.Fragment key={step.id}>
                  {/* Step Card */}
                  <Card
                    size="small"
                    style={{
                      minWidth: 150,
                      maxWidth: 180,
                      borderRadius: 12,
                      border: `2px solid ${
                        step.type === 'start'
                          ? '#52c41a'
                          : step.type === 'approval'
                          ? '#faad14'
                          : '#1890ff'
                      }`,
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                    styles={{
                      body: {
                        padding: '16px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 8,
                      },
                    }}
                  >
                    <Input
                      value={step.name}
                      onChange={(e) => handleStepNameChange(step.id, e.target.value)}
                      style={{ textAlign: 'center', fontWeight: 600, fontSize: 14 }}
                      variant="borderless"
                    />
                    <Tag color={stepTypeColor[step.type] || 'default'}>
                      {stepTypeLabel[step.type] || step.type}
                    </Tag>
                    {step.type === 'approval' && (
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveStep(step.id)}
                      />
                    )}
                  </Card>

                  {/* Arrow connector (not after last step) */}
                  {idx < arr.length - 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 8px',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 2,
                          backgroundColor: '#d9d9d9',
                        }}
                      />
                      <ArrowRightOutlined style={{ fontSize: 18, color: '#8c8c8c' }} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Add step button */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddStep}
                style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
              >
                Add Step
              </Button>
            </div>

            {/* Step details table */}
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Step Details
              </Title>
              <Row gutter={[12, 12]}>
                {getOrderedSteps(editingSteps).map((step, idx) => (
                  <Col xs={24} sm={12} md={8} key={step.id}>
                    <Card
                      size="small"
                      style={{ borderRadius: 8, height: '100%' }}
                      styles={{ body: { padding: 12 } }}
                    >
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Step {idx + 1}
                          </Text>
                          <Tag color={stepTypeColor[step.type] || 'default'} style={{ fontSize: 11 }}>
                            {stepTypeLabel[step.type] || step.type}
                          </Tag>
                        </div>
                        <Input
                          size="small"
                          value={step.name}
                          onChange={(e) => handleStepNameChange(step.id, e.target.value)}
                          style={{ fontWeight: 600 }}
                        />
                        {step.next_step_id && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Next: {editingSteps.find((s) => s.id === step.next_step_id)?.name || '-'}
                          </Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default WorkflowList;
