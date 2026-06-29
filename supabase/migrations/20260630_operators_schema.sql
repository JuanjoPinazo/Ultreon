-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - OPERATORS SCHEMA MIGRATION
-- =============================================================================

-- 1. CREATE TABLE OPERATORS
create table if not exists public.operators (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CREATE TABLE HOSPITAL_OPERATORS
create table if not exists public.hospital_operators (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  operator_id uuid not null references public.operators(id) on delete cascade,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(hospital_id, operator_id)
);

-- 3. ENABLE ROW LEVEL SECURITY
alter table public.operators enable row level security;
alter table public.hospital_operators enable row level security;

-- 4. RLS POLICIES FOR OPERATORS
-- Admin can do everything
create policy admin_all_operators on public.operators
  for all using (public.is_admin()) with check (public.is_admin());

-- Authenticated can read active operators
create policy auth_read_active_operators on public.operators
  for select using (auth.role() = 'authenticated' and is_active = true);

-- 5. RLS POLICIES FOR HOSPITAL_OPERATORS
-- Admin can do everything
create policy admin_all_hospital_ops on public.hospital_operators
  for all using (public.is_admin()) with check (public.is_admin());

-- Hospital users can read operators in their hospital
create policy auth_read_active_hospital_ops on public.hospital_operators
  for select using (
    auth.role() = 'authenticated' 
    and is_active = true
  );

-- Trigger to update updated_at timestamp (reusing standard approach)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_operators_modtime ON public.operators;
CREATE TRIGGER update_operators_modtime BEFORE UPDATE ON public.operators FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_hospital_operators_modtime ON public.hospital_operators;
CREATE TRIGGER update_hospital_operators_modtime BEFORE UPDATE ON public.hospital_operators FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
