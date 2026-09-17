-- Migration: sprint_final_clinical_audit_v2
-- Description: Implement audited correction without reverting to DRAFT

-- 1. Modify the trigger to block everything on COMPLETED cases UNLESS 'ultreon.correction_mode' is set to 'true'.
CREATE OR REPLACE FUNCTION public.fn_protect_completed_cases()
RETURNS TRIGGER AS $$
DECLARE
    v_correction_mode TEXT;
BEGIN
    IF OLD.status = 'COMPLETED' THEN
        
        -- Check if we are in an authorized correction context via RPC
        v_correction_mode := current_setting('ultreon.correction_mode', true);
        
        IF v_correction_mode = 'true' THEN
            -- We are in an audited correction via the correct_completed_case RPC
            -- Ensure that the status is NOT being changed from COMPLETED
            IF NEW.status != 'COMPLETED' THEN
                RAISE EXCEPTION 'A completed case must remain COMPLETED during a correction.';
            END IF;
            
            -- Ensure anonymous_code, hospital_id, created_by, is_demo, is_prelaunch are NOT changed
            IF NEW.anonymous_code IS DISTINCT FROM OLD.anonymous_code OR
               NEW.hospital_id IS DISTINCT FROM OLD.hospital_id OR
               NEW.created_by IS DISTINCT FROM OLD.created_by OR
               NEW.is_demo IS DISTINCT FROM OLD.is_demo OR
               NEW.is_prelaunch IS DISTINCT FROM OLD.is_prelaunch THEN
               RAISE EXCEPTION 'Immutable fields (anonymous_code, hospital_id, created_by, is_demo, is_prelaunch) cannot be modified.';
            END IF;
            
            RETURN NEW;
        END IF;

        -- If not in correction mode, block ANY modification
        IF NEW IS DISTINCT FROM OLD THEN
            RAISE EXCEPTION 'Cannot modify a COMPLETED case directly. Use the audited correction RPC.';
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create the RPC for audited correction
CREATE OR REPLACE FUNCTION public.correct_completed_case(
    p_case_id UUID,
    p_reason TEXT,
    p_changes JSONB
)
RETURNS void AS $$
DECLARE
    v_user_id UUID;
    v_case RECORD;
    v_old_value JSONB;
BEGIN
    -- 1. Validate user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate reason
    IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'A valid reason must be provided for the correction.';
    END IF;

    -- 3. Get the case and ensure it's COMPLETED
    SELECT * INTO v_case FROM public.ultreon_registry_cases WHERE id = p_case_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Case not found.';
    END IF;

    IF v_case.status != 'COMPLETED' THEN
        RAISE EXCEPTION 'This function can only be used on COMPLETED cases.';
    END IF;

    -- Convert the whole old record to JSONB for auditing
    v_old_value := to_jsonb(v_case);

    -- 4. Enable correction mode for this transaction
    PERFORM set_config('ultreon.correction_mode', 'true', true);

    -- 5. Apply the updates (Dynamic UPDATE based on p_changes JSONB)
    -- Using jsonb_populate_record to safely apply the changes
    UPDATE public.ultreon_registry_cases
    SET
        procedure_date = COALESCE((p_changes->>'procedure_date')::date, procedure_date),
        operator_id = COALESCE((p_changes->>'operator_id')::uuid, operator_id),
        core_data = COALESCE(p_changes->'core_data', core_data),
        acquisition_data = COALESCE(p_changes->'acquisition_data', acquisition_data),
        findings_data = COALESCE(p_changes->'findings_data', findings_data),
        calcium_module = COALESCE(p_changes->'calcium_module', calcium_module),
        lipid_module = COALESCE(p_changes->'lipid_module', lipid_module),
        left_main_module = COALESCE(p_changes->'left_main_module', left_main_module),
        ffr_oct_module = COALESCE(p_changes->'ffr_oct_module', ffr_oct_module),
        global_assessment = COALESCE(p_changes->'global_assessment', global_assessment),
        updated_at = now()
    WHERE id = p_case_id;

    -- 6. Insert into audit log
    INSERT INTO public.registry_case_audit_log (
        case_id,
        changed_by,
        changed_at,
        reason,
        section,
        field_path,
        old_value,
        new_value,
        change_type
    ) VALUES (
        p_case_id,
        v_user_id,
        now(),
        p_reason,
        'MULTIPLE',
        'root',
        v_old_value,
        p_changes,
        'CORRECTION'
    );
    
    -- Correction mode will automatically reset at the end of the transaction
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
