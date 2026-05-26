// app/follow-up/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import FollowUpDashboard from './FollowUpDashboard';

export const metadata: Metadata = {
  title: 'Seguimiento Clínico y Outcomes — OPSTAR-AI Levante Registry',
  description: 'Seguimiento longitudinal y outcomes clínicos (MACE) del registro clínico multicéntrico OPSTAR-AI.',
};

export default async function FollowUpPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Obtener perfil y hospital del usuario actual
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, hospital_id, is_active, hospitals(name)')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  // Cargar hospitales activos (solo para administradores y monitores)
  let hospitals: { id: string; name: string }[] = [];
  if (profile.role === 'admin' || profile.role === 'monitor') {
    const { data: hospitalsData } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    hospitals = hospitalsData || [];
  }

  // Cargar casos con su correspondiente historial de seguimientos (opstar_followup)
  let query = supabase
    .from('ecrf_opstar_records')
    .select(`
      *,
      hospitals(name),
      opstar_strategy_changes(*),
      opstar_optimization_results(*),
      opstar_followup(*)
    `);

  // Restringir casos por centro si es investigador local (hospital_user)
  if (profile.role === 'hospital_user') {
    if (profile.hospital_id) {
      query = query.eq('hospital_id', profile.hospital_id);
    } else {
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data: cases, error: casesError } = await query.order('created_at', { ascending: false });

  const hospitalName = profile.hospitals
    ? (Array.isArray(profile.hospitals) ? profile.hospitals[0]?.name : (profile.hospitals as any).name)
    : 'Sin centro asignado';

  return (
    <FollowUpDashboard
      initialCases={cases || []}
      profile={{
        fullName: profile.full_name || '',
        role: profile.role || 'hospital_user',
        hospitalId: profile.hospital_id || '',
        hospitalName,
      }}
      hospitals={hospitals}
    />
  );
}
