// app/cases/[id]/follow-up/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CaseFollowUpClient from './CaseFollowUpClient';

export const metadata: Metadata = {
  title: 'Seguimiento Clínico de Caso — OPSTAR-AI Levante Registry',
  description: 'Seguimiento longitudinal y outcomes clínicos (MACE) de un caso clínico.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseFollowUpPage({ params }: PageProps) {
  const { id } = await params;
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

  // Cargar caso con hospital y resultados de optimización
  const { data: caseRecord, error: caseError } = await supabase
    .from('ecrf_opstar_records')
    .select(`
      *,
      hospitals(name),
      opstar_optimization_results(*)
    `)
    .eq('id', id)
    .single();

  if (caseError || !caseRecord) {
    notFound();
  }

  // Control de seguridad: Investigadores locales solo pueden ver/editar casos de su centro
  if (profile.role === 'hospital_user' && caseRecord.hospital_id !== profile.hospital_id) {
    redirect('/follow-up?error=unauthorized');
  }

  // Cargar seguimientos existentes para este caso
  const { data: followups, error: followupsError } = await supabase
    .from('opstar_followup')
    .select('*')
    .eq('case_id', id)
    .order('followup_date', { ascending: true });

  // Cargar bitácora de auditoría
  const { data: auditTrail, error: auditError } = await supabase
    .from('opstar_followup_audit')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: false });

  const hospitalName = caseRecord.hospitals
    ? (Array.isArray(caseRecord.hospitals) ? caseRecord.hospitals[0]?.name : (caseRecord.hospitals as any).name)
    : 'Centro no definido';

  return (
    <CaseFollowUpClient
      caseRecord={{
        ...caseRecord,
        hospitalName,
      }}
      initialFollowups={followups || []}
      auditTrail={auditTrail || []}
      profile={{
        userId: user.id,
        fullName: profile.full_name || '',
        role: profile.role || 'hospital_user',
        hospitalId: profile.hospital_id || '',
      }}
    />
  );
}
