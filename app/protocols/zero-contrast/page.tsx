// app/protocols/zero-contrast/page.tsx
import type { Metadata } from 'next';
import ZeroContrastClient from './ZeroContrastClient';

export const metadata: Metadata = {
  title: 'Zero-Contrast OCT — OPSTAR-AI Levante Registry',
  description:
    'Dragonfly OPSTAR + ULTREON™ 3.0 — Manual saline-guided OCT acquisition workflow for interventional cardiology in the cath lab.',
};

export default function ZeroContrastPage() {
  return <ZeroContrastClient />;
}
