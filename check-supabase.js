const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pgveqfawikvwqifsvsrx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBndmVxZmF3aWt2d3FpZnN2c3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODQ3NjIsImV4cCI6MjA4Njg2MDc2Mn0.ygWg_7jG0Vdy9561xrMgDO5SWdUaK7oz5LhBcyOUlxk';

const supabase = createClient(supabaseUrl, supabaseKey);

// Try to read the health endpoint
const https = require('https');

https.get('https://pgveqfawikvwqifsvsrx.supabase.co/rest/v1/', (res) => {
  console.log('Status:', res.statusCode);
  res.on('data', (d) => {
    console.log('Data:', d.toString());
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});

// Also try querying
supabase.from('dealerships').select('*').then(({ data, error }) => {
  if (error) {
    console.log('Query error:', error.message);
  } else {
    console.log('Data:', data);
  }
});
