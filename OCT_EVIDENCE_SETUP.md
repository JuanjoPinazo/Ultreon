# OCT Evidence Module - Setup Instructions

## PASO 1: Crear Bucket en Supabase Storage

En el panel de Supabase:

1. Ve a **Storage** → **Buckets**
2. Crea nuevo bucket: `opstar-oct-evidence`
3. Configuración:
   - **Private bucket**: ✓ (seleccionado)
   - **File size limit**: 25 MB
   - **Allowed MIME types**: image/*, application/pdf

4. Policies - Ve a **Bucket Policies** y añade:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "authenticated_can_upload" ON storage.objects
   FOR INSERT TO authenticated
   WITH CHECK (bucket_id = 'opstar-oct-evidence');
   
   -- Allow admin and monitor to download
   CREATE POLICY "authenticated_can_view" ON storage.objects
   FOR SELECT TO authenticated
   USING (bucket_id = 'opstar-oct-evidence');
   ```

## PASO 2: Ejecutar Migración SQL

En el **SQL Editor** de Supabase, ejecuta:

```bash
# File: supabase/migrations/20250527_opstar_oct_evidence.sql
```

El archivo contiene:
- Tabla `opstar_oct_evidence` con campos completos
- RLS policies para admin/monitor/hospital_user/viewer
- Índices de performance
- Vista computed `vw_oct_evidence_stats`

## PASO 3: Verificar en Aplicación

La aplicación ahora tiene:

### Rutas Disponibles:
- **`/cases/[id]/evidence`** - Galería completa con upload
- **`/cases/[id]`** - Integración en caso detail (próximo paso)
- **`/core-lab/cases/[id]`** - Review de calidad core lab

### Server Actions (lib/supabase/actions.ts):
- `uploadOctEvidenceFileAction(formData)` - Upload de archivo
- `uploadOctEvidenceAction(data)` - Guardar metadata
- `getOctEvidenceAction(caseId)` - Obtener evidencias
- `updateOctCoreLabReviewAction(data)` - Validar core lab
- `deleteOctEvidenceAction(evidenceId)` - Eliminar evidencia

### Helpers (lib/storage/oct-evidence-helpers.ts):
- `validateOctEvidenceFile()` - Validación de cliente
- `buildOctEvidencePath()` - Construir ruta de storage

## PASO 4: Features Implementadas

### A) Upload Zone (`/cases/[id]/evidence`)
✅ Drag & drop elegante
✅ Preview de imagen
✅ Selección de archivo
✅ **OBLIGATORIO**: Checkbox anonimización
✅ Validación de tamaño (25 MB)
✅ Validación de tipo (JPG, PNG, WebP, PDF)

### B) Metadata Form
✅ Phase selector:
   - pre_pci
   - strategy_change
   - post_pci
   - zero_contrast
   - follow_up
   - report

✅ Evidence Type (14 opciones):
   - oct_frame, oct_pullback, ultreon_screenshot
   - calcium, lipid_plaque, eel_reference
   - stent_expansion, malapposition, edge_dissection
   - ffr_oct, angiography, zero_contrast_quality
   - report_pdf, other

✅ Linked Variable (14 opciones):
   - severe_calcium, lipid_plaque, eel_reference
   - ffr_oct, stent_diameter_change, etc.

✅ Linked Strategy Change (preparado para futuro)

✅ Key Evidence checkbox

✅ Title & description fields

### C) Gallery & Filtering
✅ Grid responsivo (móvil → tablet → desktop)
✅ Filtro por fase
✅ Filtro key evidence solo
✅ Detail modal con metadata
✅ Indicadores de core lab quality
✅ Stats: total, pending core lab
✅ Empty states

### D) Core Lab Review
✅ Calidad: excellent, diagnostic, suboptimal, not_usable
✅ Notas
✅ Marcar como key evidence
✅ Timestamp reviewed_at
✅ Usuario reviewed_by

### E) Seguridad (RLS)
✅ Admin: acceso total
✅ Monitor: acceso total
✅ Hospital_user: solo su hospital
✅ Viewer: read-only
✅ Signed URLs con expiry 15 min

## PASO 5: Integración Próxima

### En `/cases/[id]` (CaseDetailClient.tsx):
Falta agregar:
```tsx
<div className="space-y-6">
  {/* ... existing sections ... */}
  
  {/* NEW: OCT Evidence Section */}
  <OctEvidencePanel caseId={caseId} evidenceStats={evidenceStats} />
  
  {/* Link to full evidence gallery */}
  <Link href={`/cases/${id}/evidence`} className="...">
    Ver galería completa
  </Link>
</div>
```

### En Strategy Modification Panel:
```tsx
{strategyChanges && (
  <button className="...">
    ✓ Adjuntar OCT Evidence ({attachedCount})
  </button>
)}
```

### En Triada ULTREON:
```tsx
// En cada sección (Expansion, Apposition, Edge)
{
  <button onClick={() => setShowEvidenceSelector(true)}>
    📸 Attach OCT Image
  </button>
}
```

## PASO 6: Analytics en Site Monitoring

En `/admin/site-monitoring/SiteMonitoringClient.tsx`, agregar:

```typescript
const evidenceStats = {
  casesWithoutStrategyEvidence: 0,
  casesWithoutPrePciEvidence: 0,
  casesWithoutPostPciEvidence: 0,
  pendingCoreLabValidation: 0,
  percentageWithCompleteEvidence: 0,
};
```

## PASO 7: PDF Congress Summary

En `/lib/pdf/congress-summary.ts`:

```typescript
// Agregar key evidence a PDF
if (data.keyEvidenceUrls?.prePci) {
  doc.text('Key Evidence - Pre-PCI: [IMAGE]');
}
```

## Datos Almacenados

```
Storage:
cases/
  {case_id}/
    pre_pci/
      {timestamp}-{filename}
    strategy_change/
      {timestamp}-{filename}
    post_pci/
      {timestamp}-{filename}
    zero_contrast/
      {timestamp}-{filename}
    follow_up/
      {timestamp}-{filename}
    reports/
      {timestamp}-{filename}

Database (opstar_oct_evidence):
- id, case_id, hospital_id
- storage_path, file_name, file_type, file_size_bytes
- evidence_phase, evidence_type
- linked_variable, linked_strategy_change
- title, description
- is_key_evidence, is_anonymized
- corelab_quality, corelab_notes
- reviewed_by, reviewed_at
- created_at, updated_at
```

## Testing Checklist

- [ ] Crear bucket `opstar-oct-evidence`
- [ ] Ejecutar migración SQL
- [ ] Navegar a `/cases/[id]/evidence`
- [ ] Arrastra una imagen (JPG/PNG)
- [ ] Confirmar anonimización
- [ ] Seleccionar metadata (fase, tipo, variable)
- [ ] Upload exitoso
- [ ] Imagen aparece en gallery
- [ ] Detail modal abre correctamente
- [ ] Filtros funcionan
- [ ] Signed URLs generan (15 min)
- [ ] Admin/Monitor ven todo
- [ ] Hospital_user solo ve su hospital
- [ ] Viewer es read-only

## Próximas Mejoras

1. Integración con `/cases/[id]` panel
2. Integración con strategy modification alerts
3. Integración con triada ULTREON
4. Analytics en site monitoring
5. PDF congress summary con key evidence
6. Bulk upload (múltiples archivos)
7. Video support (MP4, opcional)
8. OCT AI analysis (future)
