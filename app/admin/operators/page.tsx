import React from 'react';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAllOperatorsAction } from '@/lib/supabase/actions';
import AdminOperatorsClient from './AdminOperatorsClient';

export default async function AdminOperatorsPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch all operators and their hospitals
  const result = await getAllOperatorsAction();
  const operators = result.success ? result.data : [];

  // Also fetch all hospitals to allow linking
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in">
      <AdminOperatorsClient initialOperators={operators} allHospitals={hospitals || []} />
    </div>
  );
}
