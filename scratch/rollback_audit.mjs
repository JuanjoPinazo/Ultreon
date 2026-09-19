import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
});

async function run() {
  console.log("Analyzing the test case TEST-LIVE-00000001...");
  try {
    const { data: testCase, error: caseErr } = await supabase
      .from('ultreon_registry_cases')
      .select('*')
      .eq('anonymous_code', 'TEST-LIVE-00000001')
      .single();
      
    if (caseErr) throw caseErr;
    console.log("Found Test Case:", testCase.id);

    // Look for consumptions
    const { data: consumptions, error: consErr } = await supabase
      .from('ultreon_registry_consumptions')
      .select('*')
      .eq('hospital_id', testCase.hospital_id);
    
    console.log("Consumptions:", consumptions);
    
    const { data: consumptions2 } = await supabase
      .from('consumptions')
      .select('*')
      .eq('hospital_id', testCase.hospital_id);
    console.log("Legacy Consumptions:", consumptions2);

    // Look for stock movements / inventory
    const { data: inventory } = await supabase
      .from('hospital_inventory')
      .select('*')
      .eq('hospital_id', testCase.hospital_id)
      .single();
    
    console.log("Current Inventory:", inventory);
    
    const { data: ultreonInventory } = await supabase
      .from('ultreon_registry_hospital_inventory')
      .select('*')
      .eq('hospital_id', testCase.hospital_id)
      .single();
    
    console.log("Current Ultreon Inventory:", ultreonInventory);
    
    // Look for economic/settlements
    const { data: economics } = await supabase
      .from('settlements')
      .select('*')
      .eq('hospital_id', testCase.hospital_id);
      
    console.log("Settlements:", economics);
    
    // Hospital settings
    const { data: hospitalSettings } = await supabase
      .from('ultreon_registry_hospital_settings')
      .select('*')
      .eq('hospital_id', testCase.hospital_id)
      .single();
      
    console.log("Hospital Settings:", hospitalSettings);
  } catch(e) {
    console.error(e);
  }
}
run();
