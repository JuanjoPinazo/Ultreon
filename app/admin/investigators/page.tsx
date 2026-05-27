// app/admin/investigators/page.tsx
import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import InvestigatorsFormClient from './InvestigatorsFormClient';

export default async function AdminInvestigatorsPage() {
  const supabase = await createServerClient();

  // Fetch all investigators with hospital details
  const { data: investigators, error: invError } = await supabase
    .from('opstar_investigators')
    .select('*, hospitals(name, short_name)')
    .order('full_name');

  if (invError) {
    console.error('Error fetching investigators:', invError.message || JSON.stringify(invError));
  }

  // Fetch all hospitals to choose from in the dropdown select
  const { data: hospitals, error: hospError } = await supabase
    .from('hospitals')
    .select('*')
    .order('name');

  if (hospError) {
    console.error('Error fetching hospitals:', hospError);
  }

  return (
    <InvestigatorsFormClient
      investigators={investigators || []}
      hospitals={hospitals || []}
    />
  );
}
