-- 1. ADD CLINICAL_ADMIN TO ENUM
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'clinical_admin';

-- 2. VERIFY/RE-CREATE GET_CURRENT_USER_ROLE
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
DECLARE
  current_role public.user_role;
BEGIN
  SELECT role::public.user_role INTO current_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CREATE IS_CLINICAL_ADMIN HELPER
CREATE OR REPLACE FUNCTION public.is_clinical_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_current_user_role() = 'clinical_admin'::public.user_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. FIX FK CONSTRAINT FOR OPERATOR CLINICAL PROFILES (BUG: FK was pointing to profiles instead of operators)
ALTER TABLE public.operator_clinical_profiles 
  DROP CONSTRAINT IF EXISTS operator_clinical_profiles_operator_id_fkey,
  ADD CONSTRAINT operator_clinical_profiles_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE CASCADE;

ALTER TABLE public.operator_clinical_profile_history 
  DROP CONSTRAINT IF EXISTS operator_clinical_profile_history_operator_id_fkey,
  ADD CONSTRAINT operator_clinical_profile_history_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE CASCADE;

-- 5. FIX RLS FOR OPERATOR PROFILES (operator_id is NOT auth.uid(), it's operators.id!)
DROP POLICY IF EXISTS "Operators can read their own profile" ON public.operator_clinical_profiles;
DROP POLICY IF EXISTS "Operators can update their own profile" ON public.operator_clinical_profiles;
DROP POLICY IF EXISTS "Operators can insert their own profile" ON public.operator_clinical_profiles;
DROP POLICY IF EXISTS "Admins and Monitors can read all profiles" ON public.operator_clinical_profiles;

CREATE POLICY clinical_all_profiles_select ON public.operator_clinical_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY clinical_all_profiles_all ON public.operator_clinical_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Operators can read their own profile history" ON public.operator_clinical_profile_history;
DROP POLICY IF EXISTS "Operators can insert their own profile history" ON public.operator_clinical_profile_history;
DROP POLICY IF EXISTS "Admins and Monitors can read all profile history" ON public.operator_clinical_profile_history;

CREATE POLICY clinical_all_history_select ON public.operator_clinical_profile_history FOR SELECT TO authenticated USING (true);
CREATE POLICY clinical_all_history_all ON public.operator_clinical_profile_history FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. ADD RLS POLICIES FOR CLINICAL_ADMIN
CREATE POLICY clinical_admin_all_profiles ON public.profiles FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_hospitals ON public.hospitals FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_investigators ON public.opstar_investigators FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_operators ON public.operators FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_hospital_operators ON public.hospital_operators FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_registry_cases ON public.ultreon_registry_cases FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_ecrf_records ON public.ecrf_opstar_records FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_center_targets ON public.registry_center_targets FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_operator_targets ON public.registry_operator_targets FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_case_consumption ON public.registry_case_consumption FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_center_stock ON public.registry_center_stock FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_stock_movements ON public.registry_stock_movements FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_orders ON public.registry_orders FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_order_items ON public.registry_order_items FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_study_governance ON public.opstar_study_governance FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
CREATE POLICY clinical_admin_all_registry_settings ON public.registry_settings FOR ALL TO authenticated USING (public.is_clinical_admin()) WITH CHECK (public.is_clinical_admin());
