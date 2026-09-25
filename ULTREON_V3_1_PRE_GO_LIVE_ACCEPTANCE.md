# ULTREON™ v3.1 PRE-GO-LIVE ACCEPTANCE & CODE FREEZE

## Estado Final de Aceptación

1. **OPERATOR_PROFILE_RLS_REMOTE_VERIFIED**: Confirmado. El script `20260925000000_operator_profile_history_rls_hardening.sql` (con `SECURITY DEFINER` y `owner = postgres`) garantiza que la tabla de histórico se actualiza automáticamente bajo el bypass de permisos de Postgres, permitiendo que la App frontend cree y modifique perfiles de operador limpiamente. En pruebas, al modificar un perfil de QA de OCT 4 a OCT 5, el trigger cierra el `valid_to` previo e inserta el nuevo histórico sin fallos de RLS.
2. **SCIENTIFIC_REVIEWER_LOGIN_VERIFIED**: Se ha habilitado y verificado el rol `SCIENTIFIC_REVIEWER` para el Dr. Ramón López Palop. Puede leer tableros clínicos, casos y métricas científicas. Los módulos de modificación le resultan en acceso denegado.
3. **ECONOMICS_DB_DENY_VERIFIED**: Verificado. El rol de Revisor Científico no posee grants explícitos sobre las tablas del ecosistema económico (ni `registry_case_economics`, ni `monthly_settlements`, etc), devolviendo un error 403 / Forbiden y denegando el acceso de manera segura.
4. **NO_CRITICAL_LINT_RULES_SILENCED**: Verificado. Se excluyeron los artefactos temporales `scratch/**` y `scratch_pdf_qa/**` mediante `tsconfig.json` y `eslint.config.mjs` como decisión arquitectónica justificada. Las reglas críticas TypeScript no se han silenciado a nivel global, preservando la robustez de todo el directorio `app/`, `lib/` y `components/`.
5. **QA_CASE_END_TO_END_VERIFIED**: El ciclo completo de N/A en casos PRE/POST mixtos, Calidad (FPS) y anclas semánticas 1-10 opera fluidamente. Todo caso falso/QA no contamina los aggregates.
6. **ECRF_SCHEMA_3_1_VERIFIED**: Añadido en `saveRegistryCaseAction()` la asignación forzosa `schema_version: '3.1'` garantizando la trazabilidad histórica del eCRF de forma canónica desde Supabase.
7. **SITE_PACK_V1_1_VERIFIED**: Se reemplazaron todas las referencias físicas estáticas y documentos PDF de `Site Pack v1.0` por `Site Pack v1.1` con fecha efectiva de 01/10/2026.
8. **REAL_PDF_VERIFIED**: El renderizado A4 (Printable ECRF) soporta los nuevos diccionarios cerrados, módulos Scale10 sin texto libre de 'Valor', y checks de N/A sin deformar layouts (no overflow) ni provocar páginas en blanco.
9. **LINT_PASS / TSC_PASS / BUILD_PASS**: Exitoso, Exit Code 0.
10. **OFFICIAL_DATASET_ZERO**: Confirmado.
11. **MANISES_PRELAUNCH / V3_1_READY_FOR_DEPLOYMENT**: Centro bloqueado en estado PRELAUNCH. Go-Live aprobado para 2026-10-01.

---

**ESTADO ACTUAL**: `CODE FREEZE` ACTIVADO
A partir de este instante, queda terminantemente prohibida la inclusión de mejoras UI/UX o refactors. El despliegue a producción de Manises está formalmente autorizado.
