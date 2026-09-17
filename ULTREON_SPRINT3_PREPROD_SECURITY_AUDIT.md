# ULTREON SPRINT 3 - PRE-PRODUCTION SECURITY AUDIT

## 1. Protección de Costes por Filas y Columnas
Se han implementado **Vistas Operacionales Sanitizadas** en la migración `20260916230000_registry_operational_module.sql` para prevenir fuga de datos económicos a nivel de base de datos y API:

1. Las tablas base (`registry_case_consumption`, `registry_order_items`, `registry_products`) han sido blindadas con Row Level Security para que **únicamente el ADMIN** pueda acceder a ellas (mediante `public.is_admin()`). 
2. Si un Hospital User o Coordinator intenta hacer un `SELECT * FROM registry_case_consumption` vía API, la base de datos devolverá 0 filas.
3. Para la visibilidad de los hospitales se han desplegado las vistas:
   - `registry_case_consumption_operational`
   - `registry_order_items_operational`
   - `registry_products_operational`
   Estas vistas **excluyen** explícitamente las columnas `unit_cost_snapshot` y `default_unit_cost`. Además, en su propia definición (WHERE clause) aplican la lógica de filtro por centro (`public.get_current_user_hospital_id()`).

## 2. Prevención de Stock Negativo (Ledger Físico)
Se ha implementado una restricción dura y explícita:
- A nivel de tabla: `CHECK (quantity_on_hand >= 0)`
- A nivel de RPC (`confirm_registry_consumption`): Se bloquea cualquier confirmación que resulte en stock negativo incluso para Administradores. La única vía permitida para descuadres físicos es que el ADMIN registre previamente un movimiento de tipo `ADJUSTMENT` antes de poder confirmar un consumo que supere el stock informático.

## 3. Idempotencia y Doble Ejecución
En ambas RPC (`confirm_registry_consumption` y `receive_registry_order`) se ha incluido una validación temprana (early exit):
```sql
IF v_consumption.status = 'CONFIRMED' THEN ...
IF v_order.status = 'RECEIVED' THEN ...
```
Esto asegura matemáticamente que no se produzcan dobles descuentos de stock o generación repetida de movimientos inmutables (`CONSUMPTION` o `RECEIPT`), sin depender de la UI.

## 4. Protección Backend DEMO/DRAFT
En `confirm_registry_consumption`, la función lee directamente el caso de la tabla base `ultreon_registry_cases`. Si el caso tiene `is_demo = true` o `status <> 'COMPLETED'`, la RPC aborta con una Excepción de integridad. Además, se verifica que el `hospital_id` del consumo coincida de forma obligatoria con el del caso clínico.

## 5. Cost Snapshot Inmutable
`unit_cost_snapshot` se establece una única vez dentro de la RPC de confirmación. Como la función implementa el control de idempotencia, y la columna base no es modificable por usuarios estándar (sólo Admin vía RLS, pero la UI no expone edición post-confirmación), el coste queda blindado históricamente frente a cambios del catálogo.

## VEREDICTO FINAL
La migración revisada está preparada para ser aplicada en Producción, habiendo asegurado tanto la barrera de columnas (Vistas) como las barreras transaccionales (RPCs).

✅ ECONOMIC COLUMNS DB-PROTECTED
✅ NO NEGATIVE STOCK FLOW
✅ DEMO BACKEND BLOCK VERIFIED
✅ CONSUMPTION IDEMPOTENCY VERIFIED
✅ ORDER RECEIPT IDEMPOTENCY VERIFIED
✅ SPRINT 3 SAFE FOR PRODUCTION
