-- 0004_helper_functions.sql
-- Funciones helper para RLS y validación

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
DECLARE
  current_role user_role;
BEGIN
  SELECT role INTO current_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener el hospital (o hospitales) del usuario actual
-- Retorna un array de UUIDs de hospitales a los que el usuario tiene acceso
CREATE OR REPLACE FUNCTION public.get_current_user_hospital_ids()
RETURNS UUID[] AS $$
DECLARE
  hospital_ids UUID[];
BEGIN
  -- Un usuario normal está asignado como investigador a un hospital (o varios)
  SELECT array_agg(hospital_id) INTO hospital_ids
  FROM public.opstar_investigators
  WHERE profile_id = auth.uid() AND status = 'active';
  
  RETURN COALESCE(hospital_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprobar si es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_current_user_role() = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprobar si es monitor
CREATE OR REPLACE FUNCTION public.is_monitor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_current_user_role() = 'monitor');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprobar acceso a un caso específico
CREATE OR REPLACE FUNCTION public.can_access_case(case_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  case_hospital_id UUID;
BEGIN
  -- Si es admin o monitor, siempre puede ver
  IF public.is_admin() OR public.is_monitor() THEN
    RETURN true;
  END IF;

  -- Para usuarios de hospital, deben pertenecer al mismo hospital del caso
  SELECT hospital_id INTO case_hospital_id FROM public.ecrf_opstar_records WHERE id = case_uuid;
  
  RETURN case_hospital_id = ANY(public.get_current_user_hospital_ids());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comprobar si puede editar un caso específico
CREATE OR REPLACE FUNCTION public.can_edit_case(case_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  case_record public.ecrf_opstar_records;
BEGIN
  -- Admin siempre puede editar
  IF public.is_admin() THEN
    RETURN true;
  END IF;

  SELECT * INTO case_record FROM public.ecrf_opstar_records WHERE id = case_uuid;
  
  -- Si no existe, no puede editar
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Si está bloqueado, nadie (excepto admin que ya retornó true) puede editar
  IF case_record.case_status = 'locked' THEN
    RETURN false;
  END IF;

  -- Debe ser del mismo hospital para poder editar
  RETURN case_record.hospital_id = ANY(public.get_current_user_hospital_ids());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para bloquear edición si status = locked
CREATE OR REPLACE FUNCTION public.check_locked_case()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.case_status = 'locked' AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Cannot modify a locked case.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_case_lock
BEFORE UPDATE OR DELETE ON public.ecrf_opstar_records
FOR EACH ROW EXECUTE PROCEDURE check_locked_case();
