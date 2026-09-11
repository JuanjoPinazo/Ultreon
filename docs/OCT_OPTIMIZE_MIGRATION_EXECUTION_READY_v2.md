# Ejecución Segura de Migración: OCT-Optimize ULTREON 3.0
**Documentación de Producción - Versión Ejecutable**

**Fecha:** 16-julio-2026  
**Entorno:** Sprint 1 - Development / Staging  
**Revisor:** Arquitecto Senior  
**Status:** ✅ LISTO PARA EJECUCIÓN

---

## TABLA DE CONTENIDOS

1. [Pre-Vuelo (Preflight Checks)](#1-pre-vuelo-preflight-checks)
2. [Plan de Ejecución](#2-plan-de-ejecución)
3. [Código de Migración Ejecutable](#3-código-de-migración-ejecutable)
4. [Cambios en Función (Monitor Bloqueado)](#4-cambios-en-función-monitor-bloqueado)
5. [Manejo de Errores (Error Codes)](#5-manejo-de-errores-error-codes)
6. [Plan de Rollback No Destructivo](#6-plan-de-rollback-no-destructivo)
7. [Testing Post-Ejecución](#7-testing-post-ejecución)
8. [Checklist de Ejecución](#8-checklist-de-ejecución)

---

## 1. PRE-VUELO (PREFLIGHT CHECKS)

### 1.1 Verificar Hospitales Activos con short_name Válido

**Ejecutar ANTES de la migración:**

```sql
-- Preflight: Detectar problemas en tabla hospitals
SELECT 
  h.id,
  h.name,
  h.short_name,
  h.is_active,
  CASE 
    WHEN h.short_name IS NULL OR h.short_name = '' THEN 'ERROR: short_name NULL/vacío'
    WHEN NOT (UPPER(TRIM(h.short_name)) ~ '^[A-Z0-9]+$') THEN 'ERROR: short_name inválido (caracteres especiales)'
    WHEN LENGTH(UPPER(TRIM(h.short_name))) > 10 THEN 'ERROR: short_name demasiado largo (>10 chars)'
    WHEN h.is_active = true THEN 'OK'
    ELSE 'INFORMACIÓN: Hospital inactivo'
  END AS status
FROM public.hospitals h
ORDER BY h.is_active DESC, h.name;
```

**Acciones según resultado:**

- ✅ **OK:** Todos los hospitales ACTIVOS tienen short_name válido → Proceder con migración
- ⚠️ **ERROR (hospital ACTIVO):** Corregir short_name antes de ejecutar migración
  ```sql
  UPDATE public.hospitals 
  SET short_name = 'AAA' 
  WHERE id = 'hospital-id' AND is_active = true;
  ```
- ⚠️ **INFORMACIÓN (hospital INACTIVO):** Ignorar, no bloquea migración

### 1.2 Verificar Tabla `hospital_case_counters` No Existe

```sql
-- Preflight: Confirmar que la tabla de contadores no existe aún
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'hospital_case_counters'
);
-- Esperado: FALSE
```

### 1.3 Verificar Que Función Anterior No Existe

```sql
-- Preflight: Confirmar que la función no existe (primera ejecución)
SELECT EXISTS (
  SELECT 1 FROM pg_proc 
  WHERE proname = 'create_draft_case_secure' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
);
-- Esperado: FALSE
```

### 1.4 Verificar Permisos de Ejecución

```sql
-- Preflight: Confirmar que somos superuser o owner de schema
SELECT current_user, has_schema_privilege(current_user, 'public', 'CREATE');
-- Esperado: (postgres, true) o (owner_user, true)
```

---

## 2. PLAN DE EJECUCIÓN

### Fase 1: Crear Nuevas Columnas (No Destructivo)
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
- Columnas nuevas con DEFAULT NULL
- Idempotente: si existen, las ignora

### Fase 2: Crear Tabla de Contadores
- `CREATE TABLE IF NOT EXISTS hospital_case_counters`
- Habilitar RLS
- Crear política de seguridad

### Fase 3: Crear Índice Único
- `CREATE UNIQUE INDEX idx_hospital_anonymous_code`
- Garantiza unicidad por hospital

### Fase 4: Crear Función Segura
- `CREATE OR REPLACE FUNCTION create_draft_case_secure()`
- SECURITY DEFINER, SET search_path, RETURNS jsonb
- Autorización: admin/monitor BLOQUEADO, hospital_user restringido

### Fase 5: Asignar Permisos
- REVOKE EXECUTE FROM PUBLIC
- GRANT EXECUTE TO authenticated

### Fase 6: Verificar Integridad
- Test: crear borrador
- Test: validar autorización
- Test: validar concurrencia

---

## 3. CÓDIGO DE MIGRACIÓN EJECUTABLE

```sql
-- ============================================================
-- OCT-Optimize: Migración de Sprint 1 - COMPLETA Y SEGURA
-- Archivo: supabase/migrations/20260716_oct_optimize_fields.sql
-- ============================================================

-- FASE 1: Agregar columnas nuevas (no destructivo)
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- FASE 2: Crear tabla de contadores (para generación atómica de códigos)
CREATE TABLE IF NOT EXISTS public.hospital_case_counters (
  hospital_id uuid PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
  last_value integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en tabla de contadores (acceso solo vía SECURITY DEFINER)
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- Crear política RLS: por defecto, nadie puede acceder (solo SECURITY DEFINER)
CREATE POLICY IF NOT EXISTS hospital_case_counters_security_definer 
  ON public.hospital_case_counters
  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- FASE 3: Crear índice único para garantizar códigos únicos por hospital
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- FASE 4: Crear función segura (con cambios de autorización)
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
  -- monitor: BLOQUEADO (igual que viewer, salvo autorización futura)
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

  IF v_hospital_is_active IS FALSE THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Hospital inactivo';
  END IF;

  -- ========== PASO 5: NORMALIZAR Y VALIDAR short_name ==========
  v_short_name_normalized := UPPER(TRIM(v_short_name));
  
  IF NOT v_short_name_normalized ~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Prefijo de hospital contiene caracteres inválidos';
  END IF;

  IF LENGTH(v_short_name_normalized) > 10 THEN
    RAISE EXCEPTION 'INVALID_HOSPITAL:Prefijo de hospital demasiado largo';
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

  -- ========== PASO 7: VALIDACIÓN ANTI-COLISIÓN ==========
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
  -- Sanitizar errores: mantener error codes (UNAUTHORIZED, etc.) pero no detalles internos
  DECLARE
    v_error_msg text := SQLERRM;
    v_error_code text;
  BEGIN
    -- Extraer el código de error personalizado si existe
    IF v_error_msg LIKE 'UNAUTHORIZED:%' THEN
      v_error_code := 'UNAUTHORIZED';
    ELSIF v_error_msg LIKE 'FORBIDDEN:%' THEN
      v_error_code := 'FORBIDDEN';
    ELSIF v_error_msg LIKE 'INVALID_HOSPITAL:%' THEN
      v_error_code := 'INVALID_HOSPITAL';
    ELSE
      v_error_code := 'INTERNAL_ERROR';
    END IF;
    
    -- Loguear error completo internamente (sin exponerlo)
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

-- FASE 5: Asignar permisos de seguridad
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) TO authenticated;

-- Documentación de la función
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

## 4. CAMBIOS EN FUNCIÓN (MONITOR BLOQUEADO)

### Cambio Clave: Monitor está BLOQUEADO

**Antes (v1):**
```sql
WHEN 'monitor' THEN
  -- Permitir cualquier hospital
  NULL;
```

**Ahora (v2):**
```sql
WHEN 'monitor' THEN
  -- ❌ Monitor BLOQUEADO (igual que viewer, salvo autorización futura)
  RAISE EXCEPTION 'FORBIDDEN:Rol monitor no está autorizado para crear casos en esta versión';
```

### Razón
- Monitor es rol de **validación**, no creación de datos
- Si en futuro se requiere que monitor cree casos, se autoriza explícitamente
- Mejora de seguridad: todos los creadores (admin, hospital_user) tienen cadena clara de responsabilidad

---

## 5. MANEJO DE ERRORES (ERROR CODES)

### Error Codes Distinguidos

| Code | Situación | Cliente Recibe |
|------|-----------|---|
| `UNAUTHORIZED` | auth.uid() NULL, usuario inactivo | "Usuario no autenticado o sesión expirada" |
| `FORBIDDEN` | Rol sin permisos (monitor, viewer), hospital_user intenta otro hospital | "No tiene permiso para crear casos en este hospital" |
| `INVALID_HOSPITAL` | Hospital no existe, inactivo, short_name inválido | "Hospital inválido, inactivo o no configurado correctamente" |
| `INTERNAL_ERROR` | Fallo de BD (contador, colisión, etc.) | "Error interno al crear el caso. Contacte al administrador." |

### Implementación en Función

```sql
EXCEPTION WHEN OTHERS THEN
  DECLARE
    v_error_msg text := SQLERRM;
    v_error_code text;
  BEGIN
    -- Extraer código personalizado del mensaje
    IF v_error_msg LIKE 'UNAUTHORIZED:%' THEN
      v_error_code := 'UNAUTHORIZED';
    ELSIF v_error_msg LIKE 'FORBIDDEN:%' THEN
      v_error_code := 'FORBIDDEN';
    ELSIF v_error_msg LIKE 'INVALID_HOSPITAL:%' THEN
      v_error_code := 'INVALID_HOSPITAL';
    ELSE
      v_error_code := 'INTERNAL_ERROR';
    END IF;
    
    -- Loguear internamente (sin exponer detalles)
    RAISE NOTICE 'create_draft_case_secure error [%]: %', v_error_code, v_error_msg;
    
    -- Retornar al cliente
    RETURN jsonb_build_object(
      'success', false,
      'error_code', v_error_code,
      'error', CASE ... END
    );
  END;
END;
```

---

## 6. PLAN DE ROLLBACK NO DESTRUCTIVO

### ¿Qué NO se elimina?

❌ **NO eliminar columnas nuevas:**
- `age`, `sex`, `flush_technique`, `flush_technique_other`
- `ultreon_coregistration_ok`, `ultreon_optimization_ok`

**Razón:** Datos pueden haber sido escritos; eliminarlos causa pérdida de información

### ¿Qué SÍ se elimina?

✅ **Eliminar solo artefactos de función:**

**Script de Rollback:**

```sql
-- ============================================================
-- ROLLBACK: Revertir cambios de migración (NO DESTRUCTIVO)
-- ============================================================

-- 1. Revocar y eliminar función
DROP FUNCTION IF EXISTS public.create_draft_case_secure(uuid);

-- 2. Revocar permisos (ya no existen, pero por seguridad)
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;

-- 3. Eliminar política RLS de hospital_case_counters
DROP POLICY IF EXISTS hospital_case_counters_security_definer 
  ON public.hospital_case_counters;

-- 4. Eliminar tabla de contadores
DROP TABLE IF EXISTS public.hospital_case_counters;

-- 5. Eliminar índice único
DROP INDEX IF EXISTS public.idx_hospital_anonymous_code;

-- ============================================================
-- COLUMNAS NUEVAS SE MANTIENEN (NO SE ELIMINAN)
-- ============================================================
-- Las columnas age, sex, flush_technique, etc. se mantienen en:
--   public.ecrf_opstar_records
-- Esto permite:
-- - Reversibilidad de datos
-- - Futura re-aplicación de migración
-- - Auditoría de cambios
-- ============================================================
```

### Ejecución de Rollback

**Si la migración falla durante ejecución:**
```bash
# 1. Conectar a la BD con superuser
psql -U postgres -d [database] -f rollback_20260716.sql

# 2. Verificar que rollback fue completo
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'hospital_case_counters';
-- Debe retornar: cero filas

# 3. Columnas nuevas están intactas
SELECT age, sex FROM public.ecrf_opstar_records LIMIT 1;
-- Debe funcionar sin error
```

---

## 7. TESTING POST-EJECUCIÓN

### Test 1: Autenticación
```bash
# Como usuario no autenticado (anon key):
curl -X POST https://[project].supabase.co/rest/v1/rpc/create_draft_case_secure \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"p_hospital_id": "uuid"}'

# Esperado: error_code = "UNAUTHORIZED"
```

### Test 2: Autorización - hospital_user
```bash
# Usuario hospital_user del hospital A intenta crear en hospital B:
const response = await supabase.rpc('create_draft_case_secure', {
  p_hospital_id: 'hospital-b-uuid'
});

// Esperado: { success: false, error_code: 'FORBIDDEN' }
```

### Test 3: Autorización - monitor
```bash
# Usuario monitor intenta crear caso:
const response = await supabase.rpc('create_draft_case_secure', {
  p_hospital_id: 'any-hospital-uuid'
});

// Esperado: { success: false, error_code: 'FORBIDDEN', error: 'Rol monitor no está autorizado...' }
```

### Test 4: Autorización - admin
```bash
# Usuario admin crea en cualquier hospital:
const response = await supabase.rpc('create_draft_case_secure', {
  p_hospital_id: 'any-hospital-uuid'
});

// Esperado: { success: true, case_id: 'uuid', anonymous_code: 'XXX-0001', status: 'draft' }
```

### Test 5: Concurrencia
```bash
# Simular 5 creaciones simultáneas en el mismo hospital:
Promise.all([
  supabase.rpc('create_draft_case_secure', { p_hospital_id: 'hosp-uuid' }),
  supabase.rpc('create_draft_case_secure', { p_hospital_id: 'hosp-uuid' }),
  supabase.rpc('create_draft_case_secure', { p_hospital_id: 'hosp-uuid' }),
  supabase.rpc('create_draft_case_secure', { p_hospital_id: 'hosp-uuid' }),
  supabase.rpc('create_draft_case_secure', { p_hospital_id: 'hosp-uuid' })
]);

// Esperado: 5 casos con códigos distintos:
// XXX-0001, XXX-0002, XXX-0003, XXX-0004, XXX-0005
// (Nunca duplicados)
```

### Test 6: Generación de Código
```sql
-- Verificar secuencia de códigos:
SELECT 
  anonymous_code,
  hospital_id,
  created_at
FROM public.ecrf_opstar_records
WHERE hospital_id = 'hospital-uuid'
  AND anonymous_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- Esperado:
-- HSJ-0010
-- HSJ-0009
-- HSJ-0008
-- ...
-- HSJ-0001
```

---

## 8. CHECKLIST DE EJECUCIÓN

### Pre-Ejecución
- [ ] Preflight check: hospitales ACTIVOS sin short_name válido (0 errores)
- [ ] Preflight check: tabla hospital_case_counters no existe
- [ ] Preflight check: función create_draft_case_secure no existe
- [ ] Preflight check: tenemos permisos de CREATE en schema public
- [ ] Backup de BD completado
- [ ] Script de rollback preparado
- [ ] Equipo notificado de cambios

### Ejecución
- [ ] Ejecutar migración en dev/test
- [ ] Verificar que todas las fases completaron sin error
- [ ] Verificar que tabla hospital_case_counters existe
- [ ] Verificar que función create_draft_case_secure existe
- [ ] Verificar que índice idx_hospital_anonymous_code existe
- [ ] Verificar que permisos están asignados correctamente

### Post-Ejecución (Inmediato)
- [ ] Test 1: Autenticación (no autenticado falla)
- [ ] Test 2: Autorización hospital_user bloqueado en otro hospital
- [ ] Test 3: Autorización monitor bloqueado
- [ ] Test 4: Autorización admin funciona
- [ ] Test 5: Concurrencia (5 usuarios simultáneos, códigos únicos)
- [ ] Test 6: Generación de código (secuencia correcta)

### Post-Ejecución (Extended)
- [ ] Integrar Server Action en RegistryFormClient
- [ ] Test E2E: crear borrador → completar caso
- [ ] Verificar que state='draft' no valida completitud
- [ ] Verificar que anonymous_code es read-only en UI
- [ ] Monitoreo en producción: no hay errores en logs

### Rollback (Si Es Necesario)
- [ ] Ejecutar script de rollback
- [ ] Verificar que función se eliminó
- [ ] Verificar que tabla se eliminó
- [ ] Verificar que índice se eliminó
- [ ] Verificar que columnas nuevas se mantienen (NO se eliminaron)
- [ ] Reintentar ejecución de migración si fue error temporal

---

## ESTADO FINAL

### ✅ Listo para Ejecución

- ✅ Preflight checks definidos
- ✅ Monitor BLOQUEADO (igual que viewer)
- ✅ Error codes distinguidos (UNAUTHORIZED, FORBIDDEN, INVALID_HOSPITAL, INTERNAL_ERROR)
- ✅ Rollback no destructivo (columnas se mantienen)
- ✅ Atomicidad garantizada (INSERT ON CONFLICT)
- ✅ SECURITY DEFINER aplicado
- ✅ search_path explícito
- ✅ Permisos correctos (REVOKE PUBLIC + GRANT authenticated)
- ✅ Estado draft inicial
- ✅ Testing post-ejecución documentado

### Próximos Pasos

1. **Ejecutar en Dev:** Preflight checks + migración
2. **Testing:** Validar todos los 6 tests
3. **Ejecutar en Staging:** Preflight checks + migración
4. **Ejecutar en Producción:** Con backup + rollback listo

---

**Documento Confidencial - Uso Interno Únicamente**  
**Autorizado para Ejecución en Sprint 1**  
**Última Actualización:** 16-julio-2026
