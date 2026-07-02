import React from 'react';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getExecutiveDashboardStats } from '@/lib/supabase/actions';
import ExecutiveDashboardClient from './ExecutiveDashboardClient';

export default async function ExecutiveDashboardPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const { success, cases, hospitals, investigators, error } = await getExecutiveDashboardStats();

  if (!success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center font-mono">
        Error loading executive data: {error}
      </div>
    );
  }

  return (
    <ExecutiveDashboardClient 
      cases={cases} 
      hospitals={hospitals} 
      investigators={investigators} 
      profileName={profile.full_name} 
    />
  );
}
