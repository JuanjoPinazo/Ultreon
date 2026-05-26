// app/page.tsx
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';

export default async function IndexPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  if (profile.role === 'admin') {
    redirect('/admin');
  } else {
    redirect('/dashboard');
  }
}
