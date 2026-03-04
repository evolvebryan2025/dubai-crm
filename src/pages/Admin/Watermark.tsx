import React, { useState } from 'react';
import {
  Card,
  Switch,
  Select,
  Slider,
  Upload,
  Typography,
  Space,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  InboxOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Dragger } = Upload;
const TEAL = '#00C4A1';

type WatermarkPosition = 'center' | 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

const POSITION_OPTIONS = [
  { label: 'Center', value: 'center' },
  { label: 'Bottom Right', value: 'bottom-right' },
  { label: 'Bottom Left', value: 'bottom-left' },
  { label: 'Top Right', value: 'top-right' },
  { label: 'Top Left', value: 'top-left' },
];

const Watermark: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [position, setPosition] = useState<WatermarkPosition>('center');
  const [opacity, setOpacity] = useState(50);

  const getWatermarkStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      position: 'absolute',
      color: `rgba(255, 255, 255, ${opacity / 100})`,
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: 2,
      textShadow: `0 1px 3px rgba(0, 0, 0, ${opacity / 200})`,
      pointerEvents: 'none',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    };

    switch (position) {
      case 'center':
        return {
          ...base,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-25deg)',
        };
      case 'bottom-right':
        return {
          ...base,
          bottom: 12,
          right: 12,
          fontSize: 18,
        };
      case 'bottom-left':
        return {
          ...base,
          bottom: 12,
          left: 12,
          fontSize: 18,
        };
      case 'top-right':
        return {
          ...base,
          top: 12,
          right: 12,
          fontSize: 18,
        };
      case 'top-left':
        return {
          ...base,
          top: 12,
          left: 12,
          fontSize: 18,
        };
      default:
        return {
          ...base,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(-25deg)',
        };
    }
  };

  return (
    <div style={{ padding: 24, background: '#f5f7fa', minHeight: '100%' }}>
      <h2 style={{ margin: 0, marginBottom: 20, fontWeight: 600, fontSize: 22 }}>
        Watermark
      </h2>

      <Card
        style={{ borderRadius: 12, maxWidth: 800 }}
      >
        <Title level={4} style={{ marginTop: 0 }}>
          Watermark Settings
        </Title>

        {/* Enable Toggle */}
        <div style={{ marginBottom: 24 }}>
          <Space size={12} align="center">
            <Switch
              checked={enabled}
              onChange={setEnabled}
              style={{ backgroundColor: enabled ? TEAL : undefined }}
            />
            <Text strong style={{ fontSize: 15 }}>
              Enable Watermark
            </Text>
          </Space>
          <div style={{ fontSize: 13, color: '#999', marginTop: 4, marginLeft: 56 }}>
            {enabled
              ? 'Watermark will be applied to all property images'
              : 'Watermark is currently disabled'}
          </div>
        </div>

        {enabled && (
          <>
            <Divider />

            {/* Upload Watermark Image */}
            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>
                Watermark Image
              </Text>
              <Dragger
                name="watermark"
                multiple={false}
                accept="image/*"
                beforeUpload={() => false}
                style={{ borderRadius: 8 }}
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined style={{ color: TEAL, fontSize: 36 }} />
                </p>
                <p className="ant-upload-text">
                  Click or drag an image to upload
                </p>
                <p className="ant-upload-hint" style={{ fontSize: 12 }}>
                  Supports PNG with transparency for best results
                </p>
              </Dragger>
            </div>

            {/* Position Select */}
            <Row gutter={24} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Position
                </Text>
                <Select
                  value={position}
                  onChange={(val) => setPosition(val)}
                  style={{ width: '100%' }}
                  options={POSITION_OPTIONS}
                />
              </Col>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  Opacity: {opacity}%
                </Text>
                <Slider
                  min={0}
                  max={100}
                  value={opacity}
                  onChange={setOpacity}
                  tooltip={{ formatter: (val) => `${val}%` }}
                  styles={{
                    track: { background: TEAL },
                  }}
                />
              </Col>
            </Row>

            <Divider />

            {/* Preview Section */}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 12, fontSize: 15 }}>
                Preview
              </Text>
              <div
                style={{
                  position: 'relative',
                  width: 300,
                  height: 200,
                  backgroundColor: '#b0b8c4',
                  borderRadius: 10,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e0e0e0',
                }}
              >
                {/* Placeholder text */}
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    textAlign: 'center',
                    zIndex: 1,
                    opacity: 0.8,
                  }}
                >
                  Property Image Preview
                </Text>

                {/* Watermark overlay */}
                <div style={getWatermarkStyle()}>
                  RealCRM
                </div>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                This preview demonstrates how the watermark will appear on property images.
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default Watermark;
