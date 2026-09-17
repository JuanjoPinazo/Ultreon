-- Migration: operator_targets_and_history
-- Description: Create configuration for operator targets and tracking target history

-- 1. Operator Targets
CREATE TABLE IF NOT EXISTS public.registry_operator_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    center_target_id UUID REFERENCES public.registry_center_targets(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE,
    target_total INT NOT NULL,
    target_monthly INT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_registry_operator_targets_hospital ON public.registry_operator_targets(hospital_id);
CREATE INDEX IF NOT EXISTS idx_registry_operator_targets_operator ON public.registry_operator_targets(operator_id);
CREATE INDEX IF NOT EXISTS idx_registry_operator_targets_center_target ON public.registry_operator_targets(center_target_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_registry_operator_targets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_registry_operator_targets_updated_at ON public.registry_operator_targets;
CREATE TRIGGER trigger_update_registry_operator_targets_updated_at
BEFORE UPDATE ON public.registry_operator_targets
FOR EACH ROW
EXECUTE FUNCTION update_registry_operator_targets_updated_at();

-- 2. Target History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.registry_target_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('center', 'operator')),
    target_id UUID NOT NULL,
    previous_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registry_target_history_target ON public.registry_target_history(target_type, target_id);

-- 3. RLS for registry_operator_targets
ALTER TABLE public.registry_operator_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on registry_operator_targets"
ON public.registry_operator_targets
FOR ALL
TO authenticated
USING (
    public.is_admin()
);

CREATE POLICY "Hospital users can view operator targets of their hospital"
ON public.registry_operator_targets
FOR SELECT
TO authenticated
USING (
    registry_operator_targets.hospital_id = public.get_current_user_hospital_id()
);

-- 4. RLS for registry_target_history
ALTER TABLE public.registry_target_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on registry_target_history"
ON public.registry_target_history
FOR ALL
TO authenticated
USING (
    public.is_admin()
);

CREATE POLICY "Hospital users can view history of their hospital targets"
ON public.registry_target_history
FOR SELECT
TO authenticated
USING (
    (target_type = 'center' AND target_id IN (
        SELECT id FROM public.registry_center_targets WHERE hospital_id = public.get_current_user_hospital_id()
    ))
    OR 
    (target_type = 'operator' AND target_id IN (
        SELECT id FROM public.registry_operator_targets WHERE hospital_id = public.get_current_user_hospital_id()
    ))
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
