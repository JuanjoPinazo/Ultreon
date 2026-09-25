# ULTREON ROLE SECURITY AUDIT

## 1. SCIENTIFIC_REVIEWER
- **Estado**: SQL Migración preparada para creación de Role Enum (`ALTER TYPE user_role ADD VALUE 'SCIENTIFIC_REVIEWER'`).
- **Nivel de Acceso (Planificado)**: LECTURA exclusiva (`READ-ONLY`) sobre todos los datos clínicos (Casos, Resultados, Stock no económico, Documentos).
- **Protección Económica**: Debe recibir denegación (`DENY`) a nivel de Row Level Security y API Routes para cualquier tabla o acción económica (`registry_case_economics`, `registry_economic_rules`, `payment_beneficiaries`, etc.).
- **Recomendación de Implementación**: 
  - Actualizar el middleware (`public.is_admin()`, `public.is_scientific_reviewer()`).
  - Configurar políticas RLS para denegar lectura explícitamente sobre el esquema de economía, incluso previniendo inyecciones o bypass por Supabase UI.
  - Asegurar un Test E2E donde `ADMIN -> ALLOW`, y `SCIENTIFIC_REVIEWER -> DENY` en la visualización de Economics.

## 2. Operator Profile History (RLS FIX)
- **Problema Inicial**: Inserción de un nuevo historial (OCT/IVUS/Angio = 10) fallaba debido a que la regla RLS impedía `INSERT` directo desde el cliente.
- **Solución Aplicada**: Creación de trigger function con `SECURITY DEFINER` y `SET search_path = public`.
- **Hardening adicional necesario**: Asegurar que la función pertenece al `postgres` (superuser), caso contrario el `SECURITY DEFINER` operará en el nivel de otro usuario sin privilegios.
