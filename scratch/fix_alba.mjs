import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const { data: usersData } = await supabase.auth.admin.listUsers();
  
  const albaUser = usersData.users.find(u => u.email === 'lopez_albmar@gva.es');
  if (albaUser) {
    console.log('Restoring Alba Lopez auth user_metadata...');
    await supabase.auth.admin.updateUserById(albaUser.id, {
      user_metadata: {
        email_verified: true,
        full_name: 'Dra. Alba López',
        hospital_id: '6daf691c-3354-459f-94c5-70fd0e876d28',
        role: 'hospital_user'
      }
    });
    console.log('Restored Alba Lopez.');
  }
}

main().catch(console.error);
