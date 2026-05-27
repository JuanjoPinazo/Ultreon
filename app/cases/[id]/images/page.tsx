import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CaseImagesClient from './CaseImagesClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseImagesPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('hospital_id, role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    redirect('/login?error=inactive');
  }

  // Fetch case
  const { data: caseRecord, error: caseError } = await supabase
    .from('ecrf_opstar_records')
    .select('id, id_paciente, vaso_diana, created_at, hospital_id, hospitals(name)')
    .eq('id', id)
    .single();

  if (caseError || !caseRecord) {
    notFound();
  }

  // Access control
  if (profile.role === 'hospital_user' && caseRecord.hospital_id !== profile.hospital_id) {
    redirect('/cases');
  }

  // Fetch media
  const { data: media } = await supabase
    .from('opstar_case_media')
    .select('*')
    .eq('case_id', id)
    .order('created_at', { ascending: false });

  const hospitalName = caseRecord.hospitals
    ? Array.isArray(caseRecord.hospitals)
      ? caseRecord.hospitals[0]?.name
      : (caseRecord.hospitals as any).name
    : 'Centro desconocido';

  return (
    <CaseImagesClient
      caseId={id}
      hospitalId={profile.hospital_id!}
      patientId={caseRecord.id_paciente}
      segment={caseRecord.vaso_diana}
      hospitalName={hospitalName}
      initialMedia={media || []}
      userRole={profile.role}
    />
  );
}
