-- Phase 3: Create call_logs and messages tables
-- Run this migration in your Supabase SQL editor

-- ===== CALL LOGS TABLE =====
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'answered' CHECK (status IN ('answered', 'missed', 'voicemail', 'busy')),
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  notes TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read call_logs"
  ON call_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create call_logs"
  ON call_logs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own call_logs or admins"
  ON call_logs FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete call_logs"
  ON call_logs FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Indexes
CREATE INDEX idx_call_logs_agent ON call_logs(agent_id);
CREATE INDEX idx_call_logs_created ON call_logs(created_at DESC);
CREATE INDEX idx_call_logs_status ON call_logs(status);
CREATE INDEX idx_call_logs_lead ON call_logs(lead_id);

-- ===== MESSAGES TABLE (WhatsApp/SMS/Email) =====
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES profiles(id),
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp' CHECK (channel IN ('whatsapp', 'sms', 'email')),
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read messages"
  ON messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON messages FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update own messages or admins"
  ON messages FOR UPDATE TO authenticated
  USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

CREATE POLICY "Admins can delete messages"
  ON messages FOR DELETE TO authenticated
  USING (agent_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')));

-- Indexes
CREATE INDEX idx_messages_agent ON messages(agent_id);
CREATE INDEX idx_messages_channel ON messages(channel);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_lead ON messages(lead_id);
