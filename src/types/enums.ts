export const USER_ROLES = ["super_admin", "admin", "finance", "agent"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const LISTING_TYPES = ["sale", "rent"] as const;
export type ListingType = (typeof LISTING_TYPES)[number];

export const PROPERTY_TYPES = [
  "apartment",
  "villa",
  "townhouse",
  "penthouse",
  "office",
  "retail",
  "warehouse",
  "land",
  "other",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const LISTING_STATUSES = [
  "draft",
  "active",
  "under_offer",
  "sold",
  "rented",
  "archived",
] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "closed",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCES = [
  "website",
  "portal",
  "manual",
  "referral",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type LeadPriority = (typeof LEAD_PRIORITIES)[number];

export const TRANSACTION_STATUSES = ["pending", "completed", "cancelled"] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const COMMISSION_STATUSES = [
  "pending",
  "owner_approved",
  "finance_cleared",
  "rejected",
] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

export const FURNISHED_OPTIONS = ["furnished", "semi", "unfurnished"] as const;
export type FurnishedOption = (typeof FURNISHED_OPTIONS)[number];

export const RENT_FREQUENCIES = ["yearly", "monthly", "weekly", "daily"] as const;
export type RentFrequency = (typeof RENT_FREQUENCIES)[number];

export const OWNER_PURPOSES = ["sale", "rent", "both"] as const;
export type OwnerPurpose = (typeof OWNER_PURPOSES)[number];

export const PORTALS = ["bayut", "property_finder", "dubizzle"] as const;
export type Portal = (typeof PORTALS)[number];

// Labels for display
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance: "Finance",
  agent: "Agent",
};

export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  draft: "Draft",
  active: "Active",
  under_offer: "Under Offer",
  sold: "Sold",
  rented: "Rented",
  archived: "Archived",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  closed: "Closed",
  lost: "Lost",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Website",
  portal: "Portal",
  manual: "Manual",
  referral: "Referral",
};
