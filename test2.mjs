import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://xdfhqhochessqscpdbgs.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhkZmhxaG9jaGVzc3FzY3BkYmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3OTE5NjIsImV4cCI6MjA5NTM2Nzk2Mn0.307y1YDmtoplPhPw64ErGRlAOGqWgU8XDo4pvdyU5ac');
async function run() {
  const { data, error } = await supabase.from('hospitals').select('id, name, is_active');
  console.log('Error:', error);
  console.log('Data:', data);
}
run();
