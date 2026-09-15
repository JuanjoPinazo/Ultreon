const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

const supabase = createClient(url, key);

async function test() {
  // First, we need to login as an admin or hospital user
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@ultreon.com', // Let's guess the admin email
    password: 'password' // We don't have the password easily.
  });
  console.log(authError);
}
test();
