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
  try {
    console.log("=== INTEGRITY CHECK ===");

    // 1. DDL WINDOW & CONCURRENT WRITES
    // We know from transcript:
    // DISABLE was run at ~ 2026-09-19T07:21:41Z (09:21 local)
    // ENABLE was run in the same script immediately after.
    // Let's query any cases created or updated around that time.
    const windowStart = '2026-09-19T07:20:00Z';
    const windowEnd = '2026-09-19T07:23:00Z';

    const { data: recentCases, error: caseErr } = await supabase
      .from('ultreon_registry_cases')
      .select('id, anonymous_code, updated_at, created_at')
      .gte('updated_at', windowStart)
      .lte('updated_at', windowEnd);

    if (caseErr) throw caseErr;

    console.log(`Cases updated in DDL window (${windowStart} to ${windowEnd}):`, recentCases);

    // 2. SYNTHETIC CASE
    const { data: testCase } = await supabase
      .from('ultreon_registry_cases')
      .select('is_demo, is_prelaunch')
      .eq('anonymous_code', 'TEST-LIVE-00000001')
      .single();

    console.log(`Test Case: is_demo=${testCase.is_demo}, is_prelaunch=${testCase.is_prelaunch}`);

    // 3. CENTER STATE
    const { data: settings } = await supabase
      .from('ultreon_registry_hospital_settings')
      .select('phase, official_start_date')
      .eq('hospital_id', '6daf691c-3354-459f-94c5-70fd0e876d28')
      .single();

    console.log(`Manises State: ${settings.phase}, Date: ${settings.official_start_date}`);

    // 4. OFFICIAL COUNTS
    const { data: offCases } = await supabase
      .from('ultreon_registry_cases')
      .select('id')
      .eq('hospital_id', '6daf691c-3354-459f-94c5-70fd0e876d28')
      .eq('is_demo', false)
      .eq('is_prelaunch', false);

    const { data: offCons } = await supabase
      .from('ultreon_registry_consumptions')
      .select('id')
      .eq('hospital_id', '6daf691c-3354-459f-94c5-70fd0e876d28')
      .eq('is_official', true);
      
    const { data: offCons2 } = await supabase
      .from('consumptions')
      .select('id')
      .eq('hospital_id', '6daf691c-3354-459f-94c5-70fd0e876d28')
      .eq('is_official', true);

    const { data: offSet } = await supabase
      .from('ultreon_registry_settlements')
      .select('id')
      .eq('hospital_id', '6daf691c-3354-459f-94c5-70fd0e876d28')
      .eq('is_official', true);
      
    const { data: offSet2 } = await supabase
      .from('settlements')
      .select('id')
      .eq('hospital_id', '6daf691c-3354-459f-94c5-70fd0e876d28')
      .eq('is_official', true);

    const cCount = offCases?.length || 0;
    const consCount = (offCons?.length || 0) + (offCons2?.length || 0);
    const setCount = (offSet?.length || 0) + (offSet2?.length || 0);

    console.log(`Official counts: Cases=${cCount}, Consumptions=${consCount}, Settlements=${setCount}`);

  } catch (e) {
    console.error(e);
  }
}

run();
