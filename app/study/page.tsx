// app/study/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { getActiveHospitalsWithInvestigators, getStudyOverviewStats } from '@/lib/supabase/actions';
import StudyClient from './StudyClient';

export const metadata: Metadata = {
  title: 'Descripción del Estudio — Registro OPSTAR-AI Levante',
  description:
    'Impacto de la integración de OCT guiada por IA y fisiología en la optimización de la estrategia de ICP. Registro prospectivo multicéntrico — 6 centros participantes, Comunidad Valenciana.',
};

export default async function StudyPage() {
  // Query Supabase server-side for dynamic active centers, investigators and metrics
  const [hospitals, stats] = await Promise.all([
    getActiveHospitalsWithInvestigators(),
    getStudyOverviewStats(),
  ]);

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
    />
  );
}
