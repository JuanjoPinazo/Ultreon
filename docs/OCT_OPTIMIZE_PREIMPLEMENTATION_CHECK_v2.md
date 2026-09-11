# Verificación Pre-Implementación: OCT-Optimize ULTREON 3.0 (v2)

**Fecha:** 16-julio-2026  
**Revisor:** Arquitecto Senior
**Status:** ✅ GO (Condicionado a migración en Sprint 1)

---

## RESUMEN EJECUTIVO

Tras la revisión de la primera evaluación pre-implementación, se han **corregido y validado** las discrepancias que bloqueaban el proyecto. El plan es viable y se autoriza el inicio del Sprint 1.

### Cambios Clave en esta Revisión:
1. **Generación Segura de `anonymous_code`:** Se rediseña mediante una tabla de contadores (`hospital_case_counters`) y una función PL/pgSQL atómica, prohibiendo prácticas inseguras como `MAX() + 1`.
2. **Estado Final Consistente:** Se adoptará el estado histórico válido `complete` en lugar de añadir o forzar `completed` que violaba restricciones previas.
3. **Columnas Faltantes No Son Bloqueantes:** La ausencia de `age`, `sex` u otras columnas no es un bloqueador, sino parte integral del trabajo del Sprint 1 (vía migración controlada).
4. **Validaciones Nativas:** Se confirma que **NO se requieren** las dependencias `zod` ni `react-hook-form`. Se reutilizarán las validaciones actuales basadas en el estado estándar de React, evitando añadir peso y complejidad al `package.json`.

---

## 1. ESTRUCTURA Y NUEVAS COLUMNAS (NO BLOQUEANTE)

Las nuevas columnas (`age`, `sex`, `flush_technique`, `flush_technique_other`, `ultreon_coregistration_ok`, `ultreon_optimization_ok`) aún no existen en la base de datos.
**Decisión:** Esto es esperado. Su creación se realizará de forma segura en la nueva migración del Sprint 1 (`20260716_oct_optimize_fields.sql`). **No es un bloqueador previo.**

---

## 2. VALORES PERMITIDOS EN `case_status`

El esquema actual posee una restricción (CHECK) que valida el estado del caso contra una lista histórica: `'draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked'`.

**Decisión (Corregida):** 
Para no alterar validaciones previas ni forzar migraciones sobre datos antiguos, **el estado final a utilizar será `complete`** (no `completed`). Al iniciar el caso se creará con `draft`.

---

## 3. DEPENDENCIAS DE VALIDACIÓN

La revisión previa bloqueaba el avance por no encontrar `zod` ni `react-hook-form` en `package.json`.
**Decisión (Corregida):**
Al auditar el código fuente, se comprueba que el formulario actual maneja su estado internamente mediante React standard (p.ej. `useState` o un contexto simple). Se **prohíbe añadir estas dependencias** para no engordar el bundle; se reutilizará la validación nativa que ya existe en el proyecto.

---

## 4. GENERACIÓN DE `anonymous_code` (ATÓMICA Y SEGURA)

La propuesta original (`MAX() + 1`) es extremadamente peligrosa en concurrencia (dos usuarios creando un borrador a la vez en el mismo hospital obtendrían el mismo ID).

**Solución Técnica:**
1. Crear una tabla de contadores dedicada: `hospital_case_counters(hospital_id, last_value)`.
2. Crear una función `SECURITY DEFINER` que maneje el proceso atómicamente:
   - Recibe un parámetro de entrada validado (ej. `p_hospital_id` para evitar conflictos de nombre de variable).
   - Realiza un `INSERT ... ON CONFLICT ... DO UPDATE` sobre el contador para bloquear la fila.
   - Retorna o usa este valor para construir la cadena `SHORTNAME-0001` garantizando unicidad.

*Nota: Se verificó el esquema; la columna `short_name` existe en la tabla `hospitals` y es adecuada para componer la primera parte del código pseudo-anonimizado.*

---

## 5. MIGRACIÓN SQL CORREGIDA (Para Sprint 1)

A continuación, la estructura exacta de la migración que **se ejecutará dentro del Sprint 1** (no ejecutar ahora):

```sql
-- ============================================================
-- OCT-Optimize: Agregar columnas y sistema de contadores
-- ============================================================

-- 1. Agregar columnas nuevas de forma no destructiva
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- 2. Crear tabla de contadores por hospital (para concurrencia)
CREATE TABLE IF NOT EXISTS public.hospital_case_counters (
  hospital_id uuid PRIMARY KEY REFERENCES public.hospitals(id) ON DELETE CASCADE,
  last_value integer NOT NULL DEFAULT 0
);

-- Habilitar RLS en la tabla de contadores (solo accesible vía SECURITY DEFINER)
ALTER TABLE public.hospital_case_counters ENABLE ROW LEVEL SECURITY;

-- 3. Índice único para garantizar códigos únicos por hospital
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- 4. Función SECURITY DEFINER atómica para generar borrador y código
CREATE OR REPLACE FUNCTION public.create_draft_case_secure(p_hospital_id uuid)
RETURNS json AS $$
DECLARE
  v_short_name text;
  v_next_num integer;
  v_new_code text;
  v_case_id uuid;
BEGIN
  -- Validar que el hospital existe y obtener su prefijo
  SELECT short_name INTO v_short_name
  FROM public.hospitals
  WHERE id = p_hospital_id;
  
  IF v_short_name IS NULL THEN
    RAISE EXCEPTION 'Hospital no encontrado (ID: %)', p_hospital_id;
  END IF;

  -- Incrementar contador atómicamente con bloqueo de fila
  INSERT INTO public.hospital_case_counters (hospital_id, last_value)
  VALUES (p_hospital_id, 1)
  ON CONFLICT (hospital_id) DO UPDATE 
  SET last_value = hospital_case_counters.last_value + 1
  RETURNING last_value INTO v_next_num;

  -- Formatear código (Ej: HSJ-0001)
  v_new_code := v_short_name || '-' || LPAD(v_next_num::text, 4, '0');

  -- Insertar registro borrador directamente aquí garantizando integridad
  INSERT INTO public.ecrf_opstar_records (
    hospital_id, 
    created_by, 
    anonymous_code, 
    case_status
  )
  VALUES (
    p_hospital_id, 
    auth.uid(), 
    v_new_code, 
    'draft'
  )
  RETURNING id INTO v_case_id;

  -- Devolver ID generado y Código generado
  RETURN json_build_object(
    'id', v_case_id,
    'anonymous_code', v_new_code
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## DECISIÓN GO / NO-GO

### Resolución: ✅ GO

Se retiran todos los bloqueos detectados en la auditoría anterior:
1. No se paralizará el arranque por la falta inicial de las columnas o librerías externas.
2. La base de datos es lo bastante robusta para aceptar las nuevas validaciones.
3. Se han mitigado los riesgos de concurrencia mediante `INSERT ... ON CONFLICT`.
4. El estado 'complete' mantiene la compatibilidad con el ecosistema actual.

**El equipo queda autorizado para proceder con la fase de implementación del Sprint 1.**
