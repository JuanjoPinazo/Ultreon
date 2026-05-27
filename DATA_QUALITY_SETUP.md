# Case Quality & Data Quality System - Setup Guide

## PASO 1: Ejecutar Migración SQL

En **SQL Editor** de Supabase:

```sql
-- File: supabase/migrations/20250527_case_quality_system.sql
```

Esta migración agrega a `ecrf_opstar_records`:

```sql
-- Status field
case_status text default 'draft'  -- Values: draft, incomplete, complete, pending_corelab, validated, locked

-- Completeness score (0-100)
case_completeness_score integer default 0

-- Quality warnings (JSONB array)
data_quality_warnings jsonb default '[]'::jsonb

-- Completion tracking
completed_at timestamptz
validated_at timestamptz
validated_by uuid references auth.users(id)
locked_at timestamptz
locked_by uuid references auth.users(id)
```

También crea:
- Índices para performance en status, completeness, locked, validated
- Vista: `vw_case_status_overview` - Resumen por hospital
- Vista: `vw_data_quality_stats` - Estadísticas de calidad

**Verificar:**
```sql
select column_name, data_type 
from information_schema.columns 
where table_name='ecrf_opstar_records' 
and column_name like 'case%'
```

Debería mostrar 6 nuevas columnas ✓

---

## PASO 2: Entender la Lógica de Completitud

En `lib/clinical/case-quality.ts`:

### Función: `calculateCaseCompleteness(caseData)`

Calcula score 0-100 basado en:

#### A) Datos Mínimos (50 puntos)
- ✓ hospital_id (10 pts)
- ✓ procedure_date (10 pts)
- ✓ vaso_diana (5 pts)
- ✓ created_by (3 pts)
- ✓ pre-PCI data FFR/calcium/lipid (5 pts)
- ✓ post-PCI optimization (15 pts)

#### B) Strategy Change (25 puntos)
Si `modified_strategy = true`:
- ✓ cambio_descripcion (10 pts)
- ✓ change_magnitude (5 pts)
- ✓ OCT evidence associated (10 pts) 🔴 ERROR if missing

#### C) Zero-Contrast (10 puntos)
Si `zero_contrast_completed = true`:
- ✓ expected_contrast_ml (5 pts)
- ✓ actual_contrast_ml (5 pts)

#### D) OCT Evidence (15 puntos) 🔴 CRITICAL
- ✓ Pre-PCI key evidence (5 pts) 🔴 ERROR if missing
- ✓ Post-PCI key evidence (5 pts) 🔴 ERROR if missing
- ✓ Strategy change evidence (5 pts) 🔴 ERROR if strategy change
- ✓ Core lab validation (pending reduces 5 pts)

### Retorna:

```typescript
{
  score: number,                    // 0-100
  warnings: DataQualityWarning[],   // Array de avisos
  isReadyToComplete: boolean,       // score >= 60 && no critical errors
  isReadyForCoreLab: boolean,       // score >= 70
  isReadyForValidation: boolean,    // score >= 80
}
```

### Warning Severities:

```
error:    Bloquea completitud (rojo)
warning:  Reduce score (amarillo)
info:     Solo referencial (azul)
```

---

## PASO 3: Agregar Componente al Case Detail

En `app/cases/[id]/CaseDetailClient.tsx`:

```tsx
import DataQualityPanel from '@/components/case-detail/DataQualityPanel';
import { getCaseQualityDataAction } from '@/lib/supabase/actions';

// En la función del componente:
const { data: qualityData } = await getCaseQualityDataAction(caseId);
const { calculateCaseCompleteness } = await import('@/lib/clinical/case-quality');
const completeness = calculateCaseCompleteness(qualityData);

// En el JSX, después de otros paneles:
<DataQualityPanel
  caseId={caseId}
  caseStatus={caseRecord.case_status}
  completenessScore={completeness.score}
  warnings={completeness.warnings}
  isLocked={caseRecord.locked_at !== null}
  canEdit={!caseRecord.locked_at && userRole !== 'viewer'}
  isAdmin={userRole === 'admin' || userRole === 'monitor'}
/>
```

---

## PASO 4: Estados y Transiciones

### Estados del Caso:

```
DRAFT (inicial)
  ↓
INCOMPLETE (datos parciales, <60%)
  ↓
COMPLETE (score ≥60, sin critical errors)
  ↓
PENDING_CORELAB (enviado a core lab)
  ↓
VALIDATED (validado por admin/monitor)
  ↓
LOCKED (bloqueado, no se puede editar)
```

### Server Actions para Transiciones:

```typescript
// 1. Mark as complete (hospital_user, >=60% score)
markCaseCompleteAction(caseId)

// 2. Update status (admin/monitor)
updateCaseStatusAction({
  caseId,
  newStatus: 'validated' | 'locked' | 'pending_corelab',
  completenessScore,
  warnings
})

// 3. Get full case data with quality
getCaseQualityDataAction(caseId)
```

---

## PASO 5: Validaciones Antes de Completar

En `DataQualityPanel.tsx`:

### Botón "Mark as Complete":
- ✗ Deshabilitado si `groupedWarnings.errors.length > 0`
- ✗ Deshabilitado si `score < 60`
- ✓ Habilitado si no hay errores críticos

### Botón "Validate":
- ✓ Solo para admin/monitor
- ✗ Deshabilitado si hay errores
- ✓ Requiere `score >= 80`

### Botón "Lock":
- ✓ Solo para admin/monitor
- ✓ Pide confirmación
- ✓ Bloquea edición para hospital_user

---

## PASO 6: RLS y Permisos

En `updateCaseStatusAction` y `markCaseCompleteAction`:

```typescript
// Hospital_user:
- Puede marcar complete (si su hospital)
- NO puede validar
- NO puede bloquear
- NO puede editar si locked

// Admin/Monitor:
- Todo (complete, validate, lock, unlock)

// Viewer:
- Read-only (sin botones de acción)
```

---

## PASO 7: Integración con Site Monitoring

En `SiteMonitoringClient.tsx`, agregar nuevas métricas:

```typescript
// Usar vista vw_case_status_overview
const statusOverview = await supabase
  .from('vw_case_status_overview')
  .select('*');

// Mostrar:
- draft_cases
- incomplete_cases
- complete_cases
- pending_corelab_cases
- validated_cases
- locked_cases
- avg_completeness_score (por hospital)
```

### Alertas en Site Monitoring:
```
🔴 Casos draft >30 días sin editar
🟡 Casos incomplete >7 días sin progreso
🟠 Casos complete >7 días sin validar
🟡 Casos pending_corelab >14 días sin revisión
✓ Casos validated/locked (ok)
```

---

## PASO 8: Filtrado de Analytics

En cualquier query de análisis:

```sql
-- EXCLUIR casos draft/incomplete por defecto
where eor.case_status in ('complete', 'validated', 'locked')

-- O usar vista:
select * from vw_data_quality_stats

-- Si incluir drafted:
where case_status != 'draft'  -- Only if explicit
```

---

## PASO 9: PDF Congress Summary

En `route.ts` de export PDF:

```typescript
// Solo permitir export si:
if (!['complete', 'validated', 'locked'].includes(caseRecord.case_status)) {
  return NextResponse.json(
    { error: 'Solo casos completados pueden ser exportados' },
    { status: 403 }
  );
}

// Verificar evidence:
if (!octEvidenceStats.pre_pci_key || !octEvidenceStats.post_pci_key) {
  return NextResponse.json(
    { error: 'Faltan evidencias OCT clave para export' },
    { status: 400 }
  );
}
```

---

## PASO 10: Compilación y Testing

```bash
npm run build
```

Debería compilar sin errores ✓

### Checklist de Testing:

- [ ] Migración SQL ejecutada
- [ ] Nuevas columnas visibles en DB
- [ ] Navegar a `/cases/[id]`
- [ ] Ver DataQualityPanel
- [ ] Score muestra correctamente
- [ ] Warnings se despliegan
- [ ] "Mark as Complete" deshabilitado si hay errors
- [ ] "Validate" deshabilitado para hospital_user
- [ ] "Lock" funciona para admin
- [ ] Caso bloqueado no se puede editar
- [ ] Status cambia en DB
- [ ] Site monitoring muestra status counts

---

## DATOS ALMACENADOS

Ejemplo de registro completo:

```json
{
  "id": "uuid",
  "case_status": "complete",
  "case_completeness_score": 85,
  "data_quality_warnings": [
    {
      "code": "PENDING_CORELAB_VALIDATION",
      "message": "2 evidencia(s) pendiente(s) de validación core lab",
      "severity": "warning"
    }
  ],
  "completed_at": "2025-05-27T14:30:00Z",
  "validated_at": null,
  "validated_by": null,
  "locked_at": null,
  "locked_by": null
}
```

---

## PRÓXIMAS MEJORAS

1. ✅ Basic workflow (draft → complete → validated → locked)
2. 🔜 Workflow avanzado (unlock, revert to draft)
3. 🔜 Audit log de transiciones
4. 🔜 Email notifications cuando status cambia
5. 🔜 Batch validation para admin
6. 🔜 Export de quality report
7. 🔜 AI suggestions para completar datos faltantes
8. 🔜 Integration con external validation systems

---

## ARQUITECTURA

```
User → UI Button (DataQualityPanel.tsx)
  ↓
markCaseCompleteAction() / updateCaseStatusAction()
  ↓
calculateCaseCompleteness() (lib/clinical/case-quality.ts)
  ↓
DB Update: case_status, case_completeness_score, data_quality_warnings
  ↓
RLS enforcement at DB level
  ↓
revalidatePath() to refresh UI
  ↓
User sees updated status + score
```

---

## SEGURIDAD

✅ RLS en tabla ecrf_opstar_records:
- Hospital_user: solo edita casos de su hospital si no locked
- Admin/Monitor: todo
- Viewer: read-only

✅ Validaciones en server actions:
- Verifica rol antes de cambiar status
- Bloquea edición si locked
- Registra validated_by y locked_by

✅ No expone data_quality_warnings a viewer sin rol

---

## PREGUNTAS FRECUENTES

**Q: ¿Qué pasa si falta evidencia OCT?**
A: Se marca como error (rojo) y bloquea completitud. Score < 60.

**Q: ¿Puede hospital_user bloquear?**
A: No, solo admin/monitor. Hospital_user solo puede marcar complete.

**Q: ¿Qué pasa si desbloqueo un caso?**
A: Por implementar - ahora solo admin puede desbloquear (manual DB update).

**Q: ¿Se puede editar después de validar?**
A: Sí, hasta que se bloquea. Locked = verdadera barrera.

**Q: ¿Y si cambio datos después de complete?**
A: Score se recalcula pero status se mantiene hasta desbloquear.

---

¡Sistema de calidad listo! 🎯
