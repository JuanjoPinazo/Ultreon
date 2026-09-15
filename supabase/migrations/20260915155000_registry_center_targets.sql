-- Migration: registry_center_targets
-- Description: Create configuration for hospital targets (Demo/Global)

CREATE TABLE IF NOT EXISTS public.registry_center_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    target_total INT NOT NULL,
    target_monthly INT,
    target_weekly INT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_registry_center_targets_hospital ON public.registry_center_targets(hospital_id);

-- RLS Enable
ALTER TABLE public.registry_center_targets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can do everything on registry_center_targets"
ON public.registry_center_targets
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.role = 'admin'
    )
);

CREATE POLICY "Hospital users can view their own targets"
ON public.registry_center_targets
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE user_profiles.id = auth.uid()
        AND user_profiles.hospital_id = registry_center_targets.hospital_id
    )
);

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

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
