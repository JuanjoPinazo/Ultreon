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

async function runTest() {
  console.log("== CENTER-LEVEL GO LIVE DB VERIFICATION ==");
  
  // 1. Set QA Manises to CENTER_LIVE and QA Clínico to CENTER_PRELAUNCH
  const { data: hospitals, error: hErr } = await supabase.from('hospitals').select('id, name');
  if (hErr) throw hErr;
  
  const manises = hospitals.find(h => h.name.includes('Manises'));
  const clinico = hospitals.find(h => h.name.includes('Clínico'));
  
  if (!manises || !clinico) {
    console.error("Hospitals not found");
    return;
  }
  
  console.log(`Manises ID: ${manises.id}`);
  console.log(`Clínico ID: ${clinico.id}`);
  
  await supabase.from('ultreon_registry_hospital_settings').upsert({
    hospital_id: manises.id,
    phase: 'CENTER_LIVE',
    official_start_date: '2026-01-01',
    code_prefix: 'HDMAN'
  });
  
  await supabase.from('ultreon_registry_hospital_settings').upsert({
    hospital_id: clinico.id,
    phase: 'CENTER_PRELAUNCH',
    code_prefix: 'HCUDV'
  });
  
  // 2. Insert cases and check is_prelaunch
  // Using some random mock patient data for the required fields
  const mockPatient = {
    anonymous_code: `TEST-${Date.now()}`,
    age_range: '60_69',
    gender: 'male',
    clinical_presentation: 'stable_angina',
    procedure_date: '2026-09-01',
    is_demo: false,
    status: 'COMPLETED'
  };
  
  console.log("Inserting case in Manises (LIVE)...");
  const { data: manisesCase, error: mcErr } = await supabase.from('ultreon_registry_cases').insert({
    ...mockPatient,
    hospital_id: manises.id
  }).select().single();
  
  if (mcErr) console.error("Error Manises:", mcErr);
  else console.log(`Manises Case Prelaunch: ${manisesCase.is_prelaunch} (Expected: false)`);
  
  console.log("Inserting case in Clínico (PRELAUNCH)...");
  const { data: clinicoCase, error: ccErr } = await supabase.from('ultreon_registry_cases').insert({
    ...mockPatient,
    anonymous_code: `TEST-C-${Date.now()}`,
    hospital_id: clinico.id
  }).select().single();
  
  if (ccErr) console.error("Error Clínico:", ccErr);
  else console.log(`Clínico Case Prelaunch: ${clinicoCase.is_prelaunch} (Expected: true)`);
  
  console.log("== DONE ==");
}

runTest().catch(console.error);
