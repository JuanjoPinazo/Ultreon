import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log("Looking for Dr. Ramón López Palop in auth.users...");
  const { data: users, error: authError } = await supabase.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error listing users:", authError.message);
    return;
  }
  
  const ramonUser = users.users.find(u => u.email === 'ramon.lopez.palop@scientific.reviewer.com' || (u.user_metadata && (u.user_metadata.full_name?.includes('López') || u.user_metadata.first_name?.includes('Ramón'))));
  
  if (!ramonUser) {
    console.log("Could not find Ramón in auth.users. Creating him...");
    const { data: newAuthData, error: newAuthErr } = await supabase.auth.admin.createUser({
      email: 'ramon.lopez.palop@ultreon.com',
      password: 'OpstarPassword2026!',
      email_confirm: true,
      user_metadata: {
        role: 'clinical_admin',
        full_name: 'Dr. Ramón López-Palop'
      }
    });
    
    if (newAuthErr) {
      console.error("Failed to create new user:", newAuthErr.message);
      return;
    }
    
    console.log("New user created in auth:", newAuthData.user.id);
    
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: newAuthData.user.id,
        full_name: 'Dr. Ramón López-Palop',
        email: 'ramon.lopez.palop@ultreon.com',
        role: 'clinical_admin',
        is_active: true
      });
      
    if (profileErr) console.error("Error creating profile:", profileErr.message);
    else console.log("Profile created successfully.");
    
  } else {
    console.log("Found Ramón user:", ramonUser.id, ramonUser.email);
    
    // Update auth metadata
    await supabase.auth.admin.updateUserById(ramonUser.id, {
      user_metadata: { ...ramonUser.user_metadata, role: 'clinical_admin', full_name: 'Dr. Ramón López-Palop' }
    });
    
    // Update profiles table
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({
        id: ramonUser.id,
        full_name: 'Dr. Ramón López-Palop',
        email: ramonUser.email,
        role: 'clinical_admin',
        is_active: true
      });
      
    if (profileErr) {
      console.error("Error updating profile:", profileErr.message);
    } else {
      console.log("Profile successfully updated to clinical_admin.");
    }
  }
}

main().catch(console.error);
