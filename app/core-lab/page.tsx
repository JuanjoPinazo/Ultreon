import React from 'react';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CoreLabDashboardClient from './CoreLabDashboardClient';

export default async function CoreLabPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Only admin and monitor access
  if (profile?.role !== 'admin' && profile?.role !== 'monitor') {
    redirect('/dashboard');
  }

  // Fetch all cases with media counts
  const { data: cases } = await supabase
    .from('ecrf_opstar_records')
    .select(`
      id,
      id_paciente,
      centro,
      vaso_diana,
      created_at,
      hospitals(name),
      opstar_case_media(
        id,
        reviewed_at,
        corelab_quality,
        media_category
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <CoreLabDashboardClient
      cases={cases || []}
      userRole={profile?.role || 'viewer'}
    />
  );
}
