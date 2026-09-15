import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_columns_test', {}); // wait, RPC might not exist.
  // We can query using the REST API if we don't have access to information_schema from anon/service_role.
  // Or we can just select 1 row from the table to see what keys come back.
  const { data: rows, error: err } = await supabase.from('hospital_case_counters').select('*').limit(1);
  if (err) {
    console.error('Error selecting:', err);
  } else {
    console.log('Row keys:', rows.length > 0 ? Object.keys(rows[0]) : 'No rows. But table exists.');
  }
}
run();
