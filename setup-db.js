const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.pgveqfawikvwqifsvsrx:Passwordforchad1996@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function setup() {
  const client = await pool.connect();
  console.log('Connected to Supabase!');

  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS dealerships (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ dealerships');

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      pin TEXT NOT NULL,
      roles TEXT[] DEFAULT '{}',
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ users');

  await client.query(`
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
    )
  `);
  console.log('✓ pipeline_stages');

  await client.query(`
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
    )
  `);
  console.log('✓ vehicles');

  await client.query(`
    CREATE TABLE IF NOT EXISTS stage_completions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
      stage_id UUID REFERENCES pipeline_stages(id) ON DELETE CASCADE,
      completion_value TEXT DEFAULT '',
      completed_by TEXT,
      completed_at TIMESTAMPTZ,
      cleared_at TIMESTAMPTZ
    )
  `);
  console.log('✓ stage_completions');

  await client.query(`
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
    )
  `);
  console.log('✓ audit_log');

  await client.query(`
    CREATE TABLE IF NOT EXISTS dropdown_lists (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      dealership_id UUID REFERENCES dealerships(id) ON DELETE CASCADE,
      list_name TEXT NOT NULL,
      "values" TEXT[] DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  console.log('✓ dropdown_lists');

  // Disable RLS on all tables for alpha
  const tables = ['dealerships', 'users', 'pipeline_stages', 'vehicles', 'stage_completions', 'audit_log', 'dropdown_lists'];
  for (const t of tables) {
    await client.query(`ALTER TABLE ${t} ENABLE ROW LEVEL SECURITY`);
    await client.query(`DROP POLICY IF EXISTS "allow_all_${t}" ON ${t}`);
    await client.query(`CREATE POLICY "allow_all_${t}" ON ${t} FOR ALL USING (true) WITH CHECK (true)`);
  }
  console.log('✓ RLS policies (permissive)');

  // Seed data
  const { rows: [dealership] } = await client.query(
    `INSERT INTO dealerships (name) VALUES ('Demo Dealership') ON CONFLICT DO NOTHING RETURNING id`
  );
  
  let dealershipId;
  if (dealership) {
    dealershipId = dealership.id;
  } else {
    const { rows } = await client.query(`SELECT id FROM dealerships LIMIT 1`);
    dealershipId = rows[0].id;
  }
  console.log('✓ dealership:', dealershipId);

  // Admin user
  const { rows: existingUsers } = await client.query(`SELECT id FROM users WHERE pin = '0000' AND dealership_id = $1`, [dealershipId]);
  if (existingUsers.length === 0) {
    await client.query(
      `INSERT INTO users (dealership_id, name, pin, roles, active) VALUES ($1, 'Admin', '0000', ARRAY['Manager'], true)`,
      [dealershipId]
    );
    console.log('✓ admin user created');
  } else {
    console.log('✓ admin user exists');
  }

  // Pipeline stages
  const { rows: existingStages } = await client.query(`SELECT id FROM pipeline_stages WHERE dealership_id = $1`, [dealershipId]);
  if (existingStages.length === 0) {
    const stages = [
      [1, 'Pending Inventory', 'Manager', 'Inventory', 'checkbox', null, null, '#EF4444', false],
      [2, 'Awaiting Detail', 'Detail', 'Detailer', 'dropdown', 'Detailers', 4, '#EAB308', false],
      [3, 'Awaiting Photos', 'Detail', 'Photographer', 'dropdown', 'Detailers', 2, '#EAB308', false],
      [4, 'Awaiting Service', 'Service', 'Service Advisor', 'dropdown', 'Advisors', 8, '#EAB308', false],
      [5, 'Pending Estimate', 'Service', 'Technician', 'dropdown', 'Technicians', 24, '#EAB308', false],
      [6, 'Pending Approval', 'Manager', 'Approved', 'checkbox', null, 4, '#F97316', false],
      [7, 'Approved - Pending Repair', 'Service', 'Work Complete', 'checkbox', null, 48, '#EAB308', false],
      [8, 'Ready for Sale', 'Sales', '', 'checkbox', null, null, '#22C55E', true],
    ];
    for (const s of stages) {
      await client.query(
        `INSERT INTO pipeline_stages (dealership_id, "order", stage_name, role, completion_field, completion_type, list_name, target_hours, stage_color, is_terminal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [dealershipId, ...s]
      );
    }
    console.log('✓ pipeline stages created');
  } else {
    console.log('✓ pipeline stages exist');
  }

  // Dropdown lists
  const { rows: existingLists } = await client.query(`SELECT id FROM dropdown_lists WHERE dealership_id = $1`, [dealershipId]);
  if (existingLists.length === 0) {
    await client.query(`INSERT INTO dropdown_lists (dealership_id, list_name, "values") VALUES ($1, 'Detailers', ARRAY['John D.', 'Maria L.', 'Chris T.'])`, [dealershipId]);
    await client.query(`INSERT INTO dropdown_lists (dealership_id, list_name, "values") VALUES ($1, 'Advisors', ARRAY['Mike A.', 'Lisa B.', 'Pat M.'])`, [dealershipId]);
    await client.query(`INSERT INTO dropdown_lists (dealership_id, list_name, "values") VALUES ($1, 'Technicians', ARRAY['Tom R.', 'Dave W.', 'Steve H.'])`, [dealershipId]);
    console.log('✓ dropdown lists created');
  } else {
    console.log('✓ dropdown lists exist');
  }

  console.log('\n✅ Database setup complete!');
  client.release();
  await pool.end();
}

setup().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
