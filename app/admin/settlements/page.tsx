import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettlementsClient from './SettlementsClient';

export default async function SettlementsPage() {
  const supabase = await createServerClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    redirect('/login');
  }

  // Verify admin access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || profile.role !== 'admin' && profile.role !== 'super_admin') {
    redirect('/dashboard');
  }

  // Check phase
  const { data: settings } = await supabase
    .from('registry_settings')
    .select('phase')
    .single();

  const isPrelaunch = settings?.phase === 'PRELAUNCH';

  return (
    <SettlementsClient 
      isPrelaunch={isPrelaunch} 
      userId={session.user.id}
    />
  );
}
