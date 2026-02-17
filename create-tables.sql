-- Create all tables for Car Manager

-- Dealerships table
CREATE TABLE IF NOT EXISTS dealerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table  
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pin TEXT NOT NULL,
  roles TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  stage_name TEXT NOT NULL,
  role TEXT NOT NULL,
  completion_field TEXT NOT NULL DEFAULT '',
  completion_type TEXT DEFAULT 'checkbox',
  list_name TEXT,
  target_hours INTEGER DEFAULT 24,
  stage_color TEXT DEFAULT '#6B7280',
  is_terminal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  row_id SERIAL,
  stock_num TEXT,
  year TEXT,
  make TEXT,
  model TEXT,
  vin TEXT,
  status TEXT DEFAULT 'Pending Inventory',
  age INTEGER DEFAULT 0,
  in_system_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT DEFAULT '',
  ro_num TEXT,
  estimate NUMERIC(10,2),
  actual NUMERIC(10,2),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage completions table
CREATE TABLE IF NOT EXISTS stage_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
  completion_value TEXT DEFAULT '',
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  cleared_at TIMESTAMPTZ
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  user_name TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  vehicle_desc TEXT,
  vehicle_id UUID,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Dropdown lists table
CREATE TABLE IF NOT EXISTS dropdown_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
  list_name TEXT NOT NULL,
  "values" TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and create permissive policies for alpha testing
ALTER TABLE dealerships ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_dealerships" ON dealerships FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_pipeline_stages" ON pipeline_stages FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_vehicles" ON vehicles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE stage_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_stage_completions" ON stage_completions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_audit_log" ON audit_log FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE dropdown_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "allow_all_dropdown_lists" ON dropdown_lists FOR ALL USING (true) WITH CHECK (true);

-- Insert default data
DO $$
DECLARE
    dealership_uuid UUID;
BEGIN
    -- Insert dealership if not exists
    INSERT INTO dealerships (name) VALUES ('Demo Dealership') 
    ON CONFLICT DO NOTHING;
    
    -- Get dealership ID
    SELECT id INTO dealership_uuid FROM dealerships WHERE name = 'Demo Dealership' LIMIT 1;
    
    -- Insert admin user if not exists
    INSERT INTO users (dealership_id, name, pin, roles, active) 
    VALUES (dealership_uuid, 'Admin', '0000', ARRAY['Manager'], true)
    ON CONFLICT DO NOTHING;
    
    -- Insert pipeline stages if not exists
    INSERT INTO pipeline_stages (dealership_id, "order", stage_name, role, completion_field, completion_type, list_name, target_hours, stage_color, is_terminal)
    VALUES 
        (dealership_uuid, 1, 'Pending Inventory', 'Manager', 'Inventory', 'checkbox', null, null, '#EF4444', false),
        (dealership_uuid, 2, 'Awaiting Detail', 'Detail', 'Detailer', 'dropdown', 'Detailers', 4, '#EAB308', false),
        (dealership_uuid, 3, 'Awaiting Photos', 'Detail', 'Photographer', 'dropdown', 'Detailers', 2, '#EAB308', false),
        (dealership_uuid, 4, 'Awaiting Service', 'Service', 'Service Advisor', 'dropdown', 'Advisors', 8, '#EAB308', false),
        (dealership_uuid, 5, 'Pending Estimate', 'Service', 'Technician', 'dropdown', 'Technicians', 24, '#EAB308', false),
        (dealership_uuid, 6, 'Pending Approval', 'Manager', 'Approved', 'checkbox', null, 4, '#F97316', false),
        (dealership_uuid, 7, 'Approved - Pending Repair', 'Service', 'Work Complete', 'checkbox', null, 48, '#EAB308', false),
        (dealership_uuid, 8, 'Ready for Sale', 'Sales', '', 'checkbox', null, null, '#22C55E', true)
    ON CONFLICT DO NOTHING;
    
    -- Insert dropdown lists if not exists
    INSERT INTO dropdown_lists (dealership_id, list_name, "values")
    VALUES 
        (dealership_uuid, 'Detailers', ARRAY['John D.', 'Maria L.', 'Chris T.']),
        (dealership_uuid, 'Advisors', ARRAY['Mike A.', 'Lisa B.', 'Pat M.']),
        (dealership_uuid, 'Technicians', ARRAY['Tom R.', 'Dave W.', 'Steve H.'])
    ON CONFLICT DO NOTHING;
END $$;