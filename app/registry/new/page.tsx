// app/registry/new/page.tsx
import React from 'react';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import RegistryFormClient from './RegistryFormClient';

export default async function NewRegistryPage() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, hospital_id, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  // Viewer role is read-only and cannot create new cases
  if (profile.role === 'viewer') {
    redirect('/dashboard');
  }

  // Fetch all active hospitals from the database
  const { data: hospitals, error: hospitalsError } = await supabase
    .from('hospitals')
    .select('id, name, short_name, code')
    .eq('is_active', true)
    .order('name');

  if (hospitalsError || !hospitals) {
    console.error('Error fetching hospitals:', hospitalsError);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 antialiased font-sans">
      {/* Inject custom styles for clean transitions and scrollbar */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide {
          animation: fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      <div className="w-full max-w-4xl animate-fade-slide">
        <RegistryFormClient 
          user={user} 
          profile={profile} 
          hospitals={hospitals || []} 
        />
      </div>
    </main>
  );
}
