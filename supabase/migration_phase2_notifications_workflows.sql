-- Phase 2: Create notifications and workflows tables
-- Run this migration in your Supabase SQL editor

-- ===== NOTIFICATIONS TABLE =====
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  entity_type TEXT,
  entity_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ===== WORKFLOWS TABLE =====
DROP TABLE IF EXISTS workflows CASCADE;

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflows"
  ON workflows FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Indexes
CREATE INDEX idx_workflows_active ON workflows(is_active);

-- Insert default workflows (separate inserts to avoid JSON encoding issues)
INSERT INTO workflows (name, description, steps, is_active) VALUES ('Transaction', 'Transaction approval workflow', '[{"id":"s1","name":"Submit","type":"start","next_step_id":"s2"},{"id":"s2","name":"Manager Review","type":"approval","next_step_id":"s3"},{"id":"s3","name":"Finance Review","type":"approval","next_step_id":"s4"},{"id":"s4","name":"Complete","type":"end"}]'::jsonb, true);

INSERT INTO workflows (name, description, steps, is_active) VALUES ('Commission', 'Commission approval workflow', '[{"id":"s1","name":"Submit","type":"start","next_step_id":"s2"},{"id":"s2","name":"Approval","type":"approval","next_step_id":"s3"},{"id":"s3","name":"Complete","type":"end"}]'::jsonb, true);

INSERT INTO workflows (name, description, steps, is_active) VALUES ('Portals', 'Portal publication workflow', '[{"id":"s1","name":"Submit","type":"start","next_step_id":"s2"},{"id":"s2","name":"Review","type":"approval","next_step_id":"s3"},{"id":"s3","name":"Published","type":"end"}]'::jsonb, true);

INSERT INTO workflows (name, description, steps, is_active) VALUES ('Listings Status', 'Listing status change workflow', '[{"id":"s1","name":"Request","type":"start","next_step_id":"s2"},{"id":"s2","name":"Approve","type":"approval","next_step_id":"s3"},{"id":"s3","name":"Done","type":"end"}]'::jsonb, true);

INSERT INTO workflows (name, description, steps, is_active) VALUES ('Listings Update', 'Listing update workflow', '[{"id":"s1","name":"Submit","type":"start","next_step_id":"s2"},{"id":"s2","name":"Review","type":"approval","next_step_id":"s3"},{"id":"s3","name":"Updated","type":"end"}]'::jsonb, true);
