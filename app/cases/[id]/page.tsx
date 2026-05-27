import React from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CaseDetailClient from './CaseDetailClient';

export const metadata: Metadata = {
  title: 'Revisión de Caso Clínico — OPSTAR-AI Levante Registry',
  description: 'Visualización premium de caso clínico con análisis IA, optimización de procedimiento y seguimiento clínico.',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, hospital_id, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  // Fetch case with all related data
  const { data: caseRecord, error: caseError } = await supabase
    .from('ecrf_opstar_records')
    .select(`
      *,
      hospitals(name),
      opstar_strategy_changes(*),
      opstar_optimization_results(*)
    `)
    .eq('id', id)
    .single();

  if (caseError || !caseRecord) {
    notFound();
  }

  // Access control: hospital_user can only see their own hospital cases
  if (profile.role === 'hospital_user' && caseRecord.hospital_id !== profile.hospital_id) {
    redirect('/dashboard?error=unauthorized');
  }

  // Fetch follow-ups
  const { data: followups, error: followupsError } = await supabase
    .from('opstar_followup')
    .select('*')
    .eq('case_id', id)
    .order('followup_date', { ascending: true });

  return (
    <CaseDetailClient
      caseRecord={caseRecord}
      followups={followups || []}
    />
  );
}
