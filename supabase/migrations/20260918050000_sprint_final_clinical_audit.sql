-- Migration: sprint_final_clinical_audit
-- Description: Enforce audit trail for completed clinical cases

-- 1. Create Enum for change type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'case_change_type') THEN
    CREATE TYPE case_change_type AS ENUM ('CORRECTION', 'STATUS_CHANGE', 'ADMIN_ADJUSTMENT');
  END IF;
END $$;

-- 2. Create Audit Log Table
CREATE TABLE IF NOT EXISTS public.registry_case_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id UUID NOT NULL REFERENCES public.ultreon_registry_cases(id) ON DELETE CASCADE,
    changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    reason TEXT NOT NULL,
    section TEXT,
    field_path TEXT,
    old_value JSONB,
    new_value JSONB,
    change_type case_change_type NOT NULL DEFAULT 'CORRECTION'
);

-- RLS for audit log
ALTER TABLE public.registry_case_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users" 
ON public.registry_case_audit_log FOR SELECT 
TO authenticated 
USING (true);

-- Ensure users can insert into audit log to record their own changes
CREATE POLICY "Enable insert for authenticated users" 
ON public.registry_case_audit_log FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Case Protection Mechanism
-- We need to block standard updates to COMPLETED cases unless a specific flag/mechanism is used.
-- The simplest way is to add a boolean 'correction_mode' or check if the update is only reverting status to DRAFT.

CREATE OR REPLACE FUNCTION public.fn_protect_completed_cases()
RETURNS TRIGGER AS $$
BEGIN
    -- Only protect cases that are already COMPLETED
    IF OLD.status = 'COMPLETED' THEN
        
        -- Allow status to be changed back to DRAFT (this would be a STATUS_CHANGE request)
        -- We require the application to provide an audit log entry in the same transaction 
        -- (we can't easily enforce that from the trigger without assuming a specific transaction structure).
        -- But we can at least ensure we don't block the transition from COMPLETED -> DRAFT if authorized.
        
        IF NEW.status = 'DRAFT' THEN
            -- Allow reversion to DRAFT
            RETURN NEW;
        END IF;

        -- If the status remains COMPLETED, block ANY data changes unless it's a superadmin bypassing it (which we won't assume here).
        -- We will enforce that the case MUST be returned to DRAFT to be edited.
        -- This satisfies the requirement: "COMPLETED: bloqueado para edición ordinaria. Acción explícita: [Solicitar / Realizar corrección]".
        
        -- If any other field is modified while staying COMPLETED, reject it.
        IF NEW IS DISTINCT FROM OLD THEN
            RAISE EXCEPTION 'Cannot modify a COMPLETED case. You must request a correction and revert it to DRAFT first.';
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_completed_cases ON public.ultreon_registry_cases;

CREATE TRIGGER trg_protect_completed_cases
BEFORE UPDATE ON public.ultreon_registry_cases
FOR EACH ROW
EXECUTE FUNCTION public.fn_protect_completed_cases();

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
