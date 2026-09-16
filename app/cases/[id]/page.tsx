import React from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import Link from 'next/link';
import CaseDetailClient from './CaseDetailClient';

export const metadata: Metadata = {
  title: 'Detalle de Caso — ULTREON 3.0',
  description: 'Visor clínico en modo lectura del caso seleccionado.',
};

export default async function CaseDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id;
  
  if (!id) {
    redirect('/follow-up');
  }

  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, hospital_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect('/login');
  }

  // Fetch the case
  const { data: clinicalCase, error: caseError } = await supabase
    .from('ultreon_registry_cases')
    .select(`
      *,
      hospitals(name),
      operators(full_name)
    `)
    .eq('id', id)
    .single();

  if (caseError || !clinicalCase) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="bg-card border border-border rounded-xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Caso no encontrado</h2>
          <p className="text-sm text-muted-foreground mb-6">El registro clínico que intentas buscar no existe o no tienes permisos para visualizarlo.</p>
          <Link href="/follow-up" className="inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-bold text-sm transition-colors">
            Volver a Casos Registrados
          </Link>
        </div>
      </div>
    );
  }

  // Check permissions (hospital user can only see their own hospital's cases unless it's demo, wait RLS already handled this but double checking)
  if (profile.role === 'hospital_user' && clinicalCase.hospital_id !== profile.hospital_id && !clinicalCase.is_demo) {
    redirect('/follow-up');
  }

  return <CaseDetailClient record={clinicalCase} profileRole={profile.role} />;
}
