-- ==========================================
-- OPSTAR-AI LEVANTE REGISTRY - BASE DATABASE SETUP
-- Execute this script in your Supabase SQL Editor.
-- ==========================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CREATE HOSPITALS TABLE
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  city text,
  province text,
  code text unique not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. CREATE PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'hospital_user' check (role in ('admin', 'hospital_user', 'monitor', 'viewer')),
  hospital_id uuid references public.hospitals(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. ADAPT ECRF_OPSTAR_RECORDS TABLE
create table if not exists public.ecrf_opstar_records (
  id uuid primary key default gen_random_uuid(),
  id_paciente text not null,
  centro text not null,
  vaso_diana text not null,
  tecnica_purga_oct text,
  ffr_oct numeric,
  calcio_ia boolean default false,
  placa_lipida_ia boolean default false,
  arco_lipidico_estimado numeric,
  landing_zone text,
  diametro numeric,
  modifico_estrategia boolean default false,
  expansion numeric,
  malaposicion_struts boolean default false,
  diseccion_bordes boolean default false,
  contraste_ml numeric
);

-- Inject additional columns for access control and audit
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'hospital_id') then
    alter table public.ecrf_opstar_records add column hospital_id uuid references public.hospitals(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'created_by') then
    alter table public.ecrf_opstar_records add column created_by uuid references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'locked') then
    alter table public.ecrf_opstar_records add column locked boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'monitor_validated') then
    alter table public.ecrf_opstar_records add column monitor_validated boolean default false;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'created_at') then
    alter table public.ecrf_opstar_records add column created_at timestamptz default now();
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'ecrf_opstar_records' and column_name = 'updated_at') then
    alter table public.ecrf_opstar_records add column updated_at timestamptz default now();
  end if;
end $$;

-- 5. PROFILE SYNCHRONIZATION TRIGGER FUNCTION
-- This trigger automatically synchronizes new auth.users into public.profiles,
-- mapping metadata for roles, full_name and hospital_id if available.
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'hospital_user';
  meta_role text;
  meta_full_name text;
  meta_hospital_id uuid;
begin
  meta_role := coalesce(new.raw_user_meta_data->>'role', default_role);
  meta_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');
  
  -- Set specific email automatically to admin
  if new.email = 'juanjopinazo@gmail.com' then
    meta_role := 'admin';
  end if;

  if (new.raw_user_meta_data->>'hospital_id') is not null and (new.raw_user_meta_data->>'hospital_id') != '' then
    meta_hospital_id := (new.raw_user_meta_data->>'hospital_id')::uuid;
  else
    meta_hospital_id := null;
  end if;

  insert into public.profiles (id, email, full_name, role, hospital_id, is_active)
  values (
    new.id,
    new.email,
    meta_full_name,
    meta_role,
    meta_hospital_id,
    true
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(meta_full_name, profiles.full_name),
      role = coalesce(meta_role, profiles.role),
      hospital_id = coalesce(meta_hospital_id, profiles.hospital_id);
      
  return new;
end;
$$ language plpgsql security definer;

-- Trigger definition
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. SECURITY DEFINER HELPER FUNCTIONS FOR RLS POLICIES
-- Security definer runs functions with bypass of RLS to avoid recursion loops.
create or replace function public.is_admin()
returns boolean security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
end;
$$ language plpgsql;

create or replace function public.get_current_user_role()
returns text security definer as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles
  where id = auth.uid() and is_active = true;
  return coalesce(user_role, 'viewer');
end;
$$ language plpgsql;

create or replace function public.get_current_user_hospital_id()
returns uuid security definer as $$
declare
  user_hospital_id uuid;
begin
  select hospital_id into user_hospital_id from public.profiles
  where id = auth.uid() and is_active = true;
  return user_hospital_id;
end;
$$ language plpgsql;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.hospitals enable row level security;
alter table public.profiles enable row level security;
alter table public.ecrf_opstar_records enable row level security;

-- 8. RLS POLICIES

-- HOSPITALS POLICIES
drop policy if exists admin_all_hospitals on public.hospitals;
create policy admin_all_hospitals on public.hospitals
  for all using (public.is_admin());

drop policy if exists active_users_select_hospitals on public.hospitals;
create policy active_users_select_hospitals on public.hospitals
  for select using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() and is_active = true
    )
  );

-- PROFILES POLICIES
drop policy if exists admin_all_profiles on public.profiles;
create policy admin_all_profiles on public.profiles
  for all using (public.is_admin());

drop policy if exists users_select_own_profile on public.profiles;
create policy users_select_own_profile on public.profiles
  for select using (auth.uid() = id);

drop policy if exists users_update_own_profile on public.profiles;
create policy users_update_own_profile on public.profiles
  for update using (auth.uid() = id)
  with check (
    auth.uid() = id 
    and role = (select role from public.profiles where id = auth.uid()) -- Role cannot be changed by user
    and hospital_id = (select hospital_id from public.profiles where id = auth.uid()) -- Hospital cannot be changed
  );

-- CASES (ECRF_OPSTAR_RECORDS) POLICIES
drop policy if exists admin_all_cases on public.ecrf_opstar_records;
create policy admin_all_cases on public.ecrf_opstar_records
  for all using (public.is_admin());

drop policy if exists monitor_all_cases on public.ecrf_opstar_records;
create policy monitor_all_cases on public.ecrf_opstar_records
  for all using (public.get_current_user_role() = 'monitor');

drop policy if exists hospital_user_select_cases on public.ecrf_opstar_records;
create policy hospital_user_select_cases on public.ecrf_opstar_records
  for select using (
    public.get_current_user_role() = 'hospital_user' 
    and hospital_id = public.get_current_user_hospital_id()
  );

drop policy if exists hospital_user_insert_cases on public.ecrf_opstar_records;
create policy hospital_user_insert_cases on public.ecrf_opstar_records
  for insert with check (
    public.get_current_user_role() = 'hospital_user'
    and hospital_id = public.get_current_user_hospital_id()
    and created_by = auth.uid()
  );

drop policy if exists hospital_user_update_cases on public.ecrf_opstar_records;
create policy hospital_user_update_cases on public.ecrf_opstar_records
  for update using (
    public.get_current_user_role() = 'hospital_user'
    and hospital_id = public.get_current_user_hospital_id()
    and locked = false
  )
  with check (
    public.get_current_user_role() = 'hospital_user'
    and hospital_id = public.get_current_user_hospital_id()
    and locked = false
  );

drop policy if exists viewer_select_cases on public.ecrf_opstar_records;
create policy viewer_select_cases on public.ecrf_opstar_records
  for select using (
    public.get_current_user_role() = 'viewer'
  );

-- 9. SEED INITIAL HOSPITALS
insert into public.hospitals (name, short_name, city, province, code, is_active)
values 
  ('Hospital de San Juan', 'HSJ', 'San Juan de Alicante', 'Alicante', 'HOSP-SANJUAN', true),
  ('Hospital General Universitario de Elche', 'HGE', 'Elche', 'Alicante', 'HOSP-ELCHE', true),
  ('Hospital General Universitario de Castellón', 'HGC', 'Castellón de la Plana', 'Castellón', 'HOSP-CASTELLON', true),
  ('Hospital Universitario de la Ribera', 'HUR', 'Alzira', 'Valencia', 'HOSP-RIBERA', true),
  ('Hospital de Manises', 'HMA', 'Manises', 'Valencia', 'HOSP-MANISES', true),
  ('Otro / Pendiente de definir', 'OPD', 'Levante', 'Alicante', 'HOSP-PENDIENTE', true)
on conflict (code) do update 
set name = excluded.name, 
    short_name = excluded.short_name, 
    city = excluded.city, 
    province = excluded.province, 
    is_active = excluded.is_active;

-- 10. MANUAL SET ADMIN INSTRUCTIONS (For reference or update)
-- If the user juanjopinazo@gmail.com is already registered, this SQL statement turns their profile into admin:
-- UPDATE public.profiles SET role = 'admin', is_active = true, hospital_id = null WHERE email = 'juanjopinazo@gmail.com';
