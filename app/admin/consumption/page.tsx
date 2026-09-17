import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConsumptionClient from './ConsumptionClient';

export default async function ConsumptionPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  const { data: consumptions } = await supabase
    .from('registry_case_consumption')
    .select('*, hospitals(name), operators(first_name, last_name), registry_products(product_name, default_unit_cost), ultreon_registry_cases(anonymous_code)')
    .order('consumption_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-foreground">Consumos</h1>
        <p className="text-sm text-muted-foreground font-medium">Gestión y auditoría de consumos clínicos</p>
      </div>

      <ConsumptionClient consumptions={consumptions || []} />
    </div>
  );
}
