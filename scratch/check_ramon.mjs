import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const matches = usersData.users.filter(u => 
    u.email?.toLowerCase().includes('ramon') || 
    u.email?.toLowerCase().includes('palop')
  );
  console.log(`Found ${matches.length} matching auth users:`);
  for (const u of matches) {
    console.log(`- ID: ${u.id}, Email: ${u.email}`);
  }
}
main().catch(console.error);
