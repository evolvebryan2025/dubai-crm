import React from 'react';
import { Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTabStore } from '../../stores/useTabStore';

const TabBar: React.FC = () => {
  const navigate = useNavigate();
  const { tabs, activeKey, removeTab, setActiveTab } = useTabStore();

  const handleChange = (key: string) => {
    setActiveTab(key);
    navigate(key);
  };

  const handleEdit = (targetKey: React.MouseEvent | React.KeyboardEvent | string, action: 'add' | 'remove') => {
    if (action === 'remove' && typeof targetKey === 'string') {
      const newActive = removeTab(targetKey);
      navigate(newActive);
    }
  };

  return (
    <div
      style={{
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <Tabs
        type="editable-card"
        hideAdd
        activeKey={activeKey}
        onChange={handleChange}
        onEdit={handleEdit}
        size="small"
        items={tabs.map((tab) => ({
          key: tab.key,
          label: tab.label,
          closable: tab.closable,
        }))}
        style={{ marginBottom: 0 }}
        tabBarStyle={{ marginBottom: 0 }}
      />
    </div>
  );
};

export default TabBar;
