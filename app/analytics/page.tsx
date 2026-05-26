// app/analytics/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import AnalyticsClient from './AnalyticsClient';

export const metadata: Metadata = {
  title: 'Analítica Científica — OPSTAR-AI Levante Registry',
  description: 'Análisis multicéntrico en tiempo real e inteligencia procedimental del registro clínico OPSTAR-AI.',
};

export default async function AnalyticsPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Obtener perfil y hospital del investigador
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, hospital_id, is_active, hospitals(name)')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  // Cargar todos los hospitales activos para el filtro multicéntrico (Admins/Monitores únicamente)
  let hospitals: { id: string; name: string }[] = [];
  if (profile.role === 'admin' || profile.role === 'monitor') {
    const { data: hospitalsData } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    hospitals = hospitalsData || [];
  }

  // Consulta de registros clínicos incluyendo datos de estrategia y resultados de optimización por OCT
  let query = supabase
    .from('ecrf_opstar_records')
    .select(`
      *,
      hospitals(name),
      opstar_strategy_changes(*),
      opstar_optimization_results(*)
    `);

  // Restringir consulta al centro del usuario si es un perfil de hospital (hospital_user)
  if (profile.role === 'hospital_user') {
    if (profile.hospital_id) {
      query = query.eq('hospital_id', profile.hospital_id);
    } else {
      // Retorna vacío si no tiene hospital asignado
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data: cases, error: casesError } = await query.order('created_at', { ascending: true });

  const hospitalName = profile.hospitals
    ? (Array.isArray(profile.hospitals) ? profile.hospitals[0]?.name : (profile.hospitals as any).name)
    : 'Sin asignar';

  return (
    <AnalyticsClient
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
