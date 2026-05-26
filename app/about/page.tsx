// app/about/page.tsx
import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
  title: 'Identidad Científica — OPSTAR-AI Levante Registry',
  description: 'Iniciativa científica OPSTAR-AI Levante. Coordinación, investigadores y centros participantes.',
};

export default async function AboutPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Obtener perfil del usuario actual para la cabecera
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, hospital_id, hospitals(name)')
    .eq('id', user.id)
    .single();

  const hospitalName = profile?.hospitals
    ? (Array.isArray(profile.hospitals) ? profile.hospitals[0]?.name : (profile.hospitals as any).name)
    : '';

  return (
    <AboutClient
      profile={{
        fullName: profile?.full_name || '',
        role: profile?.role || 'hospital_user',
        hospitalName,
      }}
    />
  );
}
