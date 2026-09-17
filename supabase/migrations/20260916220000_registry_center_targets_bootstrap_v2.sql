-- Migration: registry_center_targets_bootstrap_v2
-- Description: Correct bootstrap for registry_center_targets avoiding user_profiles

CREATE TABLE IF NOT EXISTS public.registry_center_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    target_total INTEGER NOT NULL CHECK (target_total > 0),
    target_monthly INTEGER NULL CHECK (target_monthly IS NULL OR target_monthly > 0),
    active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indices to prevent overlapping active targets
CREATE INDEX IF NOT EXISTS idx_registry_center_targets_hospital ON public.registry_center_targets(hospital_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_center_target 
ON public.registry_center_targets (hospital_id) 
WHERE active = true;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_registry_center_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_registry_center_targets_updated_at ON public.registry_center_targets;
CREATE TRIGGER trigger_update_registry_center_targets_updated_at
BEFORE UPDATE ON public.registry_center_targets
FOR EACH ROW
EXECUTE FUNCTION update_registry_center_targets_updated_at();

-- RLS Enable
ALTER TABLE public.registry_center_targets ENABLE ROW LEVEL SECURITY;

-- ADMIN CRUD
CREATE POLICY "Admins can do everything on registry_center_targets"
ON public.registry_center_targets
FOR ALL
TO authenticated
USING (
    public.is_admin()
);

-- HOSPITAL/OPERATOR READ
CREATE POLICY "Hospital users can view their own targets"
ON public.registry_center_targets
FOR SELECT
TO authenticated
USING (
    registry_center_targets.hospital_id = public.get_current_user_hospital_id()
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
