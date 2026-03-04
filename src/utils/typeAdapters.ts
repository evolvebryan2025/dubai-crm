import type { Profile, SupabaseListing, SupabaseLead, SupabaseOwner, SupabaseTransaction, SupabaseTeam, NewProject } from '../types/database';
import type { User, SellListing, RentListing, Lead, Owner, Transaction, Team, Project } from '../types';

// ===== Profile -> User =====
export function profileToUser(profile: Profile & { teams?: SupabaseTeam | null }): User {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    phone: profile.phone ?? '',
    is_active: profile.is_active,
    profile_image: profile.avatar_url ?? '',
    created_at: profile.created_at,
    team_id: profile.team_id ?? undefined,
    team: profile.teams ? supabaseTeamToTeam(profile.teams) : undefined,
    role: {
      id: profile.role,
      title: profile.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      permissions: {},
      created_at: profile.created_at,
    },
  };
}

// ===== SupabaseTeam -> Team =====
export function supabaseTeamToTeam(team: SupabaseTeam): Team {
  return {
    id: team.id,
    name: team.name,
    created_at: team.created_at,
  };
}

// ===== Listing (type='sale') -> SellListing =====
export function listingToSellListing(listing: SupabaseListing & { profiles?: Profile | null; owners?: SupabaseOwner | null; listing_images?: { url: string; is_primary: boolean }[] | null }): SellListing {
  return {
    id: listing.id,
    property_type: listing.property_type,
    completion_status: listing.status,
    listing_id: listing.reference_no,
    community: listing.community ?? undefined,
    building: listing.building_name ?? undefined,
    unit_no: listing.unit_number ?? undefined,
    address: [listing.area, listing.community].filter(Boolean).join(', '),
    location_lat: listing.latitude ?? undefined,
    location_lng: listing.longitude ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    parking: listing.parking_spaces ?? undefined,
    furniture: listing.furnished ?? undefined,
    price: listing.price,
    title_en: listing.title,
    description_en: listing.description ?? undefined,
    amenities: Array.isArray(listing.amenities) ? listing.amenities as string[] : [],
    media_urls: listing.listing_images?.map(img => img.url) ?? [],
    document_urls: [],
    status: mapListingStatusToUI(listing.status),
    agent_id: listing.assigned_agent_id,
    agent: listing.profiles ? profileToUser(listing.profiles as Profile) : undefined,
    owner_id: listing.owner_id ?? undefined,
    owner: listing.owners ? supabaseOwnerToOwner(listing.owners as SupabaseOwner) : undefined,
    tags: [],
    created_at: listing.created_at,
  };
}

// ===== Listing (type='rent') -> RentListing =====
export function listingToRentListing(listing: SupabaseListing & { profiles?: Profile | null; owners?: SupabaseOwner | null; listing_images?: { url: string; is_primary: boolean }[] | null }): RentListing {
  return {
    id: listing.id,
    property_type: listing.property_type,
    completion_status: listing.status,
    listing_id: listing.reference_no,
    community: listing.community ?? undefined,
    building: listing.building_name ?? undefined,
    unit_no: listing.unit_number ?? undefined,
    address: [listing.area, listing.community].filter(Boolean).join(', '),
    location_lat: listing.latitude ?? undefined,
    location_lng: listing.longitude ?? undefined,
    bedrooms: listing.bedrooms ?? undefined,
    bathrooms: listing.bathrooms ?? undefined,
    parking: listing.parking_spaces ?? undefined,
    furniture: listing.furnished ?? undefined,
    rental_price: listing.price,
    rental_frequency: mapRentFrequency(listing.rent_frequency),
    title_en: listing.title,
    description_en: listing.description ?? undefined,
    amenities: Array.isArray(listing.amenities) ? listing.amenities as string[] : [],
    media_urls: listing.listing_images?.map(img => img.url) ?? [],
    document_urls: [],
    status: listing.status === 'rented' ? 'Rented' : listing.status === 'active' ? 'Active' : 'Inactive',
    agent_id: listing.assigned_agent_id,
    agent: listing.profiles ? profileToUser(listing.profiles as Profile) : undefined,
    owner_id: listing.owner_id ?? undefined,
    owner: listing.owners ? supabaseOwnerToOwner(listing.owners as SupabaseOwner) : undefined,
    tags: [],
    created_at: listing.created_at,
  };
}

// ===== Supabase Lead -> RealCRM Lead =====
export function supabaseLeadToLead(lead: SupabaseLead & { profiles?: Profile | null }): Lead {
  return {
    id: lead.id,
    lead_type: lead.purpose === 'buy' ? 'Buy' : 'Rent',
    agent_id: lead.assigned_agent_id ?? undefined,
    agent: lead.profiles ? profileToUser(lead.profiles as Profile) : undefined,
    name: lead.full_name,
    phone: lead.phone ?? undefined,
    email: lead.email ?? undefined,
    preferred_location: Array.isArray(lead.preferred_areas) ? lead.preferred_areas as string[] : [],
    budget: lead.budget_max ? Number(lead.budget_max) : undefined,
    preferred_property_type: lead.property_type ?? undefined,
    nationality: lead.nationality ?? undefined,
    source_of_lead: lead.source ?? undefined,
    status: mapLeadStatusToUI(lead.status),
    tags: [],
    keywords: lead.notes ?? undefined,
    documents: [],
    last_follow_up_at: lead.last_contacted_at ?? undefined,
    created_at: lead.created_at,
  };
}

// ===== Supabase Owner -> RealCRM Owner =====
export function supabaseOwnerToOwner(owner: SupabaseOwner & { profiles?: Profile | null }): Owner {
  return {
    id: owner.id,
    name: owner.full_name,
    email: owner.email ?? undefined,
    phone: owner.phone ?? '',
    country_code: '+971',
    source_of_owner: owner.source ?? undefined,
    nationality: owner.nationality ?? undefined,
    spoken_languages: [],
    agent_id: owner.assigned_agent_id ?? undefined,
    agent: owner.profiles ? profileToUser(owner.profiles as Profile) : undefined,
    status: 'Active',
    created_at: owner.created_at,
  };
}

// ===== Supabase Transaction -> RealCRM Transaction =====
export function supabaseTransactionToTransaction(
  txn: SupabaseTransaction & { profiles?: Profile | null; leads?: SupabaseLead | null }
): Transaction {
  return {
    id: txn.id,
    purpose: txn.type === 'sale' ? 'Sell' : 'Rent',
    deal_date: txn.deal_date,
    agent_id: txn.agent_id,
    agent: txn.profiles ? profileToUser(txn.profiles as Profile) : undefined,
    lead_id: txn.lead_id ?? undefined,
    deal_price: Number(txn.deal_value),
    commission_total_percentage: txn.commission_pct ? Number(txn.commission_pct) : undefined,
    commission_total_amount: Number(txn.commission_amount),
    commission_agents: [{
      agent_id: txn.agent_id,
      agent_name: (txn.profiles as Profile | null)?.full_name ?? '',
      role: 'Deal Agent',
      percentage: 100,
      amount: Number(txn.agent_share ?? txn.commission_amount),
      received: 0,
    }],
    commission_status: {},
    approval_status: mapTransactionStatusToUI(txn.status),
    documents: [],
    created_at: txn.created_at,
  };
}

// ===== Supabase NewProject -> RealCRM Project =====
export function supabaseProjectToProject(
  project: NewProject & { profiles?: Profile | null }
): Project {
  const propertyTypes = Array.isArray(project.property_types)
    ? (project.property_types as string[])
    : [];
  const mediaUrls = Array.isArray(project.media_urls)
    ? (project.media_urls as string[])
    : [];
  const floorPlanUrls = Array.isArray(project.floor_plan_urls)
    ? (project.floor_plan_urls as string[])
    : [];
  const tags = Array.isArray(project.tags)
    ? (project.tags as string[])
    : [];
  const keyFeatures = Array.isArray(project.key_features)
    ? (project.key_features as string[])
    : [];

  return {
    id: project.id,
    name: project.name,
    area_id: project.area_id ?? '',
    developer_id: project.developer_id ?? '',
    address: project.city ?? '',
    property_type: propertyTypes[0] ?? '',
    completion_status: project.completion_status ?? 'off_plan',
    listing_id: project.id,
    price: project.starting_price ? Number(project.starting_price) : undefined,
    title_en: project.title ?? undefined,
    description_en: project.description ?? undefined,
    amenities: keyFeatures,
    media_urls: mediaUrls,
    document_urls: [],
    floor_plan_urls: floorPlanUrls,
    payment_plan: project.payment_plan
      ? { installments: (project.payment_plan as any).installments ?? [] }
      : undefined,
    status: mapProjectStatusToUI(project.status),
    agent_id: project.agent_id ?? undefined,
    agent: project.profiles ? profileToUser(project.profiles as Profile) : undefined,
    tags,
    created_at: project.created_at,
  };
}

function mapProjectStatusToUI(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'pool':
      return 'Pool';
    case 'sold_out':
      return 'Sold Out';
    default:
      return 'Active';
  }
}

// ===== Status Mapping Helpers =====

function mapListingStatusToUI(status: string): 'Active' | 'Inactive' | 'Sold' {
  switch (status) {
    case 'active':
    case 'under_offer':
      return 'Active';
    case 'sold':
      return 'Sold';
    default:
      return 'Inactive';
  }
}

export function mapLeadStatusToUI(status: string): 'Active' | 'Pool' | 'Deal' {
  switch (status) {
    case 'new':
    case 'contacted':
      return 'Active';
    case 'qualified':
      return 'Pool';
    case 'closed':
      return 'Deal';
    case 'lost':
      return 'Pool';
    default:
      return 'Active';
  }
}

export function mapUIStatusToSupabase(uiStatus: string): string {
  switch (uiStatus) {
    case 'Active':
      return 'new';
    case 'Pool':
      return 'qualified';
    case 'Deal':
      return 'closed';
    default:
      return 'new';
  }
}

function mapTransactionStatusToUI(status: string): 'Pending' | 'Approved' | 'Rejected' {
  switch (status) {
    case 'completed':
      return 'Approved';
    case 'cancelled':
      return 'Rejected';
    default:
      return 'Pending';
  }
}

function mapRentFrequency(freq: string | null): 'Yearly' | 'Monthly' | 'Weekly' | 'Daily' {
  switch (freq) {
    case 'yearly': return 'Yearly';
    case 'monthly': return 'Monthly';
    case 'weekly': return 'Weekly';
    case 'daily': return 'Daily';
    default: return 'Yearly';
  }
}
