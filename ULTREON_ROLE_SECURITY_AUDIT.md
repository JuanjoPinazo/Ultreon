# ULTREON ROLE SECURITY AUDIT

## Role Access Matrix

| Role | Clinical Actions | User Management | Economics & Billing |
|---|---|---|---|
| **ADMIN** | ✅ Full Access (Read/Write) | ✅ Full Access (Assign any role) | ✅ Full Access (Read/Write) |
| **CLINICAL_ADMIN** | ✅ Full Access (Read/Write) | ⚠️ Partial (Cannot assign/modify ADMIN) | ❌ Absolute Deny (No access) |
| **SCIENTIFIC_REVIEWER** | 👁️ Read-Only | ❌ No Access | ❌ Absolute Deny (No access) |
| **COORDINATOR / MONITOR** | 👁️ Read-Only (Validation) | ❌ No Access | ❌ Absolute Deny (No access) |
| **OPERATOR / HOSPITAL_USER**| ⚠️ Partial (Own cases only) | ❌ No Access | ❌ Absolute Deny (No access) |

## Implementation Details

### CLINICAL_ADMIN (Nuevo Rol)
- **Estado**: Creado y asignado exitosamente al Dr. Ramón López-Palop.
- **Middleware Protection**: `proxy.ts` explícitamente redirige cualquier intento de acceso a `/admin/economics`, `/admin/settlements`, `/admin/consumption`, o `/admin/business-intelligence` a `/admin`.
- **UI Protection**: `AdminNav.tsx` oculta todos los enlaces relacionados con economía (liquidaciones, consumos, inteligencia de negocio).
- **Server Actions**: `lib/supabase/actions.ts` valida que `clinical_admin` actúe como admin clínico pero le bloquea la capacidad de otorgar el rol `admin` o editar perfiles que sean `admin`.
- **Database Level**: Migración SQL `20260925180000_clinical_admin_role.sql` actualiza el `check constraint` en `profiles_role_check` para permitir el rol, y aplica el rol `clinical_admin` al email correspondiente de forma directa.

### SCIENTIFIC_REVIEWER
- **Estado**: Mantenido. Sus permisos siguen siendo exclusivamente de lectura clínica y científica.

### Operator Profile History (RLS FIX)
- **Solución Aplicada**: Creación de trigger function con `SECURITY DEFINER` y `SET search_path = public`.
- **Hardening adicional necesario**: Asegurar que la función pertenece al `postgres` (superuser), caso contrario el `SECURITY DEFINER` operará en el nivel de otro usuario sin privilegios.

### INVESTIGATOR MODEL (SEPARATION OF CONCERNS)
- **Concepto**: Coordinador vs IP Local vs Operador vs Usuario.
- **Investigador Coordinador**: Rol representativo global (Dr. Ramón López-Palop).
- **Investigador Principal**: IP delegado a nivel de centro (`opstar_investigators.is_principal_investigator`).
- **Operador**: Entidad médica ejecutora vinculada por `hospital_operators`. NO es necesario que tenga credenciales.
- **User (Hospital User)**: Credencial de acceso a plataforma (CRA / Data entry). Separado conceptualmente del Operador.
- **Ramón Scope**: Como `clinical_admin`, tiene acceso global a todos los centros para auditoría y visualización de expedientes clínicos, pero permanece denegado a nivel económico.
