-- ============================================================
-- Dubai Real Estate CRM — Full Schema
-- Migration 00001: Create all tables, FKs, indexes, triggers
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TEAMS
-- ============================================================
CREATE TABLE public.teams (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  created_by    UUID,  -- FK added after profiles exists
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'agent'
                CHECK (role IN ('super_admin','admin','finance','agent')),
  team_id       UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_team ON public.profiles(team_id);

-- Now add the deferred FK on teams.created_by
ALTER TABLE public.teams
  ADD CONSTRAINT fk_teams_created_by
  FOREIGN KEY (created_by) REFERENCES public.profiles(id);

-- ============================================================
-- 3. OWNERS (off-market property owners)
-- ============================================================
CREATE TABLE public.owners (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  nationality       TEXT,
  property_type     TEXT CHECK (property_type IN (
                      'apartment','villa','townhouse','penthouse',
                      'office','retail','warehouse','land','other'
                    )),
  area              TEXT,
  community         TEXT,
  building_name     TEXT,
  unit_number       TEXT,
  bedrooms          SMALLINT,
  bathrooms         SMALLINT,
  size_sqft         NUMERIC(10,2),
  asking_price      NUMERIC(14,2),
  currency          TEXT NOT NULL DEFAULT 'AED',
  purpose           TEXT CHECK (purpose IN ('sale','rent','both')),
  notes             TEXT,
  source            TEXT,
  assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_owners_assigned_agent ON public.owners(assigned_agent_id);
CREATE INDEX idx_owners_area ON public.owners(area);

-- ============================================================
-- 4. LISTINGS
-- ============================================================
CREATE TABLE public.listings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no      TEXT UNIQUE NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL CHECK (type IN ('sale','rent')),
  property_type     TEXT NOT NULL CHECK (property_type IN (
                      'apartment','villa','townhouse','penthouse',
                      'office','retail','warehouse','land','other'
                    )),
  -- Location
  area              TEXT NOT NULL,
  community         TEXT,
  building_name     TEXT,
  unit_number       TEXT,
  latitude          NUMERIC(10,7),
  longitude         NUMERIC(10,7),
  -- Details
  bedrooms          SMALLINT,
  bathrooms         SMALLINT,
  size_sqft         NUMERIC(10,2),
  plot_size_sqft    NUMERIC(10,2),
  furnished         TEXT CHECK (furnished IN ('furnished','semi','unfurnished')),
  parking_spaces    SMALLINT DEFAULT 0,
  amenities         JSONB DEFAULT '[]',
  -- Pricing
  price             NUMERIC(14,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'AED',
  price_per_sqft    NUMERIC(10,2),
  rent_frequency    TEXT CHECK (rent_frequency IN ('yearly','monthly','weekly','daily')),
  -- Dubai regulatory
  permit_number     TEXT,
  ded_license       TEXT,
  -- Publishing
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                      'draft','active','under_offer','sold','rented','archived'
                    )),
  is_published      BOOLEAN NOT NULL DEFAULT false,
  publish_portals   JSONB DEFAULT '[]',
  watermark_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Relations
  owner_id          UUID REFERENCES public.owners(id) ON DELETE SET NULL,
  assigned_agent_id UUID NOT NULL REFERENCES public.profiles(id),
  created_by        UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listings_type ON public.listings(type);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_area ON public.listings(area);
CREATE INDEX idx_listings_agent ON public.listings(assigned_agent_id);
CREATE INDEX idx_listings_published ON public.listings(is_published);
CREATE INDEX idx_listings_reference ON public.listings(reference_no);

-- ============================================================
-- 5. LISTING IMAGES
-- ============================================================
CREATE TABLE public.listing_images (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  storage_path    TEXT NOT NULL,
  url             TEXT NOT NULL,
  display_order   SMALLINT NOT NULL DEFAULT 0,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  is_watermarked  BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_images_listing ON public.listing_images(listing_id);

-- ============================================================
-- 6. LEADS
-- ============================================================
CREATE TABLE public.leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  nationality       TEXT,
  source            TEXT CHECK (source IN (
                      'website','portal','manual','referral'
                    )),
  -- Requirements
  budget_min        NUMERIC(14,2),
  budget_max        NUMERIC(14,2),
  preferred_areas   JSONB DEFAULT '[]',
  property_type     TEXT,
  purpose           TEXT CHECK (purpose IN ('buy','rent')),
  bedrooms_min      SMALLINT,
  bedrooms_max      SMALLINT,
  -- Pipeline
  status            TEXT NOT NULL DEFAULT 'new' CHECK (status IN (
                      'new','contacted','qualified','closed','lost'
                    )),
  priority          TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  -- Assignment
  assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  listing_id        UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  -- Notes & follow-up
  notes             TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up    TIMESTAMPTZ,
  lost_reason       TEXT,
  -- Meta
  created_by        UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_agent ON public.leads(assigned_agent_id);
CREATE INDEX idx_leads_priority ON public.leads(priority);

-- ============================================================
-- 7. UPLOAD BATCHES (created before contacts to satisfy FK)
-- ============================================================
CREATE TABLE public.upload_batches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name         TEXT NOT NULL,
  total_records     INT NOT NULL DEFAULT 0,
  processed_records INT NOT NULL DEFAULT 0,
  failed_records    INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'processing' CHECK (status IN (
                      'processing','completed','failed'
                    )),
  error_log         JSONB DEFAULT '[]',
  uploaded_by       UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. CONTACTS (bulk database)
-- ============================================================
CREATE TABLE public.contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  company           TEXT,
  designation       TEXT,
  nationality       TEXT,
  area_tags         JSONB DEFAULT '[]',
  source            TEXT,
  notes             TEXT,
  assigned_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  upload_batch_id   UUID REFERENCES public.upload_batches(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_agent ON public.contacts(assigned_agent_id);
CREATE INDEX idx_contacts_area_tags ON public.contacts USING GIN (area_tags);
CREATE INDEX idx_contacts_batch ON public.contacts(upload_batch_id);

-- ============================================================
-- 9. TRANSACTIONS
-- ============================================================
CREATE TABLE public.transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_no      TEXT UNIQUE NOT NULL,
  type              TEXT NOT NULL CHECK (type IN ('sale','rent')),
  listing_id        UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  lead_id           UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  agent_id          UUID NOT NULL REFERENCES public.profiles(id),
  -- Financials
  deal_value        NUMERIC(14,2) NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'AED',
  commission_pct    NUMERIC(5,2),
  commission_amount NUMERIC(14,2) NOT NULL,
  company_share     NUMERIC(14,2),
  agent_share       NUMERIC(14,2),
  -- Dates
  deal_date         DATE NOT NULL,
  closing_date      DATE,
  -- Status
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending','completed','cancelled'
                    )),
  notes             TEXT,
  created_by        UUID NOT NULL REFERENCES public.profiles(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_agent ON public.transactions(agent_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_deal_date ON public.transactions(deal_date);

-- ============================================================
-- 10. COMMISSION APPROVALS
-- ============================================================
CREATE TABLE public.commission_approvals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id      UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  agent_id            UUID NOT NULL REFERENCES public.profiles(id),
  commission_amount   NUMERIC(14,2) NOT NULL,
  -- Workflow
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending','owner_approved','finance_cleared','rejected'
                      )),
  -- Owner approval step
  owner_approved_at   TIMESTAMPTZ,
  owner_approved_by   UUID REFERENCES public.profiles(id),
  owner_notes         TEXT,
  -- Finance clearance step
  finance_cleared_at  TIMESTAMPTZ,
  finance_cleared_by  UUID REFERENCES public.profiles(id),
  finance_notes       TEXT,
  -- Rejection
  rejected_at         TIMESTAMPTZ,
  rejected_by         UUID REFERENCES public.profiles(id),
  rejection_reason    TEXT,
  -- Meta
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commission_status ON public.commission_approvals(status);
CREATE INDEX idx_commission_agent ON public.commission_approvals(agent_id);
CREATE INDEX idx_commission_txn ON public.commission_approvals(transaction_id);

-- ============================================================
-- 11. ACTIVITY LOGS (immutable audit trail)
-- ============================================================
CREATE TABLE public.activity_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id),
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL,
  entity_id     UUID,
  metadata      JSONB DEFAULT '{}',
  ip_address    INET,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_action ON public.activity_logs(action);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);

-- ============================================================
-- 12. SETTINGS (key-value app configuration)
-- ============================================================
CREATE TABLE public.settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      TEXT NOT NULL,
  key           TEXT NOT NULL,
  value         JSONB NOT NULL,
  updated_by    UUID REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, key)
);

-- ============================================================
-- 13. AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'agent')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 14. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.owners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.commission_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 15. LISTING REFERENCE NUMBER SEQUENCE
-- ============================================================
CREATE SEQUENCE public.listing_ref_seq START 1;
CREATE SEQUENCE public.transaction_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_listing_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_no IS NULL OR NEW.reference_no = '' THEN
    NEW.reference_no := 'DXB-' || UPPER(LEFT(NEW.type, 1)) || '-' ||
                        LPAD(nextval('public.listing_ref_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_listing_ref BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.generate_listing_ref();

CREATE OR REPLACE FUNCTION public.generate_transaction_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_no IS NULL OR NEW.reference_no = '' THEN
    NEW.reference_no := 'TXN-' ||
                        LPAD(nextval('public.transaction_ref_seq')::TEXT, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_ref BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.generate_transaction_ref();
