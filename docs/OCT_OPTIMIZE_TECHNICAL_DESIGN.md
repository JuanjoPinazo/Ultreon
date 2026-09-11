# Diseño Técnico: OCT-Optimize ULTREON 3.0

**Objetivo:** Establecer las bases técnicas para el refactor del eCRF de OPSTAR-AI Levante, alineadas con el diseño funcional (V2) sin realizar migraciones destructivas en la base de datos de producción actual.

---

## 1. Mapeo entre campos funcionales y columnas de Supabase

| Campo Funcional | Tipo UI | Columna Supabase (`ecrf_opstar_records`) | Tipo BD |
|-----------------|---------|-----------------------------------------|---------|
| Centro | Dropdown | `hospital_id` | UUID |
| Operador | Dropdown | `operator_id` | UUID |
| Fecha | Datepicker | `procedure_date` | DATE |
| Código Paciente | Read-only | `anonymous_code` | TEXT |
| Edad | Numérico | *NUEVO: `age`* | INTEGER |
| Sexo | Select | *NUEVO: `sex`* | TEXT |
| Vaso Diana | Select | `coronary_segment` | TEXT |
| Contraste Total | Numérico | `total_contrast_ml` | NUMERIC |
| Técnica Flush | Select | *NUEVO: `flush_technique`* | TEXT |
| Detalle Flush | Text | *NUEVO: `flush_technique_other`* | TEXT |
| Contraste OCT | Numérico | `contrast_during_oct_ml` | NUMERIC |
| Cambio Contraste | Toggle | `contrast_conversion_needed` | BOOLEAN |
| Razón Cambio | Select | `contrast_conversion_reason` | TEXT |
| Mod. Estrategia | Toggle | `ultreon_modified_strategy` | BOOLEAN |
| Tipo Cambio | Checkboxes | `strategy_change_type` | TEXT |
| Notas | Text (breve) | `strategy_change_notes` | TEXT |
| Corregistro OK | Toggle (Nullable) | *NUEVO: `ultreon_coregistration_ok`* | BOOLEAN |
| Optimización OK | Toggle (Nullable) | *NUEVO: `ultreon_optimization_ok`* | BOOLEAN |
| Estado | Sistema | `case_status` | TEXT |

---

## 2. Campos existentes reutilizables
Se reutilizarán directamente las siguientes columnas ya presentes en `ecrf_opstar_records`:
- `id`, `hospital_id`, `created_by`, `locked`, `created_at`, `updated_at`
- `operator_id`, `procedure_date`
- `coronary_segment`
- `total_contrast_ml`, `contrast_during_oct_ml`
- `contrast_conversion_needed`, `contrast_conversion_reason`
- `ultreon_modified_strategy`, `strategy_change_type`, `strategy_change_notes`
- `case_status` (que ya soporta 'completed', y se adaptará para soportar 'draft')
- `anonymous_code` (se usará para el código auto-generado)

---

## 3. Nuevas columnas estrictamente necesarias
Para evitar modificar o sobrecargar campos existentes con nuevos significados, se crearán (mediante una nueva migración segura `ALTER TABLE ... ADD COLUMN`):
- `age` (INTEGER)
- `sex` (TEXT, check: 'M', 'F')
- `flush_technique` (TEXT)
- `flush_technique_other` (TEXT)
- `ultreon_coregistration_ok` (BOOLEAN, nullable)
- `ultreon_optimization_ok` (BOOLEAN, nullable)

---

## 4. Campos antiguos que deben dejar de enviarse (Sin eliminarlos)
**No se ejecutarán sentencias `DROP COLUMN`**. Simplemente el payload dejará de incluirlos (quedarán como `NULL` por defecto en nuevos registros):
- `patient_code`, `local_nhc`, `local_sip` (Sustituidos por generación en servidor de `anonymous_code`).
- `saline_protocol_used` (Sustituido por el select de `flush_technique`).
- Todos los relacionados con la IA anterior y FFR-OCT (p. ej., `calcio_ia`, `placa_lipida_ia`, `ffr_oct`, `ultreon_calcium`).

---

## 5. Diseño del código `patient_code` generado en servidor
Para garantizar la pseudo-anonimización y evitar colisiones:

- **Estructura:** Se usará el campo `anonymous_code` con el formato `[SHORT_NAME_HOSPITAL]-[NUMERO_SECUENCIAL_4_DIGITOS]` (Ej: `HSJ-0001`).
- **Seguridad de Concurrencia:** Se implementará mediante una función en la base de datos (PostgreSQL PL/pgSQL) usando bloqueo de fila o una secuencia personalizada ligada al `hospital_id`, garantizando que dos inserciones simultáneas del mismo hospital no obtengan el mismo número.
- **Índice:** Se creará un índice único compuesto para asegurar la integridad: `CREATE UNIQUE INDEX idx_hospital_anonymous_code ON public.ecrf_opstar_records(hospital_id, anonymous_code);`.
- **Flujo:** La UI crea un borrador vacío a través de una Server Action al iniciar el registro; la BD asigna el código en la inserción (trigger/default o Server Action RPC); la UI recupera el ID y el código para mostrarlo (read-only).

---

## 6. Diseño de estados `draft` / `completed`
- **Draft:** Todo caso se crea inicialmente con `case_status = 'draft'`. Se permite el UPSERT continuo.
- **Completed:** Al hacer submit del Paso 4, se envía `case_status = 'completed'`. Las políticas RLS de `UPDATE` se restringirán para que los `hospital_user` solo puedan modificar casos donde `case_status = 'draft'`.
- La columna `locked` (existente) puede usarse también para indicar el cierre si el sistema heredado así lo requiere.

---

## 7. Server Actions Necesarias
1. `createDraftCase(hospital_id)`: Inserta un registro vacío y retorna el `id` y el `anonymous_code` generado.
2. `saveDraftCase(id, partialData)`: Ejecuta una actualización parcial (`update`) de los campos en base de datos.
3. `completeCase(id, fullData)`: Realiza la validación final y marca el caso como `completed`.

---

## 8. Esquema Zod

```typescript
export const eCRFSchema = z.object({
  id: z.string().uuid().optional(),
  hospital_id: z.string().uuid(),
  operator_id: z.string().uuid(),
  anonymous_code: z.string().optional(),
  procedure_date: z.date(),
  age: z.number().min(18).max(120),
  sex: z.enum(['M', 'F']),
  
  coronary_segment: z.string().min(1, 'Seleccione un vaso diana'),
  total_contrast_ml: z.number().min(0),
  
  flush_technique: z.enum(['saline', 'contrast', 'diluted_contrast', 'other']),
  flush_technique_other: z.string().optional(),
  
  contrast_during_oct_ml: z.number().min(0),
  contrast_conversion_needed: z.boolean(),
  contrast_conversion_reason: z.string().optional(),
  
  ultreon_modified_strategy: z.boolean(),
  strategy_change_type: z.array(z.string()).optional(),
  strategy_change_notes: z.string().max(100).optional(),
  
  ultreon_coregistration_ok: z.boolean().nullable(),
  ultreon_optimization_ok: z.boolean().nullable()
}).superRefine((data, ctx) => {
  if (data.contrast_during_oct_ml > data.total_contrast_ml) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Contraste OCT no puede ser mayor al total",
      path: ['contrast_during_oct_ml']
    });
  }
  if (data.flush_technique === 'other' && (!data.flush_technique_other || data.flush_technique_other.trim() === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe especificar la técnica utilizada",
      path: ['flush_technique_other']
    });
  }
});
```

---

## 9. División exacta de `RegistryFormClient` en 4 componentes
Se mantendrá el archivo padre `app/registry/new/RegistryFormClient.tsx` encargado del `<FormProvider>`, estado global, el stepper y el handle del autoguardado. Internamente montará:
1. `Step1Identification.tsx`: Renderiza campos de edad, sexo, fecha, operador.
2. `Step2Procedure.tsx`: Renderiza vaso diana, técnica de flush (con lógica condicional para el campo `other`), contraste total, contraste OCT y cambio de técnica.
3. `Step3Ultreon.tsx`: Renderiza checkboxes y toggles de métricas de corregistro, estrategia y optimización.
4. `Step4Review.tsx`: Componente de lectura que lista todos los valores de `useFormContext` y maneja el checkbox de confirmación final de PII.

---

## 10. Técnica de flush como select
Se abandona el toggle de "protocolo salino puro" a favor de un `<select>` (`flush_technique`):
- `saline` (Suero Salino Fisiológico)
- `contrast` (Contraste Puro)
- `diluted_contrast` (Contraste Diluido)
- `other` (Otra mezcla/técnica)

---

## 11. Campo de detalle obligatorio para `other`
Se implementará condicionalmente en UI dentro de `Step2Procedure.tsx` y se validará en Zod mediante `superRefine`. Si `flush_technique` !== `other`, el campo `flush_technique_other` debe limpiarse automáticamente.

---

## 12. Estrategia de migración no destructiva
Se creará **1 única migración** (`20260716_oct_optimize_fields.sql`):
```sql
-- 1. Agregar nuevas columnas
ALTER TABLE public.ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS sex text CHECK (sex IN ('M', 'F')),
  ADD COLUMN IF NOT EXISTS flush_technique text,
  ADD COLUMN IF NOT EXISTS flush_technique_other text,
  ADD COLUMN IF NOT EXISTS ultreon_coregistration_ok boolean,
  ADD COLUMN IF NOT EXISTS ultreon_optimization_ok boolean;

-- 2. Índice único para concurrencia de códigos (usando coalesce para los casos viejos sin código)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_anonymous_code 
  ON public.ecrf_opstar_records(hospital_id, anonymous_code)
  WHERE anonymous_code IS NOT NULL;
```

---

## 13. Plan de Pruebas
1. **Unidad:** Validar con Jest/Vitest el esquema Zod (comprobando que falla si `other` no tiene justificación y que contraste OCT <= contraste total).
2. **Concurrencia (BD):** Prueba de inserción simultánea de 2 casos para el mismo `hospital_id` validando que se asignan números de `anonymous_code` consecutivos y no fallan por clave duplicada.
3. **Flujo de Drafts:** Crear caso, rellenar paso 1, recargar navegador, validar que `draft` se recarga desde Supabase sin perder estado.
4. **Seguridad (RLS):** Validar que `hospital_user` no puede hacer `UPDATE` a un caso en `completed`.
5. **Mobile UI:** Verificar carga sin scroll horizontal a 375px.

---

## 14. Lista exacta de archivos que modificaría el Sprint 1

### UI y Formularios
- `app/registry/new/RegistryFormClient.tsx` (Padre orquestador)
- `components/registry/Step1Identification.tsx` (Nuevo)
- `components/registry/Step2Procedure.tsx` (Nuevo)
- `components/registry/Step3Ultreon.tsx` (Nuevo)
- `components/registry/Step4Review.tsx` (Nuevo)
- `components/CoronaryTreeNavigator/` (Mover a `_archived/` o no instanciar)

### Datos y Acciones
- `lib/validations/registrySchema.ts` (Nuevo esquema Zod unificado)
- `lib/supabase/actions.ts` (Crear `createDraftCase`, `saveDraftCase`, `completeCase`)

### Base de Datos
- `supabase/migrations/[TIMESTAMP]_oct_optimize_fields.sql` (Migración no destructiva e index)
- `supabase/functions/generate_patient_code.sql` (Opcional, si se usa PL/pgSQL para generación segura en BD en lugar de aplicación).

### Ocultamiento de Módulos
- `app/dashboard/page.tsx` (Ocultar enlaces obsoletos)
- `app/admin/layout.tsx` (Ocultar enlaces a módulos fuera del alcance)
