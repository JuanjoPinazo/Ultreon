const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

fetch(`${url}/rest/v1/ultreon_registry_cases?select=*`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
}).then(res => res.json()).then(data => {
  console.log(`Total: ${data.length}`);
  const demos = data.filter(d => d.is_demo);
  console.log(`Demos: ${demos.length}`);
  if (demos.length > 0) {
    console.log(`Demo Status: ${demos[0].status}`);
  }
  const drafts = data.filter(d => d.status === 'DRAFT');
  console.log(`Drafts: ${drafts.length}`);
}).catch(console.error);
