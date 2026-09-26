import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: hospData, error: hospErr } = await supabase
    .from('hospitals')
    .select('*')
    .limit(5);
    
  if (hospErr) {
    console.error('Error hospitals:', hospErr);
  } else {
    console.log('Hospital columns of row 1:', Object.keys(hospData[0] || {}));
    console.log('Sample hospital:', hospData[0]);
  }
}

main().catch(console.error);
