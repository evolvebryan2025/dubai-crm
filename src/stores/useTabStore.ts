import { create } from 'zustand';
import type { TabItem } from '../types';

interface TabState {
  tabs: TabItem[];
  activeKey: string;
  addTab: (tab: TabItem) => void;
  removeTab: (key: string) => string;
  setActiveTab: (key: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [{ key: '/index', label: 'Dashboard', path: '/index', closable: false }],
  activeKey: '/index',

  addTab: (tab: TabItem) => {
    const { tabs } = get();
    const exists = tabs.find((t) => t.key === tab.key);
    if (!exists) {
      set({ tabs: [...tabs, tab], activeKey: tab.key });
    } else {
      set({ activeKey: tab.key });
    }
  },

  removeTab: (key: string) => {
    const { tabs, activeKey } = get();
    const filtered = tabs.filter((t) => t.key !== key);
    let newActive = activeKey;
    if (activeKey === key) {
      const idx = tabs.findIndex((t) => t.key === key);
      newActive = filtered[Math.min(idx, filtered.length - 1)]?.key || '/index';
    }
    set({ tabs: filtered, activeKey: newActive });
    return newActive;
  },

  setActiveTab: (key: string) => set({ activeKey: key }),
}));
