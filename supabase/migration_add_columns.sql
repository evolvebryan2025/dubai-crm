-- =============================================================
-- RealCRM Schema Update — Run this in Supabase SQL Editor once
-- Dashboard → SQL Editor → New Query → Paste & Run
-- =============================================================

-- 1. LISTINGS: Add missing columns
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'ready',
  ADD COLUMN IF NOT EXISTS developer_id UUID REFERENCES public.developers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS floor_number TEXT,
  ADD COLUMN IF NOT EXISTS private_unit_number TEXT,
  ADD COLUMN IF NOT EXISTS keywords JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS place_id TEXT;

-- Add index for completion_status
CREATE INDEX IF NOT EXISTS idx_listings_completion_status ON public.listings(completion_status);

-- 2. NEW_PROJECTS: Add missing columns
ALTER TABLE public.new_projects
  ADD COLUMN IF NOT EXISTS completion_status TEXT DEFAULT 'off_plan',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS key_features JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS floor_plan_urls JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS brochure_url TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Apply updated_at trigger to new_projects
DROP TRIGGER IF EXISTS set_updated_at ON public.new_projects;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.new_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 3. DEVELOPERS: Add missing columns (table already exists with id + name)
ALTER TABLE public.developers
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 4. Enable RLS on new tables (if not already)
ALTER TABLE public.new_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read developers
DROP POLICY IF EXISTS "Authenticated users can read developers" ON public.developers;
CREATE POLICY "Authenticated users can read developers"
  ON public.developers FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage developers
DROP POLICY IF EXISTS "Admins can manage developers" ON public.developers;
CREATE POLICY "Admins can manage developers"
  ON public.developers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Allow authenticated users to read new_projects
DROP POLICY IF EXISTS "Authenticated users can read new_projects" ON public.new_projects;
CREATE POLICY "Authenticated users can read new_projects"
  ON public.new_projects FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to create new_projects
DROP POLICY IF EXISTS "Authenticated users can create new_projects" ON public.new_projects;
CREATE POLICY "Authenticated users can create new_projects"
  ON public.new_projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow admins to manage new_projects
DROP POLICY IF EXISTS "Admins can manage new_projects" ON public.new_projects;
CREATE POLICY "Admins can manage new_projects"
  ON public.new_projects FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Done! Refresh PostgREST schema cache by calling:
-- NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
