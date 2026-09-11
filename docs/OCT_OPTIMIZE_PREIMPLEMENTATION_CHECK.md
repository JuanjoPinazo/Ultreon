# Verificación Pre-Implementación: OCT-Optimize ULTREON 3.0
**Análisis de Discrepancias entre Diseño Técnico y Código Real**

**Fecha:** 16-julio-2026  
**Revisor:** Claude Code  
**Status:** ⏸️ BLOQUEADO - Decisión NO-GO hasta resolución

---

## RESUMEN EJECUTIVO

Se encontraron **7 discrepancias críticas** que requieren resolución antes de Sprint 1:

| # | Severidad | Aspecto | Estado |
|---|-----------|--------|--------|
| 1 | 🔴 CRÍTICO | Columnas nuevas no existen en migraciones | Bloqueante |
| 2 | 🔴 CRÍTICO | `case_status` inválido ('completed' viola CHECK) | Bloqueante |
| 3 | 🔴 CRÍTICO | React Hook Form + Zod no en package.json | Bloqueante |
| 4 | 🟠 ALTO | Almacenamiento array vs texto de `strategy_change_type` | Resolvible |
| 5 | 🟠 ALTO | No hay generación automática de `anonymous_code` | Resolvible |
| 6 | 🟡 MEDIO | Borrador vacío es imposible (campos obligatorios) | Resolvible |
| 7 | 🟡 MEDIO | `procedure_date` tipo DATE requiere validación Zod | Resolvible |

---

## 1. ESTRUCTURA REAL DE `ecrf_opstar_records`

### 1.1 Columnas Existentes (Confirmadas en Migraciones)

**De 20260630_zero_contrast_alignment.sql:**
```
✅ id (uuid, PK)
✅ hospital_id (uuid, FK)
✅ operator_id (uuid, FK)
✅ procedure_date (date)
✅ patient_code (text)
✅ local_nhc (text)
✅ local_sip (text)
✅ anonymous_code (text)
✅ coronary_segment (text)
✅ coronary_vessel (text)
✅ coronary_group (text)
✅ projection_horizontal (text)
✅ projection_vertical (text)
✅ axial_rotation (numeric)
✅ saline_protocol_used (boolean DEFAULT true)
✅ syringe_size_ml (numeric)
✅ fast_pullback_seconds (numeric)
✅ contrast_during_oct_ml (numeric)
✅ total_contrast_ml (numeric)
✅ wash_quality (text)
✅ contrast_conversion_needed (boolean)
✅ contrast_conversion_reason (text)
✅ ultreon_modified_strategy (boolean)
✅ strategy_change_type (text)
✅ strategy_change_notes (text)
✅ case_status (text DEFAULT 'completed')
✅ created_by (uuid, FK)
✅ created_at (timestamptz DEFAULT now())
✅ updated_at (timestamptz DEFAULT now())
```

**De 20250527_case_quality_system.sql:**
```
✅ locked (boolean DEFAULT false)
✅ monitor_validated (boolean DEFAULT false)
```

### 1.2 Columnas Propuestas pero NO Existentes

❌ **NO EXISTEN en migraciones:**
```
❌ age (INTEGER) - PROPUESTO
❌ sex (TEXT) - PROPUESTO
❌ flush_technique (TEXT) - PROPUESTO
❌ flush_technique_other (TEXT) - PROPUESTO
❌ ultreon_coregistration_ok (BOOLEAN) - PROPUESTO
❌ ultreon_optimization_ok (BOOLEAN) - PROPUESTO
```

**Acción Requerida:** Crear nueva migración `20260716_oct_optimize_fields.sql`

---

## 2. COLUMNAS NOT NULL Y VALORES POR DEFECTO

### 2.1 Análisis de NOT NULL

De las migraciones, se obtiene:

| Campo | NULL? | DEFAULT | Validación |
|-------|-------|---------|-----------|
| `procedure_date` | ❓ No especificado | Ninguno | Puede ser NULL (problema) |
| `patient_code` | ❓ No especificado | Ninguno | Puede ser NULL (problema) |
| `contrast_during_oct_ml` | ❓ No especificado | Ninguno | Puede ser NULL (problema) |
| `wash_quality` | ❓ No especificado | Ninguno | Puede ser NULL (problema) |
| `case_status` | Permite NULL | DEFAULT 'completed' | CHECK viola con 'completed' |
| `saline_protocol_used` | Permite NULL | TRUE | Razonable |

**Hallazgo:** Las migraciones NO especifican `NOT NULL` explícitamente. Esto permite NULLs donde el diseño funcional requiere obligatorios.

**Problema en saveRegistryCaseAction (línea 388-393):**
```typescript
if (!payload.patient_code) return { error: '...' };
if (!payload.wash_quality) return { error: '...' };
// ...valida en aplicación, pero BD permite NULL
```

**Acción Requerida:** Actualizar migración para añadir `NOT NULL` donde corresponda.

---

## 3. VALORES PERMITIDOS EN `case_status`

### 🔴 CRÍTICO: Conflicto de Restricciones

**Migración 20250527_case_quality_system.sql:**
```sql
add column if not exists case_status text default 'draft' check (
  case_status in ('draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked')
)
```

**Migración 20260630_zero_contrast_alignment.sql:**
```sql
ADD COLUMN IF NOT EXISTS case_status text DEFAULT 'completed';
```

### ❌ Problema

- Primera migración define CHECK con valores: `'draft'`, `'incomplete'`, `'complete'`, `'pending_corelab'`, `'validated'`, `'locked'`
- Segunda migración intenta establecer DEFAULT `'completed'` ❌ **NO ESTÁ en la lista del CHECK**
- El código actual usa `'completed'` (línea 519 en RegistryFormClient.tsx) ❌ **VIOLA el CHECK**

### Soluciones Posibles

**Opción A:** Usar valor válido según primer CHECK
```typescript
case_status: 'complete' // en lugar de 'completed'
```

**Opción B:** Actualizar el CHECK en nueva migración
```sql
ALTER TABLE public.ecrf_opstar_records
  DROP CONSTRAINT ecrf_opstar_records_case_status_check;

ALTER TABLE public.ecrf_opstar_records
  ADD CONSTRAINT ecrf_opstar_records_case_status_check 
  CHECK (case_status IN ('draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked', 'completed'));
```

**Recomendación:** Opción B (preserva otros estados del sistema). Pero requiere coordinación.

**Acción Requerida:** Decisión del DPO/IP sobre estado final del caso (¿'complete' o 'completed'?).

---

## 4. ALMACENAMIENTO DE `strategy_change_type`

### Estado Actual

**Tipo en BD:** `TEXT` (no array)

**En RegistryFormClient.tsx (línea ~340):**
```typescript
const changeTypes: string[] = [];
if (formData.modificoEstrategiaUltreon) {
  if (formData.changedStentDiameter) changeTypes.push('diameter');
  if (formData.changedStentLength) changeTypes.push('length');
  // ...
}
const strategyChangeType = changeTypes.join(', ');
```

**En payload:**
```typescript
strategy_change_type: strategyChangeType || null, // Ej: "diameter, length"
```

### Diseño Técnico Propone

```typescript
strategy_change_type: z.array(z.string()).optional(),
```

### Análisis

✅ **Actual funciona:** Se serializa array a string con `join(', ')`  
❌ **Propuesto no sincroniza:** Zod valida array, pero se almacena string

### Soluciones

**Opción A:** Mantener string serializado (actual)
```typescript
z.string().optional() // "diameter, length"
```

**Opción B:** Almacenar JSON en BD
```typescript
z.array(z.string()).transform(arr => JSON.stringify(arr))
// En BD: ["diameter", "length"]
```

**Recomendación:** Opción A (mantener actual, es más simple).

**Acción Requerida:** Ajustar esquema Zod propuesto en diseño técnico.

---

## 5. `anonymous_code`: Restricciones y Generación

### Estado Actual

**En BD:** Campo `TEXT` existente sin restricciones especiales
```sql
ADD COLUMN IF NOT EXISTS anonymous_code text
```

**En código:** Se envía manualmente desde frontend
```typescript
anonymous_code: formData.idPaciente || null,
```

**En migrations:** NO hay índice único, NO hay trigger de generación

### Diseño Técnico Propone

1. Auto-generación en servidor
2. Formato: `[SHORT_NAME_HOSPITAL]-[NUMERO_SECUENCIAL_4_DIGITOS]` (Ej: `HSJ-0001`)
3. Índice único: `CREATE UNIQUE INDEX idx_hospital_anonymous_code ON public.ecrf_opstar_records(hospital_id, anonymous_code)`
4. Bloqueo de concurrencia: PL/pgSQL trigger o secuencia

### Problema

✅ Migración propuesta existe en diseño técnico (sección 12)  
❌ NO está ejecutada  
❌ NO hay lógica de generación en BD ni en aplicación

### Acción Requerida

1. Ejecutar migración con índice
2. Crear Server Action `generatePatientCode(hospital_id: UUID): string`
3. Llamarlo en `createDraftCase()` ANTES de insertar

---

## 6. `operator_id` y `hospital_id`

### Verificación

✅ **`operator_id`** existe en BD (migración 20260630_zero_contrast_alignment.sql)
```sql
ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES public.operators(id) ON DELETE SET NULL
```

✅ **`hospital_id`** existe en BD (desde migraciones iniciales, línea 35 de supabase_schema.sql)

✅ Ambas son FK a tablas existentes

**Status:** ✅ SIN PROBLEMAS

---

## 7. CREAR BORRADOR VACÍO

### Estado Actual

**saveRegistryCaseAction (línea 385-393) valida:**
```typescript
if (!payload.hospital_id) return { error: '...' };
if (!payload.operator_id) return { error: '...' };
if (!payload.procedure_date) return { error: '...' };
if (!payload.patient_code) return { error: '...' };  // ❌ BLOQUEANTE
if (!payload.coronary_segment) return { error: '...' };
if (payload.contrast_during_oct_ml === undefined) return { error: '...' };
if (!payload.wash_quality) return { error: '...' }; // ❌ BLOQUEANTE
```

### Problema

❌ **Imposible crear borrador vacío** porque valida TODO al insertar

El diseño funcional V2 requiere:
```
1. Usuario abre formulario → createDraftCase()
2. Se crea registro VACÍO en BD con estado 'draft'
3. Se recupera ID y anonymous_code generado
4. Usuario completa Paso 1 → saveDraftCase(partialData)
5. ...Paso 4 → completeCase(fullData)
```

### Acción Requerida

Crear 3 Server Actions NUEVAS:

**1. `createDraftCase(hospital_id)`**
```typescript
export async function createDraftCase(hospital_id: string) {
  // INSERT caso VACÍO con status='draft'
  // Genera anonymous_code automáticamente
  // Retorna {id, anonymous_code}
}
```

**2. `saveDraftCase(id, partialData)`**
```typescript
export async function saveDraftCase(id: string, data: Partial<eCRFSchema>) {
  // UPDATE parcial (UPSERT) del caso
  // NO valida completitud
}
```

**3. `completeCase(id, fullData)`**
```typescript
export async function completeCase(id: string, data: eCRFSchema) {
  // UPDATE final
  // Valida completitud ANTES de cambiar a 'complete'/'completed'
  // Establece status='completed' (o el valor acordado)
}
```

---

## 8. INSERT + UPDATE vs UPSERT

### Estado Actual

**saveRegistryCaseAction usa INSERT:**
```typescript
const { data: insertedCase, error: caseError } = await supabase
  .from('ecrf_opstar_records')
  .insert([insertData])
  .select('id')
  .single();
```

**Problema:** Si el usuario recarga en mitad de Paso 2, intenta INSERT de nuevo → falla por duplicado (o no, depende de si hay PK)

### Diseño Propone

Uso de `saveDraftCase` con UPDATE:
```typescript
.update(data)
.eq('id', id)
```

### Análisis

✅ **Para borradores:** UPDATE es correcto (mismo registro, actualización parcial)  
✅ **Para completar:** UPDATE es correcto (cambiar estado a 'completed')  
❌ **Para crear:** INSERT es correcto (primer registro)

### Recomendación

```typescript
// createDraftCase: INSERT registro vacío
// saveDraftCase: UPDATE parcial
// completeCase: UPDATE + validación
```

**Acción Requerida:** Implementar las 3 funciones de forma separada, NO usar UPSERT para todo.

---

## 9. `procedure_date` VALIDACIÓN ZOD

### Problema

**Tipo en BD:** `DATE`  
**Tipo HTML Input:** `<input type="date">` genera string `"2026-09-15"`  
**Tipo Zod Propuesto:** `z.date()`

### Flujo Problemático

```typescript
// HTML Input value: "2026-09-15" (string)
// Zod: z.date() espera objeto Date
const parsed = schema.parse(formData); // ❌ FALLA

// Solución: Convertir string → Date ANTES de Zod
const dateValue = new Date(formData.get('procedure_date'));
```

### Esquema Correcto

```typescript
procedure_date: z.string().pipe(z.coerce.date()).or(z.date()),
```

O en servidor (Server Action):
```typescript
procedure_date: new Date(payload.procedure_date).toISOString().split('T')[0],
```

**Acción Requerida:** Ajustar esquema Zod propuesto en diseño técnico.

---

## 10. COMPATIBILIDAD DE COLUMNAS PROPUESTAS

### Nueva Migración Requerida: `20260716_oct_optimize_fields.sql`

```sql
-- Agregar columnas nuevas (nunca existieron)
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- Índice para concurrencia de códigos pseudo-anonimizados
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- Corregir case_status CHECK si es necesario
ALTER TABLE public.ecrf_opstar_records
  DROP CONSTRAINT IF EXISTS ecrf_opstar_records_case_status_check;

ALTER TABLE public.ecrf_opstar_records
  ADD CONSTRAINT ecrf_opstar_records_case_status_check 
  CHECK (case_status IN (
    'draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked', 'completed'
  ));

-- Marcar procedure_date, patient_code, contrast_during_oct_ml como NOT NULL si aplica
-- (Requiere revisión previa porque pueden haber registros NULL existentes)
```

---

## DISCREPANCIAS ENCONTRADAS: TABLA RESUMIDA

| # | Aspecto | Diseño Técnico Dice | Realidad | Impacto |
|----|--------|---|---|---|
| 1 | Columnas `age`, `sex`, `flush_technique*` | Existen en BD | ❌ NO existen | 🔴 Crítico |
| 2 | `case_status` valores | 'draft' / 'completed' | CHECK: 'draft'/'complete'/otros; DEFAULT 'completed' viola | 🔴 Crítico |
| 3 | React Hook Form + Zod | Necesarios para esquema | ❌ NO en package.json | 🔴 Crítico |
| 4 | `strategy_change_type` tipo | z.array() | Almacena TEXT (join string) | 🟠 Alto |
| 5 | `anonymous_code` generación | Auto-generado servidor | Manual en cliente | 🟠 Alto |
| 6 | Crear borrador vacío | `createDraftCase()` | saveRegistryCaseAction valida TODO | 🟡 Medio |
| 7 | `procedure_date` Zod | z.date() | Requiere coerce de string | 🟡 Medio |
| 8 | INSERT/UPDATE split | 3 funciones | 1 función (saveRegistryCaseAction) | 🟠 Alto |
| 9 | NOT NULL en campos | Se asume | No especificado en migraciones | 🟡 Medio |
| 10 | Índice único anon_code | Propuesto | ❌ No existe | 🟠 Alto |

---

## DISEÑO CORREGIDO

### Cambios Necesarios en Diseño Técnico

#### A. Esquema Zod Corregido

```typescript
export const eCRFSchema = z.object({
  id: z.string().uuid().optional(),
  hospital_id: z.string().uuid(),
  operator_id: z.string().uuid(),
  anonymous_code: z.string().optional(), // Read-only en UI
  procedure_date: z.string().pipe(z.coerce.date()).refine(
    d => d >= new Date('2026-09-01'), 
    'Fecha debe ser en o después de sep 2026'
  ),
  age: z.number().int().min(18).max(120),
  sex: z.enum(['M', 'F']),
  
  coronary_segment: z.string().min(1, 'Vaso diana obligatorio'),
  total_contrast_ml: z.number().min(0),
  
  flush_technique: z.enum(['saline', 'contrast', 'diluted_contrast', 'other']),
  flush_technique_other: z.string().max(100).optional(),
  
  contrast_during_oct_ml: z.number().min(0), // Siempre obligatorio
  contrast_conversion_needed: z.boolean(),
  contrast_conversion_reason: z.string().max(200).optional(),
  
  ultreon_modified_strategy: z.boolean(),
  strategy_change_type: z.string().max(500).optional(), // JSON o string separado por comas
  strategy_change_notes: z.string().max(100).optional(),
  
  ultreon_coregistration_ok: z.boolean().nullable().default(null),
  ultreon_optimization_ok: z.boolean().nullable().default(null),
  
  case_status: z.enum(['draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked', 'completed']).default('draft')
}).superRefine((data, ctx) => {
  if (data.contrast_during_oct_ml > data.total_contrast_ml) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Contraste OCT no puede superar el total",
      path: ['contrast_during_oct_ml']
    });
  }
  if (data.flush_technique === 'other' && (!data.flush_technique_other || data.flush_technique_other.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Especificar técnica si elige 'otra'",
      path: ['flush_technique_other']
    });
  }
  if (data.contrast_conversion_needed && !data.contrast_conversion_reason) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Indicar razón del cambio de protocolo",
      path: ['contrast_conversion_reason']
    });
  }
});
```

#### B. Server Actions Corregidas

```typescript
// 1. CREAR borrador vacío
export async function createDraftCase(hospitalId: string) {
  // - Validar que usuario pertenece a hospital
  // - Generar anonymous_code automáticamente
  // - INSERT con status='draft' y campos mínimos
  // - Retornar {id, anonymous_code}
}

// 2. GUARDAR borrador parcial (UPDATE)
export async function saveDraftCase(caseId: string, partialData: Partial<eCRFSchema>) {
  // - NO validar completitud
  // - UPDATE parcial
  // - Mantener status='draft'
}

// 3. COMPLETAR caso (UPDATE + validación)
export async function completeCase(caseId: string, fullData: eCRFSchema) {
  // - Validar con schema COMPLETO
  // - UPDATE con todos los campos
  // - Cambiar status a 'complete' (ver nota sobre 'completed')
}
```

#### C. Package.json Actualizado

```json
{
  "dependencies": {
    // ...existing
    "zod": "^3.22.0",
    "react-hook-form": "^7.49.0"
  }
}
```

---

## MIGRACIÓN SQL PROPUESTA

**Archivo:** `supabase/migrations/20260716_oct_optimize_fields.sql`

```sql
-- ============================================================
-- OCT-Optimize: Agregar columnas y restricciones necesarias
-- ============================================================

-- 1. Agregar columnas nuevas
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer CHECK (age >= 18 AND age <= 120),
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- 2. Crear índice único para garantizar códigos únicos por hospital
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;

-- 3. Actualizar restricción case_status para permitir 'completed'
-- (Primero intentar eliminar la restricción anterior)
DO $$
BEGIN
  ALTER TABLE public.ecrf_opstar_records
    DROP CONSTRAINT IF EXISTS ecrf_opstar_records_case_status_check;
EXCEPTION WHEN others THEN
  NULL; -- Si no existe, ignorar
END
$$;

-- Agregar nueva restricción ampliada
ALTER TABLE public.ecrf_opstar_records
  ADD CONSTRAINT ecrf_opstar_records_case_status_check 
  CHECK (case_status IN (
    'draft', 'incomplete', 'complete', 'pending_corelab', 'validated', 'locked', 'completed'
  ));

-- 4. Crear secuencia para generar códigos pseudo-anonimizados
CREATE SEQUENCE IF NOT EXISTS seq_patient_code_by_hospital 
  START WITH 1 
  INCREMENT BY 1 
  CACHE 100;

-- 5. Crear función para generar código automático
CREATE OR REPLACE FUNCTION public.generate_anonymous_code(hospital_id uuid)
RETURNS text AS $$
DECLARE
  short_name text;
  next_num integer;
  new_code text;
BEGIN
  -- Obtener short_name del hospital
  SELECT h.short_name INTO short_name
  FROM public.hospitals h
  WHERE h.id = hospital_id
  LIMIT 1;
  
  IF short_name IS NULL THEN
    RAISE EXCEPTION 'Hospital no encontrado';
  END IF;
  
  -- Generar número secuencial para este hospital
  next_num := (SELECT COALESCE(MAX(CAST(SUBSTRING(anonymous_code, POSITION('-' IN anonymous_code) + 1) AS integer)), 0)) + 1
    FROM public.ecrf_opstar_records
    WHERE hospital_id = hospital_id AND anonymous_code LIKE short_name || '-%');
  
  -- Construir código: HOSPITAL-0001
  new_code := short_name || '-' || LPAD(next_num::text, 4, '0');
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Fin de migración
-- ============================================================
```

---

## DECISIÓN GO / NO-GO

### Recomendación: 🛑 NO-GO

**Razón:** Existen 3 bloqueadores críticos sin resolver:

1. ❌ **Columnas NO existen:** age, sex, flush_technique*
2. ❌ **case_status inválido:** 'completed' viola CHECK
3. ❌ **Dependencias faltantes:** Zod y React Hook Form no en package.json

### Pasos para Cambiar a GO

1. ✅ **Pre-requisito 1:** Ejecutar migración SQL propuesta (sección anterior)
2. ✅ **Pre-requisito 2:** Instalar `npm install zod react-hook-form`
3. ✅ **Pre-requisito 3:** Decidir si usar 'complete' o 'completed' (coordinar con equipo)
4. ✅ **Pre-requisito 4:** Crear 3 Server Actions nuevas (createDraftCase, saveDraftCase, completeCase)
5. ✅ **Pre-requisito 5:** Actualizar esquema Zod según correcciones propuestas
6. ✅ **Pre-requisito 6:** Refactor tipo ZeroContrastInsertPayload o migrar a eCRFSchema

### Timeline para GO

- **Hoy (16-jul):** Ejecutar migración + instalar dependencias (30 min)
- **Hoy:** Crear 3 Server Actions (1-2 horas)
- **Mañana (17-jul):** Refactor RegistryFormClient en 4 componentes (4-6 horas)
- **18-jul:** Testing de borrador vacío + flujo draft/complete (2-3 horas)

**GO Estimado:** 18-julio-2026 (si equipo dedica recursos hoy)

---

## APÉNDICES

### A. Checklist Pre-Sprint 1

- [ ] Migración SQL ejecutada
- [ ] `npm install zod react-hook-form`
- [ ] Decisión sobre case_status: 'complete' vs 'completed'
- [ ] Función PL/pgSQL `generate_anonymous_code()` testada
- [ ] 3 Server Actions implementadas y testeadas
- [ ] Esquema Zod con correcciones
- [ ] Types.ts (ZeroContrastInsertPayload) actualizado
- [ ] RegistryFormClient refactorizado en 4 componentes
- [ ] Testing E2E: crear borrador → completar caso

### B. Matriz de Responsabilidades

| Tarea | Responsable | Fecha |
|-------|------------|-------|
| Decisión case_status | IP + DPO | 16-jul EOD |
| Migración SQL | Tech/DB | 17-jul 9am |
| npm install | Tech/Dev | 17-jul 9am |
| Server Actions | Tech/Dev | 17-jul 10am |
| Esquema Zod | Tech/Dev | 17-jul 2pm |
| Refactor Componentes | Tech/Dev | 18-jul |
| Testing | QA | 18-jul |

---

**Documento Confidencial - Uso Interno Únicamente**  
**Status:** ⏸️ BLOQUEADO - Aguardando Resolución de Bloqueadores
