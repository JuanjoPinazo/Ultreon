-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - BUSINESS INTELLIGENCE MODULE
-- Admin-only financial and operational metrics tracking
-- Execute this script in your Supabase SQL Editor
-- =============================================================================

-- 1. CREATE TABLE OPSTAR_CENTER_BUSINESS_METRICS
create table if not exists public.opstar_center_business_metrics (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  year integer not null,
  month integer,
  product_line text,
  purchase_volume_units numeric default 0,
  purchase_revenue_eur numeric default 0,
  registry_investment_eur numeric default 0,
  investigator_payments_eur numeric default 0,
  training_costs_eur numeric default 0,
  congress_support_eur numeric default 0,
  other_investment_eur numeric default 0,
  target_units numeric,
  target_revenue_eur numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CREATE TABLE OPSTAR_CENTER_OBJECTIVES
create table if not exists public.opstar_center_objectives (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  year integer not null,
  target_cases integer,
  target_zero_contrast_rate numeric,
  target_strategy_modification_rate numeric,
  target_purchase_units numeric,
  target_revenue_eur numeric,
  target_opstar_score numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. ENABLE ROW LEVEL SECURITY
alter table public.opstar_center_business_metrics enable row level security;
alter table public.opstar_center_objectives enable row level security;

-- 4. RLS POLICIES - BUSINESS METRICS (ADMIN ONLY)
drop policy if exists admin_all_business_metrics on public.opstar_center_business_metrics;
create policy admin_all_business_metrics on public.opstar_center_business_metrics
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists deny_non_admin_metrics on public.opstar_center_business_metrics;
create policy deny_non_admin_metrics on public.opstar_center_business_metrics
  for all using (false);

-- 5. RLS POLICIES - CENTER OBJECTIVES (ADMIN ONLY)
drop policy if exists admin_all_objectives on public.opstar_center_objectives;
create policy admin_all_objectives on public.opstar_center_objectives
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists deny_non_admin_objectives on public.opstar_center_objectives;
create policy deny_non_admin_objectives on public.opstar_center_objectives
  for all using (false);

-- 6. CREATE INDEXES FOR PERFORMANCE
create index if not exists idx_business_metrics_hospital on public.opstar_center_business_metrics(hospital_id);
create index if not exists idx_business_metrics_year_month on public.opstar_center_business_metrics(year, month);
create index if not exists idx_business_metrics_product on public.opstar_center_business_metrics(product_line);
create index if not exists idx_objectives_hospital on public.opstar_center_objectives(hospital_id);
create index if not exists idx_objectives_year on public.opstar_center_objectives(year);

-- 7. CREATE COMPUTED COLUMNS VIEW FOR KPIs (OPTIONAL - for future performance)
-- This view helps calculate aggregated metrics
create or replace view public.vw_center_business_kpis as
select
  h.id as hospital_id,
  h.name as hospital_name,
  m.year,
  m.month,
  coalesce(m.purchase_volume_units, 0) as purchase_volume_units,
  coalesce(m.purchase_revenue_eur, 0) as purchase_revenue_eur,
  coalesce(
    m.registry_investment_eur +
    m.investigator_payments_eur +
    m.training_costs_eur +
    m.congress_support_eur +
    m.other_investment_eur,
    0
  ) as total_investment_eur,
  coalesce(m.target_units, 0) as target_units,
  coalesce(m.target_revenue_eur, 0) as target_revenue_eur,
  o.target_cases,
  o.target_zero_contrast_rate,
  o.target_strategy_modification_rate
from public.hospitals h
left join public.opstar_center_business_metrics m on h.id = m.hospital_id
left join public.opstar_center_objectives o on h.id = o.hospital_id and m.year = o.year
where h.is_active = true;

-- 8. SECURITY: ENSURE NO LEAKAGE
-- Verify admin is only user type with access
grant select on public.opstar_center_business_metrics to authenticated;
grant select on public.opstar_center_objectives to authenticated;
alter table public.opstar_center_business_metrics force row level security;
alter table public.opstar_center_objectives force row level security;
