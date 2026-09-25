# ULTREON™ v3.1 – DATA CLEANUP REPORT (PRE-UAT)

## Resumen de Ejecución
- **Fecha**: 2026-09-25
- **Objetivo**: Limpiar la base de datos de datos sintéticos históricos sin afectar los registros maestros.
- **Fase de Manises**: `CENTER_PRELAUNCH`
- **Lanzamiento Oficial**: `2026-10-01`

## Preservación de Master Data (Verificado)
Se ha validado la integridad de:
- `profiles` y `auth.users`
- `operators`, `operator_user_links`, `hospital_operators`
- `hospitals` y `opstar_investigators` (PIs locales)
- Rol y acceso de Dr. Ramón López-Palop (`clinical_admin`)
- Configuración maestra (`registry_settings`, `ultreon_registry_hospital_settings`)

## Inventario de Limpieza

| Tabla | Rows Before | Rows Deleted/Reverted | Rows After | Notas |
|---|---|---|---|---|
| `ultreon_registry_cases` | 11 | 11 | 0 | 8 Oficiales (`QA-PRELAUNCH-*`) y 3 Demo borrados en cascada. |
| `registry_case_consumption` | 4 | 4 | 0 | Consumos asociados a los casos QA eliminados. |
| `registry_orders` | 3 | 3 | 0 | Pedidos `QA-ORD-*` eliminados. |
| `registry_order_items` | 3 | 3 | 0 | Items asociados a los pedidos de prueba eliminados. |
| `registry_stock_movements` | - | - | - | Movimientos QA revertidos. Movimiento `INITIAL` (Baseline físico) preservado. |
| `registry_case_economics` | 0 | 0 | 0 | Sin registros oficiales (Tabla inactiva/inexistente en caché). |
| `monthly_settlements` | 0 | 0 | 0 | Sin registros oficiales. |
| `settlement_items` | 0 | 0 | 0 | Sin registros oficiales. |

## Check de Seguridad Final
✅ Manises se mantiene como `CENTER_PRELAUNCH` (Verificado a través de `ultreon_registry_hospital_settings`).
✅ Casos oficiales = 0 (Verificado `is_demo=false` -> 0 rows).
✅ Consumo oficial = 0.
✅ Liquidaciones oficiales = 0.
✅ Stock oficial (Baseline físico) = Verificado mediante preservación del movimiento `INITIAL`.
✅ Usuarios y roles operativos = Intactos.
✅ El banner "MODO PRELANZAMIENTO" permanece activo en Manises.
✅ Preparado Test Pack UAT para Dr. Ramón López-Palop.

**La plataforma se encuentra completamente limpia y lista para las pruebas clínicas (UAT).**
