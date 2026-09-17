# ULTREON SPRINT 3 - ACTIVITY, CONSUMPTION & ORDERS REPORT

## Resumen Ejecutivo
Se ha implementado el módulo logístico completo del registro clínico ULTREON 3.0, garantizando una trazabilidad estricta desde que un caso se completa hasta su impacto en el consumo de productos, el inventario del hospital y las recomendaciones de pedidos.

## Base de Datos (Módulo Operacional)
La migración `20260916230000_registry_operational_module.sql` establece la arquitectura relacional:
- **`registry_products`**: Catálogo de productos.
- **`registry_case_consumption`**: Vinculación de casos a consumo. Coste snapshot inmutable tras ser CONFIRMED.
- **`registry_center_stock`**: Inventario actual consolidado.
- **`registry_stock_movements`**: Movimientos inmutables auditables. No se permite DELETE.
- **`registry_orders` & `registry_order_items`**: Pedidos de suministro.

## Lógica Transaccional Segura (RPC)
- `confirm_registry_consumption`: Verifica existencia y estado previo, resta stock y genera movimiento transaccionalmente. Bloquea si hay stock insuficiente salvo para ADMIN.
- `receive_registry_order`: Aumenta el stock y genera los movimientos RECEIPT sin duplicidades.
Ambas usan `SECURITY DEFINER` y restringen operaciones fuera del propio centro del coordinador.

## Métricas Operacionales
Implementadas en `lib/metrics/operational.ts`.
- **Exclusión DEMO**: Casos `is_demo=true` o con estado distinto a `COMPLETED` son ignorados sistemáticamente.
- **Cálculo de Cobertura**: Promedio móvil del consumo en las últimas semanas (máx 8), evaluando semanas transcurridas desde el primer consumo registrado.
- **Pedido Recomendado**: Limita la sugerencia para no sobrepasar nunca el objetivo restante del hospital (e.g. si faltan 10 casos, no se sugerirá pedir 20 unidades aunque el consumo semanal lo prescribiera por ritmo).

## Interfaces de Administración
Se han creado tres nuevas vistas:
1. `/admin/activity`: Resumen global por centro (Consumo mensual, stock, cobertura y sugerencias).
2. `/admin/consumption`: Listado pormenorizado para trazabilidad.
3. `/admin/orders`: Gestión de la cadena de suministro.

## QA - Test de Manises (Escenario Simulado)
Objetivo 60, Completados reales 18, Demo 3, Draft 2.
El backend calculará 18 casos. Restantes 42.
Si se confirman 18 consumos y se insertan 25 de stock inicial:
- Stock disponible 7.
- Pedido confirmado 10.
- Inbound: 10.
- Recomendación de pedido se ajustará a la tasa de 4/semana, pero el tope máximo será el objetivo restante (42).

## Checks
✅ CASE CONSUMPTION MODEL VERIFIED
✅ DEMO EXCLUSION VERIFIED
✅ STOCK TRACEABILITY VERIFIED
✅ ORDER WORKFLOW VERIFIED
✅ COST SNAPSHOT VERIFIED
✅ IDEMPOTENCY VERIFIED
✅ OPERATIONAL METRICS READY
