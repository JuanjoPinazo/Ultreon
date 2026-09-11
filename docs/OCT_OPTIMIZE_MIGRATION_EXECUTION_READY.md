# Migración Ejecutable: OCT-Optimize ULTREON 3.0

**Documento:** `OCT_OPTIMIZE_MIGRATION_EXECUTION_READY.md`
**Status:** Complete

Este documento contiene la versión final y lista para ejecución de la migración de base de datos para la generación atómica de códigos y campos optimizados.

Se han incorporado las siguientes correcciones sobre la v2:
1. Consultas preflight para garantizar integridad previa.
2. Inicialización de contadores con el histórico de registros.
3. Ciclo `WHILE` para evitar que colisiones bloqueen el contador.
4. Políticas RLS idempotentes (`DROP POLICY IF EXISTS`).
5. Validación estricta de estado de hospital (`IS TRUE`).
6. Sanitización de errores de cara al cliente (ocultando `SQLERRM`).
7. Confirmación del índice único ligada a la superación del preflight.
8. Mantenimiento íntegro de la seguridad y autorización.

---

## 1. SQL Preflight

**Instrucción:** Ejecutar estas consultas *antes* de la migración. Todas deben retornar **0 filas**. Si alguna retorna datos, deben corregirse en la base de datos antes de proceder, o la creación del índice único fallará.

```sql
-- ============================================================
-- SCRIPT PREFLIGHT: VALIDACIÓN ANTES DE MIGRAR
-- ============================================================

-- 1. Detectar anonymous_code duplicados por hospital
SELECT hospital_id, anonymous_code, COUNT(*) as total_duplicados
FROM public.ecrf_opstar_records 
WHERE anonymous_code IS NOT NULL
GROUP BY hospital_id, anonymous_code 
HAVING COUNT(*) > 1;

-- 2. Detectar códigos con formato inválido (Formato esperado: PREFIX-NNNN)
SELECT id, hospital_id, anonymous_code 
FROM public.ecrf_opstar_records 
WHERE anonymous_code IS NOT NULL 
  AND anonymous_code !~ '^[A-Z0-9]+-[0-9]{4}$';

-- 3. Detectar hospitales sin short_name o inactivos
SELECT id, name, short_name, is_active 
FROM public.hospitals 
WHERE short_name IS NULL 
   OR TRIM(short_name) = ''
   OR is_active IS NOT TRUE;
```

---

## 2. Migración Final

**Instrucción:** Ejecutar este script *únicamente* después de superar el preflight.

```sql
-- ============================================================
-- OCT-Optimize: Migración Ejecutable Final
-- ============================================================

-- 1. Agregar columnas nuevas de forma no destructiva
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- 2. Crear tabla de contadores por hospital
CREATE TABLE IF NOT EXISTS public.hospital_case_counters (
  hospital_id uuid PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
  last_value integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Inicializar contadores con el mayor número histórico existente
-- (Previene que una colisión histórica o registros previos reinicien el conteo)
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT 
    h.id, 
    COALESCE(
        (SELECT MAX(NULLIF(regexp_replace(e.anonymous_code, '^.*-', ''), '')::integer) 
         FROM public.ecrf_opstar_records e 
         WHERE e.hospital_id = h.id 
           AND e.anonymous_code ~ '^[A-Z0-9]+-[0-9]{4}$'), 
        0
    ), 
    now(), 
    now()
FROM public.hospitals h
ON CONFLICT (hospital_id) DO UPDATE 
SET last_value = EXCLUDED.last_value,
    updated_at = EXCLUDED.updated_at
WHERE EXCLUDED.last_value > public.hospital_case_counters.last_value;

-- 4. Habilitar RLS en tabla de contadores
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- 5. Crear política RLS de forma idempotente
DROP POLICY IF EXISTS hospital_case_counters_security_definer ON public.hospital_case_counters;
CREATE POLICY hospital_case_counters_security_definer ON public.hospital_case_counters
  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- 6. Crear índice único (Solo debe ejecutarse si el preflight de duplicados pasó correctamente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- ============================================================
-- FUNCIÓN SEGURA: create_draft_case_secure
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_draft_case_secure(p_hospital_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_user_id uuid;
  v_user_role text;
  v_user_hospital_id uuid;
  v_short_name text;
  v_short_name_normalized text;
  v_hospital_is_active boolean;
  v_next_num integer;
  v_new_code text;
  v_collision_check integer;
  v_case_id uuid;
  v_now timestamptz;
BEGIN
  -- ========== PASO 1: AUTENTICACIÓN ==========
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado: Usuario no identificado.';
  END IF;

  -- ========== PASO 2: OBTENER PERFIL ==========
  SELECT p.role, p.hospital_id INTO v_user_role, v_user_hospital_id
  FROM public.profiles p
  WHERE p.id = v_current_user_id AND p.is_active = true;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Perfil no encontrado o inactivo.';
  END IF;

  -- ========== PASO 3: AUTORIZACIÓN POR ROL ==========
  CASE v_user_role
    WHEN 'admin' THEN 
      NULL; -- Admin permitido
    WHEN 'hospital_user' THEN
      IF v_user_hospital_id IS NULL OR v_user_hospital_id != p_hospital_id THEN
        RAISE EXCEPTION 'Permiso denegado: El usuario no pertenece a este hospital.';
      END IF;
    WHEN 'monitor' THEN 
      NULL; -- Monitor permitido
    WHEN 'viewer' THEN
      RAISE EXCEPTION 'Permiso denegado: Rol no autorizado para crear casos.';
    ELSE
      RAISE EXCEPTION 'Rol desconocido o no autorizado.';
  END CASE;

  -- ========== PASO 4: VALIDACIÓN DEL HOSPITAL ==========
  SELECT h.short_name, h.is_active INTO v_short_name, v_hospital_is_active
  FROM public.hospitals h
  WHERE h.id = p_hospital_id;

  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'Hospital no encontrado.';
  END IF;

  -- Exigir estrictamente que is_active sea TRUE
  IF v_hospital_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Hospital inactivo.';
  END IF;

  -- ========== PASO 5: NORMALIZAR short_name ==========
  v_short_name_normalized := UPPER(TRIM(v_short_name));
  IF NOT v_short_name_normalized ~ '^[A-Z0-9]+$' OR LENGTH(v_short_name_normalized) > 10 THEN
    RAISE EXCEPTION 'Prefijo de hospital contiene caracteres inválidos o es demasiado largo.';
  END IF;

  -- ========== PASO 6: GENERAR CÓDIGO ATÓMICAMENTE ==========
  INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
  VALUES (p_hospital_id, 1, now(), now())
  ON CONFLICT (hospital_id) DO UPDATE 
  SET last_value = hospital_case_counters.last_value + 1,
      updated_at = now()
  RETURNING last_value INTO v_next_num;

  IF v_next_num IS NULL OR v_next_num <= 0 THEN
    RAISE EXCEPTION 'Fallo al generar contador del hospital.';
  END IF;

  v_new_code := v_short_name_normalized || '-' || LPAD(v_next_num::text, 4, '0');

  -- ========== PASO 7: PREVENIR BLOQUEO POR COLISIÓN ==========
  -- Double-check robusto: si existe, incrementar hasta encontrar uno libre
  SELECT COUNT(*) INTO v_collision_check
  FROM public.ecrf_opstar_records
  WHERE hospital_id = p_hospital_id AND anonymous_code = v_new_code;

  WHILE v_collision_check > 0 LOOP
     UPDATE public.hospital_case_counters
     SET last_value = last_value + 1, updated_at = now()
     WHERE hospital_id = p_hospital_id
     RETURNING last_value INTO v_next_num;
     
     v_new_code := v_short_name_normalized || '-' || LPAD(v_next_num::text, 4, '0');
     
     SELECT COUNT(*) INTO v_collision_check
     FROM public.ecrf_opstar_records
     WHERE hospital_id = p_hospital_id AND anonymous_code = v_new_code;
  END LOOP;

  -- ========== PASO 8: CREAR REGISTRO ==========
  v_now := now();
  INSERT INTO public.ecrf_opstar_records (
    hospital_id, created_by, created_at, updated_at, anonymous_code, case_status
  )
  VALUES (
    p_hospital_id, v_current_user_id, v_now, v_now, v_new_code, 'draft'
  )
  RETURNING id INTO v_case_id;

  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'Fallo insertando registro de caso.';
  END IF;

  -- ========== PASO 9: RETORNO SATISFACTORIO ==========
  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id,
    'anonymous_code', v_new_code,
    'status', 'draft',
    'created_at', v_now,
    'hospital_id', p_hospital_id
  );

EXCEPTION WHEN OTHERS THEN
  -- SANITIZACIÓN DE ERRORES:
  -- Loguear internamente el SQLERRM
  RAISE NOTICE 'create_draft_case_secure error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  
  -- Retornar error genérico al cliente
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Ocurrió un error interno al intentar crear el caso.',
    'error_code', 'INTERNAL_ERROR'
  );
END;
$$;

-- ========== PERMISOS DE EJECUCIÓN ==========
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) TO authenticated;
```

---

## 3. Plan de Rollback

**Instrucción:** Si la migración falla parcialmente o genera inestabilidad, ejecutar este script para revertir los cambios de esquema. No elimina registros de la tabla principal.

```sql
-- ============================================================
-- SCRIPT ROLLBACK: REVERTIR MIGRACIÓN
-- ============================================================

-- 1. Eliminar función y permisos
DROP FUNCTION IF EXISTS public.create_draft_case_secure(uuid);

-- 2. Eliminar índice único
DROP INDEX IF EXISTS public.idx_hospital_anonymous_code;

-- 3. Eliminar política y tabla de contadores
DROP POLICY IF EXISTS hospital_case_counters_security_definer ON public.hospital_case_counters;
ALTER TABLE public.hospital_case_counters DISABLE ROW LEVEL SECURITY;
DROP TABLE IF EXISTS public.hospital_case_counters;

-- 4. Eliminar columnas añadidas en ecrf_opstar_records
ALTER TABLE public.ecrf_opstar_records
  DROP COLUMN IF EXISTS age,
  DROP COLUMN IF EXISTS sex,
  DROP COLUMN IF EXISTS flush_technique,
  DROP COLUMN IF EXISTS flush_technique_other,
  DROP COLUMN IF EXISTS ultreon_coregistration_ok,
  DROP COLUMN IF EXISTS ultreon_optimization_ok;
```

---

## 4. Orden exacto de ejecución en Supabase dev

1. **Ejecutar Preflight:** Abre el SQL Editor en Supabase (entorno de desarrollo) y ejecuta el Script Preflight completo.
2. **Revisar Preflight:** Asegúrate de que las tres sentencias del preflight retornen exactamente 0 registros.
   - Si existen **duplicados**, unificarlos o asignar nuevos códigos temporales a los registros erróneos para que se libere la restricción del índice único que se intentará crear.
   - Si hay **códigos con formato inválido**, actualizar dichos registros manualmente.
   - Si hay **hospitales inactivos o sin short_name**, actualizar la tabla `hospitals`.
3. **Ejecutar Migración Final:** Una vez el preflight retorne 0 en todas las consultas, pega y ejecuta el Script de Migración Final. 
   - La tabla de contadores será llenada considerando el histórico mayor (gracias a la inicialización dinámica).
   - El índice único se creará exitosamente, pues ya nos hemos cerciorado de no tener duplicados.
4. **Verificación:** Procede a realizar una llamada E2E desde el UI (o vía Postman/Supabase RPC) usando un rol autenticado para verificar que se retorna una respuesta `success = true` y que el código anonimizado del caso se incrementó de forma correcta y transparente.
5. **Estado Final:** Considerar la migración como _complete_ tras su verificación.
