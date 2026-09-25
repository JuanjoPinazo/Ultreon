// app/admin/users/page.tsx
import React from 'react';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import UsersFormClient from './UsersFormClient';

export default async function AdminUsersPage() {
  const supabase = await createServerClient();
  const adminClient = createAdminClient();

  // Get current logged-in user ID and role
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser?.id || '')
    .single();

  // Fetch all user profiles sorted by created date using admin client
  const { data: users, error: usersError } = await adminClient
    .from('profiles')
    .select('*, hospitals(name)')
    .order('created_at', { ascending: false });

  if (usersError || !users) {
    console.error('Error fetching user profiles:', usersError);
  }

  // Fetch all active hospitals for selections using admin client
  const { data: hospitals, error: hospitalsError } = await adminClient
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
      currentUserId={currentUser?.id}
      currentUserRole={currentProfile?.role}
    />
  );
}

