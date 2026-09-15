import React from 'react';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { DemoDataProvider } from '@/lib/demo/DemoDataProvider';

export default async function DemoLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <DemoDataProvider>
      <div className="min-h-screen bg-black text-foreground">
        {children}
      </div>
    </DemoDataProvider>
  );
}
