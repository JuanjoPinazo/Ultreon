# ULTREON SPRINT - PRELAUNCH & GO LIVE REPORT

## 1. PRELAUNCH MODE VERIFIED
La arquitectura global ha sido adaptada para soportar una fase de "Pre-lanzamiento" aislada.
- Se ha creado la tabla de configuración global `registry_settings` que gobierna todo el registro (fijada inicialmente a `phase = PRELAUNCH`).
- Se han inyectado Triggers en PostgreSQL (`BEFORE INSERT` en `ultreon_registry_cases`, `registry_case_consumption`, `registry_orders`) que leen automáticamente esta fase y asientan el flag `is_prelaunch = true` a todo dato generado, independientemente de si el cliente frontend es consciente o no.
- El Dashboard principal detecta la fase y despliega de inmediato un **Banner Persistente** advirtiendo que los datos actuales son de prueba y no computarán oficialmente.

## 2. OFFICIAL CASE COUNT ISOLATED
La regla oficial ha quedado centralizada a nivel TypeScript en `lib/metrics/progress.ts -> isOfficialRegistryCase(c, officialStartDate)` y se inyecta en los agregadores:
```typescript
if (c.status !== 'COMPLETED') return false;
if (c.is_demo) return false;
if (c.is_prelaunch) return false; // El flag persistente descarta de raíz
```
Cualquier caso, consumo o pedido marcado como prelaunch jamás computará para el porcentaje de realización de objetivos de los centros ni operadores.

## 3. PRELAUNCH CONSUMPTION & ORDERS ISOLATED
En `lib/metrics/operational.ts`, se ha implementado el "early exit" en los bucles de consolidación logística:
```typescript
consumptions.forEach(c => {
  if (c.is_prelaunch) return; 
  // ...
});
```
Esto asegura que un consumo de prueba no genera falsas alarmas de rotura de stock ni adultera la predicción de consumo mensual o recomendaciones de pedido (Order Quantity).

## 4. SCIENTIFIC METRICS ISOLATED
Al purgar de raíz `is_prelaunch` y las fechas previas a `official_start_date` mediante la función unificada, los endpoints científicos (Incremental Yield, Calcium Mod, FFR-OCT rate) operarán en un Sandbox que solo mira los datos posteriores a la activación oficial.

## 5. GO LIVE WORKFLOW VERIFIED
Se ha habilitado la pantalla `/admin/settings`:
1. Muestra el estado (PRELAUNCH vs LIVE).
2. Proporciona un botón transaccional para "Poner Registro en marcha (GO LIVE)", que dispara un RPC `activate_registry_go_live` para registrar la fecha seleccionada y el auditor.
3. El dashboard en fase LIVE muestra un LED verde: "Registro Oficial Activo desde [fecha]".

## 6. OFFICIAL STOCK BASELINE VERIFIED
Dentro del mismo panel, una vez la fase es `LIVE`, el coordinador clínico puede usar un formulario exclusivo para fijar el inventario físico de las estanterías de cada hospital, disparando la RPC `set_initial_official_stock`. Esto generará un movimiento fundacional en el kardex de tipo `INITIAL`, sobre el que se construirán los consumos matemáticos futuros.

## CONCLUSIÓN Y CHECKS
✅ PRELAUNCH MODE VERIFIED
✅ GO LIVE WORKFLOW VERIFIED
✅ OFFICIAL CASE COUNT ISOLATED
✅ PRELAUNCH CONSUMPTION ISOLATED
✅ PRELAUNCH ORDERS ISOLATED
✅ OFFICIAL STOCK BASELINE VERIFIED
✅ SCIENTIFIC METRICS ISOLATED

El registro está listo para iniciar el QA completo con doctores en remoto, sin comprometer un solo KPI del estudio final.
