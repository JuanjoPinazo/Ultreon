import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';

export default async function SettingsPage() {
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

  const { data: settings } = await supabase
    .from('registry_settings')
    .select('*')
    .eq('registry_key', 'ULTREON_3')
    .single();

  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('id, name')
    .order('name');
    
  const { data: products } = await supabase
    .from('registry_products')
    .select('id, product_name, product_code')
    .eq('active', true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-foreground">Configuración del Registro</h1>
        <p className="text-sm text-muted-foreground font-medium">Gestión global y ciclo de vida de Ultreon 3.0</p>
      </div>

      <SettingsClient 
        settings={settings} 
        hospitals={hospitals || []} 
        products={products || []} 
      />
    </div>
  );
}
