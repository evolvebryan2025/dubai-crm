import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

// ===== Profiles (replaces usersAPI) =====
export const profilesService = {
  getAll: () =>
    supabase.from('profiles').select('*, teams(*)').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('profiles').select('*, teams(*)').eq('id', id).single(),
  update: (id: string, data: Database['public']['Tables']['profiles']['Update']) =>
    supabase.from('profiles').update(data).eq('id', id),
};

// ===== Teams (replaces teamsAPI) =====
export const teamsService = {
  getAll: () =>
    supabase.from('teams').select('*').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('teams').select('*').eq('id', id).single(),
  create: (data: Database['public']['Tables']['teams']['Insert']) =>
    supabase.from('teams').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['teams']['Update']) =>
    supabase.from('teams').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('teams').delete().eq('id', id),
};

// ===== Developers =====
export const developersService = {
  getAll: () =>
    supabase.from('developers').select('*').order('name'),
  create: (data: Database['public']['Tables']['developers']['Insert']) =>
    supabase.from('developers').insert(data).select().single(),
};

// ===== Listings (replaces both sellListingsAPI and rentListingsAPI) =====
const LISTING_SELECT = '*, listing_images(*), profiles!assigned_agent_id(*), owners(*)';
export const listingsService = {
  getAll: () =>
    supabase.from('listings').select(LISTING_SELECT).order('created_at', { ascending: false }),
  getSellListings: () =>
    supabase.from('listings').select(LISTING_SELECT).eq('type', 'sale').order('created_at', { ascending: false }),
  getRentListings: () =>
    supabase.from('listings').select(LISTING_SELECT).eq('type', 'rent').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('listings').select(LISTING_SELECT).eq('id', id).single(),
  create: (data: Database['public']['Tables']['listings']['Insert']) =>
    supabase.from('listings').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['listings']['Update']) =>
    supabase.from('listings').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('listings').delete().eq('id', id),
  clone: async (id: string) => {
    const { data: original, error } = await supabase.from('listings').select('*').eq('id', id).single();
    if (error || !original) throw error || new Error('Listing not found');
    const { id: _id, reference_no: _ref, created_at: _ca, updated_at: _ua, ...rest } = original;
    return supabase.from('listings').insert({ ...rest, status: 'draft', is_published: false }).select().single();
  },
};

// ===== New Projects (Off-Plan) =====
export const newProjectsService = {
  getAll: () =>
    supabase.from('new_projects').select('*').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('new_projects').select('*').eq('id', id).single(),
  create: (data: Database['public']['Tables']['new_projects']['Insert']) =>
    supabase.from('new_projects').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['new_projects']['Update']) =>
    supabase.from('new_projects').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('new_projects').delete().eq('id', id),
};

// ===== Owners (replaces ownersAPI) =====
export const ownersService = {
  getAll: () =>
    supabase.from('owners').select('*, profiles!assigned_agent_id(*)').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('owners').select('*, profiles!assigned_agent_id(*)').eq('id', id).single(),
  create: (data: Database['public']['Tables']['owners']['Insert']) =>
    supabase.from('owners').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['owners']['Update']) =>
    supabase.from('owners').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('owners').delete().eq('id', id),
};

// ===== Leads (replaces leadsAPI) =====
export const leadsService = {
  getAll: () =>
    supabase.from('leads').select('*, profiles!assigned_agent_id(*)').order('created_at', { ascending: false }),
  getBuyLeads: () =>
    supabase.from('leads').select('*, profiles!assigned_agent_id(*)').eq('purpose', 'buy').order('created_at', { ascending: false }),
  getRentLeads: () =>
    supabase.from('leads').select('*, profiles!assigned_agent_id(*)').eq('purpose', 'rent').order('created_at', { ascending: false }),
  getPortalLeads: () =>
    supabase.from('leads').select('*, profiles!assigned_agent_id(*)').eq('source', 'portal').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('leads').select('*, profiles!assigned_agent_id(*), listings(*)').eq('id', id).single(),
  create: (data: Database['public']['Tables']['leads']['Insert']) =>
    supabase.from('leads').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['leads']['Update']) =>
    supabase.from('leads').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('leads').delete().eq('id', id),
  updateStatus: (id: string, status: string) =>
    supabase.from('leads').update({ status }).eq('id', id),
  assignAgent: (id: string, agentId: string) =>
    supabase.from('leads').update({ assigned_agent_id: agentId }).eq('id', id),
};

// ===== Transactions (replaces transactionsAPI) =====
export const transactionsService = {
  getAll: () =>
    supabase.from('transactions').select('*, profiles!agent_id(*), leads(*), listings(*)').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('transactions').select('*, profiles!agent_id(*), leads(*), listings(*)').eq('id', id).single(),
  create: (data: Database['public']['Tables']['transactions']['Insert']) =>
    supabase.from('transactions').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['transactions']['Update']) =>
    supabase.from('transactions').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('transactions').delete().eq('id', id),
};

// ===== Commission Approvals =====
export const commissionApprovalsService = {
  getAll: () =>
    supabase.from('commission_approvals').select('*, transactions(*), profiles!agent_id(*)').order('created_at', { ascending: false }),
  getById: (id: string) =>
    supabase.from('commission_approvals').select('*, transactions(*), profiles!agent_id(*)').eq('id', id).single(),
  update: (id: string, data: Database['public']['Tables']['commission_approvals']['Update']) =>
    supabase.from('commission_approvals').update(data).eq('id', id),
};

// ===== Contacts (for Database/bulk import page) =====
export const contactsService = {
  getAll: () =>
    supabase.from('contacts').select('*, profiles!assigned_agent_id(*)').order('created_at', { ascending: false }),
  create: (data: Database['public']['Tables']['contacts']['Insert']) =>
    supabase.from('contacts').insert(data).select().single(),
  createBulk: (data: Database['public']['Tables']['contacts']['Insert'][]) =>
    supabase.from('contacts').insert(data).select(),
  update: (id: string, data: Database['public']['Tables']['contacts']['Update']) =>
    supabase.from('contacts').update(data).eq('id', id),
  delete: (id: string) =>
    supabase.from('contacts').delete().eq('id', id),
};

// ===== Upload Batches =====
export const uploadBatchesService = {
  getAll: () =>
    supabase.from('upload_batches').select('*').order('created_at', { ascending: false }),
  create: (data: Database['public']['Tables']['upload_batches']['Insert']) =>
    supabase.from('upload_batches').insert(data).select().single(),
  update: (id: string, data: Database['public']['Tables']['upload_batches']['Update']) =>
    supabase.from('upload_batches').update(data).eq('id', id),
};

// ===== Activity Logs =====
export const activityLogsService = {
  getAll: () =>
    supabase.from('activity_logs').select('*, profiles!user_id(*)').order('created_at', { ascending: false }),
  create: (data: Database['public']['Tables']['activity_logs']['Insert']) =>
    supabase.from('activity_logs').insert(data),
};

// ===== Settings =====
export const settingsService = {
  getAll: () =>
    supabase.from('settings').select('*'),
  getByCategory: (category: string) =>
    supabase.from('settings').select('*').eq('category', category),
  upsert: (data: Database['public']['Tables']['settings']['Insert']) =>
    supabase.from('settings').upsert(data, { onConflict: 'category,key' }),
};

// ===== Dashboard (aggregate queries) =====
export const dashboardService = {
  getStats: async () => {
    const [transactions, listings, leads, contacts] = await Promise.all([
      supabase.from('transactions').select('id', { count: 'exact', head: true }),
      supabase.from('listings').select('id', { count: 'exact', head: true }).in('status', ['active', 'under_offer']),
      supabase.from('leads').select('id', { count: 'exact', head: true }).in('status', ['new', 'contacted', 'qualified']),
      supabase.from('contacts').select('id', { count: 'exact', head: true }),
    ]);
    return {
      transactions: transactions.count ?? 0,
      listings: listings.count ?? 0,
      leads: leads.count ?? 0,
      viewings: 0,
      contacts: contacts.count ?? 0,
    };
  },
  getLeadCharts: async () => {
    const [buyLeads, rentLeads, sellListings, rentListings] = await Promise.all([
      supabase.from('leads').select('status').eq('purpose', 'buy'),
      supabase.from('leads').select('status').eq('purpose', 'rent'),
      supabase.from('listings').select('status').eq('type', 'sale'),
      supabase.from('listings').select('status').eq('type', 'rent'),
    ]);

    const countByStatus = (rows: { status: string }[] | null, activeStatuses: string[], poolStatuses: string[], dealStatuses: string[]) => ({
      active: rows?.filter(r => activeStatuses.includes(r.status)).length ?? 0,
      pool: rows?.filter(r => poolStatuses.includes(r.status)).length ?? 0,
      deal: rows?.filter(r => dealStatuses.includes(r.status)).length ?? 0,
    });

    const buyCounts = countByStatus(buyLeads.data, ['new', 'contacted'], ['qualified', 'lost'], ['closed']);
    const rentCounts = countByStatus(rentLeads.data, ['new', 'contacted'], ['qualified', 'lost'], ['closed']);
    const sellCounts = countByStatus(sellListings.data, ['active', 'under_offer'], ['draft', 'archived'], ['sold']);
    const rentListingCounts = countByStatus(rentListings.data, ['active', 'under_offer'], ['draft', 'archived'], ['rented']);

    return [
      { title: 'Buy Leads', total: buyLeads.data?.length ?? 0, ...buyCounts },
      { title: 'Rent Leads', total: rentLeads.data?.length ?? 0, ...rentCounts },
      { title: 'Sell Listings', total: sellListings.data?.length ?? 0, ...sellCounts },
      { title: 'Rent Listings', total: rentListings.data?.length ?? 0, ...rentListingCounts },
    ];
  },
  getAgentPerformance: async () => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('agent_id, profiles!agent_id(full_name, avatar_url)')
      .eq('status', 'completed');

    if (!transactions) return [];

    const agentMap = new Map<string, { name: string; avatar?: string; deals: number }>();
    for (const txn of transactions) {
      const existing = agentMap.get(txn.agent_id);
      const profile = txn.profiles as unknown as { full_name: string; avatar_url: string | null } | null;
      if (existing) {
        existing.deals++;
      } else {
        agentMap.set(txn.agent_id, {
          name: profile?.full_name ?? 'Unknown',
          avatar: profile?.avatar_url ?? undefined,
          deals: 1,
        });
      }
    }

    return Array.from(agentMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.deals - a.deals)
      .map((agent, idx) => ({ ...agent, rank: idx + 1 }));
  },
};
