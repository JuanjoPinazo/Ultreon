-- Migration: ULTREON 3.0 Clinical Registry V3 Bootstrap V3 (Final & Idempotent)
-- Description: Creates the definitive ultreon_registry_cases table and RPC for V3, with strict constraints.

BEGIN;

-- 1. Configuration Tables (Idempotent)
CREATE TABLE IF NOT EXISTS public.hospital_case_counters (
    hospital_id UUID PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
    counter_value BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ultreon_registry_hospital_settings (
    hospital_id UUID PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
    code_prefix TEXT NOT NULL UNIQUE CHECK (code_prefix ~ '^[A-Z0-9]{2,10}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed prefix settings (Idempotent via ON CONFLICT)
INSERT INTO public.ultreon_registry_hospital_settings (hospital_id, code_prefix)
VALUES
  ('27c36776-db4b-4719-9c3c-ed1e3cefd719'::uuid, 'HCUDV'),
  ('6daf691c-3354-459f-94c5-70fd0e876d28'::uuid, 'HDMAN'),
  ('de2b9564-730d-4092-acd5-184dcf7a1357'::uuid, 'HSJDA'),
  ('91f7b58d-18d9-4ce7-aa1f-2bfc80b6fbcb'::uuid, 'HGA'),
  ('6807eb0e-4355-4aa3-b0d5-2e0f3f44bee8'::uuid, 'HGDCA'),
  ('2e836080-1542-42c9-89ba-db01559a21bc'::uuid, 'HGUDE'),
  ('03ccaad6-c861-4ee8-b046-851f2f2a63f5'::uuid, 'HUDLR')
ON CONFLICT (hospital_id) DO UPDATE SET code_prefix = EXCLUDED.code_prefix;


-- 2. V3 Registry Table
CREATE TABLE IF NOT EXISTS public.ultreon_registry_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    procedure_date DATE NOT NULL,
    anonymous_code TEXT NOT NULL UNIQUE CHECK (anonymous_code != ''),
    is_demo BOOLEAN NOT NULL DEFAULT false,
    
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'COMPLETED')),
    schema_version TEXT NOT NULL DEFAULT '3.0',
    
    ultreon_changed_strategy BOOLEAN,
    incremental_diagnostic_yield BOOLEAN,
    post_pci_correction_needed BOOLEAN,
    calcium_impacted_decision BOOLEAN,
    ffr_oct_impacted_decision BOOLEAN,
    expected_oct_utilization_increase TEXT,

    core_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    acquisition_data JSONB NOT NULL DEFAULT '{"pullbacks": []}'::jsonb,
    findings_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    calcium_module JSONB,
    lipid_module JSONB,
    left_main_module JSONB,
    ffr_oct_module JSONB,
    global_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_cases_hospital_id ON public.ultreon_registry_cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_cases_operator_id ON public.ultreon_registry_cases(operator_id);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_cases_procedure_date ON public.ultreon_registry_cases(procedure_date);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_cases_status ON public.ultreon_registry_cases(status);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_cases_created_by ON public.ultreon_registry_cases(created_by);


-- 3. Trigger updated_at
CREATE OR REPLACE FUNCTION set_updated_at_ultreon_registry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_updated_at_ultreon_registry ON public.ultreon_registry_cases;
CREATE TRIGGER trigger_set_updated_at_ultreon_registry
BEFORE UPDATE ON public.ultreon_registry_cases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_ultreon_registry();

-- Trigger for Immutable Fields Protection
CREATE OR REPLACE FUNCTION protect_immutable_v3_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip protection if user is admin
    IF public.get_current_user_role() = 'admin' THEN
        RETURN NEW;
    END IF;

    IF NEW.created_by IS DISTINCT FROM OLD.created_by OR
       NEW.is_demo IS DISTINCT FROM OLD.is_demo OR
       NEW.anonymous_code IS DISTINCT FROM OLD.anonymous_code OR
       NEW.hospital_id IS DISTINCT FROM OLD.hospital_id THEN
        RAISE EXCEPTION 'Unauthorized: Cannot modify immutable fields (created_by, is_demo, anonymous_code, hospital_id)';
    END IF;

    -- Protect operator_id changes if case is COMPLETED (preferentemente status = DRAFT)
    IF NEW.operator_id IS DISTINCT FROM OLD.operator_id AND OLD.status = 'COMPLETED' THEN
        RAISE EXCEPTION 'Unauthorized: Cannot modify operator_id on COMPLETED cases';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_protect_immutable_v3_fields ON public.ultreon_registry_cases;
CREATE TRIGGER trigger_protect_immutable_v3_fields
BEFORE UPDATE ON public.ultreon_registry_cases
FOR EACH ROW
EXECUTE FUNCTION protect_immutable_v3_fields();


-- 4. RLS
ALTER TABLE public.ultreon_registry_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultreon_registry_hospital_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- Clear previous policies on the tables safely
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ultreon_registry_cases' AND schemaname = 'public' 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.ultreon_registry_cases';
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'ultreon_registry_hospital_settings' AND schemaname = 'public' 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.ultreon_registry_hospital_settings';
    END LOOP;
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'hospital_case_counters' AND schemaname = 'public' 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(pol.policyname) || ' ON public.hospital_case_counters';
    END LOOP;
END $$;

-- hospital_case_counters (No policies, accessible ONLY via SECURITY DEFINER)
-- (Deliberately empty to ensure isolation)

-- ultreon_registry_hospital_settings
CREATE POLICY admin_all_v3_settings ON public.ultreon_registry_hospital_settings
    FOR ALL USING (public.is_admin());

CREATE POLICY authenticated_select_v3_settings ON public.ultreon_registry_hospital_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- ultreon_registry_cases: Admins
CREATE POLICY admin_all_v3_cases ON public.ultreon_registry_cases
    FOR ALL USING (public.is_admin());

-- ultreon_registry_cases: Hospital Users
CREATE POLICY hospital_user_select_v3_cases ON public.ultreon_registry_cases
    FOR SELECT USING (
        public.get_current_user_role() = 'hospital_user' 
        AND hospital_id = public.get_current_user_hospital_id()
    );

CREATE POLICY hospital_user_insert_v3_cases ON public.ultreon_registry_cases
    FOR INSERT WITH CHECK (
        public.get_current_user_role() = 'hospital_user'
        AND hospital_id = public.get_current_user_hospital_id()
        AND is_demo = false
        AND created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.hospital_operators ho
            JOIN public.operators op ON op.id = ho.operator_id
            WHERE ho.hospital_id = ultreon_registry_cases.hospital_id 
              AND ho.operator_id = ultreon_registry_cases.operator_id
              AND ho.is_active = true
              AND op.is_active = true
        )
    );

CREATE POLICY hospital_user_update_v3_cases ON public.ultreon_registry_cases
    FOR UPDATE USING (
        public.get_current_user_role() = 'hospital_user'
        AND hospital_id = public.get_current_user_hospital_id()
    )
    WITH CHECK (
        public.get_current_user_role() = 'hospital_user'
        AND hospital_id = public.get_current_user_hospital_id()
        AND EXISTS (
            SELECT 1 FROM public.hospital_operators ho
            JOIN public.operators op ON op.id = ho.operator_id
            WHERE ho.hospital_id = ultreon_registry_cases.hospital_id 
              AND ho.operator_id = ultreon_registry_cases.operator_id
              AND ho.is_active = true
              AND op.is_active = true
        )
    );

-- Monitor/Viewer
CREATE POLICY monitor_select_v3_cases ON public.ultreon_registry_cases
    FOR SELECT USING (public.get_current_user_role() = 'monitor');

CREATE POLICY viewer_select_v3_cases ON public.ultreon_registry_cases
    FOR SELECT USING (public.get_current_user_role() = 'viewer');


-- 5. RPC create_ultreon_v3_draft_secure
DROP FUNCTION IF EXISTS public.create_ultreon_v3_draft_secure(UUID);
DROP FUNCTION IF EXISTS public.create_ultreon_v3_draft_secure(UUID, UUID);
DROP FUNCTION IF EXISTS public.create_ultreon_v3_draft_secure(UUID, UUID, BOOLEAN, DATE);

CREATE OR REPLACE FUNCTION public.create_ultreon_v3_draft_secure(
    p_hospital_id UUID,
    p_operator_id UUID,
    p_is_demo BOOLEAN DEFAULT false,
    p_procedure_date DATE DEFAULT CURRENT_DATE
)
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
    v_operator_valid BOOLEAN;
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
    
    IF p_is_demo = true AND v_role != 'admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can create DEMO cases';
    END IF;

    -- Verify operator belongs to this hospital and is active
    SELECT EXISTS (
        SELECT 1 FROM public.hospital_operators ho
        JOIN public.operators op ON op.id = ho.operator_id
        WHERE ho.hospital_id = p_hospital_id 
          AND ho.operator_id = p_operator_id
          AND ho.is_active = true
          AND op.is_active = true
    ) INTO v_operator_valid;

    IF NOT v_operator_valid THEN
        RAISE EXCEPTION 'Invalid Operator: Operator is not associated with this hospital or is inactive';
    END IF;

    -- 3. Get Prefix
    SELECT code_prefix INTO v_prefix 
    FROM public.ultreon_registry_hospital_settings 
    WHERE hospital_id = p_hospital_id;

    IF v_prefix IS NULL THEN
        RAISE EXCEPTION 'Configuration Error: Hospital prefix not defined';
    END IF;

    -- 4. Atomic Counter Increment
    INSERT INTO public.hospital_case_counters (hospital_id, counter_value)
    VALUES (p_hospital_id, 1)
    ON CONFLICT (hospital_id) DO UPDATE 
    SET counter_value = public.hospital_case_counters.counter_value + 1
    RETURNING counter_value INTO v_counter;

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
        is_demo,
        procedure_date,
        anonymous_code,
        status
    ) VALUES (
        p_hospital_id,
        p_operator_id,
        auth.uid(),
        p_is_demo,
        p_procedure_date,
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

-- Grant Execution properly hardened
REVOKE ALL ON FUNCTION public.create_ultreon_v3_draft_secure(UUID, UUID, BOOLEAN, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_ultreon_v3_draft_secure(UUID, UUID, BOOLEAN, DATE) TO authenticated;

COMMIT;

-- 6. Schema Cache Reload
NOTIFY pgrst, 'reload schema';
