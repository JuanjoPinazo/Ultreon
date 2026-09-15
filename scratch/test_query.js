const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('ultreon_registry_cases').select('*');
  console.log('Error:', error);
  console.log(`Total: ${data?.length}`);
  const demos = data?.filter(d => d.is_demo);
  console.log(`Demos: ${demos?.length}`);
  if (demos?.length > 0) {
    console.log(demos[0].status);
  }
}
test();
