# ULTREON SCIENTIFIC REVIEWER USER REPORT

## 1. Verificación y Creación
- **Rol Existente**: Se ha validado la existencia del rol `SCIENTIFIC_REVIEWER` para el sistema.
- **Usuario Creado**: Dr. Ramón López Palop
- **Email de acceso**: `ramon.lopez.palop@scientific.reviewer.com` (Simulado para invitación normal).
- **ID de Usuario**: `620afc4e-f9de-4fd7-80f4-c3c02c7357ea`
- **Role Asignado**: `SCIENTIFIC_REVIEWER` (Revisor Científico).

## 2. Permisos Efectivos
El perfil cuenta con acceso **READ-ONLY** estricto sobre las siguientes áreas de negocio:
- Dashboard principal
- Casos clínicos y Detalle completo eCRF
- Resultados científicos, Centros, y Operadores
- Perfiles clínicos y Objetivos
- Documentación, Audit trail y stock operativo no económico.

Cualquier mutación en estas entidades (ej. editar un caso o cambiar stock) está bloqueada por Supabase RLS y validación Middleware.

## 3. Seguridad Económica (HARD DENY)
Se ha implementado el HARD DENY requerido a través de RLS (Policies restrictivas).
- **Rutas y Tablas Denegadas**: `registry_case_economics`, `registry_economic_rules`, `payment_beneficiaries`, `operator_payment_assignments`, `monthly_settlements`, `settlement_items`.
- **Efecto de la denegación**: Ninguna consulta SELECT, INSERT, UPDATE, o DELETE retornará datos económicos. 
- **Verificación URL Directa**: Si el Dr. López Palop intenta navegar por URL manual hacia `/admin/economics` o `/admin/settlements`, será interceptado y devuelto a la pantalla principal por el middleware y los guards del frontend, impidiendo la lectura de product costs, revenues, margins, compensations, VAT, etc.
