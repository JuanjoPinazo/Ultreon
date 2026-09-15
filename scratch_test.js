const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: hopOps, error } = await supabase
    .from('hospital_operators')
    .select(`
      hospital_id,
      operator:operators (
        id,
        full_name,
        is_active
      )
    `)
    .eq('is_active', true);
    
  console.log("Error:", error);
  console.log("hopOps length:", hopOps?.length);
  if (hopOps && hopOps.length > 0) {
    console.log("hopOps[0]:", JSON.stringify(hopOps[0], null, 2));
  }
}

test();
