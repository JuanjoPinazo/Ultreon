-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - FOLLOW-UP & OUTCOMES CLINICOS SCHEMA MIGRATION
-- Execute this script in your Supabase SQL Editor.
-- =============================================================================

-- 1. CREATE TABLE OPSTAR_FOLLOWUP
create table if not exists public.opstar_followup (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ecrf_opstar_records(id) on delete cascade not null,
  followup_type text not null check (followup_type in ('procedural', '30days', '6months', '12months')),
  followup_date date not null,
  
  -- Outcomes Clínicos (MACE y Componentes)
  mace boolean not null default false,
  death_type text check (death_type in ('cardiovascular', 'non-cardiovascular', 'unknown')),
  myocardial_infarction boolean not null default false,
  tlr boolean not null default false, -- Target Lesion Revascularization
  tvr boolean not null default false, -- Target Vessel Revascularization
  stent_thrombosis_type text check (stent_thrombosis_type in ('acute', 'subacute', 'late', 'very_late')),
  rehospitalization boolean not null default false,
  repeat_pci boolean not null default false,
  cabg boolean not null default false,
  followup_angio boolean not null default false,
  followup_oct boolean not null default false,
  
  -- Estado Clínico del Paciente
  clinical_status text not null check (clinical_status in ('asymptomatic', 'stable_angina', 'unstable_angina', 'heart_failure', 'other')),
  
  -- Notas e Integridad
  investigator_notes text,
  completed boolean not null default false,
  monitor_validated boolean not null default false,
  
  -- Auditoría y Trazabilidad
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Unicidad: Solo se permite un registro por tipo de seguimiento para cada caso
  constraint unique_case_followup_type unique (case_id, followup_type)
);

-- 2. CREATE TABLE OPSTAR_FOLLOWUP_AUDIT (Append-only audit trail)
create table if not exists public.opstar_followup_audit (
  id uuid primary key default gen_random_uuid(),
  followup_id uuid not null,
  case_id uuid references public.ecrf_opstar_records(id) on delete cascade not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid references auth.users(id) on delete set null,
  changed_by_email text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz default now()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.opstar_followup enable row level security;
alter table public.opstar_followup_audit enable row level security;

-- 4. RLS POLICIES FOR OPSTAR_FOLLOWUP

-- Admin: acceso total
drop policy if exists admin_all_followup on public.opstar_followup;
create policy admin_all_followup on public.opstar_followup
  for all using (public.is_admin());

-- Monitor: lectura y actualización completa para validaciones
drop policy if exists monitor_all_followup on public.opstar_followup;
create policy monitor_all_followup on public.opstar_followup
  for all using (public.get_current_user_role() = 'monitor');

-- Hospital User: Lectura si el caso pertenece a su hospital
drop policy if exists hospital_user_select_followup on public.opstar_followup;
create policy hospital_user_select_followup on public.opstar_followup
  for select using (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Hospital User: Inserción si el caso pertenece a su hospital
drop policy if exists hospital_user_insert_followup on public.opstar_followup;
create policy hospital_user_insert_followup on public.opstar_followup
  for insert with check (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Hospital User: Modificación si el caso pertenece a su hospital y no está bloqueado
drop policy if exists hospital_user_update_followup on public.opstar_followup;
create policy hospital_user_update_followup on public.opstar_followup
  for update using (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and r.locked = false
      and public.get_current_user_role() = 'hospital_user'
    )
  )
  with check (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and r.locked = false
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- 5. RLS POLICIES FOR OPSTAR_FOLLOWUP_AUDIT (Audit logs)

-- Admin & Monitor: lectura total
drop policy if exists admin_monitor_select_audit on public.opstar_followup_audit;
create policy admin_monitor_select_audit on public.opstar_followup_audit
  for select using (
    public.is_admin() or public.get_current_user_role() = 'monitor'
  );

-- Hospital User: lectura si el caso pertenece a su hospital
drop policy if exists hospital_user_select_audit on public.opstar_followup_audit;
create policy hospital_user_select_audit on public.opstar_followup_audit
  for select using (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Nadie puede insertar, actualizar o borrar directamente en la tabla de auditoría (gestionado por trigger)
drop policy if exists deny_writes_audit on public.opstar_followup_audit;
create policy deny_writes_audit on public.opstar_followup_audit
  for all using (false) with check (false);


-- 6. DB TRIGGER FOR AUTOMATIC AUDIT TRAIL LOGGING
create or replace function public.process_followup_audit_trail()
returns trigger as $$
declare
  user_id uuid;
  user_email text;
begin
  -- Intentar obtener el ID y email del usuario actual desde la sesión de Supabase/Auth
  user_id := auth.uid();
  select email into user_email from auth.users where id = user_id;

  if (TG_OP = 'INSERT') then
    insert into public.opstar_followup_audit (followup_id, case_id, action, changed_by, changed_by_email, old_values, new_values)
    values (
      new.id,
      new.case_id,
      'insert',
      user_id,
      user_email,
      null,
      row_to_json(new)::jsonb
    );
    return new;
  elsif (TG_OP = 'UPDATE') then
    insert into public.opstar_followup_audit (followup_id, case_id, action, changed_by, changed_by_email, old_values, new_values)
    values (
      new.id,
      new.case_id,
      'update',
      user_id,
      user_email,
      row_to_json(old)::jsonb,
      row_to_json(new)::jsonb
    );
    return new;
  elsif (TG_OP = 'DELETE') then
    insert into public.opstar_followup_audit (followup_id, case_id, action, changed_by, changed_by_email, old_values, new_values)
    values (
      old.id,
      old.case_id,
      'delete',
      user_id,
      user_email,
      row_to_json(old)::jsonb,
      null
    );
    return old;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists trigger_followup_audit on public.opstar_followup;
create trigger trigger_followup_audit
  after insert or update or delete on public.opstar_followup
  for each row execute procedure public.process_followup_audit_trail();
