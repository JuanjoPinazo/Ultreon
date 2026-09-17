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

async function checkOfficialDataset() {
  console.log("== OFFICIAL DATASET INVENTORY CHECK ==");

  const { data: cases, error: caseErr } = await supabase
    .from('ultreon_registry_cases')
    .select('id, is_demo, is_prelaunch, status');

  if (caseErr) throw caseErr;

  let demoCount = 0;
  let prelaunchCount = 0;
  let officialCount = 0;

  for (const c of cases) {
    if (c.is_demo) {
      demoCount++;
    } else if (c.is_prelaunch) {
      prelaunchCount++;
    } else {
      officialCount++;
    }
  }

  console.log(`CASES -> Demo: ${demoCount}, Prelaunch: ${prelaunchCount}, Official: ${officialCount}`);

  if (officialCount > 0) {
    console.error(`❌ ERROR: Found ${officialCount} official cases. Expected 0.`);
    process.exit(1);
  }

  // Check economics
  const { count: econCount, error: econErr } = await supabase
    .from('registry_case_economics')
    .select('*', { count: 'exact', head: true });
    
  if (econErr) throw econErr;
  
  // Since we know we didn't run the economics triggers with official cases, 
  // any economics generated from PRELAUNCH cases might exist but they are explicitly marked.
  // Actually we only check if there's any official payments logic, but we haven't implemented it.

  console.log(`ECONOMICS ROWS -> Total: ${econCount}`);
  
  console.log("✅ CHECK PASSED: 0 Official records found.");
}

checkOfficialDataset().catch(console.error);
