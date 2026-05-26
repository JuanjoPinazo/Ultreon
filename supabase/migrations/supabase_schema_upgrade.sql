-- ==========================================
-- OPSTAR-AI LEVANTE REGISTRY - SCHEMA UPGRADE
-- Execute this script in your Supabase SQL Editor.
-- ==========================================

-- 1. ADD CONTRAST METRIC COLUMNS TO ECRF_OPSTAR_RECORDS
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'expected_contrast_ml') then
    alter table public.ecrf_opstar_records add column expected_contrast_ml numeric;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'actual_contrast_ml') then
    alter table public.ecrf_opstar_records add column actual_contrast_ml numeric;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'contrast_reduction_percent') then
    alter table public.ecrf_opstar_records add column contrast_reduction_percent numeric;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'zero_contrast_completed') then
    alter table public.ecrf_opstar_records add column zero_contrast_completed boolean default false;
  end if;
end $$;

-- 2. CREATE TABLE OPSTAR_STRATEGY_CHANGES
create table if not exists public.opstar_strategy_changes (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ecrf_opstar_records(id) on delete cascade not null,
  modified_strategy boolean not null default false,
  change_magnitude text check (change_magnitude in ('minor','moderate','major')),
  change_description text,
  changed_stent_diameter boolean default false,
  changed_stent_length boolean default false,
  changed_landing_zone_proximal boolean default false,
  changed_landing_zone_distal boolean default false,
  required_plaque_preparation boolean default false,
  used_nc_balloon boolean default false,
  used_scoring_cutting_balloon boolean default false,
  used_ivl boolean default false,
  used_atherectomy boolean default false,
  decided_no_stent boolean default false,
  treated_edge boolean default false,
  additional_postdilatation boolean default false,
  global_strategy_change boolean default false,
  other_change boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. CREATE TABLE OPSTAR_OPTIMIZATION_RESULTS
create table if not exists public.opstar_optimization_results (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.ecrf_opstar_records(id) on delete cascade not null,
  post_stent_msa_mm2 numeric,
  stent_expansion_percent numeric,
  adequate_expansion text check (adequate_expansion in ('yes','no','na')),
  significant_malapposition text check (significant_malapposition in ('yes','no','na')),
  malapposition_length_mm numeric,
  requires_malapposition_correction boolean default false,
  proximal_edge_dissection boolean default false,
  distal_edge_dissection boolean default false,
  proximal_dissection_length_mm numeric,
  distal_dissection_length_mm numeric,
  significant_flap_gt_3mm boolean default false,
  requires_edge_treatment boolean default false,
  opstar_score integer check (opstar_score >= 0 and opstar_score <= 100),
  opstar_score_category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. ENABLE ROW LEVEL SECURITY
alter table public.opstar_strategy_changes enable row level security;
alter table public.opstar_optimization_results enable row level security;

-- 5. RLS POLICIES FOR OPSTAR_STRATEGY_CHANGES

-- Admin: full access
drop policy if exists admin_all_changes on public.opstar_strategy_changes;
create policy admin_all_changes on public.opstar_strategy_changes
  for all using (public.is_admin());

-- Monitor: read/write/update access
drop policy if exists monitor_all_changes on public.opstar_strategy_changes;
create policy monitor_all_changes on public.opstar_strategy_changes
  for all using (public.get_current_user_role() = 'monitor');

-- Hospital User: select if the linked case belongs to their hospital
drop policy if exists hospital_user_select_changes on public.opstar_strategy_changes;
create policy hospital_user_select_changes on public.opstar_strategy_changes
  for select using (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Hospital User: insert if the linked case belongs to their hospital and was created by them
drop policy if exists hospital_user_insert_changes on public.opstar_strategy_changes;
create policy hospital_user_insert_changes on public.opstar_strategy_changes
  for insert with check (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and r.created_by = auth.uid()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Hospital User: update if the linked case belongs to their hospital and is not locked
drop policy if exists hospital_user_update_changes on public.opstar_strategy_changes;
create policy hospital_user_update_changes on public.opstar_strategy_changes
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

-- 6. RLS POLICIES FOR OPSTAR_OPTIMIZATION_RESULTS

-- Admin: full access
drop policy if exists admin_all_results on public.opstar_optimization_results;
create policy admin_all_results on public.opstar_optimization_results
  for all using (public.is_admin());

-- Monitor: read/write/update access
drop policy if exists monitor_all_results on public.opstar_optimization_results;
create policy monitor_all_results on public.opstar_optimization_results
  for all using (public.get_current_user_role() = 'monitor');

-- Hospital User: select if the linked case belongs to their hospital
drop policy if exists hospital_user_select_results on public.opstar_optimization_results;
create policy hospital_user_select_results on public.opstar_optimization_results
  for select using (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Hospital User: insert if the linked case belongs to their hospital and was created by them
drop policy if exists hospital_user_insert_results on public.opstar_optimization_results;
create policy hospital_user_insert_results on public.opstar_optimization_results
  for insert with check (
    exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id 
      and r.hospital_id = public.get_current_user_hospital_id()
      and r.created_by = auth.uid()
      and public.get_current_user_role() = 'hospital_user'
    )
  );

-- Hospital User: update if the linked case belongs to their hospital and is not locked
drop policy if exists hospital_user_update_results on public.opstar_optimization_results;
create policy hospital_user_update_results on public.opstar_optimization_results
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
