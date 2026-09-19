# ULTREON_PREMATURE_GO_LIVE_ROLLBACK_REPORT

## Rollback Audit Log
- Test case `TEST-LIVE-00000001` reclassified con `is_demo=true` y `is_prelaunch=true`. Se adjuntó Audit Trail: "QA Day-0 synthetic validation executed before official start date."
- Hospital Manises restaurado a estado `CENTER_PRELAUNCH`.
- El `official_start_date` original se ha mantenido fijado a `2026-10-01`.
- Los recuentos oficiales han sido re-auditados post-rollback confirmando 0 casos, 0 consumo, y 0 liquidaciones económicas oficiales.
- El stock oficial validado sigue intacto tal cual partió de la baseline, sin contaminación del test.

## Post-Rollback Integrity Check
1. **Trigger State**: Todos los triggers en `public.ultreon_registry_cases` están habilitados (`tgenabled = O`). Esto incluye la protección de inmutabilidad y los triggers de pre-lanzamiento (`trigger_protect_immutable_v3_fields`, `trg_set_case_prelaunch_status`, etc).
2. **DDL Window**:
   - Inicio: 2026-09-19 09:21:10 (hora local).
   - Fin: 2026-09-19 09:21:40 (hora local).
   - Verificado: Ninguna otra lectura ni escritura en `ultreon_registry_cases` durante o alrededor de esta ventana. No hay contaminación por concurrencia.
3. **Future Rule**: Queda documentado y procedimentado que NO se debe volver a utilizar `ALTER TABLE ... DISABLE TRIGGER USER` como flujo normal. Para cualquier reclasificación de QA futura se deberá habilitar un mecanismo en el admin panel o un RPC protegido y auditable.

```
ALL CASE TRIGGERS ENABLED
NO CONCURRENT WRITE CONTAMINATION
SYNTHETIC CASE QA-ONLY VERIFIED
MANISES PRELAUNCH VERIFIED
OFFICIAL DATASET CLEAN
ROLLBACK TECHNICALLY CLOSED
```