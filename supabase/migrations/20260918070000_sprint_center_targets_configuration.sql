-- Migration: sprint_center_targets_configuration
-- Description: Non-destructive center targets schema refinement for go-live readiness

-- 1. Update registry_center_targets
ALTER TABLE public.registry_center_targets
    ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Backfill status based on active boolean (Non-destructive)
UPDATE public.registry_center_targets
SET status = CASE 
    WHEN active = true THEN 'ACTIVE' 
    ELSE 'CLOSED' 
END
WHERE status IS NULL;

-- Default status for new records
ALTER TABLE public.registry_center_targets
    ALTER COLUMN status SET DEFAULT 'DRAFT',
    ALTER COLUMN status SET NOT NULL;

-- Add partial unique index for ACTIVE center targets
CREATE UNIQUE INDEX IF NOT EXISTS idx_registry_center_targets_active_unique 
    ON public.registry_center_targets (hospital_id) 
    WHERE status = 'ACTIVE';


-- 2. Update registry_operator_targets
ALTER TABLE public.registry_operator_targets
    ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED')),
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Backfill status based on active boolean
UPDATE public.registry_operator_targets
SET status = CASE 
    WHEN active = true THEN 'ACTIVE' 
    ELSE 'CLOSED' 
END
WHERE status IS NULL;

-- Default status for new records
ALTER TABLE public.registry_operator_targets
    ALTER COLUMN status SET DEFAULT 'DRAFT',
    ALTER COLUMN status SET NOT NULL;

-- Add partial unique index for ACTIVE operator targets
CREATE UNIQUE INDEX IF NOT EXISTS idx_registry_operator_targets_active_unique 
    ON public.registry_operator_targets (operator_id) 
    WHERE status = 'ACTIVE';


-- 3. Update registry_target_history
ALTER TABLE public.registry_target_history
    ADD COLUMN IF NOT EXISTS reason TEXT;

-- 4. RPC for safe Target Activation/Modification
-- We will handle updates to ACTIVE targets through the UI for now,
-- but the DB enforces the unique constraint.

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
