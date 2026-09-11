# Revisión Final de Migración: OCT-Optimize ULTREON 3.0 (v2)
**Función Segura `create_draft_case_secure` - Versión Ejecutable**

**Fecha:** 16-julio-2026  
**Revisor:** Arquitecto Senior  
**Status:** ✅ Listo para Sprint 1  
**Aplicadas:** 7 correcciones críticas

---

## TABLA DE CORRECCIONES APLICADAS

| # | Corrección | Status | Validación |
|----|-----------|--------|-----------|
| 1 | CREATE OR REPLACE FUNCTION con SET search_path en firma | ✅ | Estructura válida |
| 2 | VOLATILE (eliminar STABLE) | ✅ | Función escribe datos |
| 3 | Autorización explícita por rol | ✅ | admin/hospital_user/monitor/bloquear viewer |
| 4 | Verificar profiles.id (no user_id) | ✅ | Confirmado en schema |
| 5 | No ALTER COLUMN sin verificación | ✅ | Migración sin sentencia destructiva |
| 6 | REVOKE PUBLIC + GRANT authenticated | ✅ | Mantiene seguridad |
| 7 | Retorna jsonb (no json) | ✅ | Tipo correcto |

---

## MIGRACIÓN EJECUTABLE COMPLETA

```sql
-- ============================================================
-- OCT-Optimize: Migración para Sprint 1
-- Archivo: supabase/migrations/20260716_oct_optimize_fields.sql
-- ============================================================

-- 1. Agregar columnas nuevas de forma no destructiva
-- (Verificar que no existen antes de ejecutar)
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- 2. Crear tabla de contadores por hospital (para generación atómica)
CREATE TABLE IF NOT EXISTS public.hospital_case_counters (
  hospital_id uuid PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
  last_value integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Habilitar RLS en tabla de contadores (acceso restringido a SECURITY DEFINER)
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- 4. Crear política RLS: solo SECURITY DEFINER puede acceder
CREATE POLICY hospital_case_counters_security_definer ON public.hospital_case_counters
  FOR ALL USING (FALSE) WITH CHECK (FALSE);

-- 5. Crear índice único para garantizar códigos únicos por hospital
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- ============================================================
-- FUNCIÓN SEGURA: Crear caso en draft de forma atómica
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
    RAISE EXCEPTION 'No autenticado: auth.uid() no disponible';
  END IF;

  -- ========== PASO 2: OBTENER PERFIL DEL USUARIO ==========
  SELECT p.role, p.hospital_id
  INTO v_user_role, v_user_hospital_id
  FROM public.profiles p
  WHERE p.id = v_current_user_id AND p.is_active = true;

  IF v_user_role IS NULL THEN
    RAISE EXCEPTION 'Usuario inactivo o perfil no encontrado (ID: %)', v_current_user_id;
  END IF;

  -- ========== PASO 3: AUTORIZACIÓN EXPLÍCITA POR ROL ==========
  -- Roles válidos: admin (cualquier hospital), hospital_user (solo su hospital), monitor (decisión)
  -- Bloqueados: viewer, otros roles desconocidos
  
  CASE v_user_role
    WHEN 'admin' THEN
      -- Admin puede crear en cualquier hospital activo
      NULL; -- Permitir, validar hospital existe más abajo
    
    WHEN 'hospital_user' THEN
      -- Hospital user solo puede crear en su hospital asignado
      IF v_user_hospital_id IS NULL THEN
        RAISE EXCEPTION 'Hospital user sin hospital asignado (ID: %)', v_current_user_id;
      END IF;
      
      IF v_user_hospital_id != p_hospital_id THEN
        RAISE EXCEPTION 'Permiso denegado: usuario del hospital % intentó crear caso en hospital %',
          v_user_hospital_id, p_hospital_id;
      END IF;
    
    WHEN 'monitor' THEN
      -- Monitor puede crear en cualquier hospital (decisión: permite coordinación)
      NULL; -- Permitir
    
    WHEN 'viewer' THEN
      -- Viewer bloqueado
      RAISE EXCEPTION 'Permiso denegado: rol viewer no puede crear casos';
    
    ELSE
      -- Rol desconocido, bloquear por seguridad
      RAISE EXCEPTION 'Rol desconocido o no autorizado: %', v_user_role;
  END CASE;

  -- ========== PASO 4: VALIDACIÓN DEL HOSPITAL ==========
  SELECT h.short_name, h.is_active
  INTO v_short_name, v_hospital_is_active
  FROM public.hospitals h
  WHERE h.id = p_hospital_id;

  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'Hospital no encontrado (ID: %)', p_hospital_id;
  END IF;

  IF v_hospital_is_active IS FALSE THEN
    RAISE EXCEPTION 'Hospital inactivo (ID: %)', p_hospital_id;
  END IF;

  -- ========== PASO 5: NORMALIZAR Y VALIDAR short_name ==========
  v_short_name_normalized := UPPER(TRIM(v_short_name));
  
  -- Validar que solo contiene caracteres alfanuméricos (prevenir inyección)
  IF NOT v_short_name_normalized ~ '^[A-Z0-9]+$' THEN
    RAISE EXCEPTION 'Prefijo de hospital contiene caracteres inválidos: %', v_short_name;
  END IF;

  -- Validar longitud razonable (máx 10 caracteres)
  IF LENGTH(v_short_name_normalized) > 10 THEN
    RAISE EXCEPTION 'Prefijo de hospital demasiado largo: %', v_short_name;
  END IF;

  -- ========== PASO 6: GENERAR CÓDIGO ATÓMICAMENTE ==========
  -- Usar INSERT ... ON CONFLICT para garantizar atomicidad
  -- Esto evita race conditions donde dos usuarios obtengan el mismo número
  
  INSERT INTO public.hospital_case_counters (hospital_id, last_value, created_at, updated_at)
  VALUES (p_hospital_id, 1, now(), now())
  ON CONFLICT (hospital_id) DO UPDATE 
  SET 
    last_value = hospital_case_counters.last_value + 1,
    updated_at = now()
  RETURNING last_value INTO v_next_num;

  IF v_next_num IS NULL OR v_next_num <= 0 THEN
    RAISE EXCEPTION 'Fallo al incrementar contador para hospital %', p_hospital_id;
  END IF;

  -- Formatear código pseudo-anonimizado (Ej: HSJ-0001)
  v_new_code := v_short_name_normalized || '-' || LPAD(v_next_num::text, 4, '0');

  -- ========== PASO 7: VALIDACIÓN REDUNDANTE ANTI-COLISIÓN ==========
  -- Double-check después de generar código
  -- (Protege contra fallos extremos de concurrencia)
  
  SELECT COUNT(*) INTO v_collision_check
  FROM public.ecrf_opstar_records
  WHERE hospital_id = p_hospital_id AND anonymous_code = v_new_code;

  IF v_collision_check > 0 THEN
    RAISE EXCEPTION 'Código pseudo-anonimizado ya existe (colisión detectada): %', v_new_code;
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
    RAISE EXCEPTION 'Fallo al crear registro de caso';
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
  -- Loguear error detallado (sin exponerlo al cliente en producción)
  RAISE NOTICE 'create_draft_case_secure error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
  
  -- Retornar error en mismo formato jsonb
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'error_code', SQLSTATE
  );
END;
$$;

-- ========== PERMISOS DE EJECUCIÓN ==========

-- 6. REVOCAR permisos de PUBLIC (seguridad por defecto)
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;

-- 6. CONCEDER permisos solo a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) TO authenticated;

-- ========== DOCUMENTACIÓN ==========

COMMENT ON FUNCTION public.create_draft_case_secure(uuid) IS
'Crea un registro de caso borrador (draft) de forma atómica y segura.

AUTENTICACIÓN:
- Requiere auth.uid() disponible (usuario autenticado)

AUTORIZACIÓN (por rol):
- admin: puede crear en cualquier hospital activo
- hospital_user: solo en su hospital asignado
- monitor: puede crear en cualquier hospital (permite coordinación)
- viewer: BLOQUEADO
- otros roles: BLOQUEADO por seguridad

GARANTÍAS:
- Validación de hospital (existe, activo)
- Normalización de short_name (alphanumeric)
- Generación atómica de anonymous_code (no race conditions)
- Inicialización en estado draft
- Double-check anti-colisión

PARÁMETROS:
- p_hospital_id: UUID del hospital destino

RETORNA (jsonb):
- success: true/false
- case_id: UUID del caso creado (si success=true)
- anonymous_code: Código pseudo-anonimizado (ej: HSJ-0001)
- status: siempre "draft"
- created_at: timestamp de creación
- error: mensaje de error (si success=false)
- error_code: código SQLSTATE de error

EXCEPCIONES COMUNES:
- No autenticado: auth.uid() IS NULL
- Usuario inactivo: perfil no encontrado o is_active=false
- Permiso denegado: hospital_user intenta crear en otro hospital
- Hospital no encontrado: ID inválido o inactivo
- Rol desconocido: role no es uno de {admin, hospital_user, monitor, viewer}

NOTAS:
- La función usa SECURITY DEFINER para acceder a hospital_case_counters con RLS
- El contador se incrementa atómicamente usando INSERT ... ON CONFLICT
- created_by se establece automáticamente a auth.uid()
- No valida completitud de datos (otros campos pueden ser NULL en draft)
';

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
```

---

## VALIDACIÓN DE ESTRUCTURA

### Sintaxis Correcta

✅ **Firma de función:**
```sql
CREATE OR REPLACE FUNCTION public.create_draft_case_secure(p_hospital_id uuid)
RETURNS jsonb                          -- Tipo de retorno
LANGUAGE plpgsql                       -- Lenguaje
SECURITY DEFINER                       -- Ejecuta con permisos de owner
SET search_path = public               -- Búsqueda de objetos
AS $$                                  -- Inicio de código
DECLARE
  ...
$$;                                    -- Fin de código
```

✅ **VOLATILE implícito:**
- No se especifica STABLE (erróneamente en v1)
- La función inserta y actualiza datos → automáticamente VOLATILE
- PostgreSQL lo asume por defecto cuando hay DML (INSERT, UPDATE)

✅ **Tipo de retorno jsonb:**
```sql
RETURN jsonb_build_object(
  'success', true,
  'case_id', v_case_id,
  'anonymous_code', v_new_code,
  ...
);
```

---

## VERIFICACIÓN DE AUTORIZACIÓN

### Estructura de Roles (Confirmada en Schema)

```sql
-- De supabase_schema.sql (línea 27):
role text not null default 'hospital_user' 
  check (role in ('admin', 'hospital_user', 'monitor', 'viewer'))
```

### Lógica de Autorización Implementada

```sql
CASE v_user_role
  WHEN 'admin' THEN
    -- ✅ Permitir cualquier hospital activo
    
  WHEN 'hospital_user' THEN
    -- ✅ Solo su hospital asignado
    IF v_user_hospital_id != p_hospital_id THEN
      RAISE EXCEPTION '...';
    END IF;
    
  WHEN 'monitor' THEN
    -- ✅ Permitir cualquier hospital (decisión: permite coordinación)
    
  WHEN 'viewer' THEN
    -- ❌ BLOQUEADO explícitamente
    RAISE EXCEPTION 'Permiso denegado: rol viewer...';
    
  ELSE
    -- ❌ Cualquier otro rol desconocido
    RAISE EXCEPTION 'Rol desconocido o no autorizado...';
END CASE;
```

---

## VERIFICACIÓN DE SCHEMA

### Confirmado en supabase_schema.sql

✅ **Tabla profiles:**
```sql
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'hospital_user' 
    check (role in ('admin', 'hospital_user', 'monitor', 'viewer')),
  hospital_id uuid references public.hospitals(id) on delete set null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

✅ **Relación correcta:** `profiles.id` (no user_id) referencia `auth.users(id)`

✅ **Hospital asignación:** `profiles.hospital_id` referencia `hospitals(id)`

---

## MIGRACIÓN SEGURA (SIN ALTER DESTRUCTIVO)

### ✅ No se modifican columnas existentes

- NO hay `ALTER COLUMN ... SET NOT NULL` sin verificación
- NO hay `DROP COLUMN`
- NO hay `ALTER COLUMN ... SET DEFAULT` que afecte datos existentes
- Todas las nuevas columnas tienen `DEFAULT NULL`

### ✅ Estrategia de columnas nuevas

```sql
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  -- Resto de columnas nuevas...
```

**Garantía:** Si la columna ya existe, `IF NOT EXISTS` la ignora (idempotente)

---

## PERMISOS DE SEGURIDAD

### Cadena de Permisos

```sql
-- 1. REVOKE: Eliminar acceso por defecto
REVOKE EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) FROM PUBLIC;

-- 2. GRANT: Conceder únicamente a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.create_draft_case_secure(uuid) TO authenticated;

-- 3. SECURITY DEFINER: Función ejecuta con permisos del owner (postgres)
CREATE OR REPLACE FUNCTION ... SECURITY DEFINER ...
```

**Flujo:**
- Usuario autenticado → puede ejecutar función (GRANT authenticated)
- Función ejecuta como owner → puede modificar hospital_case_counters (SECURITY DEFINER)
- Tabla hospital_case_counters tiene RLS → solo SECURITY DEFINER puede acceder

---

## TESTING RECOMENDADO (Pre-Sprint 1)

### Test 1: Autenticación
```sql
-- Como anon (no autenticado):
SELECT create_draft_case_secure('hospital-uuid'::uuid);
-- Debe fallar: "No autenticado: auth.uid() no disponible"
```

### Test 2: Autorización - hospital_user
```sql
-- Usuario hospital_user del hospital A intenta crear en hospital B:
SELECT create_draft_case_secure('hospital-b-uuid'::uuid);
-- Debe fallar: "Permiso denegado: usuario del hospital ... intentó crear caso en hospital ..."
```

### Test 3: Autorización - admin
```sql
-- Usuario admin puede crear en cualquier hospital:
SELECT create_draft_case_secure('any-hospital-uuid'::uuid);
-- Debe retornar: {success: true, case_id: '...', anonymous_code: 'XXX-0001', ...}
```

### Test 4: Concurrencia
```bash
# Desde dos sesiones simultáneamente, mismo hospital:
psql -c "SELECT create_draft_case_secure('hospital-uuid'::uuid);"
psql -c "SELECT create_draft_case_secure('hospital-uuid'::uuid);"

# Resultado esperado:
# Session 1: anonymous_code = 'HSJ-0001'
# Session 2: anonymous_code = 'HSJ-0002'
# (Nunca duplicados)
```

### Test 5: Generación de Código
```sql
-- Verificar formato y unicidad:
SELECT anonymous_code 
FROM ecrf_opstar_records 
WHERE hospital_id = 'hospital-uuid'::uuid 
ORDER BY created_at DESC 
LIMIT 5;

-- Resultado esperado:
-- HSJ-0005
-- HSJ-0004
-- HSJ-0003
-- HSJ-0002
-- HSJ-0001
```

---

## INTEGRACIÓN EN SERVER ACTION

```typescript
// app/registry/new/actions.ts

export async function createDraftCase(hospitalId: string) {
  try {
    const supabase = await createServerClient();
    
    // Llamar a la función PL/pgSQL segura
    const { data, error } = await supabase.rpc(
      'create_draft_case_secure',
      { p_hospital_id: hospitalId }
    );
    
    if (error) {
      console.error('create_draft_case_secure error:', error.message);
      return { success: false, error: error.message };
    }
    
    if (!data?.success) {
      return { success: false, error: data?.error || 'Error desconocido' };
    }
    
    // data = { success: true, case_id, anonymous_code, status, created_at, hospital_id }
    return { 
      success: true, 
      caseId: data.case_id, 
      code: data.anonymous_code,
      createdAt: data.created_at
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Error creando borrador' };
  }
}
```

---

## CHECKLIST FINAL

### Pre-Implementación
- [x] Función SQL correctamente formada (CREATE OR REPLACE, RETURNS jsonb, SET search_path)
- [x] VOLATILE implícito (no STABLE)
- [x] Autorización explícita por rol (admin, hospital_user, monitor, bloquear viewer)
- [x] Validación de profiles.id (no user_id)
- [x] Sin ALTER COLUMN destructivo
- [x] REVOKE PUBLIC + GRANT authenticated
- [x] Retorna jsonb

### Ejecución en Sprint 1
- [ ] Ejecutar migración en dev
- [ ] Crear tabla hospital_case_counters
- [ ] Verificar función ejecuta sin errores
- [ ] Test de autorización (hospital_user bloqueado en otro hospital)
- [ ] Test de concurrencia (2+ usuarios simultáneos)
- [ ] Test de generación de código (formato correcto)
- [ ] Integrar Server Action en UI
- [ ] Test E2E: crear borrador → completar caso

---

## ESTADO FINAL

### ✅ Autorizado para Sprint 1

La función `create_draft_case_secure` cumple todos los requisitos:
- ✅ Estructura SQL válida y ejecutable
- ✅ Autorización por rol explícita
- ✅ Generación atómica de código
- ✅ Validación de datos robusta
- ✅ Manejo de excepciones
- ✅ Permisos de seguridad

**Próximo paso:** Ejecutar migración `20260716_oct_optimize_fields.sql` en dev y proceder con integración UI.

---

**Documento Confidencial - Uso Interno Únicamente**  
**Listo para Ejecución en Sprint 1**  
**Última Revisión:** 16-julio-2026
