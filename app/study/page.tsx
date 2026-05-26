// app/study/page.tsx
import type { Metadata } from 'next';
import StudyClient from './StudyClient';

export const metadata: Metadata = {
  title: 'Descripción del Estudio — OPSTAR-AI Levante Registry',
  description:
    'Impacto de la integración de OCT guiada por IA y fisiología en la optimización de la estrategia de ICP. Registro prospectivo multicéntrico — 6 centros participantes, Comunidad Valenciana.',
};

export default function StudyPage() {
  return <StudyClient />;
}
