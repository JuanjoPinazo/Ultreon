import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import ExportClient from './ExportClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseExportPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, hospital_id, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  // Fetch case data
  const { data: caseRecord, error: caseError } = await supabase
    .from('ecrf_opstar_records')
    .select(`
      id,
      id_paciente,
      centro,
      vaso_diana,
      created_at,
      hospital_id,
      calcio_ia,
      placa_lipida_ia,
      ffr_oct,
      expected_contrast_ml,
      actual_contrast_ml,
      zero_contrast_completed,
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

  // Only admin, monitor, and hospital_user can export
  if (!['admin', 'monitor', 'hospital_user'].includes(profile.role)) {
    redirect('/dashboard?error=forbidden');
  }

  // Fetch follow-ups
  const { data: followups } = await supabase
    .from('opstar_followup')
    .select('followup_type, followup_date, mace')
    .eq('case_id', id)
    .order('followup_date', { ascending: true });

  // Fetch key images
  const { data: keyImages } = await supabase
    .from('opstar_case_media')
    .select('id, file_name, media_category, acquisition_phase, is_key_image')
    .eq('case_id', id)
    .eq('is_key_image', true);

  // Extract data
  const strategyChanges = (caseRecord.opstar_strategy_changes as any[])?.[0];
  const optimization = (caseRecord.opstar_optimization_results as any[])?.[0];
  const hospitalName = Array.isArray(caseRecord.hospitals)
    ? caseRecord.hospitals[0]?.name
    : (caseRecord.hospitals as any)?.name;

  return (
    <ExportClient
      caseId={id}
      caseData={{
        id_paciente: caseRecord.id_paciente,
        centro: hospitalName || 'Unknown Center',
        vaso_diana: caseRecord.vaso_diana,
        created_at: caseRecord.created_at,
        calcio_ia: caseRecord.calcio_ia,
        placa_lipida_ia: caseRecord.placa_lipida_ia,
        ffr_oct: caseRecord.ffr_oct,
        expected_contrast_ml: caseRecord.expected_contrast_ml,
        actual_contrast_ml: caseRecord.actual_contrast_ml,
        zero_contrast_completed: caseRecord.zero_contrast_completed,
      }}
      strategyChanges={strategyChanges}
      optimization={optimization}
      followups={followups || []}
      keyImages={keyImages || []}
    />
  );
}
