export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  phone_secondary?: string;
  nationality?: string;
  gender?: string;
  birthdate?: string;
  role_id?: string;
  team_id?: string;
  is_active: boolean;
  profile_image?: string;
  created_at: string;
  role?: Role;
  team?: Team;
}

export interface Team {
  id: string;
  name: string;
  leader_id?: string;
  leader?: User;
  members?: User[];
  created_at: string;
}

export interface Role {
  id: string;
  title: string;
  permissions: Record<string, boolean>;
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  city: string;
  property_types: string[];
  image_url?: string;
  new_projects_count: number;
  sell_count: number;
  rent_count: number;
  created_at: string;
}

export interface Developer {
  id: string;
  name: string;
  logo_url?: string;
  property_types: string[];
  new_count: number;
  sell_count: number;
  rent_count: number;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  area_id: string;
  area?: Area;
  developer_id: string;
  developer?: Developer;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  property_type: string;
  completion_status: string;
  listing_id: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  furniture?: string;
  public_unit_no?: string;
  private_unit_no?: string;
  occupancy?: string;
  availability_date?: string;
  source_of_listing?: string;
  price?: number;
  service_charge?: number;
  ac_charge?: number;
  title_en?: string;
  title_ar?: string;
  title_cn?: string;
  description_en?: string;
  description_ar?: string;
  description_cn?: string;
  amenities: string[];
  media_urls: string[];
  document_urls: string[];
  floor_plan_urls: string[];
  payment_plan?: PaymentPlan;
  portals?: PortalConfig;
  status: string;
  agent_id?: string;
  agent?: User;
  tags: string[];
  created_at: string;
}

export interface SellListing {
  id: string;
  property_type: string;
  completion_status: string;
  listing_id: string;
  community?: string;
  building?: string;
  floor?: string;
  unit_no?: string;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  occupancy?: string;
  availability_date?: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  furniture?: string;
  public_unit_no?: string;
  private_unit_no?: string;
  source_of_listing?: string;
  price: number;
  service_charge?: number;
  mortgage?: string;
  ac_charge?: number;
  title_en?: string;
  title_ar?: string;
  title_cn?: string;
  description_en?: string;
  description_ar?: string;
  description_cn?: string;
  amenities: string[];
  media_urls: string[];
  document_urls: string[];
  portals?: PortalConfig;
  status: 'Active' | 'Inactive' | 'Sold';
  agent_id?: string;
  agent?: User;
  owner_id?: string;
  owner?: Owner;
  tags: string[];
  created_at: string;
}

export interface RentListing extends Omit<SellListing, 'price' | 'mortgage' | 'status'> {
  rental_price: number;
  rental_frequency: 'Yearly' | 'Monthly' | 'Weekly' | 'Daily';
  cheques?: number;
  status: 'Active' | 'Inactive' | 'Rented';
}

export interface Owner {
  id: string;
  name: string;
  email?: string;
  phone: string;
  phone_secondary?: string;
  country_code: string;
  source_of_owner?: string;
  nationality?: string;
  gender?: string;
  birthdate?: string;
  spoken_languages: string[];
  agent_id?: string;
  agent?: User;
  status: string;
  created_at: string;
}

export interface Lead {
  id: string;
  lead_type: 'Buy' | 'Rent';
  agent_id?: string;
  agent?: User;
  name: string;
  phone?: string;
  email?: string;
  preferred_location: string[];
  budget?: number;
  preferred_rooms?: string;
  preferred_size?: string;
  preferred_property_type?: string;
  project_type?: string;
  buyer_type?: string;
  payment_method?: string;
  nationality?: string;
  form_name?: string;
  source_of_lead?: string;
  status: 'Active' | 'Pool' | 'Deal';
  tags: string[];
  keywords?: string;
  documents: string[];
  last_follow_up_at?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  purpose: 'New Project' | 'Sell' | 'Rent';
  deal_date: string;
  agent_id?: string;
  agent?: User;
  lead_id?: string;
  lead?: Lead;
  developer_id?: string;
  developer?: Developer;
  property_type?: string;
  unit_number?: string;
  picture?: string;
  project_name?: string;
  property_address?: string;
  deal_price: number;
  bedrooms?: number;
  commission_total_percentage?: number;
  commission_total_amount?: number;
  vat?: number;
  commission_agents: CommissionAgent[];
  commission_status: Record<string, number>;
  approval_status: 'Pending' | 'Approved' | 'Rejected';
  documents: string[];
  created_at: string;
}

export interface CommissionAgent {
  agent_id: string;
  agent_name: string;
  role: string;
  percentage: number;
  amount: number;
  received: number;
}

export interface PaymentPlan {
  installments: { description: string; percentage: number; amount: number; date?: string }[];
}

export interface PortalConfig {
  property_finder: boolean;
  bayut: boolean;
  dubizzle: boolean;
}

export interface CompanyProfile {
  id: string;
  company_name: string;
  pf_token?: string;
  pf_secret_token?: string;
  bayut_token?: string;
  bayut_whatsapp_api_key?: string;
  dubizzle_whatsapp_api_key?: string;
  trade_license_number?: string;
  broker_orn?: string;
  assigned_users: string[];
  created_at: string;
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  next_step_id?: string;
  config?: Record<string, unknown>;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface TabItem {
  key: string;
  label: string;
  path: string;
  closable: boolean;
}

export interface DashboardStats {
  transactions: number;
  listings: number;
  leads: number;
  viewings: number;
  contacts: number;
}

export interface LeadChartData {
  title: string;
  total: number;
  active: number;
  pool: number;
  deal: number;
}

export interface AgentPerformance {
  id: string;
  name: string;
  avatar?: string;
  deals: number;
  rank: number;
}

export interface FollowUpTask {
  id: string;
  title: string;
  type: string;
  lead_name: string;
  time: string;
  date: string;
  completed: boolean;
}
