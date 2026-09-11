# Ejecución Segura de Migración: OCT-Optimize ULTREON 3.0 (v3)
**Documentación de Producción - Versión Ejecutable Final**

**Fecha:** 16-julio-2026  
**Entorno:** Sprint 1 - Development / Staging / Production  
**Revisor:** Arquitecto Senior  
**Status:** ✅ LISTO PARA EJECUCIÓN  
**Compatibilidad:** PostgreSQL 14+ / Supabase

---

## TABLA DE CONTENIDOS

1. [Pre-Vuelo (Preflight Checks Idempotentes)](#1-pre-vuelo-preflight-checks-idempotentes)
2. [Plan de Ejecución](#2-plan-de-ejecución)
3. [Código de Migración Ejecutable](#3-código-de-migración-ejecutable)
4. [Inicialización de Contadores Históricos](#4-inicialización-de-contadores-históricos)
5. [Manejo de Errores (Error Codes)](#5-manejo-de-errores-error-codes)
6. [Plan de Rollback Condicional](#6-plan-de-rollback-condicional)
7. [Testing Post-Ejecución](#7-testing-post-ejecución)
8. [Checklist de Ejecución](#8-checklist-de-ejecución)

---

## 1. PRE-VUELO (PREFLIGHT CHECKS IDEMPOTENTES)

### 1.1 Verificar Hospitales Activos con short_name Válido

**Ejecutar ANTES de la migración:**

```sql
-- Preflight: Detectar problemas en tabla hospitals
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

-- Si hay ERROR en hospital ACTIVO, corregir antes de continuar
-- Si hay INFORMACIÓN en hospital INACTIVO, ignorar (no bloquea migración)
```

### 1.2 Verificar Tabla `hospital_case_counters` - Idempotente

```sql
-- Preflight: Tabla de contadores puede ya existir (segunda ejecución)
-- Esta verificación es INFORMATIVA, no bloqueante
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'hospital_case_counters'
  ) AS counters_table_exists,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_draft_case_secure' 
    AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  ) AS function_exists,
  EXISTS (
    SELECT 1 FROM information_schema.statistics 
    WHERE table_schema = 'public' 
    AND table_name = 'ecrf_opstar_records'
    AND indexname = 'idx_hospital_anonymous_code'
  ) AS index_exists;

-- Resultado esperado (primera ejecución): (false, false, false)
-- Resultado esperado (segunda ejecución): (true, true, true) - OK, idempotente
```

### 1.3 Detectar Máximo de `anonymous_code` Histórico

```sql
-- Preflight: Obtener máximo número histórico por hospital
-- Esto será usado para inicializar hospital_case_counters
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
-- Esto previene colisiones al reactivar la función
```

### 1.4 Verificar Permisos de Ejecución

```sql
-- Preflight: Confirmar permisos suficientes
SELECT 
  current_user,
  has_schema_privilege(current_user, 'public', 'CREATE') AS can_create,
  has_schema_privilege(current_user, 'public', 'USAGE') AS can_use;

-- Esperado: (postgres | owner_user, true, true)
-- Si no puedes ver esto, no tienes permisos suficientes
```

---

## 2. PLAN DE EJECUCIÓN

### Fase 1: Crear Nuevas Columnas (No Destructivo)
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
- Idempotente: segunda ejecución ignora columnas existentes

### Fase 2: Crear Tabla de Contadores + Inicializar
- `CREATE TABLE IF NOT EXISTS hospital_case_counters`
- **Inicializar con máximo histórico de anonymous_code**
- Prevenir colisiones futuras

### Fase 3: Crear Índice Único (Idempotente)
- `CREATE UNIQUE INDEX IF NOT EXISTS`

### Fase 4: Crear Función Segura (Reemplazable)
- `CREATE OR REPLACE FUNCTION`
- Valida con `IS NOT TRUE` en lugar de `IS FALSE`
- Monitor y viewer bloqueados

### Fase 5: Asignar Permisos (Condicionales)
- REVOKE EXECUTE (si existe)
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
-- Insertar máximo número histórico válido de anonymous_code para cada hospital
-- Esto garantiza que futuros códigos no colisionarán con históricos
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

-- Asegurarse de que todos los hospitales activos tienen entrada (incluso con 0)
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT h.id, 0, now(), now()
FROM public.hospitals h
WHERE h.is_active = true
ON CONFLICT (hospital_id) DO NOTHING;

-- FASE 3: Habilitar RLS en tabla de contadores (acceso solo vía SECURITY DEFINER)
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- FASE 3B: Crear/Recrear política RLS (segura: DROP + CREATE)
DROP POLICY IF EXISTS hospital_case_counters_security_definer 
  ON public.hospital_case_counters;

CREATE POLICY hospital_case_counters_security_definer 
  ON public.hospital_case_counters
  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- FASE 4: Crear índice único para códigos (idempotente)
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
  -- admin: puede crear en cualquier hospital
  -- hospital_user: solo en su hospital asignado
  -- monitor: BLOQUEADO (igual que viewer)
  -- viewer: BLOQUEADO
  -- otros: BLOQUEADO
  
  CASE v_user_role
    WHEN 'admin' THEN
      -- ✅ Admin permite crear en cualquier hospital
      NULL;
    
    WHEN 'hospital_user' THEN
      -- ✅ Hospital user solo en su hospital asignado
      IF v_user_hospital_id IS NULL THEN
        RAISE EXCEPTION 'FORBIDDEN:Hospital user sin hospital asignado';
      END IF;
      
      IF v_user_hospital_id != p_hospital_id THEN
        RAISE EXCEPTION 'FORBIDDEN:Usuario del hospital % intentó crear en hospital %',
          v_user_hospital_id, p_hospital_id;
      END IF;
    
    WHEN 'monitor' THEN
      -- ❌ Monitor BLOQUEADO (igual que viewer, salvo autorización futura)
      RAISE EXCEPTION 'FORBIDDEN:Rol monitor no está autorizado para crear casos en esta versión';
    
    WHEN 'viewer' THEN
      -- ❌ Viewer BLOQUEADO
      RAISE EXCEPTION 'FORBIDDEN:Rol viewer no puede crear casos';
    
    ELSE
      -- ❌ Rol desconocido, bloquear por seguridad
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

  -- Validar explícitamente: IS NOT TRUE es más seguro que IS FALSE
  IF v_hospital_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Hospital inactivo o no válido';
  END IF;

  -- ========== PASO 5: NORMALIZAR Y VALIDAR short_name ==========
  v_short_name_normalized := UPPER(TRIM(v_short_name));
  
  -- Validar caracteres alfanuméricos (prevenir inyección SQL)
  IF NOT v_short_name_normalized ~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Prefijo de hospital contiene caracteres inválidos';
  END IF;

  -- Validar longitud (1-10 caracteres)
  IF LENGTH(v_short_name_normalized) = 0 OR LENGTH(v_short_name_normalized) > 10 THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Prefijo de hospital tiene longitud inválida';
  END IF;

  -- ========== PASO 6: GENERAR CÓDIGO ATÓMICAMENTE ==========
  -- Usar INSERT ... ON CONFLICT para garantizar atomicidad sin race conditions
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

  -- Formatear código pseudo-anonimizado (Ej: HSJ-0001)
  v_new_code := v_short_name_normalized || '-' || LPAD(v_next_num::text, 4, '0');

  -- ========== PASO 7: PROTECCIÓN FRENTE A COLISIONES HISTÓRICAS ==========
  -- Verificar que el código generado no colisiona con registros históricos
  SELECT COUNT(*) INTO v_collision_check
  FROM public.ecrf_opstar_records
  WHERE hospital_id = p_hospital_id AND anonymous_code = v_new_code;

  IF v_collision_check > 0 THEN
    RAISE EXCEPTION 'INTERNAL_ERROR:Código pseudo-anonimizado ya existe (colisión detectada con histórico)';
  END IF;

  -- ========== PASO 8: CREAR REGISTRO EN ESTADO DRAFT ==========
  -- Insertar registro nuevo con estado 'draft' (no valida completitud)
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
  -- Sanitizar errores: mantener códigos pero no detalles internos
  DECLARE
    v_error_msg text := SQLERRM;
    v_error_code text;
  BEGIN
    -- Extraer código de error personalizado
    IF v_error_msg LIKE 'UNAUTHORIZED:%' THEN
      v_error_code := 'UNAUTHORIZED';
    ELSIF v_error_msg LIKE 'FORBIDDEN:%' THEN
      v_error_code := 'FORBIDDEN';
    ELSIF v_error_msg LIKE 'INVALID_HOSPITAL:%' THEN
      v_error_code := 'INVALID_HOSPITAL';
    ELSE
      v_error_code := 'INTERNAL_ERROR';
    END IF;
    
    -- Loguear error completo internamente
    RAISE NOTICE 'create_draft_case_secure error [%]: %', v_error_code, v_error_msg;
    
    -- Retornar error sanitizado al cliente
    RETURN jsonb_build_object(
      'success', false,
      'error_code', v_error_code,
      'error', CASE 
        WHEN v_error_code = 'UNAUTHORIZED' THEN 'Usuario no autenticado o sesión expirada'
        WHEN v_error_code = 'FORBIDDEN' THEN 'No tiene permiso para crear casos en este hospital'
        WHEN v_error_code = 'INVALID_HOSPITAL' THEN 'Hospital inválido, inactivo o no configurado correctamente'
        ELSE 'Error interno al crear el caso. Contacte al administrador.'
      END
    );
  END;
END;
$$;

-- ========== FASE 5: ASIGNAR PERMISOS (CONDICIONALES) ==========

-- Revocar permisos de PUBLIC (seguridad por defecto)
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;

-- Conceder permisos solo a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) TO authenticated;

-- ========== FASE 6: DOCUMENTACIÓN ==========

COMMENT ON FUNCTION public.create_draft_case_secure(uuid) IS
'Crea un registro de caso borrador (draft) de forma atómica y segura.

AUTORIZACIÓN (por rol):
- admin: puede crear en cualquier hospital activo
- hospital_user: solo en su hospital asignado
- monitor: BLOQUEADO (salvo autorización futura)
- viewer: BLOQUEADO
- otros: BLOQUEADO

ERROR CODES:
- UNAUTHORIZED: No autenticado o sesión expirada
- FORBIDDEN: Rol sin permisos o intento cross-hospital
- INVALID_HOSPITAL: Hospital no existe, inactivo o short_name inválido
- INTERNAL_ERROR: Error de BD (contador, colisión, etc.)

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
  "case_id": "uuid" (si success=true),
  "anonymous_code": "HSJ-0001" (si success=true),
  "status": "draft" (si success=true),
  "created_at": "2026-09-15T10:30:00Z" (si success=true),
  "hospital_id": "uuid" (si success=true),
  "error_code": "UNAUTHORIZED|FORBIDDEN|INVALID_HOSPITAL|INTERNAL_ERROR" (si success=false),
  "error": "mensaje sanitizado" (si success=false)
}
';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
```

---

## 4. INICIALIZACIÓN DE CONTADORES HISTÓRICOS

### Lógica de Inicialización

**SQL en Migración (Fase 2B):**

```sql
-- 1. Insertar máximo histórico de cada hospital
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

-- 2. Asegurar que todos los hospitales activos tienen entrada (incluso con 0)
INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
SELECT h.id, 0, now(), now()
FROM public.hospitals h
WHERE h.is_active = true
ON CONFLICT (hospital_id) DO NOTHING;
```

### Protección Frente a Colisiones Históricas

**En Función (Paso 7):**

```sql
-- Verificar que el código generado no colisiona con históricos
SELECT COUNT(*) INTO v_collision_check
FROM public.ecrf_opstar_records
WHERE hospital_id = p_hospital_id AND anonymous_code = v_new_code;

IF v_collision_check > 0 THEN
  RAISE EXCEPTION 'INTERNAL_ERROR:Código ya existe (colisión con histórico)';
END IF;
```

**Garantía:**
- Si hospital tiene 100 casos históricos con códigos HSJ-0001 a HSJ-0100
- El contador se inicializa en 100
- El próximo código será HSJ-0101
- Nunca colisionará con históricos

---

## 5. MANEJO DE ERRORES (ERROR CODES)

### Error Codes Distinguidos (Sanitizados)

| Code | Situación BD | Cliente Recibe |
|------|-----------|---|
| `UNAUTHORIZED` | auth.uid() NULL, usuario inactivo | "Usuario no autenticado o sesión expirada" |
| `FORBIDDEN` | Rol sin permisos, cross-hospital | "No tiene permiso para crear casos en este hospital" |
| `INVALID_HOSPITAL` | No existe, inactivo, short_name inválido | "Hospital inválido, inactivo o no configurado correctamente" |
| `INTERNAL_ERROR` | Fallos BD, contador, colisión, etc. | "Error interno. Contacte al administrador." |

### Logs Internos (Detallados)

```
NOTICE: create_draft_case_secure error [FORBIDDEN]: Usuario del hospital abc... intentó crear en hospital def...
NOTICE: create_draft_case_secure error [INTERNAL_ERROR]: Código HSJ-0050 ya existe (colisión detectada con histórico)
```

---

## 6. PLAN DE ROLLBACK CONDICIONAL

### Script de Rollback (Seguro y Condicional)

```sql
-- ============================================================
-- ROLLBACK: Revertir cambios de migración (NO DESTRUCTIVO)
-- Seguro: usar bloques condicionales (DO $$)
-- ============================================================

DO $$
BEGIN
  -- 1. REVOKE permisos ANTES de DROP (condicional)
  BEGIN
    REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM authenticated;
    RAISE NOTICE 'REVOKE EXECUTE from authenticated: OK';
  EXCEPTION WHEN UNDEFINED_OBJECT THEN
    RAISE NOTICE 'REVOKE EXECUTE from authenticated: función no existe (OK)';
  EXCEPTION WHEN others THEN
    RAISE WARNING 'REVOKE EXECUTE error: %', SQLERRM;
  END;

  -- 2. DROP función (condicional)
  BEGIN
    DROP FUNCTION IF EXISTS public.create_draft_case_secure(uuid);
    RAISE NOTICE 'DROP FUNCTION create_draft_case_secure: OK';
  EXCEPTION WHEN others THEN
    RAISE WARNING 'DROP FUNCTION error: %', SQLERRM;
  END;

  -- 3. DROP política RLS (condicional)
  BEGIN
    DROP POLICY IF EXISTS hospital_case_counters_security_definer 
      ON public.hospital_case_counters;
    RAISE NOTICE 'DROP POLICY: OK';
  EXCEPTION WHEN others THEN
    RAISE WARNING 'DROP POLICY error: %', SQLERRM;
  END;

  -- 4. DROP índice (condicional)
  BEGIN
    DROP INDEX IF EXISTS public.idx_hospital_anonymous_code;
    RAISE NOTICE 'DROP INDEX idx_hospital_anonymous_code: OK';
  EXCEPTION WHEN others THEN
    RAISE WARNING 'DROP INDEX error: %', SQLERRM;
  END;

  -- 5. DROP tabla de contadores (condicional)
  BEGIN
    DROP TABLE IF EXISTS public.hospital_case_counters;
    RAISE NOTICE 'DROP TABLE hospital_case_counters: OK';
  EXCEPTION WHEN others THEN
    RAISE WARNING 'DROP TABLE error: %', SQLERRM;
  END;

  RAISE NOTICE 'ROLLBACK completado: función, permisos, índice y tabla eliminados.';
  RAISE NOTICE 'COLUMNAS nuevas se mantienen en ecrf_opstar_records (NO ELIMINADAS por seguridad).';
END $$;

-- ============================================================
-- VERIFICACIÓN POST-ROLLBACK
-- ============================================================

-- Verificar que rollback fue completo
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'hospital_case_counters'
  ) AS counters_table_exists,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_draft_case_secure'
  ) AS function_exists
  -- Esperado: (false, false)
```

### Características de Rollback

✅ **Condicional:** cada DROP IF EXISTS no falla si objeto no existe  
✅ **No Destructivo:** NO elimina columnas nuevas  
✅ **Reversible:** permite re-ejecutar migración después  
✅ **Seguro:** REVOKE antes de DROP  
✅ **Auditable:** RAISE NOTICE log de cada paso

---

## 7. TESTING POST-EJECUCIÓN

### Test 1: Autenticación - No Autenticado
```sql
-- Como anon (no autenticado):
SELECT create_draft_case_secure('hospital-uuid'::uuid);
-- Esperado: { success: false, error_code: 'UNAUTHORIZED' }
```

### Test 2: Autorización - Hospital User Bloqueado en Otro Hospital
```sql
-- Usuario hospital_user del hospital A:
SELECT create_draft_case_secure('hospital-b-uuid'::uuid);
-- Esperado: { success: false, error_code: 'FORBIDDEN', error: 'No tiene permiso...' }
```

### Test 3: Autorización - Monitor Bloqueado
```sql
-- Usuario monitor:
SELECT create_draft_case_secure('any-hospital-uuid'::uuid);
-- Esperado: { success: false, error_code: 'FORBIDDEN', error: 'Rol monitor no está autorizado...' }
```

### Test 4: Autorización - Admin Funciona
```sql
-- Usuario admin:
SELECT create_draft_case_secure('any-hospital-uuid'::uuid);
-- Esperado: { success: true, case_id: 'uuid', anonymous_code: 'XXX-0001', status: 'draft' }
```

### Test 5: Protección Frente a Colisiones Históricas
```sql
-- Si hospital tiene códigos HSJ-0001 a HSJ-0100:
-- Contador debe inicializarse en 100
-- Próximo código debe ser HSJ-0101

SELECT last_value FROM public.hospital_case_counters 
WHERE hospital_id = 'hospital-uuid'::uuid;
-- Esperado: 100

-- Crear nuevo caso:
SELECT create_draft_case_secure('hospital-uuid'::uuid);
-- Esperado: { success: true, anonymous_code: 'HSJ-0101', ... }

-- Verificar que no colisiona con histórico HSJ-0100:
SELECT COUNT(*) FROM public.ecrf_opstar_records 
WHERE hospital_id = 'hospital-uuid'::uuid 
AND anonymous_code = 'HSJ-0101';
-- Esperado: 1 (el recién creado, no duplicado)
```

### Test 6: Concurrencia - Múltiples Usuarios Simultáneos
```bash
# Simular 5 creaciones simultáneas en el mismo hospital:
for i in {1..5}; do
  psql -U [user] -d [db] -c "SELECT create_draft_case_secure('hospital-uuid'::uuid);" &
done
wait

# Verificar códigos únicos:
# HSJ-0101, HSJ-0102, HSJ-0103, HSJ-0104, HSJ-0105
# (Nunca duplicados, siempre secuenciales)
```

### Test 7: Idempotencia - Segunda Ejecución de Migración
```bash
# Ejecutar migración dos veces seguidas (preflight idempotente):
psql -U [user] -d [db] -f 20260716_oct_optimize_fields.sql
psql -U [user] -d [db] -f 20260716_oct_optimize_fields.sql

# Esperado: ambas ejecuciones completadas sin errores
```

---

## 8. CHECKLIST DE EJECUCIÓN

### Pre-Ejecución
- [ ] **Preflight 1:** Hospitales activos sin short_name válido (0 errores)
- [ ] **Preflight 2:** Tabla hospital_case_counters no existe (o existe, OK)
- [ ] **Preflight 3:** Función create_draft_case_secure no existe (o existe, OK)
- [ ] **Preflight 4:** Máximo histórico de anonymous_code obtenido
- [ ] **Preflight 5:** Permisos de CREATE en schema public confirmados
- [ ] **Backup:** BD resguardada (snapshot o dump)
- [ ] **Rollback script:** Preparado y testeado localmente
- [ ] **Equipo:** Notificado de ventana de cambios

### Ejecución
- [ ] **Fase 1:** Columnas nuevas agregadas (verificar con `\d ecrf_opstar_records`)
- [ ] **Fase 2A:** Tabla hospital_case_counters creada
- [ ] **Fase 2B:** Contadores inicializados con máximo histórico
- [ ] **Fase 3:** RLS habilitado y política creada
- [ ] **Fase 4:** Índice único creado
- [ ] **Fase 5:** Función creada (verificar con `\df create_draft_case_secure`)
- [ ] **Fase 6:** Permisos asignados (REVOKE + GRANT)

### Post-Ejecución Inmediato
- [ ] **Test 1:** Autenticación - no autenticado falla
- [ ] **Test 2:** Autorización - hospital_user bloqueado en otro hospital
- [ ] **Test 3:** Autorización - monitor bloqueado
- [ ] **Test 4:** Autorización - admin funciona
- [ ] **Test 5:** Colisiones históricas prevenidas
- [ ] **Test 6:** Concurrencia - múltiples usuarios, códigos únicos
- [ ] **Test 7:** Idempotencia - segunda ejecución OK

### Post-Ejecución Extended
- [ ] **Integration:** Server Action integrado en RegistryFormClient
- [ ] **E2E Test:** Crear borrador → completar caso (flujo completo)
- [ ] **UI Test:** anonymous_code es read-only
- [ ] **UI Test:** Estado draft no valida completitud
- [ ] **Monitoring:** Logs sin errores en producción
- [ ] **Documentation:** Guía de uso para equipos actualizada

### Rollback (Si Es Necesario)
- [ ] **Ejecutar script:** rollback_20260716.sql
- [ ] **Verificar:** hospital_case_counters eliminada
- [ ] **Verificar:** Función eliminada
- [ ] **Verificar:** Índice eliminado
- [ ] **Verificar:** Columnas nuevas se mantienen (NO eliminadas)
- [ ] **Reintentar:** Migración después de resolver problema raíz

---

## ESTADO FINAL

### ✅ Autorizado para Ejecución

**Compatibilidad:**
- ✅ PostgreSQL 14+
- ✅ Supabase (RLS, SECURITY DEFINER, auth.uid())
- ✅ Idempotente (segunda ejecución no falla)

**Seguridad:**
- ✅ Preflight checks idempotentes
- ✅ Inicialización de contadores con históricos
- ✅ Protección frente a colisiones
- ✅ Validación explícita: IS NOT TRUE
- ✅ Rollback condicional y no destructivo
- ✅ Monitor y viewer bloqueados
- ✅ Error codes sanitizados
- ✅ Atomicidad (INSERT ON CONFLICT)

**Próximos Pasos:**

1. **Dev:** Preflight + migración
2. **Testing:** 7 tests completos
3. **Staging:** Preflight + migración
4. **Production:** Con backup + rollback listo

---

**Documento Confidencial - Uso Interno Únicamente**  
**Autorizado para Ejecución en Sprint 1**  
**Revisión Final:** 16-julio-2026  
**Compatibilidad:** PostgreSQL 14+ / Supabase
