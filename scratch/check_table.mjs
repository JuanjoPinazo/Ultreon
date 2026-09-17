import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '/Users/juanjopinazo/Dev/Ultreon3/Ultreon/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing direct query to operator_user_links...');
  const { data, error } = await supabase
    .from('operator_user_links')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Direct query error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Direct query success. Table exists and has data/is empty:', data);
  }
}

test();
