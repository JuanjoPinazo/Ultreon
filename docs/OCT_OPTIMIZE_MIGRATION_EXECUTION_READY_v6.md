# Ejecución Segura de Migración: OCT-Optimize ULTREON 3.0 (v6)
**Documentación de Producción - Versión Ejecutable Final**

**Fecha:** 17-julio-2026  
**Entorno:** Sprint 1 - Development / Staging / Production  
**Revisor:** Arquitecto Senior  
**Status:** ✅ LISTO PARA EJECUCIÓN  
**Compatibilidad:** PostgreSQL 14+ / Supabase

---

## TABLA DE CONTENIDOS

1. [Pre-Vuelo (Preflight Checks Obligatorios)](#1-pre-vuelo-preflight-checks-obligatorios)
2. [Plan de Ejecución](#2-plan-de-ejecución)
3. [Código de Migración Ejecutable](#3-código-de-migración-ejecutable)
4. [Inicialización de Contadores Históricos](#4-inicialización-de-contadores-históricos)
5. [Manejo de Errores (Error Codes)](#5-manejo-de-errores-error-codes)
6. [Plan de Rollback Condicional](#6-plan-de-rollback-condicional)
7. [Testing Post-Ejecución](#7-testing-post-ejecución)
8. [Checklist de Ejecución](#8-checklist-de-ejecución)

---

## 1. PRE-VUELO (PREFLIGHT CHECKS OBLIGATORIOS)

### 1.1 Preflight de Hospitales Activos - Verificar short_name Válido

**Ejecutar ANTES de la migración:**

```sql
-- Preflight 1: Revisar EXCLUSIVAMENTE hospitales activos (IS TRUE)
-- Devolver SOLO hospitales activos con short_name problemático
-- Resultado esperado: 0 filas
SELECT 
  h.id,
  h.name,
  h.short_name
FROM public.hospitals h
WHERE h.is_active IS TRUE
  AND (
    h.short_name IS NULL
    OR TRIM(h.short_name) = ''
    OR NOT (UPPER(TRIM(h.short_name)) ~ '^[A-Z0-9]+$')
    OR LENGTH(UPPER(TRIM(h.short_name))) > 10
  );

-- ⚠️ DECISIÓN:
-- - Si hay filas → BLOQUEAR migración (corregir short_name antes)
-- - Si no hay filas (0 resultados) → OK, proceder con migración
```

### 1.2 Preflight de Índice - Usar pg_indexes

**Ejecutar ANTES de la migración:**

```sql
-- Preflight 2: Verificar si índice ya existe (usar pg_indexes)
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ecrf_opstar_records' 
  AND indexname = 'idx_hospital_anonymous_code';

-- Resultado esperado (primera ejecución): 0 filas
-- Resultado esperado (segunda ejecución): 1 fila (OK, idempotente)
```

### 1.3 PREFLIGHT OBLIGATORIO: Detectar Duplicados de anonymous_code

**⚠️ CRÍTICO: Ejecutar ANTES de crear el índice único**

```sql
-- Preflight 3: Detectar duplicados de anonymous_code (BLOQUEANTE)
SELECT 
  hospital_id,
  anonymous_code,
  COUNT(*) AS duplicate_count,
  ARRAY_AGG(id) AS case_ids
FROM public.ecrf_opstar_records
WHERE anonymous_code IS NOT NULL
GROUP BY hospital_id, anonymous_code
HAVING COUNT(*) > 1;

-- ⚠️ RESULTADO:
-- - Si hay filas → BLOQUEAR migración
--   Acción: Resolver duplicados antes de continuar
-- - Si no hay filas (0 resultados) → OK, crear índice único
```

### 1.4 Preflight de Tabla `hospital_case_counters` - Idempotente

```sql
-- Preflight 4: Tabla de contadores puede ya existir (segunda ejecución)
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hospital_case_counters'
) AS counters_table_exists;

-- Resultado esperado (primera ejecución): false
-- Resultado esperado (segunda ejecución): true (OK)
```

### 1.5 Preflight de Función - Idempotente

```sql
-- Preflight 5: Función puede ya existir (segunda ejecución)
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'create_draft_case_secure' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
) AS function_exists;

-- Resultado esperado (primera ejecución): false
-- Resultado esperado (segunda ejecución): true (OK)
```

### 1.6 Detectar Máximo de `anonymous_code` Histórico

```sql
-- Preflight 6: Obtener máximo número histórico por hospital
SELECT 
  hospital_id,
  COALESCE(
    MAX(CAST(SUBSTRING(anonymous_code, POSITION('-' IN anonymous_code) + 1) AS integer)),
    0
  ) AS max_historical_num,
  COUNT(*) AS total_cases
FROM public.ecrf_opstar_records
WHERE anonymous_code IS NOT NULL
  AND anonymous_code ~ '^[A-Z0-9]+-[0-9]{4}$'
GROUP BY hospital_id
ORDER BY hospital_id;

-- Resultado: tabla de máximos históricos por hospital
```

### 1.7 Verificar Permisos de Ejecución

```sql
-- Preflight 7: Confirmar permisos suficientes
SELECT 
  current_user,
  has_schema_privilege(current_user, 'public', 'CREATE') AS can_create,
  has_schema_privilege(current_user, 'public', 'USAGE') AS can_use;

-- Esperado: (postgres | owner_user, true, true)
```

---

## 2. PLAN DE EJECUCIÓN

### Fase 1: Crear Nuevas Columnas (No Destructivo)
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`

### Fase 2: Crear Tabla de Contadores + Inicializar
- `CREATE TABLE IF NOT EXISTS hospital_case_counters`
- Inicializar con máximo histórico

### Fase 3: Crear Índice Único (SOLO si Preflight 3 pasó)
- `CREATE UNIQUE INDEX IF NOT EXISTS`

### Fase 4: Crear Función Segura
- `CREATE OR REPLACE FUNCTION create_draft_case_secure()`

### Fase 5: Asignar Permisos
- REVOKE EXECUTE, GRANT EXECUTE

### Fase 6: Verificar Integridad

---

## 3. CÓDIGO DE MIGRACIÓN EJECUTABLE

```sql
-- ============================================================
-- OCT-Optimize: Migración de Sprint 1 - IDEMPOTENTE Y SEGURA
-- Archivo: supabase/migrations/20260716_oct_optimize_fields.sql
-- Compatibilidad: PostgreSQL 14+ / Supabase
-- ============================================================

-- FASE 1: Agregar columnas nuevas (no destructivo, idempotente)
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- FASE 2A: Crear tabla de contadores si no existe
CREATE TABLE IF NOT EXISTS public.hospital_case_counters (
  hospital_id uuid PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
  last_value integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- FASE 2B: Inicializar contadores con máximo histórico (prevenir colisiones)
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT 
  eor.hospital_id,
  COALESCE(
    MAX(CAST(SUBSTRING(eor.anonymous_code, POSITION('-' IN eor.anonymous_code) + 1) AS integer)),
    0
  ) AS max_num,
  now(),
  now()
FROM public.ecrf_opstar_records eor
WHERE eor.anonymous_code IS NOT NULL
  AND eor.anonymous_code ~ '^[A-Z0-9]+-[0-9]{4}$'
GROUP BY eor.hospital_id
ON CONFLICT (hospital_id) DO UPDATE 
SET last_value = GREATEST(hospital_case_counters.last_value, EXCLUDED.last_value),
    updated_at = now();

-- Asegurar que todos los hospitales activos tienen entrada
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT h.id, 0, now(), now()
FROM public.hospitals h
WHERE h.is_active IS TRUE
ON CONFLICT (hospital_id) DO NOTHING;

-- FASE 3: Habilitar RLS en tabla de contadores
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- FASE 3B: Crear/Recrear política RLS (DROP + CREATE)
DROP POLICY IF EXISTS hospital_case_counters_security_definer 
  ON public.hospital_case_counters;

CREATE POLICY hospital_case_counters_security_definer 
  ON public.hospital_case_counters
  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- FASE 4: Crear índice único SOLO si no existen duplicados
-- Preflight 3 debe confirmar: sin duplicados de (hospital_id, anonymous_code)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- ============================================================
-- FUNCIÓN SEGURA: Crear caso en draft (atomicidad garantizada)
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
    RAISE EXCEPTION 'UNAUTHORIZED:No autenticado: auth.uid() no disponible';
  END IF;

  -- ========== PASO 2: OBTENER PERFIL DEL USUARIO ==========
  SELECT p.role, p.hospital_id
  INTO v_user_role, v_user_hospital_id
  FROM public.profiles p
  WHERE p.id = v_current_user_id AND p.is_active = true;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED:Usuario inactivo o perfil no encontrado';
  END IF;

  -- ========== PASO 3: AUTORIZACIÓN EXPLÍCITA POR ROL ==========
  CASE v_user_role
    WHEN 'admin' THEN
      NULL;
    
    WHEN 'hospital_user' THEN
      IF v_user_hospital_id IS NULL THEN
        RAISE EXCEPTION 'FORBIDDEN:Hospital user sin hospital asignado';
      END IF;
      
      IF v_user_hospital_id != p_hospital_id THEN
        RAISE EXCEPTION 'FORBIDDEN:Usuario del hospital % intentó crear en hospital %',
          v_user_hospital_id, p_hospital_id;
      END IF;
    
    WHEN 'monitor' THEN
      RAISE EXCEPTION 'FORBIDDEN:Rol monitor no está autorizado para crear casos en esta versión';
    
    WHEN 'viewer' THEN
      RAISE EXCEPTION 'FORBIDDEN:Rol viewer no puede crear casos';
    
    ELSE
      RAISE EXCEPTION 'FORBIDDEN:Rol desconocido o no autorizado: %', v_user_role;
  END CASE;

  -- ========== PASO 4: VALIDACIÓN DEL HOSPITAL ==========
  SELECT h.short_name, h.is_active
  INTO v_short_name, v_hospital_is_active
  FROM public.hospitals h
  WHERE h.id = p_hospital_id;

  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Hospital no encontrado';
  END IF;

  IF v_hospital_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Hospital inactivo o no válido';
  END IF;

  -- ========== PASO 5: NORMALIZAR Y VALIDAR short_name ==========
  v_short_name_normalized := UPPER(TRIM(v_short_name));
  
  IF NOT v_short_name_normalized ~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Prefijo de hospital contiene caracteres inválidos';
  END IF;

  IF LENGTH(v_short_name_normalized) = 0 OR LENGTH(v_short_name_normalized) > 10 THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Prefijo de hospital tiene longitud inválida';
  END IF;

  -- ========== PASO 6: GENERAR CÓDIGO ATÓMICAMENTE ==========
  INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
  VALUES (p_hospital_id, 1, now(), now())
  ON CONFLICT (hospital_id) DO UPDATE 
  SET 
    last_value = hospital_case_counters.last_value + 1,
    updated_at = now()
  RETURNING last_value INTO v_next_num;

  IF v_next_num IS NULL OR v_next_num <= 0 THEN
    RAISE EXCEPTION 'INTERNAL_ERROR:Fallo al incrementar contador';
  END IF;

  v_new_code := v_short_name_normalized || '-' || LPAD(v_next_num::text, 4, '0');

  -- ========== PASO 7: PROTECCIÓN FRENTE A COLISIONES HISTÓRICAS ==========
  SELECT COUNT(*) INTO v_collision_check
  FROM public.ecrf_opstar_records
  WHERE hospital_id = p_hospital_id AND anonymous_code = v_new_code;

  IF v_collision_check > 0 THEN
    RAISE EXCEPTION 'INTERNAL_ERROR:Código pseudo-anonimizado ya existe (colisión detectada)';
  END IF;

  -- ========== PASO 8: CREAR REGISTRO EN ESTADO DRAFT ==========
  v_now := now();

  INSERT INTO public.ecrf_opstar_records (
    hospital_id, 
    created_by,
    created_at,
    updated_at,
    anonymous_code, 
    case_status
  )
  VALUES (
    p_hospital_id, 
    v_current_user_id,
    v_now,
    v_now,
    v_new_code, 
    'draft'
  )
  RETURNING id INTO v_case_id;

  IF v_case_id IS NULL THEN
    RAISE EXCEPTION 'INTERNAL_ERROR:Fallo al crear registro de caso';
  END IF;

  -- ========== PASO 9: RETORNAR RESULTADO (jsonb) ==========
  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id,
    'anonymous_code', v_new_code,
    'status', 'draft',
    'created_at', v_now,
    'hospital_id', p_hospital_id
  );

EXCEPTION WHEN OTHERS THEN
  DECLARE
    v_error_msg text := SQLERRM;
    v_error_code text;
  BEGIN
    IF v_error_msg LIKE 'UNAUTHORIZED:%' THEN
      v_error_code := 'UNAUTHORIZED';
    ELSIF v_error_msg LIKE 'FORBIDDEN:%' THEN
      v_error_code := 'FORBIDDEN';
    ELSIF v_error_msg LIKE 'INVALID_HOSPITAL:%' THEN
      v_error_code := 'INVALID_HOSPITAL';
    ELSE
      v_error_code := 'INTERNAL_ERROR';
    END IF;
    
    RAISE NOTICE 'create_draft_case_secure error [%]: %', v_error_code, v_error_msg;
    
    RETURN jsonb_build_object(
      'success', false,
      'error_code', v_error_code,
      'error', CASE 
        WHEN v_error_code = 'UNAUTHORIZED' THEN 'Usuario no autenticado o sesión expirada'
        WHEN v_error_code = 'FORBIDDEN' THEN 'No tiene permiso para crear casos en este hospital'
        WHEN v_error_code = 'INVALID_HOSPITAL' THEN 'Hospital inválido, inactivo o no configurado'
        ELSE 'Error interno al crear el caso. Contacte al administrador.'
      END
    );
  END;
END;
$$;

-- ========== FASE 5: ASIGNAR PERMISOS ==========
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) TO authenticated;

-- ========== FASE 6: DOCUMENTACIÓN ==========
COMMENT ON FUNCTION public.create_draft_case_secure(uuid) IS
'Crea un registro de caso borrador (draft) de forma atómica y segura.

AUTORIZACIÓN (por rol):
- admin: puede crear en cualquier hospital activo
- hospital_user: solo en su hospital asignado
- monitor: BLOQUEADO
- viewer: BLOQUEADO

GARANTÍAS:
- Autenticación obligatoria (auth.uid())
- Validación explícita: IS NOT TRUE
- Generación atómica (INSERT ON CONFLICT)
- Protección frente a colisiones
- Estado draft inicial

RETORNA (jsonb):
{
  "success": true/false,
  "case_id": "uuid",
  "anonymous_code": "HSJ-0001",
  "status": "draft",
  "created_at": "...",
  "hospital_id": "uuid",
  "error_code": "...",
  "error": "..."
}
';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
```

---

## 4. INICIALIZACIÓN DE CONTADORES HISTÓRICOS

```sql
-- Inicializar contadores con máximo histórico
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT 
  eor.hospital_id,
  COALESCE(
    MAX(CAST(SUBSTRING(eor.anonymous_code, POSITION('-' IN eor.anonymous_code) + 1) AS integer)),
    0
  ) AS max_num,
  now(),
  now()
FROM public.ecrf_opstar_records eor
WHERE eor.anonymous_code IS NOT NULL
  AND eor.anonymous_code ~ '^[A-Z0-9]+-[0-9]{4}$'
GROUP BY eor.hospital_id
ON CONFLICT (hospital_id) DO UPDATE 
SET last_value = GREATEST(hospital_case_counters.last_value, EXCLUDED.last_value);

-- Asegurar todos los hospitales activos tienen entrada
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT h.id, 0, now(), now()
FROM public.hospitals h
WHERE h.is_active IS TRUE
ON CONFLICT (hospital_id) DO NOTHING;
```

---

## 5. MANEJO DE ERRORES (ERROR CODES)

| Code | Situación | Cliente Recibe |
|------|-----------|---|
| `UNAUTHORIZED` | auth.uid() NULL | "Usuario no autenticado o sesión expirada" |
| `FORBIDDEN` | Rol sin permisos | "No tiene permiso para crear casos" |
| `INVALID_HOSPITAL` | Hospital no existe/inactivo | "Hospital inválido, inactivo o no configurado" |
| `INTERNAL_ERROR` | Fallos BD | "Error interno. Contacte al administrador." |

---

## 6. PLAN DE ROLLBACK CONDICIONAL

**Script de Rollback (PL/pgSQL válido con to_regprocedure):**

```sql
-- ============================================================
-- ROLLBACK: Revertir cambios de migración (NO DESTRUCTIVO)
-- PL/pgSQL válido en PostgreSQL 14+
-- ============================================================

DO $rollback$
DECLARE
  v_func_exists boolean;
  v_table_exists boolean;
BEGIN
  -- Paso 1: Verificar existencia de función usando to_regprocedure
  v_func_exists := to_regprocedure('public.create_draft_case_secure(uuid)') IS NOT NULL;
  
  IF v_func_exists THEN
    -- Revoke ANTES de DROP
    REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM authenticated;
    RAISE NOTICE 'REVOKE EXECUTE: OK';
    
    -- DROP función
    DROP FUNCTION IF EXISTS public.create_draft_case_secure(uuid);
    RAISE NOTICE 'DROP FUNCTION: OK';
  ELSE
    RAISE NOTICE 'DROP FUNCTION: función no existe (OK)';
  END IF;

  -- Paso 2: Verificar existencia de tabla antes de DROP POLICY
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hospital_case_counters'
  ) INTO v_table_exists;
  
  IF v_table_exists THEN
    -- DROP política RLS
    DROP POLICY IF EXISTS hospital_case_counters_security_definer 
      ON public.hospital_case_counters;
    RAISE NOTICE 'DROP POLICY: OK';
  ELSE
    RAISE NOTICE 'DROP POLICY: tabla no existe (OK)';
  END IF;

  -- Paso 3: DROP índice (idempotente)
  DROP INDEX IF EXISTS public.idx_hospital_anonymous_code;
  RAISE NOTICE 'DROP INDEX: OK';

  -- Paso 4: DROP tabla (idempotente)
  DROP TABLE IF EXISTS public.hospital_case_counters;
  RAISE NOTICE 'DROP TABLE: OK';

  RAISE NOTICE 'ROLLBACK completado: función, tabla, índice, políticas eliminadas.';
  RAISE NOTICE 'COLUMNAS nuevas (age, sex, flush_technique, etc.) se mantienen (NO eliminadas).';

END $rollback$ LANGUAGE plpgsql;

-- ============================================================
-- VERIFICACIÓN POST-ROLLBACK
-- ============================================================

-- Verificar que rollback fue completo
SELECT 
  EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'ecrf_opstar_records' 
    AND indexname = 'idx_hospital_anonymous_code'
  ) AS index_still_exists,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_draft_case_secure'
  ) AS function_still_exists,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hospital_case_counters'
  ) AS table_still_exists;

-- Esperado: (false, false, false)
```

---

## 7. TESTING POST-EJECUCIÓN

### Test 1: Autenticación
```sql
SELECT create_draft_case_secure('hospital-uuid'::uuid);
-- Esperado: { success: false, error_code: 'UNAUTHORIZED' }
```

### Test 2: Hospital User Bloqueado
```sql
SELECT create_draft_case_secure('hospital-b-uuid'::uuid);
-- Esperado: { success: false, error_code: 'FORBIDDEN' }
```

### Test 3: Monitor Bloqueado
```sql
SELECT create_draft_case_secure('any-hospital-uuid'::uuid);
-- Esperado: { success: false, error_code: 'FORBIDDEN' }
```

### Test 4: Admin Funciona
```sql
SELECT create_draft_case_secure('any-hospital-uuid'::uuid);
-- Esperado: { success: true, anonymous_code: 'XXX-0001', status: 'draft' }
```

### Test 5: Colisiones Prevenidas
```sql
-- Si hospital tiene códigos HSJ-0001 a HSJ-0100:
SELECT create_draft_case_secure('hospital-uuid'::uuid);
-- Esperado: { anonymous_code: 'HSJ-0101' } (sin colisión)
```

### Test 6: Concurrencia
```bash
for i in {1..5}; do
  psql -c "SELECT create_draft_case_secure('hospital-uuid'::uuid);" &
done
wait
# Esperado: HSJ-0101, HSJ-0102, HSJ-0103, HSJ-0104, HSJ-0105 (únicos)
```

---

## 8. CHECKLIST DE EJECUCIÓN

### Pre-Ejecución
- [ ] **Preflight 1:** Hospitales activos sin short_name válido (0 filas)
- [ ] **Preflight 2:** Índice no existe (o existe, OK)
- [ ] **Preflight 3:** ⚠️ SIN DUPLICADOS - OBLIGATORIO
- [ ] **Preflight 4-7:** Completados
- [ ] **Backup:** BD resguardada
- [ ] **Rollback script:** Sintácticamente válido (to_regprocedure, DO block)
- [ ] **Equipo:** Notificado

### Ejecución
- [ ] **Fase 1-4:** Completadas
- [ ] **Fase 5:** Permisos asignados
- [ ] **Fase 6:** Documentación

### Post-Ejecución
- [ ] **Test 1-6:** Completados
- [ ] **E2E:** Flujo completo OK

---

## ESTADO FINAL

### ✅ Autorizado para Ejecución

**Cambios v6 (respecto a v5):**
- ✅ Preflight 1: Eliminado `HAVING validation_status != 'OK'` (sintácticamente inválido junto a columnas no agregadas sin `GROUP BY`)
- ✅ Preflight 1: Reescrito con cláusula `WHERE` que filtra directamente hospitales activos con `short_name` problemático
- ✅ Preflight 1: Condiciones evaluadas en `WHERE`: `IS NULL`, `TRIM(...) = ''`, `NOT (UPPER(TRIM(...)) ~ '^[A-Z0-9]+$')`, `LENGTH(UPPER(TRIM(...))) > 10`
- ✅ Preflight 1: Resultado esperado sigue siendo 0 filas

**Sin cambios respecto a v5:**
- Preflight 2 (pg_indexes), Preflight 3 (duplicados obligatorio), Preflight 4-7
- Migración (Sección 3), inicialización de contadores históricos (Sección 4)
- Función `create_draft_case_secure` (SECURITY DEFINER, search_path, autorización por rol, monitor/viewer bloqueados, errores sanitizados)
- Rollback (Sección 6): bloque único `DO $rollback$ ... $rollback$ LANGUAGE plpgsql`, `to_regprocedure()`, columnas nuevas preservadas

---

**Documento Confidencial - Uso Interno Únicamente**  
**Autorizado para Ejecución en Sprint 1**  
**Revisión Final:** 17-julio-2026  
**Compatibilidad:** PostgreSQL 14+ / Supabase
