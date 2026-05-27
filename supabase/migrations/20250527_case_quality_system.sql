-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - CASE QUALITY & STATUS SYSTEM
-- Data quality validation, completeness tracking, and case locking
-- Execute this script in your Supabase SQL Editor
-- =============================================================================

-- 1. ADD COLUMNS TO ECRF_OPSTAR_RECORDS TABLE
alter table public.ecrf_opstar_records
add column if not exists case_status text default 'draft' check (
  case_status in ('draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked')
),
add column if not exists case_completeness_score integer default 0 check (case_completeness_score >= 0 and case_completeness_score <= 100),
add column if not exists data_quality_warnings jsonb default '[]'::jsonb,
add column if not exists completed_at timestamptz,
add column if not exists validated_at timestamptz,
add column if not exists validated_by uuid references auth.users(id),
add column if not exists locked_at timestamptz,
add column if not exists locked_by uuid references auth.users(id);

-- 2. CREATE INDEX FOR CASE STATUS
create index if not exists idx_case_status on public.ecrf_opstar_records(case_status);
create index if not exists idx_case_completeness on public.ecrf_opstar_records(case_completeness_score);
create index if not exists idx_case_locked on public.ecrf_opstar_records(locked_at);
create index if not exists idx_case_validated on public.ecrf_opstar_records(validated_at);

-- 3. CREATE VIEW FOR CASE STATUS OVERVIEW
create or replace view public.vw_case_status_overview as
select
  h.id as hospital_id,
  h.name as hospital_name,
  count(*) as total_cases,
  count(*) filter (where eor.case_status = 'draft') as draft_cases,
  count(*) filter (where eor.case_status = 'incomplete') as incomplete_cases,
  count(*) filter (where eor.case_status = 'complete') as complete_cases,
  count(*) filter (where eor.case_status = 'pending_corelab') as pending_corelab_cases,
  count(*) filter (where eor.case_status = 'validated') as validated_cases,
  count(*) filter (where eor.case_status = 'locked') as locked_cases,
  round(avg(eor.case_completeness_score)::numeric, 1)::integer as avg_completeness_score,
  max(eor.updated_at) as last_case_update
from public.hospitals h
left join public.ecrf_opstar_records eor on h.id = eor.hospital_id
group by h.id, h.name;

-- 4. CREATE VIEW FOR DATA QUALITY STATISTICS
create or replace view public.vw_data_quality_stats as
select
  h.id as hospital_id,
  h.name as hospital_name,
  count(*) as total_cases,
  count(*) filter (where eor.case_completeness_score = 100) as perfect_cases,
  count(*) filter (where eor.case_completeness_score >= 80) as high_quality_cases,
  count(*) filter (where eor.case_completeness_score >= 60 and eor.case_completeness_score < 80) as medium_quality_cases,
  count(*) filter (where eor.case_completeness_score < 60) as low_quality_cases,
  round(avg(eor.case_completeness_score)::numeric, 1)::numeric as avg_quality_score,
  count(*) filter (where jsonb_array_length(eor.data_quality_warnings) > 0) as cases_with_warnings
from public.hospitals h
left join public.ecrf_opstar_records eor on h.id = eor.hospital_id
where eor.case_status != 'draft'
group by h.id, h.name;

-- 5. UPDATE EXISTING ROWS TO SET STATUS
-- All existing records are now 'draft' by default (from alter table default)
-- Records with monitor_validated = true should be 'validated'
update public.ecrf_opstar_records
set
  case_status = 'validated',
  validated_at = updated_at,
  case_completeness_score = 90
where monitor_validated = true and case_status = 'draft';

-- 6. CREATE FUNCTION TO UPDATE TIMESTAMP
create or replace function public.update_case_status_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 7. CREATE TRIGGER FOR STATUS UPDATES
drop trigger if exists update_case_status_timestamp_trigger on public.ecrf_opstar_records;
create trigger update_case_status_timestamp_trigger
before update on public.ecrf_opstar_records
for each row
execute function public.update_case_status_timestamp();

-- 8. GRANT PERMISSIONS
grant select on public.vw_case_status_overview to authenticated;
grant select on public.vw_data_quality_stats to authenticated;
