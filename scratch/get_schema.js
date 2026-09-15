const fs = require('fs');
(async () => {
    const res = await fetch("https://xdfhqhochessqscpdbgs.supabase.co/rest/v1/?apikey=" + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const json = await res.json();
    console.log(Object.keys(json));
    fs.writeFileSync('scratch/schema.json', JSON.stringify(json.components?.schemas?.ecrf_opstar_records || json.definitions?.ecrf_opstar_records, null, 2));
})();
