import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xdfhqhochessqscpdbgs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI'
);

async function run() {
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .ilike('full_name', '%Ram%n%P%');

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return;
  }
  
  if (users && users.length > 0) {
    const user = users[0];
    console.log('Found user:', user);
    
    // Attempt to update
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'clinical_admin' })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error updating user:', updateError);
    } else {
      console.log('Successfully updated user to clinical_admin');
    }
  } else {
    console.log('User not found');
  }
}

run();
