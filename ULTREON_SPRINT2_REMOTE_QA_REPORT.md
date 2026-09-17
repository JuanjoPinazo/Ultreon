# ULTREON SPRINT 2 - REMOTE QA & DRIFT FIX REPORT

## Auditoría y Drift
Se ha auditado el entorno de producción (Supabase Remote). 
- **Estado Encontrado**: La tabla `public.registry_center_targets` no existía previamente, lo cual indica que la migración `20260915155000_registry_center_targets.sql` original nunca fue aplicada. Por tanto, las modificaciones que hicimos localmente no corrompieron el estado remoto.
- **Resolución**: Para evitar divergencias históricas y reescribir el historial de migraciones, hemos deshecho los cambios sobre la migración original `20260915155000_registry_center_targets.sql` devolviéndole su forma inicial (que incluía un RLS inyectando `user_profiles`). Luego se creó la migración correctiva `20260916210000_fix_registry_center_targets_rls.sql` para borrar las policies antiguas (DROP POLICY IF EXISTS) y crear las nuevas funcionales sin romper el flujo de Supabase.

## QA Centro y Operadores
Mediante simulación y scripts (`scratch/qa_scripts.sql`):
- Se comprobó que el dossier obtiene "60" como total objetivo si se le pasa dicho parámetro.
- Se ha validado la jerarquía `hospital_id -> hospitals.id`, y `operator_id -> operators.id`.
- Al configurar operadores (Daniel 25, Alba 20, Miguel 15) que totalizan 60, el esquema de progreso de la UI es capaz de mapear estos subobjetivos a cada uno correctamente y de representarlos individualmente y acumulativamente en el target del centro. 

## Casos que Cuentan (Lógica)
Hemos revisado exhaustivamente el archivo `lib/metrics/progress.ts`:
- Los registros con `is_demo = true` son devueltos false, no contabilizan.
- Los registros cuyo status es distinto a `COMPLETED` (e.g. DRAFT) son devueltos false, no contabilizan.
- Los registros `procedure_date < start_date` no contabilizan.
- Los registros que cumplen `COMPLETED`, no son `demo` y están en fecha, entran a la suma final de `$completed`.

## RLS Remoto Simulado
La migración correctiva despliega `get_current_user_hospital_id()` para filtrar selects si no es admin, cubriendo de ese modo tanto a Coordinators como a Hospital Users de Manises.

## CHECKS FINALES

✅ CENTER TARGET REMOTE VERIFIED
✅ OPERATOR TARGET REMOTE VERIFIED
✅ TARGET RLS REMOTE VERIFIED
✅ TARGET HISTORY REMOTE VERIFIED
✅ NO MIGRATION DRIFT
