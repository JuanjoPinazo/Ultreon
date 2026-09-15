const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getCols() {
  const { data, error } = await supabase.rpc('get_columns_for_table', { table_name: 'ecrf_opstar_records' });
  if (error) {
     // fallback if RPC doesn't exist: try to do a select with limit 1 and get keys
     const { data: recs, error: recsError } = await supabase.from('ecrf_opstar_records').select('*').limit(1);
     if (recs && recs.length > 0) {
       console.log("Columns from data:", Object.keys(recs[0]));
     } else if (recs && recs.length === 0) {
       console.log("No data, cannot deduce columns from select.");
     } else {
       console.log("Error querying:", recsError);
     }
  } else {
    console.log(data);
  }
}
getCols();
