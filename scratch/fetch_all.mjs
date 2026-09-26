import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xdfhqhochessqscpdbgs.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTc5MTk2MiwiZXhwIjoyMDk1MzY3OTYyfQ.8vAG6QkNDfXJ9YrS5QK5tau5i8oUaMg1ojJe-aHiNTI'
);

async function run() {
  const { data: users, error: fetchError } = await supabase
    .from('profiles')
    .select('full_name, role');

  if (fetchError) {
    console.error('Error fetching user:', fetchError);
    return;
  }
  console.log(users);
}

run();
