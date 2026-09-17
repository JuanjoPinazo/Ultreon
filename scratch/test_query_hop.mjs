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
  const { data, error } = await supabase
    .from('hospital_operators')
    .select(`
      hospital_id,
      operator:operators (
        id,
        full_name,
        is_active,
        operator_user_links (
          user_id
        )
      )
    `)
    .eq('is_active', true)
    .limit(1);

  if (error) {
    console.error('Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Success:', JSON.stringify(data, null, 2));
  }
}

test();
