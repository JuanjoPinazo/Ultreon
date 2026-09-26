import { createClient as createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TargetsClient from './TargetsClient';

export default async function TargetsPage() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Verificar admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin' && profile.role !== 'clinical_admin')) {
    redirect('/dashboard');
  }

  // Fetch Hospitals
  const { data: hospitals } = await supabase
    .from('hospitals')
    .select('id, name')
    .order('name');

  // Fetch Center Targets
  const { data: centerTargets } = await supabase
    .from('registry_center_targets')
    .select('*')
    .eq('active', true);

  // Fetch Operator Targets
  const { data: operatorTargets } = await supabase
    .from('registry_operator_targets')
    .select('*')
    .eq('active', true);

  // Fetch Operators with hospital mapping
  const { data: hospitalOperators } = await supabase
    .from('hospital_operators')
    .select(`
      hospital_id,
      operator_id,
      operators (id, first_name, last_name)
    `);
    
  // Format operators for client
  const mappedOperators = (hospitalOperators || []).map(ho => {
    const op = ho.operators as any;
    return {
      hospital_id: ho.hospital_id,
      id: op?.id,
      name: op ? `${op.first_name} ${op.last_name}` : 'Unknown'
    };
  }).filter(o => o.id);

  // Fetch all completed real cases for metrics
  const { data: cases } = await supabase
    .from('ultreon_registry_cases')
    .select('id, hospital_id, operator_id, status, is_demo, is_prelaunch, procedure_date')
    .eq('is_demo', false)
    .eq('is_prelaunch', false)
    .eq('status', 'COMPLETED');

  return (
    <TargetsClient 
      hospitals={hospitals || []}
      centerTargets={centerTargets || []}
      operatorTargets={operatorTargets || []}
      operators={mappedOperators}
      cases={cases || []}
    />
  );
}
