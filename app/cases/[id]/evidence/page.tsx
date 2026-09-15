import React from 'react';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getOctEvidenceAction } from '@/lib/supabase/actions';
import OctEvidenceClient from './OctEvidenceClient';

interface Props {
  params: Promise<{ id: string }>;
}

export const metadata = {
  title: 'OCT Evidence | Caso',
  description: 'Galería de evidencia OCT del caso',
};

export default async function OctEvidencePage({ params }: Props) {
  const { id: caseId } = await params;
  const supabase = await createServerClient();

  // Get user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    redirect('/login');
  }

  // Check access
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, hospital_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/dashboard');
  }

  // Get case
  const { data: caseRecord } = await supabase
    .from('ecrf_opstar_records')
    .select('id, hospital_id, id_paciente, centro, vaso_diana')
    .eq('id', caseId)
    .single();

  if (!caseRecord) {
    redirect('/dashboard');
  }

  // Check hospital access for hospital_user
  if (
    profile.role === 'hospital_user' &&
    caseRecord.hospital_id !== profile.hospital_id
  ) {
    redirect('/dashboard');
  }

  // Get evidence
  const { data: evidence } = await getOctEvidenceAction(caseId);

  const canUpload = ['admin', 'monitor', 'hospital_user'].includes(profile.role);
  const canReview = ['admin', 'monitor'].includes(profile.role);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 md:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={`/cases/${caseId}`}
              className="h-8 w-8 rounded-lg bg-background hover:bg-muted border border-border flex items-center justify-center text-muted-foreground font-bold transition-all"
            >
              ←
            </a>
            <div>
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                OCT EVIDENCE
              </span>
              <h1 className="text-base font-bold text-foreground mt-0.5">
                Evidencia OCT del Caso
              </h1>
            </div>
          </div>

          <a
            href={`/cases/${caseId}`}
            className="px-3 py-1.5 bg-background hover:bg-muted border border-border rounded-xl text-xs font-medium transition-all"
          >
            Volver
          </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <OctEvidenceClient
          caseId={caseId}
          caseIdentifier={caseRecord.id_paciente}
          canUpload={canUpload}
          canReview={canReview}
          initialEvidence={evidence || []}
        />
      </div>
    </main>
  );
}
