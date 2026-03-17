import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import AppLayout from './components/Layout/AppLayout';
import { useAuthStore } from './stores/useAuthStore';

const Login = lazy(() => import('./pages/Auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AreasList = lazy(() => import('./pages/Areas/AreasList'));
const AreaDetail = lazy(() => import('./pages/Areas/AreaDetail'));
const ProjectList = lazy(() => import('./pages/NewProjects/ProjectList'));
const AddProject = lazy(() => import('./pages/NewProjects/AddProject'));
const SellList = lazy(() => import('./pages/SellListings/SellList'));
const AddSell = lazy(() => import('./pages/SellListings/AddSell'));
const RentList = lazy(() => import('./pages/RentListings/RentList'));
const AddRent = lazy(() => import('./pages/RentListings/AddRent'));
const OwnerList = lazy(() => import('./pages/Owners/OwnerList'));
const AddOwner = lazy(() => import('./pages/Owners/AddOwner'));
const BuyLeads = lazy(() => import('./pages/Leads/BuyLeads'));
const RentLeads = lazy(() => import('./pages/Leads/RentLeads'));
const PortalsLeads = lazy(() => import('./pages/Leads/PortalsLeads'));
const AddLead = lazy(() => import('./pages/Leads/AddLead'));
const DatabasePage = lazy(() => import('./pages/Database/DatabasePage'));
const TransactionList = lazy(() => import('./pages/Transactions/TransactionList'));
const AddTransaction = lazy(() => import('./pages/Transactions/AddTransaction'));
const TransactionApproval = lazy(() => import('./pages/Approval/TransactionApproval'));
const CommissionApproval = lazy(() => import('./pages/Approval/CommissionApproval'));
const PortalsApproval = lazy(() => import('./pages/Approval/PortalsApproval'));
const ListingsStatus = lazy(() => import('./pages/Approval/ListingsStatus'));
const ListingsUpdate = lazy(() => import('./pages/Approval/ListingsUpdate'));
const KPIContacts = lazy(() => import('./pages/KPI/KPIContacts'));
const KPIViewings = lazy(() => import('./pages/KPI/KPIViewings'));
const KPIInsightBoard = lazy(() => import('./pages/KPI/KPIInsightBoard'));
const Staff = lazy(() => import('./pages/Admin/Staff'));
const Teams = lazy(() => import('./pages/Admin/Teams'));
const Roles = lazy(() => import('./pages/Admin/Roles'));
const Watermark = lazy(() => import('./pages/Admin/Watermark'));
const Integrations = lazy(() => import('./pages/Admin/Integrations'));
const DataImport = lazy(() => import('./pages/Admin/DataImport'));
const ContactList = lazy(() => import('./pages/Contacts/ContactList'));
const AddContact = lazy(() => import('./pages/Contacts/AddContact'));
const ViewingsList = lazy(() => import('./pages/Viewings/ViewingsList'));
const AddViewing = lazy(() => import('./pages/Viewings/AddViewing'));
const TasksList = lazy(() => import('./pages/Tasks/TasksList'));
const AddTask = lazy(() => import('./pages/Tasks/AddTask'));
const CalendarPage = lazy(() => import('./pages/Calendar/CalendarPage'));
const DevelopersList = lazy(() => import('./pages/Developers/DevelopersList'));
const AddDeveloper = lazy(() => import('./pages/Developers/AddDeveloper'));
const FinanceDashboard = lazy(() => import('./pages/Finance/FinanceDashboard'));
const NotificationCenter = lazy(() => import('./pages/Notifications/NotificationCenter'));
const WorkflowList = lazy(() => import('./pages/Workflow/WorkflowList'));
const CommunicationLog = lazy(() => import('./pages/Communications/CommunicationLog'));

const LoadingFallback: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" />
  </div>
);

const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return <LoadingFallback />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) return <LoadingFallback />;

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#00C4A1',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Menu: {
            darkItemBg: 'transparent',
            darkItemColor: 'rgba(255,255,255,0.75)',
            darkItemHoverBg: 'rgba(0,196,161,0.15)',
            darkItemSelectedBg: 'rgba(0,196,161,0.2)',
            darkItemSelectedColor: '#00C4A1',
            darkSubMenuItemBg: 'transparent',
          },
          Tabs: {
            cardBg: '#fafafa',
          },
        },
      }}
    >
      <BrowserRouter>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
              <Route path="/index" element={<Dashboard />} />
              <Route path="/areas/list" element={<AreasList />} />
              <Route path="/areas/:id" element={<AreaDetail />} />
              <Route path="/new-project/list" element={<ProjectList />} />
              <Route path="/new-project/add" element={<AddProject />} />
              <Route path="/sell/list" element={<SellList />} />
              <Route path="/sell/add" element={<AddSell />} />
              <Route path="/rent/list" element={<RentList />} />
              <Route path="/rent/add" element={<AddRent />} />
              <Route path="/owners/list" element={<OwnerList />} />
              <Route path="/owners/add" element={<AddOwner />} />
              <Route path="/leads/buy" element={<BuyLeads />} />
              <Route path="/leads/rent" element={<RentLeads />} />
              <Route path="/leads/portalsLeads" element={<PortalsLeads />} />
              <Route path="/leads/add" element={<AddLead />} />
              <Route path="/database/projects" element={<DatabasePage />} />
              <Route path="/transactions/list" element={<TransactionList />} />
              <Route path="/transactions/add" element={<AddTransaction />} />
              <Route path="/approval/contract" element={<TransactionApproval />} />
              <Route path="/approval/commission" element={<CommissionApproval />} />
              <Route path="/approval/portals" element={<PortalsApproval />} />
              <Route path="/approval/propertiesStatus" element={<ListingsStatus />} />
              <Route path="/approval/propertyUpdate" element={<ListingsUpdate />} />
              <Route path="/kpi/call" element={<KPIContacts />} />
              <Route path="/kpi/viewings" element={<KPIViewings />} />
              <Route path="/kpi/genaral" element={<KPIInsightBoard />} />
              <Route path="/system/staff" element={<Staff />} />
              <Route path="/system/teams" element={<Teams />} />
              <Route path="/system/roles" element={<Roles />} />
              <Route path="/system/watermark" element={<Watermark />} />
              <Route path="/system/integrations/company-profile" element={<Integrations />} />
              <Route path="/system/integrations/:tab" element={<Integrations />} />
              <Route path="/contacts/list" element={<ContactList />} />
              <Route path="/contacts/add" element={<AddContact />} />
              <Route path="/viewings/list" element={<ViewingsList />} />
              <Route path="/viewings/add" element={<AddViewing />} />
              <Route path="/tasks/list" element={<TasksList />} />
              <Route path="/tasks/add" element={<AddTask />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/developers/list" element={<DevelopersList />} />
              <Route path="/developers/add" element={<AddDeveloper />} />
              <Route path="/finance" element={<FinanceDashboard />} />
              <Route path="/notifications" element={<NotificationCenter />} />
              <Route path="/workflows/list" element={<WorkflowList />} />
              <Route path="/communications" element={<CommunicationLog />} />
              <Route path="/system/data-import" element={<DataImport />} />
              <Route path="/" element={<Navigate to="/index" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
