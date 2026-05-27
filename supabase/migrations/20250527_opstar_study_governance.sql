-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - STUDY GOVERNANCE & ADMINISTRATION
-- Execute this script in your Supabase SQL Editor
-- =============================================================================

-- 1. CREATE TABLE OPSTAR_STUDY_GOVERNANCE
create table if not exists public.opstar_study_governance (
  id uuid primary key default gen_random_uuid(),
  section text not null unique,
  title text not null,
  body text not null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.opstar_study_governance enable row level security;

-- 3. RLS POLICIES FOR OPSTAR_STUDY_GOVERNANCE

-- Admin: acceso total
drop policy if exists admin_all_study_governance on public.opstar_study_governance;
create policy admin_all_study_governance on public.opstar_study_governance
  for all using (public.is_admin()) with check (public.is_admin());

-- Authenticated users: Lectura de gobernanza activa
drop policy if exists authenticated_select_active_governance on public.opstar_study_governance;
create policy authenticated_select_active_governance on public.opstar_study_governance
  for select using (
    auth.role() = 'authenticated'
    and is_active = true
  );

-- 4. INSERT INITIAL GOVERNANCE STRUCTURE (empty - to be filled via admin)
insert into public.opstar_study_governance (section, title, body, display_order, is_active)
values
  ('scientific_committee', 'Comité Científico', 'Información pendiente de completar', 1, true),
  ('core_lab', 'Core Lab OPSTAR-AI', 'Información pendiente de completar', 2, true),
  ('data_management', 'Gestión de Datos', 'Información pendiente de completar', 3, true),
  ('platform', 'Plataforma OPSTAR-AI', 'Información pendiente de completar', 4, true),
  ('privacy', 'Privacidad y Protección de Datos', 'Información pendiente de completar', 5, true)
on conflict (section) do nothing;

-- 5. CREATE INDEX FOR PERFORMANCE
create index if not exists idx_study_governance_section on public.opstar_study_governance(section);
create index if not exists idx_study_governance_active on public.opstar_study_governance(is_active);
create index if not exists idx_study_governance_display_order on public.opstar_study_governance(display_order);

-- 6. CREATE INDEX FOR INVESTIGATORS
create index if not exists idx_investigators_hospital_id on public.opstar_investigators(hospital_id);
create index if not exists idx_investigators_is_principal on public.opstar_investigators(is_principal_investigator);
create index if not exists idx_investigators_is_active on public.opstar_investigators(is_active);
create index if not exists idx_investigators_display_order on public.opstar_investigators(display_order);
