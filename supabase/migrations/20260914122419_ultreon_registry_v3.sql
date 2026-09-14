-- Migration: ULTREON 3.0 Clinical Registry Table & Draft Architecture

BEGIN;

-- 1. Configuration Table for Anonymous Code Prefixes
CREATE TABLE IF NOT EXISTS public.ultreon_registry_hospital_settings (
    hospital_id UUID PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
    code_prefix TEXT NOT NULL UNIQUE CHECK (code_prefix ~ '^[A-Z0-9]{2,10}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed existing hospitals using exact UUIDs
INSERT INTO public.ultreon_registry_hospital_settings (hospital_id, code_prefix)
VALUES
  ('27c36776-db4b-4719-9c3c-ed1e3cefd719'::uuid, 'HCUDV'), /* Hospital Clínico Universitario de Valencia */
  ('6daf691c-3354-459f-94c5-70fd0e876d28'::uuid, 'HDMAN'), /* Hospital de Manises */
  ('de2b9564-730d-4092-acd5-184dcf7a1357'::uuid, 'HSJDA'), /* Hospital de San Juan */
  ('91f7b58d-18d9-4ce7-aa1f-2bfc80b6fbcb'::uuid, 'HGA'),   /* Hospital General Universitario de Alicante */
  ('6807eb0e-4355-4aa3-b0d5-2e0f3f44bee8'::uuid, 'HGDCA'), /* Hospital General Universitario de Castellón */
  ('2e836080-1542-42c9-89ba-db01559a21bc'::uuid, 'HGUDE'), /* Hospital General Universitario de Elche */
  ('03ccaad6-c861-4ee8-b046-851f2f2a63f5'::uuid, 'HUDLR')  /* Hospital Universitario de la Ribera */
ON CONFLICT (hospital_id) DO UPDATE SET code_prefix = EXCLUDED.code_prefix;

-- 2. V3 Registry Table
CREATE TABLE IF NOT EXISTS public.ultreon_registry_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE CASCADE,
    operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    procedure_date DATE NOT NULL,
    anonymous_code TEXT NOT NULL,
    
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
    completed_at TIMESTAMPTZ,
    
    CONSTRAINT no_pii_local_nhc_check CHECK (anonymous_code != '')
);

CREATE INDEX IF NOT EXISTS idx_ultreon_registry_hospital_id ON public.ultreon_registry_cases(hospital_id);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_operator_id ON public.ultreon_registry_cases(operator_id);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_procedure_date ON public.ultreon_registry_cases(procedure_date);
CREATE INDEX IF NOT EXISTS idx_ultreon_registry_status ON public.ultreon_registry_cases(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ultreon_registry_anonymous_code ON public.ultreon_registry_cases(anonymous_code);

-- 3. RLS
ALTER TABLE public.ultreon_registry_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultreon_registry_hospital_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_v3_settings ON public.ultreon_registry_hospital_settings
    FOR ALL USING (public.is_admin());

CREATE POLICY authenticated_select_v3_settings ON public.ultreon_registry_hospital_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY admin_all_v3_cases ON public.ultreon_registry_cases
    FOR ALL USING (public.is_admin());

CREATE POLICY monitor_all_v3_cases ON public.ultreon_registry_cases
    FOR ALL USING (public.get_current_user_role() = 'monitor');

CREATE POLICY hospital_user_select_v3_cases ON public.ultreon_registry_cases
    FOR SELECT USING (
        public.get_current_user_role() = 'hospital_user' 
        AND hospital_id = public.get_current_user_hospital_id()
    );

CREATE POLICY hospital_user_insert_v3_cases ON public.ultreon_registry_cases
    FOR INSERT WITH CHECK (
        public.get_current_user_role() = 'hospital_user'
        AND hospital_id = public.get_current_user_hospital_id()
        AND operator_id = auth.uid()
    );

CREATE POLICY hospital_user_update_v3_cases ON public.ultreon_registry_cases
    FOR UPDATE USING (
        public.get_current_user_role() = 'hospital_user'
        AND hospital_id = public.get_current_user_hospital_id()
    )
    WITH CHECK (
        public.get_current_user_role() = 'hospital_user'
        AND hospital_id = public.get_current_user_hospital_id()
    );

CREATE POLICY viewer_select_v3_cases ON public.ultreon_registry_cases
    FOR SELECT USING (public.get_current_user_role() = 'viewer');

CREATE OR REPLACE FUNCTION set_updated_at_ultreon_registry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_updated_at_ultreon_registry
BEFORE UPDATE ON public.ultreon_registry_cases
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_ultreon_registry();

-- 4. V3 Secure Draft Function
CREATE OR REPLACE FUNCTION public.create_ultreon_v3_draft_secure(p_hospital_id UUID)
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
        procedure_date,
        anonymous_code,
        status
    ) VALUES (
        p_hospital_id,
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

COMMIT;
