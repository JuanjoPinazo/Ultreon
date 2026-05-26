// app/protocols/zero-contrast/page.tsx
import type { Metadata } from 'next';
import ZeroContrastClient from './ZeroContrastClient';

export const metadata: Metadata = {
  title: 'Protocolo Zero-Contrast OCT — OPSTAR-AI Levante Registry',
  description:
    'Dragonfly OPSTAR + ULTREON™ 3.0 — Flujo de trabajo de adquisición de OCT manual guiada por suero salino para cardiología intervencionista en sala de hemodinámica.',
};

export default function ZeroContrastPage() {
  return <ZeroContrastClient />;
}
