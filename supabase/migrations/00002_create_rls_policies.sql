-- ============================================================
-- Dubai Real Estate CRM — Row Level Security Policies
-- Migration 00002: Enable RLS and create all policies
-- Roles: super_admin, admin, finance, agent
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_admin_or_above()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ============================================================
-- PROFILES
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, others see only own profile
CREATE POLICY profiles_select_admin ON public.profiles
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- UPDATE: admin+ can update any profile, others can update own (but not role)
CREATE POLICY profiles_update_admin ON public.profiles
  FOR UPDATE USING (public.is_admin_or_above());

CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- DELETE: super_admin only
CREATE POLICY profiles_delete ON public.profiles
  FOR DELETE USING (public.is_super_admin());


-- ============================================================
-- TEAMS
-- ============================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- SELECT: all authenticated users
CREATE POLICY teams_select ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT/UPDATE: admin+ only
CREATE POLICY teams_insert ON public.teams
  FOR INSERT WITH CHECK (public.is_admin_or_above());

CREATE POLICY teams_update ON public.teams
  FOR UPDATE USING (public.is_admin_or_above());

-- DELETE: super_admin only
CREATE POLICY teams_delete ON public.teams
  FOR DELETE USING (public.is_super_admin());


-- ============================================================
-- OWNERS (off-market — restricted from agents unless assigned)
-- ============================================================
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, agent sees only assigned
CREATE POLICY owners_select_admin ON public.owners
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY owners_select_agent ON public.owners
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND assigned_agent_id = auth.uid()
  );

-- INSERT: admin+ only
CREATE POLICY owners_insert ON public.owners
  FOR INSERT WITH CHECK (public.is_admin_or_above());

-- UPDATE: admin+ only
CREATE POLICY owners_update ON public.owners
  FOR UPDATE USING (public.is_admin_or_above());

-- DELETE: admin+ only
CREATE POLICY owners_delete ON public.owners
  FOR DELETE USING (public.is_admin_or_above());


-- ============================================================
-- LISTINGS
-- ============================================================
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, agent sees only assigned
CREATE POLICY listings_select_admin ON public.listings
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY listings_select_agent ON public.listings
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND assigned_agent_id = auth.uid()
  );

-- INSERT: admin+ and agent (agent is auto-assigned)
CREATE POLICY listings_insert ON public.listings
  FOR INSERT WITH CHECK (
    public.is_admin_or_above()
    OR (public.get_user_role() = 'agent' AND assigned_agent_id = auth.uid())
  );

-- UPDATE: admin+ can update all, agent can update only assigned
CREATE POLICY listings_update_admin ON public.listings
  FOR UPDATE USING (public.is_admin_or_above());

CREATE POLICY listings_update_agent ON public.listings
  FOR UPDATE USING (
    public.get_user_role() = 'agent'
    AND assigned_agent_id = auth.uid()
  );

-- DELETE: admin+ only
CREATE POLICY listings_delete ON public.listings
  FOR DELETE USING (public.is_admin_or_above());


-- ============================================================
-- LISTING IMAGES (inherits access from parent listing)
-- ============================================================
ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

-- SELECT: if user can see the parent listing
CREATE POLICY listing_images_select ON public.listing_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
    )
  );

-- INSERT: if user can see the parent listing
CREATE POLICY listing_images_insert ON public.listing_images
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
    )
  );

-- UPDATE: if user can see the parent listing
CREATE POLICY listing_images_update ON public.listing_images
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_id
    )
  );

-- DELETE: admin+ only
CREATE POLICY listing_images_delete ON public.listing_images
  FOR DELETE USING (public.is_admin_or_above());


-- ============================================================
-- LEADS
-- ============================================================
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, agent sees only assigned
CREATE POLICY leads_select_admin ON public.leads
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY leads_select_agent ON public.leads
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND assigned_agent_id = auth.uid()
  );

-- INSERT: admin+ and agent
CREATE POLICY leads_insert ON public.leads
  FOR INSERT WITH CHECK (
    public.is_admin_or_above()
    OR public.get_user_role() = 'agent'
  );

-- UPDATE: admin+ can update all, agent can update only assigned
CREATE POLICY leads_update_admin ON public.leads
  FOR UPDATE USING (public.is_admin_or_above());

CREATE POLICY leads_update_agent ON public.leads
  FOR UPDATE USING (
    public.get_user_role() = 'agent'
    AND assigned_agent_id = auth.uid()
  );

-- DELETE: admin+ only
CREATE POLICY leads_delete ON public.leads
  FOR DELETE USING (public.is_admin_or_above());


-- ============================================================
-- CONTACTS (bulk database)
-- ============================================================
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, agent sees only assigned
CREATE POLICY contacts_select_admin ON public.contacts
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY contacts_select_agent ON public.contacts
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND assigned_agent_id = auth.uid()
  );

-- INSERT: admin+ only
CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT WITH CHECK (public.is_admin_or_above());

-- UPDATE: admin+ only
CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE USING (public.is_admin_or_above());

-- DELETE: admin+ only
CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE USING (public.is_admin_or_above());


-- ============================================================
-- UPLOAD BATCHES
-- ============================================================
ALTER TABLE public.upload_batches ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ only
CREATE POLICY upload_batches_select ON public.upload_batches
  FOR SELECT USING (public.is_admin_or_above());

-- INSERT: admin+ only
CREATE POLICY upload_batches_insert ON public.upload_batches
  FOR INSERT WITH CHECK (public.is_admin_or_above());

-- UPDATE: admin+ only
CREATE POLICY upload_batches_update ON public.upload_batches
  FOR UPDATE USING (public.is_admin_or_above());


-- ============================================================
-- TRANSACTIONS
-- ============================================================
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, finance sees all, agent sees own only
CREATE POLICY transactions_select_admin ON public.transactions
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY transactions_select_finance ON public.transactions
  FOR SELECT USING (public.get_user_role() = 'finance');

CREATE POLICY transactions_select_agent ON public.transactions
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND agent_id = auth.uid()
  );

-- INSERT: admin+ only
CREATE POLICY transactions_insert ON public.transactions
  FOR INSERT WITH CHECK (public.is_admin_or_above());

-- UPDATE: admin+ only
CREATE POLICY transactions_update ON public.transactions
  FOR UPDATE USING (public.is_admin_or_above());

-- DELETE: super_admin only
CREATE POLICY transactions_delete ON public.transactions
  FOR DELETE USING (public.is_super_admin());


-- ============================================================
-- COMMISSION APPROVALS
-- ============================================================
ALTER TABLE public.commission_approvals ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, finance sees all, agent sees own
CREATE POLICY commission_select_admin ON public.commission_approvals
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY commission_select_finance ON public.commission_approvals
  FOR SELECT USING (public.get_user_role() = 'finance');

CREATE POLICY commission_select_agent ON public.commission_approvals
  FOR SELECT USING (
    public.get_user_role() = 'agent'
    AND agent_id = auth.uid()
  );

-- INSERT: admin+ only (created alongside transaction)
CREATE POLICY commission_insert ON public.commission_approvals
  FOR INSERT WITH CHECK (public.is_admin_or_above());

-- UPDATE: role-based field-level control
-- Super admin can update everything
CREATE POLICY commission_update_super ON public.commission_approvals
  FOR UPDATE USING (public.is_super_admin());

-- Admin can set owner_approved fields (status must go to owner_approved)
CREATE POLICY commission_update_admin ON public.commission_approvals
  FOR UPDATE USING (
    public.get_user_role() = 'admin'
    AND status IN ('pending', 'owner_approved')
  );

-- Finance can set finance_cleared fields (must already be owner_approved)
CREATE POLICY commission_update_finance ON public.commission_approvals
  FOR UPDATE USING (
    public.get_user_role() = 'finance'
    AND status = 'owner_approved'
  );

-- DELETE: super_admin only
CREATE POLICY commission_delete ON public.commission_approvals
  FOR DELETE USING (public.is_super_admin());


-- ============================================================
-- ACTIVITY LOGS (immutable audit trail)
-- ============================================================
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ only
CREATE POLICY activity_logs_select ON public.activity_logs
  FOR SELECT USING (public.is_admin_or_above());

-- INSERT: all authenticated users (server-side logging)
CREATE POLICY activity_logs_insert ON public.activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies — logs are immutable


-- ============================================================
-- SETTINGS
-- ============================================================
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- SELECT: admin+ sees all, others see non-billing settings
CREATE POLICY settings_select_admin ON public.settings
  FOR SELECT USING (public.is_admin_or_above());

CREATE POLICY settings_select_others ON public.settings
  FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND category != 'billing'
  );

-- INSERT: super_admin all, admin non-billing
CREATE POLICY settings_insert_super ON public.settings
  FOR INSERT WITH CHECK (public.is_super_admin());

CREATE POLICY settings_insert_admin ON public.settings
  FOR INSERT WITH CHECK (
    public.get_user_role() = 'admin'
    AND category != 'billing'
  );

-- UPDATE: super_admin all, admin non-billing
CREATE POLICY settings_update_super ON public.settings
  FOR UPDATE USING (public.is_super_admin());

CREATE POLICY settings_update_admin ON public.settings
  FOR UPDATE USING (
    public.get_user_role() = 'admin'
    AND category != 'billing'
  );

-- DELETE: super_admin only
CREATE POLICY settings_delete ON public.settings
  FOR DELETE USING (public.is_super_admin());
