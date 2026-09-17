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
  let hospitals: { 
    id: string; 
    name: string; 
    prefix?: string; 
    operators?: string[];
    target?: {
      target_total: number;
      target_monthly: number | null;
      target_weekly: number | null;
      start_date: string;
      end_date: string | null;
    } | null;
  }[] = [];
  if (profile.role === 'admin' || profile.role === 'super_admin') {
    const { data: hospData } = await supabase
      .from('hospitals')
      .select('id, name')
      .order('name');
    hospitals = hospData || [];
  } else if (profile.hospitalId) {
    const { data: hospData } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', profile.hospitalId)
      .order('name');
    hospitals = hospData || [];
  }

  // Fetch hospital settings (prefixes)
  const { data: settingsData } = await supabase
    .from('ultreon_registry_hospital_settings')
    .select('hospital_id, code_prefix');
  
  const settingsMap = new Map((settingsData || []).map(s => [s.hospital_id, s.code_prefix]));

  // Fetch profiles to get operators for each hospital
  const { data: profilesData } = await supabase
    .from('profiles')
    .select('hospital_id, full_name, email')
    .eq('role', 'hospital_user');

  const operatorsByHospital = new Map<string, string[]>();
  if (profilesData) {
    profilesData.forEach(p => {
      if (p.hospital_id) {
        if (!operatorsByHospital.has(p.hospital_id)) {
          operatorsByHospital.set(p.hospital_id, []);
        }
        operatorsByHospital.get(p.hospital_id)!.push(p.full_name || p.email);
      }
    });
  }

  // Fetch targets
  const { data: targetsData } = await supabase
    .from('registry_center_targets')
    .select('hospital_id, target_total, target_monthly, target_weekly, start_date, end_date')
    .eq('active', true);

  const targetsMap = new Map((targetsData || []).map(t => [t.hospital_id, {
    target_total: t.target_total,
    target_monthly: t.target_monthly,
    target_weekly: t.target_weekly,
    start_date: t.start_date,
    end_date: t.end_date
  }]));

  // Attach prefixes, operators and targets to the hospitals array
  hospitals = hospitals.map(h => ({
    ...h,
    prefix: settingsMap.get(h.id) || 'UNKNOWN',
    operators: operatorsByHospital.get(h.id) || [],
    target: targetsMap.get(h.id) || null
  }));

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
