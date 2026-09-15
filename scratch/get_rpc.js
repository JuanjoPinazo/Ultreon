const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data: hosp } = await supabase.from('hospitals').select('id').limit(1).single();
    if(hosp) {
      console.log("Calling with hospital:", hosp.id);
      const { data, error } = await supabase.rpc('create_draft_case_secure', { p_hospital_id: hosp.id });
      console.log("Result:", data, error);
    }
})();
