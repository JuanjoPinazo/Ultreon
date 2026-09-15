import React from 'react';
import Link from 'next/link';
import { createClient as createServerClient } from '@/lib/supabase/server';
import DocumentationClient from './DocumentationClient';

export default async function DocumentationPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-mono">No autorizado. Por favor inicie sesión.</p>
          <Link href="/login" className="text-cyan-400 hover:underline">Ir al Login</Link>
        </div>
      </div>
    );
  }

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const profile = {
    fullName: userProfile?.full_name || user.email || 'Usuario Clínico',
    role: userProfile?.role || 'hospital_user',
    hospitalId: userProfile?.hospital_id || null,
  };

  // Fetch hospitals for admins
  let hospitals: { id: string; name: string }[] = [];
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    const { data: hospData } = await supabase
      .from('hospitals')
      .select('id, name')
      .order('name');
    hospitals = hospData || [];
  }

  // Get user's hospital name
  let hospitalName = 'Centro No Asignado';
  if (profile.hospitalId) {
    const { data: hosp } = await supabase
      .from('hospitals')
      .select('name')
      .eq('id', profile.hospitalId)
      .single();
    if (hosp) hospitalName = hosp.name;
  }

  return (
    <DocumentationClient
      profile={{ ...profile, hospitalName }}
      hospitals={hospitals}
    />
  );
}
