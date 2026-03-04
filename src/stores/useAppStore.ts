import { create } from 'zustand';

interface AppState {
  sidebarCollapsed: boolean;
  language: 'en' | 'ar' | 'cn';
  notifications: { id: string; title: string; message: string; read: boolean; created_at: string }[];
  toggleSidebar: () => void;
  setLanguage: (lang: 'en' | 'ar' | 'cn') => void;
  markNotificationRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  language: 'en',
  notifications: [
    { id: '1', title: 'New Lead Assigned', message: 'A new buy lead has been assigned to you', read: false, created_at: new Date().toISOString() },
    { id: '2', title: 'Transaction Approved', message: 'Transaction #1023 has been approved', read: false, created_at: new Date().toISOString() },
    { id: '3', title: 'Follow-up Reminder', message: 'Follow up with Ahmed Al Maktoum', read: true, created_at: new Date().toISOString() },
  ],

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setLanguage: (language) => set({ language }),
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
}));
