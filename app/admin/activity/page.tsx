import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import ActivityClient from './ActivityClient';

export default async function ActivityPage() {
  const supabaseSession = await createServerClient();
  const adminClient = createAdminClient();
  const { data: { user }, error: userError } = await supabaseSession.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabaseSession
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin' && profile?.role !== 'clinical_admin') {
    redirect('/dashboard');
  }

  // Fetch Hospitals
  const { data: hospitals } = await adminClient
    .from('hospitals')
    .select('id, name')
    .order('name');

  // Fetch Center Targets
  const { data: centerTargets } = await adminClient
    .from('registry_center_targets')
    .select('*')
    .eq('active', true);

  // Fetch Cases
  const { data: cases } = await adminClient
    .from('ultreon_registry_cases')
    .select('id, hospital_id, operator_id, status, is_demo, procedure_date, created_at');

  // Fetch Consumptions
  const { data: consumptions } = await adminClient
    .from('registry_case_consumption')
    .select('id, hospital_id, status, quantity, consumption_date');

  // Fetch Stock
  const { data: stock } = await adminClient
    .from('registry_center_stock')
    .select('hospital_id, quantity_on_hand, quantity_reserved');

  // Fetch Orders
  const { data: orders } = await adminClient
    .from('registry_orders')
    .select('id, hospital_id, status');

  // Fetch Order Items
  const { data: orderItems } = await adminClient
    .from('registry_order_items')
    .select('order_id, quantity');

  // Fetch Registry Settings
  const { data: registrySettings } = await adminClient
    .from('registry_settings')
    .select('*')
    .eq('registry_key', 'ULTREON_3')
    .single();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-foreground">Actividad Operativa</h1>
        <p className="text-sm text-muted-foreground font-medium">Métricas de consumo, stock y cobertura por hospital</p>
      </div>

      <ActivityClient 
        hospitals={hospitals || []}
        centerTargets={centerTargets || []}
        cases={cases || []}
        consumptions={consumptions || []}
        stock={stock || []}
        orders={orders || []}
        orderItems={orderItems || []}
        registrySettings={registrySettings || null}
      />
    </div>
  );
}
