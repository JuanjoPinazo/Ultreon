import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("=== 1. CREAR CASO PRUEBA ===");
  const { data: hosp } = await supabase.from('hospitals').select('id').limit(1).single();
  const { data: op } = await supabase.from('operators').select('id').limit(1).single();

  const caseId = crypto.randomUUID();
  const { data, error } = await supabase.from('ultreon_registry_cases').insert({
    id: caseId,
    hospital_id: hosp.id,
    operator_id: op.id,
    procedure_date: new Date().toISOString(),
    is_demo: false,
    status: 'COMPLETED'
  }).select();

  if (error) {
    console.error("Error creating case:", error);
  } else {
    console.log("Created Case:", data[0].id);
    console.log("is_demo:", data[0].is_demo);
    console.log("is_prelaunch:", data[0].is_prelaunch);
  }
}

main();
