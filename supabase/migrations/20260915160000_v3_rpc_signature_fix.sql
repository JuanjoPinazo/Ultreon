-- Migration: V3 RPC Signature Fix

-- 1. Add created_by to ultreon_registry_cases if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'ultreon_registry_cases' 
                   AND column_name = 'created_by') THEN
        ALTER TABLE public.ultreon_registry_cases ADD COLUMN created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Drop the old function
DROP FUNCTION IF EXISTS public.create_ultreon_v3_draft_secure(UUID);

-- 3. Create the new function with the exact signature
CREATE OR REPLACE FUNCTION public.create_ultreon_v3_draft_secure(p_hospital_id UUID, p_operator_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_user_hospital_id UUID;
    v_prefix TEXT;
    v_counter BIGINT;
    v_code TEXT;
    v_case_id UUID;
BEGIN
    -- 1. Get current user context
    SELECT role, hospital_id INTO v_role, v_user_hospital_id 
    FROM public.profiles 
    WHERE id = auth.uid() AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Invalid or inactive profile';
    END IF;

    -- 2. Authorization
    IF v_role NOT IN ('admin', 'hospital_user') THEN
        RAISE EXCEPTION 'Unauthorized: Role cannot create cases';
    END IF;

    IF v_role = 'hospital_user' AND v_user_hospital_id != p_hospital_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot create case for unauthorized hospital';
    END IF;

    -- 3. Get Prefix
    SELECT code_prefix INTO v_prefix 
    FROM public.ultreon_registry_hospital_settings 
    WHERE hospital_id = p_hospital_id;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Configuration Error: Hospital prefix not defined';
    END IF;

    -- 4. Atomic Counter Increment
    UPDATE public.hospital_case_counters 
    SET counter_value = counter_value + 1 
    WHERE hospital_id = p_hospital_id 
    RETURNING counter_value INTO v_counter;

    IF v_counter IS NULL THEN
        -- Seed counter if it does not exist
        INSERT INTO public.hospital_case_counters (hospital_id, counter_value) 
        VALUES (p_hospital_id, 1) 
        RETURNING counter_value INTO v_counter;
    END IF;

    -- 5. Generate Code
    v_code := v_prefix || '-' || LPAD(v_counter::TEXT, 5, '0');

    -- Collision Protection Loop
    WHILE EXISTS (SELECT 1 FROM public.ultreon_registry_cases WHERE anonymous_code = v_code) 
       OR EXISTS (SELECT 1 FROM public.ecrf_opstar_records WHERE anonymous_code = v_code)
    LOOP
        UPDATE public.hospital_case_counters 
        SET counter_value = counter_value + 1 
        WHERE hospital_id = p_hospital_id 
        RETURNING counter_value INTO v_counter;
        v_code := v_prefix || '-' || LPAD(v_counter::TEXT, 5, '0');
    END LOOP;

    -- 6. Insert Draft
    INSERT INTO public.ultreon_registry_cases (
        hospital_id,
        operator_id,
        created_by,
        procedure_date,
        anonymous_code,
        status
    ) VALUES (
        p_hospital_id,
        p_operator_id,
        auth.uid(),
        CURRENT_DATE,
        v_code,
        'DRAFT'
    ) RETURNING id INTO v_case_id;

    -- 7. Return Result
    RETURN jsonb_build_object(
        'case_id', v_case_id,
        'anonymous_code', v_code
    );
END;
$$;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION public.create_ultreon_v3_draft_secure(UUID, UUID) TO authenticated;

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload schema';
