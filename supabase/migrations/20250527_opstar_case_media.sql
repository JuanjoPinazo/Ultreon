-- ==========================================
-- OPSTAR-AI CASE MEDIA MANAGEMENT
-- Table for storing case images, OCT frames, angiography, and reports
-- ==========================================

-- 1. CREATE TABLE opstar_case_media
create table if not exists public.opstar_case_media (
  id uuid primary key default gen_random_uuid(),

  -- Relaciones
  case_id uuid not null references public.ecrf_opstar_records(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete set null,
  uploaded_by uuid not null references auth.users(id) on delete set null,

  -- Información del archivo
  storage_path text not null,  -- "cases/{id}/pre-oct/image.jpg"
  file_name text not null,
  file_type text,              -- "image/jpeg", "application/pdf", etc.
  file_size_bytes bigint,

  -- Clasificación clínica
  media_category text not null check (media_category in ('oct_frame', 'oct_pullback', 'angiography', 'ultreon_screenshot', 'report_pdf', 'zero_contrast_image', 'other')),
  acquisition_phase text check (acquisition_phase in ('pre_pci', 'post_pci', 'follow_up', 'unknown', null)),
  description text,

  -- Flags de importancia
  is_key_image boolean default false,
  is_anonymized boolean default false,

  -- Core Lab Review
  corelab_quality text check (corelab_quality in ('excellent', 'diagnostic', 'suboptimal', 'not_usable', null)),
  corelab_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,

  -- Auditoría
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. ÍNDICES PARA PERFORMANCE
create index if not exists idx_opstar_case_media_case_id
  on public.opstar_case_media(case_id);

create index if not exists idx_opstar_case_media_hospital_id
  on public.opstar_case_media(hospital_id);

create index if not exists idx_opstar_case_media_category
  on public.opstar_case_media(media_category);

create index if not exists idx_opstar_case_media_phase
  on public.opstar_case_media(acquisition_phase);

create index if not exists idx_opstar_case_media_key_image
  on public.opstar_case_media(is_key_image) where is_key_image = true;

create index if not exists idx_opstar_case_media_reviewed
  on public.opstar_case_media(reviewed_at) where reviewed_at is null;

-- 3. ENABLE ROW LEVEL SECURITY
alter table public.opstar_case_media enable row level security;

-- 4. RLS POLICIES

-- Admin: Acceso total
drop policy if exists admin_opstar_case_media on public.opstar_case_media;
create policy admin_opstar_case_media on public.opstar_case_media
  for all using (public.is_admin());

-- Monitor: Acceso total
drop policy if exists monitor_opstar_case_media on public.opstar_case_media;
create policy monitor_opstar_case_media on public.opstar_case_media
  for all using (public.get_current_user_role() = 'monitor');

-- Hospital User: Select si hospital_id coincide
drop policy if exists hospital_user_select_media on public.opstar_case_media;
create policy hospital_user_select_media on public.opstar_case_media
  for select using (
    hospital_id = public.get_current_user_hospital_id()
    and public.get_current_user_role() = 'hospital_user'
  );

-- Hospital User: Insert si hospital_id coincide y case pertenece a su hospital
drop policy if exists hospital_user_insert_media on public.opstar_case_media;
create policy hospital_user_insert_media on public.opstar_case_media
  for insert with check (
    hospital_id = public.get_current_user_hospital_id()
    and public.get_current_user_role() = 'hospital_user'
    and exists (
      select 1 from public.ecrf_opstar_records r
      where r.id = case_id and r.hospital_id = hospital_id
    )
  );

-- Hospital User: Update solo si fue el que subió (excepto Core Lab)
drop policy if exists hospital_user_update_media on public.opstar_case_media;
create policy hospital_user_update_media on public.opstar_case_media
  for update using (
    hospital_id = public.get_current_user_hospital_id()
    and public.get_current_user_role() = 'hospital_user'
    and uploaded_by = auth.uid()
  )
  with check (hospital_id = public.get_current_user_hospital_id());

-- Hospital User: Delete solo si fue el que subió
drop policy if exists hospital_user_delete_media on public.opstar_case_media;
create policy hospital_user_delete_media on public.opstar_case_media
  for delete using (
    hospital_id = public.get_current_user_hospital_id()
    and public.get_current_user_role() = 'hospital_user'
    and uploaded_by = auth.uid()
  );

-- Viewer: Solo lectura
drop policy if exists viewer_select_media on public.opstar_case_media;
create policy viewer_select_media on public.opstar_case_media
  for select using (
    public.get_current_user_role() = 'viewer'
  );

-- 5. TRIGGER PARA ACTUALIZAR updated_at
drop trigger if exists opstar_case_media_updated_at on public.opstar_case_media;
create or replace function public.opstar_case_media_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger opstar_case_media_updated_at
  before update on public.opstar_case_media
  for each row
  execute procedure public.opstar_case_media_updated_at();
