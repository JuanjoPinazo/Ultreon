-- supabase/migrations/20260629_simplification.sql
-- Simplificación del registro para centrarse en Zero-Contrast OCT

ALTER TABLE public.ecrf_opstar_records 
ADD COLUMN IF NOT EXISTS operador text,
ADD COLUMN IF NOT EXISTS fecha_procedimiento date,
ADD COLUMN IF NOT EXISTS contraste_adquisicion_oct numeric,
ADD COLUMN IF NOT EXISTS calidad_lavado text,
ADD COLUMN IF NOT EXISTS necesito_contraste_oct boolean,
ADD COLUMN IF NOT EXISTS motivo_contraste_oct text,
ADD COLUMN IF NOT EXISTS ultreon_calcio boolean default false,
ADD COLUMN IF NOT EXISTS ultreon_arco_calcio_gt_180 boolean default false,
ADD COLUMN IF NOT EXISTS ultreon_eel boolean default false,
ADD COLUMN IF NOT EXISTS ultreon_longitud_lesion numeric,
ADD COLUMN IF NOT EXISTS ultreon_referencia_prox numeric,
ADD COLUMN IF NOT EXISTS ultreon_referencia_dist numeric,
ADD COLUMN IF NOT EXISTS ultreon_area_luminal_min numeric,
ADD COLUMN IF NOT EXISTS ultreon_expansion_stent numeric;
