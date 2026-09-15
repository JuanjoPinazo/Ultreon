const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    let { data, error } = await supabase.from('hospital_case_counters').select('*').limit(1);
    console.log("hospital_case_counters:", error ? error.message : "Exists");
})();
