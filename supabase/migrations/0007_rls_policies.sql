-- 0007_rls_policies.sql
-- Row Level Security Policies

-- Habilitar RLS en todas las tablas
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opstar_investigators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecrf_opstar_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opstar_oct_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opstar_study_governance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opstar_center_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opstar_center_business_metrics ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS PARA HOSPITALS
-- ==========================================
CREATE POLICY "Admins pueden ver y editar todos los hospitales"
  ON public.hospitals
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Usuarios pueden ver todos los hospitales (read-only general)"
  ON public.hospitals
  FOR SELECT
  USING (true);

-- ==========================================
-- POLÍTICAS PARA PROFILES
-- ==========================================
CREATE POLICY "Admins pueden ver y editar todos los perfiles"
  ON public.profiles
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Usuarios pueden editar su propio perfil"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- ==========================================
-- POLÍTICAS PARA ECRF_OPSTAR_RECORDS
-- ==========================================
CREATE POLICY "Admins y monitors ven todos los casos"
  ON public.ecrf_opstar_records
  FOR SELECT
  USING (public.is_admin() OR public.is_monitor());

CREATE POLICY "Admins pueden editar todos los casos"
  ON public.ecrf_opstar_records
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Usuarios de hospital ven casos de su hospital"
  ON public.ecrf_opstar_records
  FOR SELECT
  USING (hospital_id = ANY(public.get_current_user_hospital_ids()));

CREATE POLICY "Usuarios de hospital pueden crear casos en su hospital"
  ON public.ecrf_opstar_records
  FOR INSERT
  WITH CHECK (hospital_id = ANY(public.get_current_user_hospital_ids()));

CREATE POLICY "Usuarios de hospital pueden editar casos no bloqueados de su hospital"
  ON public.ecrf_opstar_records
  FOR UPDATE
  USING (hospital_id = ANY(public.get_current_user_hospital_ids()) AND case_status != 'locked');

-- ==========================================
-- POLÍTICAS PARA OPSTAR_OCT_EVIDENCE
-- ==========================================
CREATE POLICY "Admins y monitors ven toda la evidencia"
  ON public.opstar_oct_evidence
  FOR SELECT
  USING (public.is_admin() OR public.is_monitor());

CREATE POLICY "Admins pueden editar toda la evidencia"
  ON public.opstar_oct_evidence
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Usuarios ven evidencia de sus casos"
  ON public.opstar_oct_evidence
  FOR SELECT
  USING (public.can_access_case(case_id));

CREATE POLICY "Usuarios pueden subir evidencia a sus casos"
  ON public.opstar_oct_evidence
  FOR INSERT
  WITH CHECK (public.can_edit_case(case_id));

CREATE POLICY "Usuarios pueden eliminar evidencia de sus casos no bloqueados"
  ON public.opstar_oct_evidence
  FOR DELETE
  USING (public.can_edit_case(case_id));

-- ==========================================
-- POLÍTICAS PARA BUSINESS METRICS (BI)
-- ==========================================
-- Solo Admin puede ver métricas económicas por requisito
CREATE POLICY "Solo admins ven métricas económicas"
  ON public.opstar_center_business_metrics
  FOR ALL
  USING (public.is_admin());

-- ==========================================
-- POLÍTICAS PARA GOVERNANCE & OBJECTIVES
-- ==========================================
CREATE POLICY "Todos pueden ver gobernanza"
  ON public.opstar_study_governance
  FOR SELECT
  USING (true);

CREATE POLICY "Solo admins gestionan gobernanza"
  ON public.opstar_study_governance
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Admins ven todos los objetivos"
  ON public.opstar_center_objectives
  FOR ALL
  USING (public.is_admin());

CREATE POLICY "Hospitales ven sus propios objetivos"
  ON public.opstar_center_objectives
  FOR SELECT
  USING (hospital_id = ANY(public.get_current_user_hospital_ids()));
