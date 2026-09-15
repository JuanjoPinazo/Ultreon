const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1]] = match[2];
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("1. Checking public.ultreon_registry_cases");
  const { data, error } = await supabase.from('ultreon_registry_cases').select('*').limit(1);
  if (error) {
    console.error("Error querying table:", error.message);
  } else {
    console.log("Table exists! Cases count in sample:", data.length);
  }

  console.log("\n2. Testing RPC create_ultreon_v3_draft_secure");
  // We need a hospital_id
  const { data: hosp } = await supabase.from('hospitals').select('id').limit(1).single();
  if (hosp) {
    console.log("Testing with hospital_id:", hosp.id);
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_ultreon_v3_draft_secure', {
      p_hospital_id: hosp.id
    });
    if (rpcError) {
      console.log("RPC Error (expected if called via service role because auth.uid() is null):", rpcError.message);
    } else {
      console.log("RPC Success:", rpcData);
    }
  }
}

run();
