-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - OCT EVIDENCE MODULE
-- Clinical evidence storage and validation
-- Execute this script in your Supabase SQL Editor
-- =============================================================================

-- 1. CREATE TABLE OPSTAR_OCT_EVIDENCE
create table if not exists public.opstar_oct_evidence (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.ecrf_opstar_records(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  uploaded_by uuid references auth.users(id),
  storage_path text not null,
  file_name text not null,
  file_type text,
  file_size_bytes bigint,
  evidence_phase text not null check (evidence_phase in ('pre_pci', 'strategy_change', 'post_pci', 'zero_contrast', 'follow_up', 'report')),
  evidence_type text not null check (evidence_type in (
    'oct_frame', 'oct_pullback', 'ultreon_screenshot', 'angiography', 'ffr_oct',
    'calcium', 'lipid_plaque', 'eel_reference', 'stent_expansion', 'malapposition',
    'edge_dissection', 'zero_contrast_quality', 'report_pdf', 'other'
  )),
  linked_variable text check (linked_variable in (
    'severe_calcium', 'lipid_plaque', 'eel_reference', 'ffr_oct',
    'stent_diameter_change', 'stent_length_change', 'landing_zone_change',
    'plaque_preparation', 'post_stent_msa', 'stent_expansion',
    'malapposition', 'edge_dissection', 'contrast_reduction', 'wash_quality'
  )),
  linked_strategy_change text check (linked_strategy_change in (
    'changed_stent_diameter', 'changed_stent_length', 'changed_landing_zone_proximal',
    'changed_landing_zone_distal', 'required_plaque_preparation', 'used_nc_balloon',
    'used_scoring_cutting_balloon', 'used_ivl', 'used_atherectomy', 'treated_edge',
    'additional_postdilatation', 'global_strategy_change', 'other_change'
  )),
  title text,
  description text,
  is_key_evidence boolean default false,
  is_anonymized boolean default false,
  corelab_quality text check (corelab_quality in ('excellent', 'diagnostic', 'suboptimal', 'not_usable')),
  corelab_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ENABLE ROW LEVEL SECURITY
alter table public.opstar_oct_evidence enable row level security;

-- 3. RLS POLICIES
-- Admin and Monitor see all
drop policy if exists admin_monitor_all_evidence on public.opstar_oct_evidence;
create policy admin_monitor_all_evidence on public.opstar_oct_evidence
  for all using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'monitor')
  );

-- Hospital user sees only their hospital's evidence
drop policy if exists hospital_user_own_hospital on public.opstar_oct_evidence;
create policy hospital_user_own_hospital on public.opstar_oct_evidence
  for all using (
    (select role from public.profiles where id = auth.uid()) = 'hospital_user'
    and hospital_id = (select hospital_id from public.profiles where id = auth.uid())
  );

-- Viewer sees all but read-only
drop policy if exists viewer_read_only on public.opstar_oct_evidence;
create policy viewer_read_only on public.opstar_oct_evidence
  for select using (
    (select role from public.profiles where id = auth.uid()) in ('admin', 'monitor', 'viewer', 'hospital_user')
  );

-- 4. CREATE INDEXES FOR PERFORMANCE
create index if not exists idx_oct_evidence_case on public.opstar_oct_evidence(case_id);
create index if not exists idx_oct_evidence_hospital on public.opstar_oct_evidence(hospital_id);
create index if not exists idx_oct_evidence_phase on public.opstar_oct_evidence(evidence_phase);
create index if not exists idx_oct_evidence_type on public.opstar_oct_evidence(evidence_type);
create index if not exists idx_oct_evidence_linked_variable on public.opstar_oct_evidence(linked_variable);
create index if not exists idx_oct_evidence_key on public.opstar_oct_evidence(is_key_evidence);
create index if not exists idx_oct_evidence_corelab_quality on public.opstar_oct_evidence(corelab_quality);

-- 5. CREATE COMPUTED VIEW FOR EVIDENCE STATS
create or replace view public.vw_oct_evidence_stats as
select
  c.id as case_id,
  c.hospital_id,
  h.name as hospital_name,
  count(*) as total_evidence,
  count(*) filter (where oe.is_key_evidence) as key_evidence_count,
  count(*) filter (where oe.corelab_quality is null) as pending_corelab,
  count(*) filter (where oe.evidence_phase = 'pre_pci' and oe.is_key_evidence) as pre_pci_key,
  count(*) filter (where oe.evidence_phase = 'post_pci' and oe.is_key_evidence) as post_pci_key,
  count(*) filter (where oe.evidence_phase = 'strategy_change') as strategy_change_evidence,
  max(oe.created_at) as last_evidence_date
from public.ecrf_opstar_records c
left join public.opstar_oct_evidence oe on c.id = oe.case_id
left join public.hospitals h on c.hospital_id = h.id
group by c.id, c.hospital_id, h.name;

-- 6. SECURITY: FORCE RLS
alter table public.opstar_oct_evidence force row level security;
grant select on public.opstar_oct_evidence to authenticated;
grant select on public.vw_oct_evidence_stats to authenticated;
