// app/study/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { getActiveHospitalsWithInvestigators, getStudyOverviewStats, getStudyGovernanceAction } from '@/lib/supabase/actions';
import StudyClient from './StudyClient';

// Force dynamic rendering since this page uses cookies() for auth
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Descripción del Registro — Registro Clínico ULTREON 3.0',
  description:
    'Impacto de la integración de OCT guiada por IA en la optimización de la estrategia de ICP. Registro clínico prospectivo multicéntrico.',
};

export default async function StudyPage() {
  // Query Supabase server-side for dynamic active centers, investigators, metrics, and governance
  const [hospitals, stats, governanceResult] = await Promise.all([
    getActiveHospitalsWithInvestigators(),
    getStudyOverviewStats(),
    getStudyGovernanceAction(),
  ]);

  const governance = governanceResult.success ? governanceResult.data : [];

  return (
    <StudyClient
      initialHospitals={hospitals || []}
      initialStats={stats || {
        totalCases: 0,
        zeroContrastPct: 0,
        strategyModifiedPct: 0,
        meanOpstarScore: 0,
        activeHospitalsCount: 0
      }}
      initialGovernance={governance || []}
    />
  );
}
