import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import CoreLabReviewClient from './CoreLabReviewClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CoreLabReviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Verify admin/monitor
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'monitor') {
    redirect('/dashboard');
  }

  // Fetch case
  const { data: caseRecord } = await supabase
    .from('ecrf_opstar_records')
    .select('id, id_paciente, vaso_diana, hospitals(name)')
    .eq('id', id)
    .single();

  if (!caseRecord) {
    notFound();
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
    <CoreLabReviewClient
      caseId={id}
      patientId={caseRecord.id_paciente}
      segment={caseRecord.vaso_diana}
      hospitalName={hospitalName}
      initialMedia={media || []}
    />
  );
}
