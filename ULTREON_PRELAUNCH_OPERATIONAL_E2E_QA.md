# QA END-TO-END — PRELAUNCH OPERATIVO

## 1. CREAR CASO QA NO DEMO
- Case ID: `f6980c6d-b54d-4884-8ac5-b4e4079791b1`
- is_demo: `false`
- is_prelaunch: `true`

## 3. CONSUMO PENDING
- Consumption ID: `b1623824-dc57-4546-b61e-415d2f8505c8`
- Status: `PENDING`
- is_prelaunch: `true`
- unit_cost_snapshot: `null`

## 4. CONFIRMAR CONSUMO
- Nuevo estado: `CONFIRMED`
- unit_cost_snapshot fijado: `750`
- Movimientos creados: `1`

## 5. IDEMPOTENCIA
- Intento de re-confirmar: Rechazado correctamente
- Mensaje de error/respuesta: `Consumption already confirmed (Idempotency)`

## 6. PEDIDO
- Order ID: `0500d3ec-3013-4683-835f-cd3869f56f01`
- Order Item ID: `f31d38d5-386a-4839-98ea-0b4f88721645` con cantidad `10`

## 7. RECEPCIÓN
- Estado de orden tras recepción: `RECEIVED`
- Movimientos RECEIPT creados: `1`
- Stock actual del centro: `28`

## 11. COSTE (MANTENIMIENTO DEL SNAPSHOT)
- Coste snapshot del consumo original: `750` (esperado: no cambia a 999.99)

