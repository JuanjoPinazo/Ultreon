-- Migration: sprint_center_go_live
-- Description: Center-level activation logic

-- 1. Create Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'hospital_phase_type') THEN
    CREATE TYPE hospital_phase_type AS ENUM ('CENTER_PRELAUNCH', 'CENTER_LIVE', 'CENTER_CLOSED');
  END IF;
END $$;

-- 2. Extend ultreon_registry_hospital_settings
ALTER TABLE public.ultreon_registry_hospital_settings
ADD COLUMN IF NOT EXISTS phase hospital_phase_type DEFAULT 'CENTER_PRELAUNCH',
ADD COLUMN IF NOT EXISTS official_start_date DATE,
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 3. Create Trigger to enforce is_prelaunch based on hospital status
CREATE OR REPLACE FUNCTION public.fn_set_case_prelaunch_status()
RETURNS TRIGGER AS $$
DECLARE
    v_hospital_phase hospital_phase_type;
    v_official_start DATE;
BEGIN
    -- Fetch the hospital's current settings
    SELECT phase, official_start_date
    INTO v_hospital_phase, v_official_start
    FROM public.ultreon_registry_hospital_settings
    WHERE hospital_id = NEW.hospital_id;

    -- If hospital is not LIVE, force prelaunch to true
    IF v_hospital_phase IS DISTINCT FROM 'CENTER_LIVE' THEN
        NEW.is_prelaunch := true;
    ELSIF v_official_start IS NOT NULL AND NEW.procedure_date < v_official_start THEN
        -- If it is LIVE, but the case is from before the official start date, force to true
        NEW.is_prelaunch := true;
    ELSIF NEW.is_demo = true THEN
        -- Demos are always prelaunch logically, or rather not official. We can force it or leave as is.
        NEW.is_prelaunch := true;
    ELSE
        -- Otherwise, it's an official live case. (We leave the UI's choice if they explicitly mark it, 
        -- but default to false if not set or enforce false if we want strictness. 
        -- The prompt says: si hospital.phase = LIVE y procedure_date >= official_start_date -> is_prelaunch = false)
        NEW.is_prelaunch := false;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_set_case_prelaunch_status ON public.ultreon_registry_cases;

CREATE TRIGGER trg_set_case_prelaunch_status
BEFORE INSERT OR UPDATE OF procedure_date, hospital_id, is_demo ON public.ultreon_registry_cases
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_case_prelaunch_status();

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
