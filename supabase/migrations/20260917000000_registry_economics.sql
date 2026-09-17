-- =====================================================================================
-- ULTREON 3.0 REGISTRY ECONOMICS (SPRINT 4)
-- Core schemas for tracking costs, revenues, compensations, margins and settlements.
-- =====================================================================================

-- =====================================================================================
-- 1. BENEFICIARIES
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.payment_beneficiaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_type TEXT NOT NULL CHECK (beneficiary_type IN ('OPERATOR', 'PROFESSIONAL', 'COMPANY', 'FOUNDATION', 'HOSPITAL', 'OTHER')),
    
    display_name TEXT NOT NULL,
    fiscal_name TEXT,
    tax_id TEXT,
    
    operator_id UUID REFERENCES public.operators(id) ON DELETE RESTRICT,
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    
    active BOOLEAN NOT NULL DEFAULT true,
    
    withholding_rate NUMERIC(5,2),
    vat_rate NUMERIC(5,2),
    
    payment_terms TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_payment_beneficiaries_operator ON public.payment_beneficiaries(operator_id);
CREATE INDEX IF NOT EXISTS idx_payment_beneficiaries_hospital ON public.payment_beneficiaries(hospital_id);

-- RLS
ALTER TABLE public.payment_beneficiaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_payment_beneficiaries" ON public.payment_beneficiaries
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- =====================================================================================
-- 2. OPERATOR -> BENEFICIARY ASSIGNMENT
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.operator_payment_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    beneficiary_id UUID NOT NULL REFERENCES public.payment_beneficiaries(id) ON DELETE RESTRICT,
    
    valid_from DATE NOT NULL,
    valid_to DATE,
    
    active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_op_pay_assignments_operator ON public.operator_payment_assignments(operator_id);
CREATE INDEX IF NOT EXISTS idx_op_pay_assignments_beneficiary ON public.operator_payment_assignments(beneficiary_id);

-- RLS
ALTER TABLE public.operator_payment_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_operator_payment_assignments" ON public.operator_payment_assignments
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- =====================================================================================
-- 3. ECONOMIC RULES
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_economic_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_name TEXT NOT NULL,
    scope_type TEXT NOT NULL CHECK (scope_type IN ('GLOBAL', 'CENTER', 'OPERATOR', 'BENEFICIARY')),
    
    hospital_id UUID REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    operator_id UUID REFERENCES public.operators(id) ON DELETE RESTRICT,
    beneficiary_id UUID REFERENCES public.payment_beneficiaries(id) ON DELETE RESTRICT,
    
    valid_from DATE NOT NULL,
    valid_to DATE,
    
    gross_compensation_per_case NUMERIC(12,2),
    net_target_per_case NUMERIC(12,2),
    withholding_rate NUMERIC(5,2),
    revenue_per_case NUMERIC(12,2),
    
    active BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT
);

-- RLS
ALTER TABLE public.registry_economic_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_registry_economic_rules" ON public.registry_economic_rules
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- =====================================================================================
-- 4. CASE ECONOMICS (SNAPSHOT)
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_case_economics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    case_id UUID UNIQUE NOT NULL REFERENCES public.ultreon_registry_cases(id) ON DELETE RESTRICT,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    beneficiary_id UUID REFERENCES public.payment_beneficiaries(id) ON DELETE RESTRICT,
    
    product_id UUID REFERENCES public.registry_products(id) ON DELETE RESTRICT,
    consumption_id UUID REFERENCES public.registry_case_consumption(id) ON DELETE RESTRICT,
    
    product_cost_snapshot NUMERIC(12,2),
    revenue_snapshot NUMERIC(12,2),
    
    gross_compensation NUMERIC(12,2),
    withholding_rate_snapshot NUMERIC(5,2),
    withholding_amount NUMERIC(12,2),
    net_compensation NUMERIC(12,2),
    
    other_variable_costs NUMERIC(12,2) NOT NULL DEFAULT 0,
    gross_margin NUMERIC(12,2),
    
    economic_status TEXT NOT NULL CHECK (economic_status IN ('PENDING', 'READY', 'SETTLED', 'CANCELLED')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_registry_case_economics_hospital ON public.registry_case_economics(hospital_id);
CREATE INDEX IF NOT EXISTS idx_registry_case_economics_operator ON public.registry_case_economics(operator_id);
CREATE INDEX IF NOT EXISTS idx_registry_case_economics_beneficiary ON public.registry_case_economics(beneficiary_id);

-- RLS
ALTER TABLE public.registry_case_economics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_registry_case_economics" ON public.registry_case_economics
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- =====================================================================================
-- 5. MONTHLY SETTLEMENTS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.monthly_settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beneficiary_id UUID NOT NULL REFERENCES public.payment_beneficiaries(id) ON DELETE RESTRICT,
    
    period_year INTEGER NOT NULL,
    period_month INTEGER NOT NULL CHECK (period_month >= 1 AND period_month <= 12),
    
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'REVIEWED', 'APPROVED', 'PAID', 'CANCELLED')),
    
    gross_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    withholding_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_total NUMERIC(12,2) NOT NULL DEFAULT 0,
    case_count INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    UNIQUE (beneficiary_id, period_year, period_month)
);

-- RLS
ALTER TABLE public.monthly_settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_monthly_settlements" ON public.monthly_settlements
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- =====================================================================================
-- 6. SETTLEMENT ITEMS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.settlement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settlement_id UUID NOT NULL REFERENCES public.monthly_settlements(id) ON DELETE CASCADE,
    case_economics_id UUID UNIQUE NOT NULL REFERENCES public.registry_case_economics(id) ON DELETE RESTRICT,
    
    gross_compensation NUMERIC(12,2) NOT NULL,
    withholding_amount NUMERIC(12,2) NOT NULL,
    net_compensation NUMERIC(12,2) NOT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all_settlement_items" ON public.settlement_items
    FOR ALL
    USING (public.get_current_user_role() = 'admin')
    WITH CHECK (public.get_current_user_role() = 'admin');

-- =====================================================================================
-- 7. TRIGGERS
-- =====================================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER tr_payment_beneficiaries_updated_at BEFORE UPDATE ON public.payment_beneficiaries FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_operator_payment_assignments_updated_at BEFORE UPDATE ON public.operator_payment_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_registry_economic_rules_updated_at BEFORE UPDATE ON public.registry_economic_rules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_registry_case_economics_updated_at BEFORE UPDATE ON public.registry_case_economics FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER tr_monthly_settlements_updated_at BEFORE UPDATE ON public.monthly_settlements FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- =====================================================================================
-- 8. RPC: CREATE CASE ECONOMICS
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.create_case_economics(
    p_case_id UUID,
    p_revenue_snapshot NUMERIC(12,2),
    p_product_cost NUMERIC(12,2),
    p_gross_compensation NUMERIC(12,2),
    p_withholding_rate NUMERIC(5,2),
    p_other_variable_costs NUMERIC(12,2) DEFAULT 0
) RETURNS UUID AS $$
DECLARE
    v_case public.ultreon_registry_cases%ROWTYPE;
    v_user_role TEXT;
    v_beneficiary_id UUID;
    v_withholding_amount NUMERIC(12,2);
    v_net_compensation NUMERIC(12,2);
    v_gross_margin NUMERIC(12,2);
    v_economics_id UUID;
BEGIN
    v_user_role := public.get_current_user_role();
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden crear economía.';
    END IF;

    -- Verify case
    SELECT * INTO v_case FROM public.ultreon_registry_cases WHERE id = p_case_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Caso no encontrado.';
    END IF;
    
    -- Verify eligibility (no DEMO, no PRELAUNCH, must be COMPLETED)
    IF v_case.is_demo = true OR v_case.is_prelaunch = true OR v_case.status != 'COMPLETED' THEN
        RAISE EXCEPTION 'Solo los casos oficiales completados pueden generar economía.';
    END IF;

    -- Check idempotency
    SELECT id INTO v_economics_id FROM public.registry_case_economics WHERE case_id = p_case_id;
    IF FOUND THEN
        RETURN v_economics_id; -- Already exists, return existing ID silently
    END IF;

    -- Find active beneficiary for operator
    SELECT beneficiary_id INTO v_beneficiary_id
    FROM public.operator_payment_assignments
    WHERE operator_id = v_case.operator_id
      AND active = true
      AND valid_from <= v_case.procedure_date
      AND (valid_to IS NULL OR valid_to >= v_case.procedure_date)
    ORDER BY valid_from DESC
    LIMIT 1;

    -- Calculate math
    v_withholding_amount := ROUND((p_gross_compensation * (p_withholding_rate / 100))::numeric, 2);
    v_net_compensation := p_gross_compensation - v_withholding_amount;
    v_gross_margin := p_revenue_snapshot - p_product_cost - p_gross_compensation - p_other_variable_costs;

    -- Insert
    INSERT INTO public.registry_case_economics (
        case_id, hospital_id, operator_id, beneficiary_id,
        revenue_snapshot, product_cost_snapshot,
        gross_compensation, withholding_rate_snapshot, withholding_amount, net_compensation,
        other_variable_costs, gross_margin,
        economic_status, created_by
    ) VALUES (
        p_case_id, v_case.hospital_id, v_case.operator_id, v_beneficiary_id,
        p_revenue_snapshot, p_product_cost,
        p_gross_compensation, p_withholding_rate, v_withholding_amount, v_net_compensation,
        p_other_variable_costs, v_gross_margin,
        'READY', auth.uid()
    ) RETURNING id INTO v_economics_id;

    RETURN v_economics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================================
-- 9. RPC: GENERATE DRAFT SETTLEMENT
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.generate_monthly_settlement(
    p_beneficiary_id UUID,
    p_year INTEGER,
    p_month INTEGER
) RETURNS UUID AS $$
DECLARE
    v_user_role TEXT;
    v_settlement_id UUID;
    v_gross_total NUMERIC(12,2) := 0;
    v_withholding_total NUMERIC(12,2) := 0;
    v_net_total NUMERIC(12,2) := 0;
    v_case_count INTEGER := 0;
    r RECORD;
BEGIN
    v_user_role := public.get_current_user_role();
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden generar liquidaciones.';
    END IF;

    -- Check if settlement already exists for this period
    SELECT id INTO v_settlement_id FROM public.monthly_settlements 
    WHERE beneficiary_id = p_beneficiary_id AND period_year = p_year AND period_month = p_month;
    
    IF FOUND THEN
        -- If it exists and is not draft/reviewed, we cannot regenerate
        IF EXISTS (SELECT 1 FROM public.monthly_settlements WHERE id = v_settlement_id AND status NOT IN ('DRAFT', 'REVIEWED')) THEN
            RAISE EXCEPTION 'La liquidación ya está aprobada o pagada y no puede regenerarse.';
        END IF;
        
        -- Delete items so we can recreate them
        DELETE FROM public.settlement_items WHERE settlement_id = v_settlement_id;
    ELSE
        -- Create new draft settlement
        INSERT INTO public.monthly_settlements (beneficiary_id, period_year, period_month, status, created_by)
        VALUES (p_beneficiary_id, p_year, p_month, 'DRAFT', auth.uid())
        RETURNING id INTO v_settlement_id;
    END IF;

    -- Find READY cases for this beneficiary matching the year/month of procedure_date
    FOR r IN (
        SELECT ce.id, ce.gross_compensation, ce.withholding_amount, ce.net_compensation
        FROM public.registry_case_economics ce
        JOIN public.ultreon_registry_cases c ON c.id = ce.case_id
        WHERE ce.beneficiary_id = p_beneficiary_id
          AND ce.economic_status = 'READY'
          AND EXTRACT(YEAR FROM c.procedure_date) = p_year
          AND EXTRACT(MONTH FROM c.procedure_date) = p_month
    ) LOOP
        -- Insert settlement item
        INSERT INTO public.settlement_items (settlement_id, case_economics_id, gross_compensation, withholding_amount, net_compensation)
        VALUES (v_settlement_id, r.id, r.gross_compensation, r.withholding_amount, r.net_compensation);
        
        v_gross_total := v_gross_total + r.gross_compensation;
        v_withholding_total := v_withholding_total + r.withholding_amount;
        v_net_total := v_net_total + r.net_compensation;
        v_case_count := v_case_count + 1;
    END LOOP;

    -- Update totals on settlement
    UPDATE public.monthly_settlements
    SET gross_total = v_gross_total,
        withholding_total = v_withholding_total,
        net_total = v_net_total,
        case_count = v_case_count
    WHERE id = v_settlement_id;

    RETURN v_settlement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =====================================================================================
-- 10. RPC: APPROVE SETTLEMENT
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.approve_monthly_settlement(
    p_settlement_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_status TEXT;
    r RECORD;
BEGIN
    v_user_role := public.get_current_user_role();
    IF v_user_role != 'admin' THEN
        RAISE EXCEPTION 'Solo administradores pueden aprobar liquidaciones.';
    END IF;

    SELECT status INTO v_status FROM public.monthly_settlements WHERE id = p_settlement_id;
    IF v_status NOT IN ('DRAFT', 'REVIEWED') THEN
        RAISE EXCEPTION 'La liquidación no está en un estado aprobable.';
    END IF;

    -- Mark cases as SETTLED
    FOR r IN (SELECT case_economics_id FROM public.settlement_items WHERE settlement_id = p_settlement_id) LOOP
        UPDATE public.registry_case_economics SET economic_status = 'SETTLED' WHERE id = r.case_economics_id;
    END LOOP;

    -- Mark settlement as APPROVED
    UPDATE public.monthly_settlements
    SET status = 'APPROVED',
        approved_at = now(),
        approved_by = auth.uid()
    WHERE id = p_settlement_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
