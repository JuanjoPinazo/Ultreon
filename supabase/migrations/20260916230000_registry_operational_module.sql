-- Migration: registry_operational_module
-- Description: SPRINT 3 - ACTIVIDAD, CONSUMO, STOCK Y PEDIDOS

-- =====================================================================================
-- 1. CATÁLOGO DE PRODUCTOS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT true,
    default_unit_cost NUMERIC(12,2),
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.registry_products (product_code, product_name, description, default_unit_cost)
VALUES ('OCT-CATHETER', 'Catéter OCT Dragonfly', 'Catéter de tomografía de coherencia óptica', 750.00)
ON CONFLICT (product_code) DO NOTHING;

-- =====================================================================================
-- 2. CONSUMO POR CASO
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_case_consumption (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.ultreon_registry_cases(id) ON DELETE RESTRICT,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    operator_id UUID NOT NULL REFERENCES public.operators(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.registry_products(id) ON DELETE RESTRICT,
    
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    unit_cost_snapshot NUMERIC(12,2),
    
    consumption_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'ADJUSTED', 'CANCELLED')),
    source TEXT NOT NULL DEFAULT 'CASE',
    
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 3. STOCK POR CENTRO
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_center_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.registry_products(id) ON DELETE RESTRICT,
    
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    UNIQUE (hospital_id, product_id)
);

-- =====================================================================================
-- 4. MOVIMIENTOS DE STOCK
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.registry_products(id) ON DELETE RESTRICT,
    
    movement_type TEXT NOT NULL CHECK (movement_type IN ('INITIAL', 'RECEIPT', 'CONSUMPTION', 'ADJUSTMENT', 'RETURN', 'RESERVATION', 'RELEASE')),
    quantity INTEGER NOT NULL,
    
    case_id UUID,
    order_id UUID,
    
    movement_date TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 5. PEDIDOS
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    hospital_id UUID NOT NULL REFERENCES public.hospitals(id) ON DELETE RESTRICT,
    
    status TEXT NOT NULL CHECK (status IN ('DRAFT', 'REQUESTED', 'CONFIRMED', 'SHIPPED', 'RECEIVED', 'CANCELLED')),
    
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    
    notes TEXT,
    
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 6. ITEMS DE PEDIDO
-- =====================================================================================
CREATE TABLE IF NOT EXISTS public.registry_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.registry_orders(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.registry_products(id) ON DELETE RESTRICT,
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost_snapshot NUMERIC(12,2),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================================================
-- 7. TRIGGERS UPDATED_AT
-- =====================================================================================
CREATE OR REPLACE FUNCTION update_operational_module_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.registry_products FOR EACH ROW EXECUTE FUNCTION update_operational_module_updated_at();
CREATE TRIGGER update_consumption_updated_at BEFORE UPDATE ON public.registry_case_consumption FOR EACH ROW EXECUTE FUNCTION update_operational_module_updated_at();
CREATE TRIGGER update_stock_updated_at BEFORE UPDATE ON public.registry_center_stock FOR EACH ROW EXECUTE FUNCTION update_operational_module_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.registry_orders FOR EACH ROW EXECUTE FUNCTION update_operational_module_updated_at();

-- =====================================================================================
-- 8. VISTAS SANITIZADAS (OPERACIONALES) PARA PROTECCIÓN DE COSTES
-- =====================================================================================
CREATE OR REPLACE VIEW public.registry_products_operational AS
SELECT id, product_code, product_name, description, active, valid_from, valid_to, created_at, updated_at
FROM public.registry_products;

CREATE OR REPLACE VIEW public.registry_case_consumption_operational AS
SELECT id, case_id, hospital_id, operator_id, product_id, quantity, consumption_date, status, source, created_by, created_at, updated_at
FROM public.registry_case_consumption
WHERE hospital_id = public.get_current_user_hospital_id();

CREATE OR REPLACE VIEW public.registry_order_items_operational AS
SELECT roi.id, roi.order_id, roi.product_id, roi.quantity, roi.created_at
FROM public.registry_order_items roi
JOIN public.registry_orders ro ON roi.order_id = ro.id
WHERE ro.hospital_id = public.get_current_user_hospital_id();

GRANT SELECT ON public.registry_products_operational TO authenticated;
GRANT SELECT ON public.registry_case_consumption_operational TO authenticated;
GRANT SELECT ON public.registry_order_items_operational TO authenticated;

-- =====================================================================================
-- 9. RPC: CONFIRMAR CONSUMO (SECURITY DEFINER, PROTECCIÓN DEMO Y NEGATIVOS)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.confirm_registry_consumption(p_consumption_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_consumption RECORD;
    v_case RECORD;
    v_product_cost NUMERIC(12,2);
    v_stock_on_hand INTEGER;
    v_admin_role BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_consumption FROM public.registry_case_consumption WHERE id = p_consumption_id FOR UPDATE;
    IF v_consumption IS NULL THEN
        RAISE EXCEPTION 'Consumption not found';
    END IF;

    IF v_consumption.status = 'CONFIRMED' THEN
        RETURN json_build_object('success', false, 'message', 'Consumption already confirmed (Idempotency)');
    END IF;

    IF v_consumption.status IN ('CANCELLED', 'ADJUSTED') THEN
        RAISE EXCEPTION 'Cannot confirm cancelled/adjusted consumption';
    END IF;

    -- DEMO & STATUS PROTECTION ON BASE CASE
    SELECT * INTO v_case FROM public.ultreon_registry_cases WHERE id = v_consumption.case_id;
    IF v_case.is_demo = true OR v_case.status <> 'COMPLETED' THEN
        RAISE EXCEPTION 'Solo los casos reales completados pueden generar consumo.';
    END IF;

    -- Ensure case hospital matches consumption hospital
    IF v_case.hospital_id <> v_consumption.hospital_id THEN
        RAISE EXCEPTION 'Data integrity error: Hospital mismatch';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_admin_role;
    IF NOT v_admin_role THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('coordinator', 'hospital_user') AND hospital_id = v_consumption.hospital_id
        ) THEN
            RAISE EXCEPTION 'Unauthorized to confirm this consumption';
        END IF;
    END IF;

    -- Check stock
    SELECT quantity_on_hand INTO v_stock_on_hand FROM public.registry_center_stock
    WHERE hospital_id = v_consumption.hospital_id AND product_id = v_consumption.product_id FOR UPDATE;

    IF v_stock_on_hand IS NULL OR (v_stock_on_hand - v_consumption.quantity) < 0 THEN
        -- NEVER allow negative stock. 
        RETURN json_build_object('success', false, 'message', 'Stock insuficiente. Por favor genere un ADJUSTMENT si hay desfase.');
    END IF;

    SELECT default_unit_cost INTO v_product_cost FROM public.registry_products WHERE id = v_consumption.product_id;

    -- 1. Update stock (no negatives allowed by table constraint now)
    UPDATE public.registry_center_stock 
    SET quantity_on_hand = quantity_on_hand - v_consumption.quantity, updated_by = auth.uid(), updated_at = NOW()
    WHERE hospital_id = v_consumption.hospital_id AND product_id = v_consumption.product_id;

    -- 2. Generate stock movement
    INSERT INTO public.registry_stock_movements (hospital_id, product_id, movement_type, quantity, case_id, notes, created_by)
    VALUES (v_consumption.hospital_id, v_consumption.product_id, 'CONSUMPTION', -v_consumption.quantity, v_consumption.case_id, 'Case consumption confirmation', auth.uid());

    -- 3. Update consumption to confirmed with cost snapshot
    UPDATE public.registry_case_consumption
    SET status = 'CONFIRMED', unit_cost_snapshot = v_product_cost, updated_at = NOW()
    WHERE id = p_consumption_id;

    RETURN json_build_object('success', true, 'message', 'Consumption confirmed successfully');
END;
$$;

-- =====================================================================================
-- 10. RPC: RECIBIR PEDIDO (SECURITY DEFINER, IDEMPOTENCIA)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.receive_registry_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_admin_role BOOLEAN;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_order FROM public.registry_orders WHERE id = p_order_id FOR UPDATE;
    IF v_order IS NULL THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    IF v_order.status = 'RECEIVED' THEN
        RETURN json_build_object('success', false, 'message', 'Order already received (Idempotency)');
    END IF;

    IF v_order.status IN ('CANCELLED', 'DRAFT') THEN
        RAISE EXCEPTION 'Cannot receive draft/cancelled order';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_admin_role;
    IF NOT v_admin_role THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('coordinator', 'hospital_user') AND hospital_id = v_order.hospital_id
        ) THEN
            RAISE EXCEPTION 'Unauthorized to receive this order';
        END IF;
    END IF;

    FOR v_item IN SELECT * FROM public.registry_order_items WHERE order_id = p_order_id LOOP
        INSERT INTO public.registry_center_stock (hospital_id, product_id, quantity_on_hand, updated_by)
        VALUES (v_order.hospital_id, v_item.product_id, v_item.quantity, auth.uid())
        ON CONFLICT (hospital_id, product_id)
        DO UPDATE SET quantity_on_hand = public.registry_center_stock.quantity_on_hand + v_item.quantity, updated_by = auth.uid(), updated_at = NOW();

        INSERT INTO public.registry_stock_movements (hospital_id, product_id, movement_type, quantity, order_id, notes, created_by)
        VALUES (v_order.hospital_id, v_item.product_id, 'RECEIPT', v_item.quantity, p_order_id, 'Order received', auth.uid());
    END LOOP;

    UPDATE public.registry_orders SET status = 'RECEIVED', received_date = CURRENT_DATE, updated_at = NOW() WHERE id = p_order_id;

    RETURN json_build_object('success', true, 'message', 'Order received and stock updated');
END;
$$;

-- =====================================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES EN TABLAS BASE
-- =====================================================================================
ALTER TABLE public.registry_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_case_consumption ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_center_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registry_order_items ENABLE ROW LEVEL SECURITY;

-- ADMIN: CRUD COMPLETO EN TABLAS BASE
CREATE POLICY "Admins full access products" ON public.registry_products FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access consumption" ON public.registry_case_consumption FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Admins full access order_items" ON public.registry_order_items FOR ALL TO authenticated USING (public.is_admin());

-- HOSPITAL USER: INSERTS PERMITIDOS PARA REGISTRAR CONSUMOS Y PEDIDOS
CREATE POLICY "Hospital users insert pending consumption" ON public.registry_case_consumption FOR INSERT TO authenticated 
WITH CHECK (hospital_id = public.get_current_user_hospital_id() AND status = 'PENDING');

-- OTROS (Stock, Movimientos, Ordenes no tienen coste, pueden usar RLS estándar)
CREATE POLICY "Admins manage center stock" ON public.registry_center_stock FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Hospital view center stock" ON public.registry_center_stock FOR SELECT TO authenticated USING (hospital_id = public.get_current_user_hospital_id());

CREATE POLICY "Admins manage stock movements" ON public.registry_stock_movements FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Hospital view stock movements" ON public.registry_stock_movements FOR SELECT TO authenticated USING (hospital_id = public.get_current_user_hospital_id());

CREATE POLICY "Admins manage orders" ON public.registry_orders FOR ALL TO authenticated USING (public.is_admin());
CREATE POLICY "Hospital view orders" ON public.registry_orders FOR SELECT TO authenticated USING (hospital_id = public.get_current_user_hospital_id());
CREATE POLICY "Hospital insert orders" ON public.registry_orders FOR INSERT TO authenticated WITH CHECK (hospital_id = public.get_current_user_hospital_id());

NOTIFY pgrst, 'reload schema';
