-- Car Manager Database Schema
-- Run this in Supabase SQL Editor

-- 1. Dealerships table
CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  roles TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pipeline Stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  order_num INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  role TEXT NOT NULL,
  completion_field TEXT NOT NULL,
  completion_type TEXT NOT NULL DEFAULT 'checkbox',
  list_name TEXT,
  target_hours INTEGER DEFAULT 24,
  stage_color TEXT DEFAULT '#ef4444',
  is_terminal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  row_id INTEGER NOT NULL,
  stock_num TEXT NOT NULL,
  year TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  vin TEXT,
  status TEXT DEFAULT 'Pending',
  age INTEGER DEFAULT 0,
  in_system_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT DEFAULT '',
  ro_num TEXT DEFAULT '',
  estimate NUMERIC(10,2),
  actual NUMERIC(10,2),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Stage Completions table
CREATE TABLE IF NOT EXISTS stage_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  completion_value TEXT,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ
);

-- 6. Audit Log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  vehicle_desc TEXT,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Dropdown Lists table
CREATE TABLE IF NOT EXISTS dropdown_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL,
  values TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stage_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE dropdown_lists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dealerships
CREATE POLICY "Users can view their own dealership" ON dealerships
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage dealerships" ON dealerships
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for users
CREATE POLICY "Users can view users in their dealership" ON users
  FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE dealership_id = (SELECT dealership_id FROM users WHERE id = auth.uid())));

CREATE POLICY "Users can insert users" ON users
  FOR INSERT WITH CHECK (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 'Manager' = ANY(roles)));

CREATE POLICY "Users can update users" ON users
  FOR UPDATE USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 'Manager' = ANY(roles)));

-- RLS Policies for pipeline_stages
CREATE POLICY "Users can view pipeline stages" ON pipeline_stages
  FOR SELECT USING (true);

CREATE POLICY "Users can manage pipeline stages" ON pipeline_stages
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 'Manager' = ANY(roles)));

-- RLS Policies for vehicles
CREATE POLICY "Users can view vehicles" ON vehicles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert vehicles" ON vehicles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vehicles" ON vehicles
  FOR UPDATE USING (true);

-- RLS Policies for stage_completions
CREATE POLICY "Users can view completions" ON stage_completions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage completions" ON stage_completions
  FOR ALL USING (true);

-- RLS Policies for audit_log
CREATE POLICY "Users can view audit log" ON audit_log
  FOR SELECT USING (true);

CREATE POLICY "Users can insert audit log" ON audit_log
  FOR INSERT WITH CHECK (true);

-- RLS Policies for dropdown_lists
CREATE POLICY "Users can view dropdown lists" ON dropdown_lists
  FOR SELECT USING (true);

CREATE POLICY "Users can manage dropdown lists" ON dropdown_lists
  FOR ALL USING (auth.role() = 'service_role' OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND 'Manager' = ANY(roles)));

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default dealership
INSERT INTO dealerships (id, name) 
SELECT '00000000-0000-0000-0000-000000000001', 'Default Dealership'
WHERE NOT EXISTS (SELECT 1 FROM dealerships WHERE id = '00000000-0000-0000-0000-000000000001');

-- Insert default admin user (PIN: 0000, role: Manager)
INSERT INTO users (id, dealership_id, name, pin, roles, active)
SELECT '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Admin', '0000', ARRAY['Manager'], true
WHERE NOT EXISTS (SELECT 1 FROM users WHERE pin = '0000');

-- Insert default pipeline stages
INSERT INTO pipeline_stages (dealership_id, order_num, stage_name, role, completion_field, completion_type, list_name, target_hours, stage_color, is_terminal) VALUES
('00000000-0000-0000-0000-000000000001', 1, 'Pending Inventory', 'Manager', 'inventory', 'checkbox', NULL, 24, '#ef4444', false),
('00000000-0000-0000-0000-000000000001', 2, 'Awaiting Detail', 'Detail', 'detailer', 'dropdown', 'Detailers', 24, '#ef4444', false),
('00000000-0000-0000-0000-000000000001', 3, 'Awaiting Photos', 'Detail', 'photographer', 'dropdown', 'Detailers', 24, '#eab308', false),
('00000000-0000-0000-0000-000000000001', 4, 'Awaiting Service', 'Service', 'advisor', 'dropdown', 'Advisors', 24, '#eab308', false),
('00000000-0000-0000-0000-000000000001', 5, 'Pending Estimate', 'Service', 'technician', 'dropdown', 'Technicians', 24, '#eab308', false),
('00000000-0000-0000-0000-000000000001', 6, 'Pending Approval', 'Manager', 'approved', 'checkbox', NULL, 24, '#f97316', false),
('00000000-0000-0000-0000-000000000001', 7, 'Approved - Pending Repair', 'Service', 'work_complete', 'checkbox', NULL, 48, '#eab308', false),
('00000000-0000-0000-0000-000000000001', 8, 'Ready for Sale', 'Sales', 'ready', 'checkbox', NULL, 0, '#22c55e', true)
ON CONFLICT DO NOTHING;

-- Insert default dropdown lists
INSERT INTO dropdown_lists (dealership_id, list_name, values) VALUES
('00000000-0000-0000-0000-000000000001', 'Detailers', ARRAY['Mike Johnson', 'Sarah Williams', 'Tom Brown']),
('00000000-0000-0000-0000-000000000001', 'Advisors', ARRAY['James Wilson', 'Emily Davis', 'Robert Miller']),
('00000000-0000-0000-0000-000000000001', 'Technicians', ARRAY['Chris Anderson', 'Dan Martinez', 'Paul Thompson'])
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_dealership ON vehicles(dealership_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_stage_completions_vehicle ON stage_completions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_vehicle ON audit_log(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
