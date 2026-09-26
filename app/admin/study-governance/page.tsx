import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import StudyGovernanceClient from './StudyGovernanceClient';

export default async function AdminStudyGovernancePage() {
  const supabase = await createServerClient();

  const { data: governance, error: govError } = await supabase
    .from('opstar_study_governance')
    .select('*')
    .order('display_order', { ascending: true });

  if (govError) {
    console.error('Error fetching governance:', govError.message || JSON.stringify(govError));
  }

  return (
    <StudyGovernanceClient
      initialGovernance={governance || []}
    />
  );
}
