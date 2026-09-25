import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Checking if SCIENTIFIC_REVIEWER role exists in some table or enum...");
  
  // Create user
  console.log("Creating user Dr. Ramón López Palop...");
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'ramon.lopez.palop@scientific.reviewer.com',
    password: 'Password123!',
    email_confirm: true
  });
  
  if (authErr) {
    console.error("Auth Error:", authErr.message);
  } else {
    console.log("User created:", authData.user.id);
    
    // Assign role to user profile
    const { error: profileErr } = await supabase
      .from('user_profiles')
      .upsert({
        id: authData.user.id,
        first_name: 'Ramón',
        last_name: 'López Palop',
        email: 'ramon.lopez.palop@scientific.reviewer.com',
        role: 'SCIENTIFIC_REVIEWER'
      });
      
    if (profileErr) {
      console.error("Profile Error:", profileErr.message);
    } else {
      console.log("Profile updated with SCIENTIFIC_REVIEWER role.");
    }
  }
}

main().catch(console.error);
