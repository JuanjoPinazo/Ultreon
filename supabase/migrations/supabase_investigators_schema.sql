-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - INVESTIGADORES & CENTROS SCHEMA MIGRATION
-- Execute this script in your Supabase SQL Editor.
-- =============================================================================

-- 1. CREATE TABLE OPSTAR_INVESTIGATORS
create table if not exists public.opstar_investigators (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('principal_investigator', 'sub_investigator', 'coordinator', 'data_manager', 'monitor', 'other')),
  email text,
  phone text,
  specialty text,
  is_principal_investigator boolean default false,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.opstar_investigators enable row level security;

-- 3. RLS POLICIES FOR OPSTAR_INVESTIGATORS

-- Admin: acceso total (lectura, inserción, actualización, borrado)
drop policy if exists admin_all_investigators on public.opstar_investigators;
create policy admin_all_investigators on public.opstar_investigators
  for all using (public.is_admin()) with check (public.is_admin());

-- Hospital User: Lectura restringida únicamente a investigadores de su propio centro
drop policy if exists hospital_user_select_investigators on public.opstar_investigators;
create policy hospital_user_select_investigators on public.opstar_investigators
  for select using (
    public.get_current_user_role() = 'hospital_user'
    and hospital_id = public.get_current_user_hospital_id()
  );

-- Usuarios autenticados (Monitores, Viewers, etc. excepto hospital_user): Lectura de investigadores activos en el registro
drop policy if exists authenticated_select_active_investigators on public.opstar_investigators;
create policy authenticated_select_active_investigators on public.opstar_investigators
  for select using (
    auth.role() = 'authenticated'
    and public.get_current_user_role() != 'hospital_user'
    and is_active = true
  );

-- Viewers: Lectura de investigadores activos (Soporte explícito para visor general)
drop policy if exists viewer_select_investigators on public.opstar_investigators;
create policy viewer_select_investigators on public.opstar_investigators
  for select using (
    public.get_current_user_role() = 'viewer'
    and is_active = true
  );
