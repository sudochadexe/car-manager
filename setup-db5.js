const { Pool } = require('pg');

// Try session mode (port 5432) instead of transaction mode (port 6543)
const pool = new Pool({
  connectionString: 'postgresql://postgres:Passwordforchad1996@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require'
});

async function setup() {
  try {
    const client = await pool.connect();
    console.log('Connected!');
    
    // Create tables
    await client.query(`CREATE TABLE IF NOT EXISTS dealerships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    console.log('Created dealerships');
    
    await client.query(`CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      roles TEXT[] DEFAULT '{}',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    console.log('Created users');
    
    await client.query(`CREATE TABLE IF NOT EXISTS pipeline_stages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
      order_num INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      role TEXT NOT NULL,
      completion_field TEXT NOT NULL,
      completion_type TEXT CHECK (completion_type IN ('checkbox', 'dropdown')) DEFAULT 'checkbox',
      list_name TEXT,
      target_hours INTEGER DEFAULT 24,
      stage_color TEXT DEFAULT '#6B7280',
      is_terminal BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    console.log('Created pipeline_stages');
    
    await client.query(`CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
      row_id SERIAL,
      stock_num TEXT,
      year TEXT,
      make TEXT,
      model TEXT,
      vin TEXT UNIQUE,
      status TEXT DEFAULT 'Pending Inventory',
      age INTEGER DEFAULT 0,
      in_system_date DATE DEFAULT CURRENT_DATE,
      notes TEXT DEFAULT '',
      ro_num TEXT,
      estimate NUMERIC(10,2),
      actual NUMERIC(10,2),
      archived BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    console.log('Created vehicles');
    
    await client.query(`CREATE TABLE IF NOT EXISTS stage_completions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
      stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
      completion_value TEXT DEFAULT '',
      completed_by TEXT,
      completed_at TIMESTAMPTZ,
      cleared_at TIMESTAMPTZ
    )`);
    console.log('Created stage_completions');
    
    await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (
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
    )`);
    console.log('Created audit_logs');
    
    await client.query(`CREATE TABLE IF NOT EXISTS dropdown_lists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
      list_name TEXT NOT NULL,
      values TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`);
    console.log('Created dropdown_lists');
    
    // Disable RLS
    await client.query(`ALTER TABLE dealerships DISABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE users DISABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE stage_completions DISABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY`);
    await client.query(`ALTER TABLE dropdown_lists DISABLE ROW LEVEL SECURITY`);
    console.log('Disabled RLS');
    
    // Seed data
    const d = await client.query(`INSERT INTO dealerships (name) VALUES ('Demo Dealership') RETURNING id`);
    const dealershipId = d.rows[0].id;
    console.log('Created dealership:', dealershipId);
    
    await client.query(
      `INSERT INTO users (dealership_id, name, pin, roles, active) VALUES ($1, 'Admin', '0000', ARRAY['Manager'], true)`,
      [dealershipId]
    );
    console.log('Created admin user');
    
    const stages = [
      { order: 1, name: 'Pending Inventory', role: 'Manager', field: 'Inventory', type: 'checkbox', color: '#EF4444', terminal: false },
      { order: 2, name: 'Awaiting Detail', role: 'Detail', field: 'Detailer', type: 'dropdown', list: 'Detailers', color: '#EAB308', terminal: false },
      { order: 3, name: 'Awaiting Photos', role: 'Detail', field: 'Photographer', type: 'dropdown', list: 'Detailers', color: '#EAB308', terminal: false },
      { order: 4, name: 'Awaiting Service', role: 'Service', field: 'Service Advisor', type: 'dropdown', list: 'Advisors', color: '#EAB308', terminal: false },
      { order: 5, name: 'Pending Estimate', role: 'Service', field: 'Technician', type: 'dropdown', list: 'Technicians', color: '#EAB308', terminal: false },
      { order: 6, name: 'Pending Approval', role: 'Manager', field: 'Approved', type: 'checkbox', color: '#F97316', terminal: false },
      { order: 7, name: 'Approved - Pending Repair', role: 'Service', field: 'Work Complete', type: 'checkbox', color: '#EAB308', terminal: false },
      { order: 8, name: 'Ready for Sale', role: 'Sales', field: 'Sold', type: 'checkbox', color: '#22C55E', terminal: true }
    ];
    
    for (const s of stages) {
      await client.query(
        `INSERT INTO pipeline_stages (dealership_id, order_num, stage_name, role, completion_field, completion_type, list_name, stage_color, is_terminal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [dealershipId, s.order, s.name, s.role, s.field, s.type, s.list, s.color, s.terminal]
      );
    }
    console.log('Created pipeline stages');
    
    await client.query(`INSERT INTO dropdown_lists (dealership_id, list_name, values) VALUES ($1, 'Detailers', ARRAY['John D.', 'Maria L.'])`, [dealershipId]);
    await client.query(`INSERT INTO dropdown_lists (dealership_id, list_name, values) VALUES ($1, 'Advisors', ARRAY['Mike A.', 'Lisa B.'])`, [dealershipId]);
    await client.query(`INSERT INTO dropdown_lists (dealership_id, list_name, values) VALUES ($1, 'Technicians', ARRAY['Tom R.', 'Dave W.'])`, [dealershipId]);
    console.log('Created dropdown lists');
    
    console.log('\n✅ Database setup complete!');
    client.release();
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
  }
}

setup();
