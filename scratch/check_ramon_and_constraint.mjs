import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('--- 1. Checking auth.users ---');
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  
  if (usersErr) {
    console.error('Error fetching auth users:', usersErr);
    return;
  }
  
  const matches = usersData.users.filter(u => 
    u.email?.toLowerCase().includes('ramon') || 
    u.email?.toLowerCase().includes('lopez') || 
    (u.user_metadata && (u.user_metadata.full_name?.toLowerCase().includes('ramón') || u.user_metadata.full_name?.toLowerCase().includes('lopez')))
  );
  
  console.log(`Found ${matches.length} matching auth users:`);
  for (const u of matches) {
    console.log(`- ID: ${u.id}, Email: ${u.email}, Meta: ${JSON.stringify(u.user_metadata)}`);
    
    // Check profiles
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', u.id)
      .single();
      
    if (profileErr) {
      console.log(`  Profile error:`, profileErr.message);
    } else {
      console.log(`  Profile found: ID: ${profile.id}, Role: ${profile.role}, Name: ${profile.full_name}`);
    }
  }

  console.log('\n--- 2. Checking profiles constraint (by attempting to update dummy role) ---');
  if (matches.length > 0) {
    const testId = matches[0].id;
    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ role: 'clinical_admin' })
      .eq('id', testId);
      
    if (updateErr) {
      console.log('Update to clinical_admin failed with error:');
      console.log(`  Code: ${updateErr.code}`);
      console.log(`  Message: ${updateErr.message}`);
      console.log(`  Details: ${updateErr.details}`);
      console.log(`  Hint: ${updateErr.hint}`);
    } else {
      console.log('Update to clinical_admin succeeded!');
    }
  }
}

main().catch(console.error);
