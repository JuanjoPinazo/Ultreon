// app/admin/users/page.tsx
import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import UsersFormClient from './UsersFormClient';

export default async function AdminUsersPage() {
  const supabase = await createServerClient();

  // Fetch all user profiles sorted by created date
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('*, hospitals(name)')
    .order('created_at', { ascending: false });

  if (usersError || !users) {
    console.error('Error fetching user profiles:', usersError);
  }

  // Fetch all active hospitals for selections
  const { data: hospitals, error: hospitalsError } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  if (hospitalsError || !hospitals) {
    console.error('Error fetching hospitals:', hospitalsError);
  }

  return (
    <UsersFormClient
      users={users || []}
      hospitals={hospitals || []}
    />
  );
}
