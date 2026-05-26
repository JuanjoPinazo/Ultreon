// app/admin/hospitals/page.tsx
import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import HospitalsFormClient from './HospitalsFormClient';

export default async function AdminHospitalsPage() {
  const supabase = await createServerClient();

  // Fetch all hospitals ordered by name
  const { data: hospitals, error: hospitalsError } = await supabase
    .from('hospitals')
    .select('*')
    .order('name');

  if (hospitalsError || !hospitals) {
    console.error('Error fetching hospitals:', hospitalsError);
  }

  // Fetch all profiles and cases to group count them safely in memory
  const [profilesRes, casesRes] = await Promise.all([
    supabase.from('profiles').select('hospital_id'),
    supabase.from('ecrf_opstar_records').select('hospital_id'),
  ]);

  const profiles = profilesRes.data || [];
  const cases = casesRes.data || [];

  // Group user counts by hospital_id
  const userCounts: Record<string, number> = {};
  profiles.forEach((p) => {
    if (p.hospital_id) {
      userCounts[p.hospital_id] = (userCounts[p.hospital_id] || 0) + 1;
    }
  });

  // Group case counts by hospital_id
  const caseCounts: Record<string, number> = {};
  cases.forEach((c) => {
    if (c.hospital_id) {
      caseCounts[c.hospital_id] = (caseCounts[c.hospital_id] || 0) + 1;
    }
  });

  return (
    <HospitalsFormClient
      hospitals={hospitals || []}
      userCounts={userCounts}
      caseCounts={caseCounts}
    />
  );
}
