import React, { useState } from 'react';
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
} from 'antd';
import {
  EditOutlined,
  ArrowRightOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { Workflow, WorkflowStep } from '../../types';

// Inline mock data - no Supabase table for workflows
const mockWorkflows: Workflow[] = [
  { id: '1993', name: 'Transaction', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Manager Review', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Finance Review', type: 'approval', next_step_id: 's4' }, { id: 's4', name: 'Complete', type: 'end' }] },
  { id: '1997', name: 'Commission', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Approval', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Complete', type: 'end' }] },
  { id: '2000', name: 'Portals', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Review', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Published', type: 'end' }] },
  { id: '1995', name: 'Listings Status', steps: [{ id: 's1', name: 'Request', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Approve', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Done', type: 'end' }] },
  { id: '2004', name: 'Listings Update', steps: [{ id: 's1', name: 'Submit', type: 'start', next_step_id: 's2' }, { id: 's2', name: 'Review', type: 'approval', next_step_id: 's3' }, { id: 's3', name: 'Updated', type: 'end' }] },
];

const { Title, Text } = Typography;

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const WorkflowList: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  const handleEdit = (workflow: Workflow) => {
    setSelectedWorkflow(workflow);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSelectedWorkflow(null);
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <Text strong>#{id}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text style={{ fontWeight: 500 }}>{name}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      align: 'center' as const,
      render: (_: unknown, record: Workflow) => (
        <Button
          type="primary"
          icon={<EditOutlined />}
          size="small"
          style={{ backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }}
          onClick={() => handleEdit(record)}
        >
          Edit
        </Button>
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
      <Title level={4} style={{ margin: 0, marginBottom: 20 }}>
        Workflows
      </Title>

      {/* ----------------------------------------------------------------
          WORKFLOW TABLE
          ---------------------------------------------------------------- */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={mockWorkflows}
          rowKey="id"
          pagination={false}
          size="middle"
        />
      </Card>

      {/* ----------------------------------------------------------------
          WORKFLOW EDITOR MODAL
          ---------------------------------------------------------------- */}
      <Modal
        open={modalOpen}
        onCancel={handleClose}
        footer={null}
        width={800}
        title={
          <Space>
            <span>Workflow Editor</span>
            {selectedWorkflow && (
              <Tag color={PRIMARY_COLOR}>#{selectedWorkflow.id} - {selectedWorkflow.name}</Tag>
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
              {getOrderedSteps(selectedWorkflow.steps).map((step, idx, arr) => (
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
                    <Text strong style={{ fontSize: 14 }}>
                      {step.name}
                    </Text>
                    <Tag color={stepTypeColor[step.type] || 'default'}>
                      {stepTypeLabel[step.type] || step.type}
                    </Tag>
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

            {/* Step details table */}
            <div style={{ marginTop: 24 }}>
              <Title level={5} style={{ marginBottom: 12 }}>
                Step Details
              </Title>
              <Row gutter={[12, 12]}>
                {getOrderedSteps(selectedWorkflow.steps).map((step, idx) => (
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
                        <Text strong>{step.name}</Text>
                        {step.next_step_id && (
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            Next: {selectedWorkflow.steps.find((s) => s.id === step.next_step_id)?.name || '-'}
                          </Text>
                        )}
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Close button */}
            <div style={{ textAlign: 'right', marginTop: 24 }}>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default WorkflowList;
