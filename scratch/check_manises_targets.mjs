import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkManises() {
  console.log("=== CHECKING MANISES DATA ===");
  
  // 1. Get Hospital ID
  const { data: hospitals, error: hErr } = await supabase
    .from('hospitals')
    .select('id, name, phase')
    .ilike('name', '%Manises%');

  if (hErr) {
    console.error("Error fetching hospital:", hErr);
    return;
  }
  
  if (!hospitals || hospitals.length === 0) {
    console.log("No hospital found with name Manises.");
    // For mock environment if we don't have db connection
    console.log("\n[MOCK ENVIRONMENT DATA]");
    console.log("hospital_id: mock-manises-uuid");
    console.log("phase: CENTER_PRELAUNCH");
    console.log("targets: [ { id: 'uuid-1', status: 'CLOSED', target_total: 20, target_monthly: 5, start_date: '2026-08-01', created_at: '2026-08-01T10:00:00Z' } ]");
    return;
  }

  const manises = hospitals[0];
  console.log(`Hospital: ${manises.name}`);
  console.log(`ID: ${manises.id}`);
  console.log(`Phase: ${manises.phase}`);

  if (manises.phase !== 'CENTER_PRELAUNCH') {
    console.warn("WARNING: Hospital is not in CENTER_PRELAUNCH phase!");
  } else {
    console.log("✅ Hospital is correctly in CENTER_PRELAUNCH phase.");
  }

  // 2. Get Targets
  const { data: targets, error: tErr } = await supabase
    .from('registry_center_targets')
    .select('*')
    .eq('hospital_id', manises.id);

  if (tErr) {
    console.error("Error fetching targets:", tErr);
    return;
  }

  console.log("\n=== EXISTING TARGETS ===");
  if (!targets || targets.length === 0) {
    console.log("No existing targets found.");
  } else {
    targets.forEach(t => {
      console.log(`- ID: ${t.id}`);
      console.log(`  status: ${t.status} (active: ${t.active})`);
      console.log(`  total: ${t.target_total} | monthly: ${t.target_monthly}`);
      console.log(`  start: ${t.start_date} | end: ${t.end_date || 'N/A'}`);
      console.log(`  created_at: ${t.created_at}`);
      console.log('---');
    });
  }
}

checkManises().catch(console.error);
