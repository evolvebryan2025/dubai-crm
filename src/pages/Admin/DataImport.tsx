import React, { useState } from 'react';
import {
  Card,
  Select,
  Upload,
  Button,
  Table,
  Typography,
  Space,
  Divider,
  Progress,
  message,
} from 'antd';
import {
  InboxOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const TEAL = '#00C4A1';

type ImportType = 'leads' | 'sell_listings' | 'rent_listings' | 'owners' | 'contacts';

const IMPORT_TYPE_OPTIONS = [
  { label: 'Leads', value: 'leads' },
  { label: 'Sell Listings', value: 'sell_listings' },
  { label: 'Rent Listings', value: 'rent_listings' },
  { label: 'Owners', value: 'owners' },
  { label: 'Contacts', value: 'contacts' },
];

const MOCK_PREVIEW_DATA: Record<ImportType, { columns: ColumnsType<Record<string, string>>; data: Record<string, string>[] }> = {
  leads: {
    columns: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'Lead Type', dataIndex: 'lead_type', key: 'lead_type' },
      { title: 'Budget', dataIndex: 'budget', key: 'budget' },
      { title: 'Location', dataIndex: 'location', key: 'location' },
    ],
    data: [
      { key: '1', name: 'John Smith', email: 'john@email.com', phone: '+971501111111', lead_type: 'Buy', budget: '2,500,000', location: 'Dubai Marina' },
      { key: '2', name: 'Anna Lee', email: 'anna@email.com', phone: '+971502222222', lead_type: 'Rent', budget: '120,000', location: 'Downtown Dubai' },
      { key: '3', name: 'Omar Al Khatib', email: 'omar@email.com', phone: '+971503333333', lead_type: 'Buy', budget: '4,000,000', location: 'Palm Jumeirah' },
      { key: '4', name: 'Maria Santos', email: 'maria@email.com', phone: '+971504444444', lead_type: 'Buy', budget: '1,800,000', location: 'Business Bay' },
      { key: '5', name: 'Raj Patel', email: 'raj@email.com', phone: '+971505555555', lead_type: 'Rent', budget: '95,000', location: 'JBR' },
    ],
  },
  sell_listings: {
    columns: [
      { title: 'Listing ID', dataIndex: 'listing_id', key: 'listing_id' },
      { title: 'Property Type', dataIndex: 'property_type', key: 'property_type' },
      { title: 'Community', dataIndex: 'community', key: 'community' },
      { title: 'Bedrooms', dataIndex: 'bedrooms', key: 'bedrooms' },
      { title: 'Price (AED)', dataIndex: 'price', key: 'price' },
      { title: 'Status', dataIndex: 'status', key: 'status' },
    ],
    data: [
      { key: '1', listing_id: 'SL-001', property_type: 'Apartment', community: 'Dubai Marina', bedrooms: '2', price: '2,800,000', status: 'Active' },
      { key: '2', listing_id: 'SL-002', property_type: 'Villa', community: 'Palm Jumeirah', bedrooms: '5', price: '15,000,000', status: 'Active' },
      { key: '3', listing_id: 'SL-003', property_type: 'Apartment', community: 'Business Bay', bedrooms: '1', price: '1,500,000', status: 'Active' },
      { key: '4', listing_id: 'SL-004', property_type: 'Townhouse', community: 'Dubai Hills', bedrooms: '3', price: '3,200,000', status: 'Active' },
      { key: '5', listing_id: 'SL-005', property_type: 'Penthouse', community: 'Downtown Dubai', bedrooms: '4', price: '25,000,000', status: 'Sold' },
    ],
  },
  rent_listings: {
    columns: [
      { title: 'Listing ID', dataIndex: 'listing_id', key: 'listing_id' },
      { title: 'Property Type', dataIndex: 'property_type', key: 'property_type' },
      { title: 'Community', dataIndex: 'community', key: 'community' },
      { title: 'Bedrooms', dataIndex: 'bedrooms', key: 'bedrooms' },
      { title: 'Rent (AED)', dataIndex: 'rent', key: 'rent' },
      { title: 'Frequency', dataIndex: 'frequency', key: 'frequency' },
    ],
    data: [
      { key: '1', listing_id: 'RL-001', property_type: 'Apartment', community: 'Dubai Marina', bedrooms: '2', rent: '140,000', frequency: 'Yearly' },
      { key: '2', listing_id: 'RL-002', property_type: 'Villa', community: 'Dubai Hills', bedrooms: '4', rent: '280,000', frequency: 'Yearly' },
      { key: '3', listing_id: 'RL-003', property_type: 'Apartment', community: 'JBR', bedrooms: '1', rent: '95,000', frequency: 'Yearly' },
      { key: '4', listing_id: 'RL-004', property_type: 'Studio', community: 'Business Bay', bedrooms: 'Studio', rent: '65,000', frequency: 'Yearly' },
      { key: '5', listing_id: 'RL-005', property_type: 'Apartment', community: 'Downtown Dubai', bedrooms: '3', rent: '200,000', frequency: 'Yearly' },
    ],
  },
  owners: {
    columns: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'Nationality', dataIndex: 'nationality', key: 'nationality' },
      { title: 'Source', dataIndex: 'source', key: 'source' },
    ],
    data: [
      { key: '1', name: 'Sheikh Abdullah', email: 'abdullah@email.com', phone: '+971551234567', nationality: 'UAE', source: 'Direct' },
      { key: '2', name: 'Chen Wei', email: 'chen@email.com', phone: '+8613912345678', nationality: 'Chinese', source: 'Referral' },
      { key: '3', name: 'Alexander Volkov', email: 'alex@email.com', phone: '+79261234567', nationality: 'Russian', source: 'Website' },
      { key: '4', name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+447912345678', nationality: 'British', source: 'Direct' },
      { key: '5', name: 'Ali Hassan', email: 'ali@email.com', phone: '+971559876543', nationality: 'UAE', source: 'Referral' },
    ],
  },
  contacts: {
    columns: [
      { title: 'Name', dataIndex: 'name', key: 'name' },
      { title: 'Email', dataIndex: 'email', key: 'email' },
      { title: 'Phone', dataIndex: 'phone', key: 'phone' },
      { title: 'Company', dataIndex: 'company', key: 'company' },
      { title: 'Type', dataIndex: 'type', key: 'type' },
    ],
    data: [
      { key: '1', name: 'David Kim', email: 'david@company.com', phone: '+821012345678', company: 'ABC Corp', type: 'Client' },
      { key: '2', name: 'Fatima Al Zahrani', email: 'fatima@company.com', phone: '+966551234567', company: 'XYZ Ltd', type: 'Partner' },
      { key: '3', name: 'James Brown', email: 'james.b@email.com', phone: '+14155551234', company: 'Global RE', type: 'Vendor' },
      { key: '4', name: 'Nina Petrova', email: 'nina@email.com', phone: '+79165554321', company: 'East Properties', type: 'Client' },
      { key: '5', name: 'Mohammed Raza', email: 'raza@email.com', phone: '+923001234567', company: 'Zain Group', type: 'Partner' },
    ],
  },
};

const INSTRUCTIONS: Record<ImportType, string[]> = {
  leads: [
    'Download the Leads import template using the button below.',
    'Fill in the required columns: Name, Email, Phone, Lead Type, Budget, Location.',
    'Optional columns include: Preferred Rooms, Property Type, Source, Nationality, Agent ID.',
    'Save the file as CSV (.csv) or Excel (.xlsx, .xls) format.',
    'Upload the file using the drag-and-drop area above.',
    'Review the preview to ensure data accuracy before importing.',
  ],
  sell_listings: [
    'Download the Sell Listings import template using the button below.',
    'Fill in the required columns: Listing ID, Property Type, Community, Bedrooms, Price.',
    'Optional columns include: Building, Floor, Unit No, Agent ID, Status, Amenities.',
    'Save the file as CSV (.csv) or Excel (.xlsx, .xls) format.',
    'Upload the file using the drag-and-drop area above.',
    'Review the preview to ensure data accuracy before importing.',
  ],
  rent_listings: [
    'Download the Rent Listings import template using the button below.',
    'Fill in the required columns: Listing ID, Property Type, Community, Bedrooms, Rental Price, Frequency.',
    'Optional columns include: Building, Floor, Unit No, Agent ID, Status, Cheques.',
    'Save the file as CSV (.csv) or Excel (.xlsx, .xls) format.',
    'Upload the file using the drag-and-drop area above.',
    'Review the preview to ensure data accuracy before importing.',
  ],
  owners: [
    'Download the Owners import template using the button below.',
    'Fill in the required columns: Name, Phone, Country Code.',
    'Optional columns include: Email, Nationality, Gender, Birthdate, Source, Spoken Languages.',
    'Save the file as CSV (.csv) or Excel (.xlsx, .xls) format.',
    'Upload the file using the drag-and-drop area above.',
    'Review the preview to ensure data accuracy before importing.',
  ],
  contacts: [
    'Download the Contacts import template using the button below.',
    'Fill in the required columns: Name, Email, Phone.',
    'Optional columns include: Company, Type, Notes.',
    'Save the file as CSV (.csv) or Excel (.xlsx, .xls) format.',
    'Upload the file using the drag-and-drop area above.',
    'Review the preview to ensure data accuracy before importing.',
  ],
};

const DataImport: React.FC = () => {
  const [importType, setImportType] = useState<ImportType>('leads');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const handleUploadChange = (info: { fileList: UploadFile[] }) => {
    setFileList(info.fileList);
    if (info.fileList.length > 0) {
      setShowPreview(true);
      setImporting(false);
      setImportProgress(0);
    } else {
      setShowPreview(false);
    }
  };

  const handleImport = () => {
    setImporting(true);
    setImportProgress(0);

    // Simulate import progress
    const interval = setInterval(() => {
      setImportProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          message.success('Data imported successfully!');
          setImporting(false);
          setShowPreview(false);
          setFileList([]);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setFileList([]);
    setImporting(false);
    setImportProgress(0);
  };

  const handleDownloadTemplate = () => {
    const typeLabel = IMPORT_TYPE_OPTIONS.find((o) => o.value === importType)?.label || importType;
    message.info(`Downloading ${typeLabel} template...`);
  };

  const previewData = MOCK_PREVIEW_DATA[importType];

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      <h2 style={{ margin: 0, marginBottom: 20, fontWeight: 600, fontSize: 22 }}>
        Data Import
      </h2>

      <Card style={{ borderRadius: 12, maxWidth: 900 }}>
        <Title level={4} style={{ marginTop: 0 }}>
          Import Data
        </Title>

        {/* Import Type Select */}
        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Select Import Type
          </Text>
          <Select
            value={importType}
            onChange={(val) => {
              setImportType(val);
              setShowPreview(false);
              setFileList([]);
              setImporting(false);
              setImportProgress(0);
            }}
            style={{ width: 300 }}
            options={IMPORT_TYPE_OPTIONS}
            size="large"
          />
        </div>

        {/* File Upload */}
        <div style={{ marginBottom: 24 }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Upload File
          </Text>
          <Dragger
            name="file"
            multiple={false}
            accept=".csv,.xlsx,.xls"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false}
            style={{ borderRadius: 8 }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ color: TEAL, fontSize: 36 }} />
            </p>
            <p className="ant-upload-text">
              Click or drag a CSV/Excel file to upload
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 12 }}>
              Supported formats: .csv, .xlsx, .xls
            </p>
          </Dragger>
        </div>

        <Divider />

        {/* Instructions */}
        <div style={{ marginBottom: 24 }}>
          <Space style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 15 }}>
              Instructions
            </Text>
            <Button
              type="link"
              icon={<DownloadOutlined />}
              style={{ color: TEAL, padding: 0 }}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </Space>
          <div
            style={{
              backgroundColor: '#f9fafb',
              borderRadius: 8,
              padding: 16,
              border: '1px solid #f0f0f0',
            }}
          >
            {INSTRUCTIONS[importType].map((step, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: index < INSTRUCTIONS[importType].length - 1 ? 8 : 0,
                }}
              >
                <Text
                  strong
                  style={{
                    color: TEAL,
                    fontSize: 13,
                    minWidth: 20,
                  }}
                >
                  {index + 1}.
                </Text>
                <Text style={{ fontSize: 13 }}>{step}</Text>
              </div>
            ))}
          </div>
        </div>

        {/* Preview Table */}
        {showPreview && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 12 }}>
                <FileExcelOutlined style={{ color: TEAL, fontSize: 18 }} />
                <Text strong style={{ fontSize: 15 }}>
                  Preview (First 5 Rows)
                </Text>
              </Space>
              <Table
                columns={previewData.columns}
                dataSource={previewData.data}
                pagination={false}
                size="small"
                bordered
                scroll={{ x: 600 }}
                style={{ borderRadius: 8 }}
              />
            </div>

            {/* Import Progress */}
            {importing && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Import Progress
                </Text>
                <Progress
                  percent={importProgress}
                  status={importProgress < 100 ? 'active' : 'success'}
                  strokeColor={TEAL}
                />
              </div>
            )}

            {/* Action Buttons */}
            <Space>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                style={{ backgroundColor: TEAL, borderColor: TEAL }}
                onClick={handleImport}
                loading={importing && importProgress < 100}
                disabled={importing && importProgress < 100}
              >
                Import
              </Button>
              <Button onClick={handleCancel} disabled={importing && importProgress < 100}>
                Cancel
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default DataImport;
