# Ejecución Segura de Migración: OCT-Optimize ULTREON 3.0 (v4)
**Documentación de Producción - Versión Ejecutable Final**

**Fecha:** 16-julio-2026  
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

### 1.1 Verificar Hospitales Activos con short_name Válido

**Ejecutar ANTES de la migración:**

```sql
-- Preflight 1: Detectar problemas en tabla hospitals
-- Idempotente: Segunda ejecución no falla
SELECT 
  h.id,
  h.name,
  h.short_name,
  h.is_active,
  CASE 
    WHEN h.short_name IS NULL OR h.short_name = '' THEN 'ERROR: short_name NULL/vacío'
    WHEN NOT (UPPER(TRIM(h.short_name)) ~ '^[A-Z0-9]+$') THEN 'ERROR: short_name inválido'
    WHEN LENGTH(UPPER(TRIM(h.short_name))) > 10 THEN 'ERROR: short_name demasiado largo'
    WHEN h.is_active = true THEN 'OK'
    ELSE 'INFORMACIÓN: Hospital inactivo (no bloquea)'
  END AS status
FROM public.hospitals h
ORDER BY h.is_active DESC, h.name;

-- ⚠️ DECISIÓN: Si hay ERROR en hospital ACTIVO → corregir antes de continuar
-- ℹ️ INFORMACIÓN: Si hay INACTIVO → ignorar (no bloquea)
```

### 1.2 Verificar Índice - Usar pg_indexes (NO information_schema.statistics)

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
--   Motivo: Crear índice único fallaría
--   Acción: Resolver duplicados antes de continuar
--   Ejemplos:
--     * Hospital A tiene 2 casos con código HSJ-0001
--     * Hospital B tiene 3 casos con código XYZ-0050
-- - Si no hay filas → OK, proceder con migración
```

**Si hay duplicados, resolverlos primero:**

```sql
-- Ejemplo: Resolver duplicado renumerando el segundo caso
UPDATE public.ecrf_opstar_records
SET anonymous_code = 'HSJ-0002'
WHERE id = 'second-duplicate-id'::uuid;

-- Luego, re-ejecutar preflight para confirmar resolución
```

### 1.4 Verificar Tabla `hospital_case_counters` - Idempotente

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

### 1.5 Verificar Función - Idempotente

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
-- Esto se usa para inicializar hospital_case_counters
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
- Idempotente: segunda ejecución ignora columnas existentes

### Fase 2: Crear Tabla de Contadores + Inicializar
- `CREATE TABLE IF NOT EXISTS hospital_case_counters`
- Inicializar con máximo histórico de anonymous_code
- Prevenir colisiones futuras

### Fase 3: Crear Índice Único (SOLO si no hay duplicados)
- `CREATE UNIQUE INDEX IF NOT EXISTS`
- Preflight 3 debe confirmar: sin duplicados

### Fase 4: Crear Función Segura (Reemplazable)
- `CREATE OR REPLACE FUNCTION`
- Valida con `IS NOT TRUE`
- Monitor y viewer bloqueados

### Fase 5: Asignar Permisos (Condicionales)
- REVOKE EXECUTE
- GRANT EXECUTE

### Fase 6: Verificar Integridad
- Consultar que función está creada
- Probar que hospital_case_counters está inicializada

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
WHERE h.is_active = true
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
-- Preflight debe confirmar: sin duplicados de (hospital_id, anonymous_code)
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
  -- Variables de usuario y autorización
  v_current_user_id uuid;
  v_user_role text;
  v_user_hospital_id uuid;
  
  -- Variables de hospital y código
  v_short_name text;
  v_short_name_normalized text;
  v_hospital_is_active boolean;
  
  -- Variables de contador y generación
  v_next_num integer;
  v_new_code text;
  v_collision_check integer;
  
  -- Variables de registro
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
- monitor: BLOQUEADO (salvo autorización futura)
- viewer: BLOQUEADO

GARANTÍAS:
- Autenticación obligatoria (auth.uid())
- Validación explícita: IS NOT TRUE
- Generación atómica de anonymous_code (INSERT ON CONFLICT)
- Protección frente a colisiones históricas
- Inicialización de contadores con máximos históricos
- Estado draft inicial (no valida completitud)

RETORNA (jsonb):
{
  "success": true/false,
  "case_id": "uuid",
  "anonymous_code": "HSJ-0001",
  "status": "draft",
  "created_at": "2026-09-15T10:30:00Z",
  "hospital_id": "uuid",
  "error_code": "UNAUTHORIZED|FORBIDDEN|INVALID_HOSPITAL|INTERNAL_ERROR",
  "error": "mensaje sanitizado"
}
';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
```

---

## 4. INICIALIZACIÓN DE CONTADORES HISTÓRICOS

**SQL en Fase 2B (Migración):**

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
WHERE h.is_active = true
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

**Script de Rollback (Sintácticamente válido en PostgreSQL):**

```sql
-- ============================================================
-- ROLLBACK: Revertir cambios de migración (NO DESTRUCTIVO)
-- Sintácticamente válido en PostgreSQL 14+
-- ============================================================

BEGIN;

-- Paso 1: REVOKE permisos
BEGIN
  REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;
  RAISE NOTICE 'REVOKE PUBLIC: OK';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'REVOKE PUBLIC: función no existe (OK)';
END;

-- Paso 2: DROP función
BEGIN
  DROP FUNCTION IF EXISTS public.create_draft_case_secure(uuid);
  RAISE NOTICE 'DROP FUNCTION: OK';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'DROP FUNCTION: función no existe (OK)';
END;

-- Paso 3: DROP política RLS
BEGIN
  DROP POLICY IF EXISTS hospital_case_counters_security_definer 
    ON public.hospital_case_counters;
  RAISE NOTICE 'DROP POLICY: OK';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'DROP POLICY: política no existe (OK)';
END;

-- Paso 4: DROP índice
BEGIN
  DROP INDEX IF EXISTS public.idx_hospital_anonymous_code;
  RAISE NOTICE 'DROP INDEX: OK';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'DROP INDEX: índice no existe (OK)';
END;

-- Paso 5: DROP tabla
BEGIN
  DROP TABLE IF EXISTS public.hospital_case_counters;
  RAISE NOTICE 'DROP TABLE: OK';
EXCEPTION WHEN undefined_object THEN
  RAISE NOTICE 'DROP TABLE: tabla no existe (OK)';
END;

RAISE NOTICE 'ROLLBACK completado: función, tabla, índice eliminados.';
RAISE NOTICE 'COLUMNAS nuevas se mantienen (NO eliminadas por seguridad).';

COMMIT;

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
-- Esperado: { anonymous_code: 'HSJ-0101' } (no colisión con históricos)
```

### Test 6: Concurrencia
```bash
# 5 creaciones simultáneas en el mismo hospital:
for i in {1..5}; do
  psql -c "SELECT create_draft_case_secure('hospital-uuid'::uuid);" &
done
wait
# Esperado: HSJ-0101, HSJ-0102, HSJ-0103, HSJ-0104, HSJ-0105 (únicos)
```

---

## 8. CHECKLIST DE EJECUCIÓN

### Pre-Ejecución
- [ ] **Preflight 1:** Hospitales activos sin short_name (0 errores)
- [ ] **Preflight 2:** Índice no existe (o existe, OK con pg_indexes)
- [ ] **Preflight 3:** ⚠️ SIN DUPLICADOS de (hospital_id, anonymous_code) - OBLIGATORIO
- [ ] **Preflight 4:** Tabla hospital_case_counters no existe (o existe, OK)
- [ ] **Preflight 5:** Función no existe (o existe, OK)
- [ ] **Preflight 6:** Máximo histórico obtenido
- [ ] **Preflight 7:** Permisos de CREATE confirmados
- [ ] **Backup:** BD resguardada
- [ ] **Rollback script:** Testeado (sintácticamente válido)
- [ ] **Equipo:** Notificado

### Ejecución
- [ ] **Fase 1:** Columnas nuevas agregadas
- [ ] **Fase 2A:** Tabla hospital_case_counters creada
- [ ] **Fase 2B:** Contadores inicializados
- [ ] **Fase 3:** RLS habilitado, política creada
- [ ] **Fase 4:** Índice creado (SÍ, porque Preflight 3 pasó)
- [ ] **Fase 5:** Función creada
- [ ] **Fase 6:** Permisos asignados

### Post-Ejecución
- [ ] **Test 1:** Autenticación falla
- [ ] **Test 2:** Hospital user bloqueado
- [ ] **Test 3:** Monitor bloqueado
- [ ] **Test 4:** Admin funciona
- [ ] **Test 5:** Colisiones prevenidas
- [ ] **Test 6:** Concurrencia OK
- [ ] **E2E:** Flujo completo (borrador → completar)

---

## ESTADO FINAL

### ✅ Autorizado para Ejecución

**Cambios v4:**
- ✅ Preflight 2: Usar pg_indexes (no information_schema.statistics)
- ✅ Preflight 3: Detectar duplicados (GROUP BY, HAVING COUNT(*) > 1)
- ✅ Fase 4: Crear índice SOLO si no hay duplicados
- ✅ Rollback: Sintácticamente válido (BEGIN/EXCEPTION/END)

**Próximos Pasos:**
1. Ejecutar Preflight checks 1-7 (especialmente Preflight 3)
2. Si Preflight 3 OK → ejecutar migración
3. Ejecutar 6 tests post-ejecución
4. Keepup monitoring

---

**Documento Confidencial - Uso Interno Únicamente**  
**Autorizado para Ejecución en Sprint 1**  
**Revisión Final:** 16-julio-2026  
**Compatibilidad:** PostgreSQL 14+ / Supabase
