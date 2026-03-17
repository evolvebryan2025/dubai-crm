-- Phase 1: Create viewings and tasks tables
-- Run this migration in your Supabase SQL editor

-- ===== VIEWINGS TABLE =====
CREATE TABLE IF NOT EXISTS viewings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  agent_id UUID NOT NULL REFERENCES profiles(id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  viewing_date DATE NOT NULL,
  viewing_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  feedback TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  property_address TEXT,
  property_type TEXT,
  area TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER viewings_updated_at
  BEFORE UPDATE ON viewings
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE viewings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read viewings"
  ON viewings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create viewings"
  ON viewings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own viewings or admins"
  ON viewings FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid() OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete viewings"
  ON viewings FOR DELETE
  TO authenticated
  USING (agent_id = auth.uid() OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Indexes
CREATE INDEX idx_viewings_agent ON viewings(agent_id);
CREATE INDEX idx_viewings_date ON viewings(viewing_date);
CREATE INDEX idx_viewings_status ON viewings(status);
CREATE INDEX idx_viewings_listing ON viewings(listing_id);
CREATE INDEX idx_viewings_lead ON viewings(lead_id);

-- ===== TASKS TABLE =====
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'other' CHECK (type IN ('follow_up', 'viewing', 'call', 'meeting', 'email', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  due_time TIME,
  reminder_at TIMESTAMPTZ,
  assigned_to UUID NOT NULL REFERENCES profiles(id),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own tasks or admins"
  ON tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

CREATE POLICY "Users can delete own tasks or admins"
  ON tasks FOR DELETE
  TO authenticated
  USING (assigned_to = auth.uid() OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Indexes
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_lead ON tasks(lead_id);
CREATE INDEX idx_tasks_listing ON tasks(listing_id);
CREATE INDEX idx_tasks_contact ON tasks(contact_id);
