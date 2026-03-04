import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  DatePicker,
  Button,
  Table,
  Tag,
  Avatar,
  Space,
  Typography,
  Spin,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { Transaction } from '../../types';
import { transactionsService } from '../../services/supabaseService';
import { supabaseTransactionToTransaction } from '../../utils/typeAdapters';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const PURPOSE_COLOR_MAP: Record<string, string> = {
  'New Project': 'blue',
  Sell: 'green',
  Rent: 'orange',
};

const APPROVAL_COLOR_MAP: Record<string, string> = {
  Pending: 'orange',
  Approved: 'green',
  Rejected: 'red',
};

const formatAED = (value: number): string => {
  return `AED ${value.toLocaleString('en-US')}`;
};

const TransactionList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const txnRes = await transactionsService.getAll();

        if (txnRes.data) {
          setTransactions(txnRes.data.map((t: any) => supabaseTransactionToTransaction(t)));
        }
      } catch (error) {
        console.error('Error fetching transactions data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleReset = () => {
    setSearchText('');
    setDateRange(null);
  };

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    if (searchText) {
      const lower = searchText.toLowerCase();
      data = data.filter((t) => t.id.toLowerCase().includes(lower));
    }

    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((t) => {
        const dealDate = dayjs(t.deal_date);
        return (
          dealDate.isAfter(dateRange[0]!.startOf('day')) &&
          dealDate.isBefore(dateRange[1]!.endOf('day'))
        );
      });
    }

    return data;
  }, [transactions, searchText, dateRange]);

  const columns: ColumnsType<Transaction> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <Text strong>{id}</Text>,
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      width: 130,
      filters: [
        { text: 'New Project', value: 'New Project' },
        { text: 'Sell', value: 'Sell' },
        { text: 'Rent', value: 'Rent' },
      ],
      onFilter: (value, record) => record.purpose === value,
      render: (purpose: string) => (
        <Tag color={PURPOSE_COLOR_MAP[purpose] || 'default'}>{purpose}</Tag>
      ),
    },
    {
      title: 'Deal Date',
      dataIndex: 'deal_date',
      key: 'deal_date',
      sorter: (a, b) => dayjs(a.deal_date).unix() - dayjs(b.deal_date).unix(),
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      render: (_: unknown, record: Transaction) => (
        <Space>
          <Avatar
            size="small"
            style={{ backgroundColor: '#00C4A1' }}
            icon={<UserOutlined />}
          >
            {record.agent?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <Text>{record.agent?.name || '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'Deal Price',
      dataIndex: 'deal_price',
      key: 'deal_price',
      sorter: (a, b) => a.deal_price - b.deal_price,
      render: (price: number) => (
        <Text strong style={{ color: '#00C4A1' }}>
          {formatAED(price)}
        </Text>
      ),
    },
    {
      title: 'Approval Status',
      dataIndex: 'approval_status',
      key: 'approval_status',
      width: 150,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.approval_status === value,
      render: (status: string) => (
        <Tag color={APPROVAL_COLOR_MAP[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: () => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            style={{
              borderColor: '#00C4A1',
              color: '#00C4A1',
            }}
          >
            View
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            style={{
              backgroundColor: '#00C4A1',
              borderColor: '#00C4A1',
            }}
          >
            Edit
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ background: '#f5f7fa', minHeight: '100%', textAlign: 'center', paddingTop: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ background: '#f5f7fa', minHeight: '100%' }}>
      {/* Filter Bar */}
      <Card
        size="small"
        style={{ borderRadius: 12, marginBottom: 16 }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col>
            <Input
              placeholder="Search by ID"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(vals) => setDateRange(vals)}
              style={{ width: 260 }}
              placeholder={['Start date', 'End date']}
            />
          </Col>
          <Col>
            <Button onClick={handleReset}>Reset</Button>
          </Col>
        </Row>
      </Card>

      {/* Transactions Table */}
      <Card
        size="small"
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table<Transaction>
          columns={columns}
          dataSource={filteredTransactions}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} transactions`,
          }}
          style={{ borderRadius: 12 }}
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default TransactionList;
