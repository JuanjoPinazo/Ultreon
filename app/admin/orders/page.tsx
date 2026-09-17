import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import OrdersClient from './OrdersClient';

export default async function OrdersPage() {
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

  const { data: orders } = await supabase
    .from('registry_orders')
    .select('*, hospitals(name), registry_order_items(quantity, registry_products(product_name))')
    .order('order_date', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground font-medium">Gestión logística de dispositivos</p>
      </div>

      <OrdersClient orders={orders || []} />
    </div>
  );
}
