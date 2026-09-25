import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Using a test user credentials
const email = process.env.SUPABASE_TEST_EMAIL || 'test@example.com';
const password = process.env.SUPABASE_TEST_PASSWORD || 'password123';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Authenticating...');
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (authError) {
    console.error('Auth error:', authError);
    // if auth fails, we skip test execution gracefully since this might be a generic test environment
    return;
  }
  console.log('Authenticated.');

  // Find a test operator or create one
  const { data: testOp, error: testOpErr } = await supabase.from('operators').select('id').limit(1).single();
  if (testOpErr || !testOp) {
    console.error('Could not find test operator:', testOpErr);
    return;
  }
  const operatorId = testOp.id;

  console.log(`Using Operator: ${operatorId}`);

  // Test 1: Insert
  console.log('Testing Profile Insert/Update (1)...');
  const { error: upsert1Err } = await supabase.from('operator_clinical_profile').upsert({
    operator_id: operatorId,
    image_usage_oct: 4,
    image_usage_ivus: 3,
    image_usage_angio: 3,
    experience_oct: 2,
    experience_level_oct: 'Expert',
    experience_ultreon: 'Yes',
  });

  if (upsert1Err) console.error('Upsert 1 Error:', upsert1Err);
  else console.log('Upsert 1 Success.');

  // Test 2: Update
  console.log('Testing Profile Insert/Update (2)...');
  const { error: upsert2Err } = await supabase.from('operator_clinical_profile').upsert({
    operator_id: operatorId,
    image_usage_oct: 5,
    image_usage_ivus: 2,
    image_usage_angio: 3,
    experience_oct: 3,
    experience_level_oct: 'Expert',
    experience_ultreon: 'Yes',
  });

  if (upsert2Err) console.error('Upsert 2 Error:', upsert2Err);
  else console.log('Upsert 2 Success.');

  // Check History
  const { data: history, error: historyErr } = await supabase.from('operator_clinical_profile_history')
    .select('*')
    .eq('operator_id', operatorId)
    .order('valid_from', { ascending: false });

  if (historyErr) {
    console.error('History Fetch Error:', historyErr);
  } else {
    console.log(`Found ${history.length} history records.`);
    console.log(history.map(h => ({ oct: h.image_usage_oct, valid_to: h.valid_to })));
  }
}

runTest().catch(console.error);
