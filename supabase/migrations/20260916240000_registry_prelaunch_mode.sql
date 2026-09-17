-- Migration: registry_prelaunch_mode
-- Description: SPRINT - REGISTRY PRELAUNCH / GO LIVE

-- =====================================================================================
-- 1. REGISTRY SETTINGS (SINGLETON)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registry_key TEXT UNIQUE NOT NULL DEFAULT 'ULTREON_3',
    phase TEXT NOT NULL CHECK (phase IN ('PRELAUNCH', 'LIVE', 'CLOSED')),
    official_start_date DATE,
    activated_at TIMESTAMPTZ,
    activated_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Establish initial state
INSERT INTO public.registry_settings (registry_key, phase) 
VALUES ('ULTREON_3', 'PRELAUNCH')
ON CONFLICT (registry_key) DO NOTHING;

-- RLS
ALTER TABLE public.registry_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Everyone can view settings" ON public.registry_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.registry_settings FOR ALL TO authenticated USING (public.is_admin());

-- =====================================================================================
-- 2. NEW FLAGS (is_prelaunch)
-- =====================================================================================
ALTER TABLE public.ultreon_registry_cases ADD COLUMN IF NOT EXISTS is_prelaunch BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.registry_case_consumption ADD COLUMN IF NOT EXISTS is_prelaunch BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.registry_orders ADD COLUMN IF NOT EXISTS is_prelaunch BOOLEAN NOT NULL DEFAULT false;

-- Backfill: asegurar que los 2 casos QA preexistentes a esta migración queden marcados
UPDATE public.ultreon_registry_cases SET is_prelaunch = true WHERE is_demo = true;

-- Add is_prelaunch to operational views
DROP VIEW IF EXISTS public.registry_case_consumption_operational;
CREATE VIEW public.registry_case_consumption_operational AS
SELECT id, case_id, hospital_id, operator_id, product_id, quantity, consumption_date, status, source, is_prelaunch, created_by, created_at, updated_at
FROM public.registry_case_consumption
WHERE hospital_id = public.get_current_user_hospital_id();

GRANT SELECT ON public.registry_case_consumption_operational TO authenticated;

-- =====================================================================================
-- 3. TRIGGERS TO AUTO-SET PRELAUNCH FLAG
-- =====================================================================================
CREATE OR REPLACE FUNCTION set_prelaunch_flag()
RETURNS TRIGGER AS $$
DECLARE
    v_phase TEXT;
BEGIN
    SELECT phase INTO v_phase FROM public.registry_settings WHERE registry_key = 'ULTREON_3';
    IF v_phase = 'PRELAUNCH' THEN
        NEW.is_prelaunch = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_prelaunch_flag_cases ON public.ultreon_registry_cases;
CREATE TRIGGER trigger_set_prelaunch_flag_cases
BEFORE INSERT ON public.ultreon_registry_cases
FOR EACH ROW EXECUTE FUNCTION set_prelaunch_flag();

DROP TRIGGER IF EXISTS trigger_set_prelaunch_flag_consumptions ON public.registry_case_consumption;
CREATE TRIGGER trigger_set_prelaunch_flag_consumptions
BEFORE INSERT ON public.registry_case_consumption
FOR EACH ROW EXECUTE FUNCTION set_prelaunch_flag();

DROP TRIGGER IF EXISTS trigger_set_prelaunch_flag_orders ON public.registry_orders;
CREATE TRIGGER trigger_set_prelaunch_flag_orders
BEFORE INSERT ON public.registry_orders
FOR EACH ROW EXECUTE FUNCTION set_prelaunch_flag();


-- =====================================================================================
-- 4. RPC: ACTIVATE REGISTRY (GO LIVE)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.activate_registry_go_live(p_official_start_date DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_role BOOLEAN;
    v_current_phase TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_admin_role;
    IF NOT v_admin_role THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can activate the registry';
    END IF;

    SELECT phase INTO v_current_phase FROM public.registry_settings WHERE registry_key = 'ULTREON_3' FOR UPDATE;
    
    IF v_current_phase = 'LIVE' THEN
        RETURN json_build_object('success', false, 'message', 'Registry is already LIVE');
    END IF;

    UPDATE public.registry_settings 
    SET 
        phase = 'LIVE', 
        official_start_date = p_official_start_date, 
        activated_at = now(), 
        activated_by = auth.uid(),
        updated_at = now()
    WHERE registry_key = 'ULTREON_3';

    RETURN json_build_object('success', true, 'message', 'Registry is now LIVE');
END;
$$;


-- =====================================================================================
-- 5. RPC: SET INITIAL STOCK
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.set_initial_official_stock(p_hospital_id UUID, p_product_id UUID, p_quantity INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_role BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_admin_role;
    IF NOT v_admin_role THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can set initial stock';
    END IF;

    IF p_quantity < 0 THEN
        RAISE EXCEPTION 'Initial stock cannot be negative';
    END IF;

    -- Update or Insert stock
    INSERT INTO public.registry_center_stock (hospital_id, product_id, quantity_on_hand, updated_by, updated_at)
    VALUES (p_hospital_id, p_product_id, p_quantity, auth.uid(), now())
    ON CONFLICT (hospital_id, product_id)
    DO UPDATE SET 
        quantity_on_hand = p_quantity,
        updated_by = auth.uid(),
        updated_at = now();

    -- Generate INITIAL movement
    INSERT INTO public.registry_stock_movements (hospital_id, product_id, movement_type, quantity, notes, created_by)
    VALUES (p_hospital_id, p_product_id, 'INITIAL', p_quantity, 'Go Live initial stock setup', auth.uid());

    RETURN json_build_object('success', true, 'message', 'Initial stock established successfully');
END;
$$;

NOTIFY pgrst, 'reload schema';
