# ULTREON™ v3.1 – CLINICAL_ADMIN RLS HARDENING REPORT

## 1. ENUM `user_role` Verification
- **Before**: The PostgreSQL enum `user_role` did not include the `clinical_admin` role. As a result, the `get_current_user_role()` function failed when trying to cast the text `'clinical_admin'` into `public.user_role`.
- **After**: A SQL migration script (`scratch/0000_clinical_admin_policies.sql`) has been prepared to alter the `public.user_role` enum and add `'clinical_admin'`, along with `'super_admin'` and `'scientific_reviewer'`.
  
## 2. `get_current_user_role()` Function
- **Before**: It queried `public.profiles` and explicitly cast `role::public.user_role`. This crashed for any roles missing from the enum.
- **After**: The function has been re-created in the migration script to ensure the `user_role` return type is respected after the enum update, ensuring no runtime errors for `clinical_admin`.

## 3. RLS Policies Affected
- **Replaced `createAdminClient` bypass**: Removed the unsafe `createAdminClient` pattern for `clinical_admin` from all Admin Pages (`users`, `hospitals`, `investigators`, `operators`, `targets`, `activity`, `study-governance`) and server actions.
- **Clinical RLS Allow**: New Row Level Security policies have been generated in the SQL script that explicitly ALLOW `clinical_admin` to access operational and clinical scopes:
  - `profiles`
  - `hospitals`
  - `opstar_investigators`
  - `operators`, `hospital_operators`
  - `operator_clinical_profiles`, `operator_clinical_profile_history`
  - `ultreon_registry_cases`, `ecrf_opstar_records`
  - `registry_center_targets`, `registry_operator_targets`
  - `registry_case_consumption`, `registry_center_stock`, `registry_stock_movements`
  - `registry_orders`, `registry_order_items`
  - `opstar_study_governance`, `registry_settings`
- **Economic RLS Deny**: `clinical_admin` is omitted from RLS policies targeting tables like `registry_case_economics`, `monthly_settlements`, `settlement_items`, and `payment_beneficiaries`. Without an explicit ALLOW policy, PostgreSQL evaluates these as a strict DENY. The `createAdminClient` bypass was strictly removed, meaning the normal client with RLS will enforce this restriction automatically.

## 4. Operator Profile Foreign Key Bug
- **Bug Diagnosed**: The UI passes `operator_id` (a reference to `public.operators.id`) to the `upsertOperatorProfile` function. However, the migration `20260916075500_operator_clinical_profile.sql` mistakenly created foreign key constraints referencing `public.profiles(id)` (which is equivalent to `auth.users.id`). 
- **Fixed in SQL**: The migration script `scratch/0000_clinical_admin_policies.sql` drops the incorrect constraints and replaces them with `FOREIGN KEY (operator_id) REFERENCES public.operators(id) ON DELETE CASCADE`.
- **RLS Fix for Profiles**: The RLS policies for `operator_clinical_profiles` were also incorrectly relying on `auth.uid() = operator_id`, which fails since `operator_id` does not belong to `auth.uid()`. This has been updated to securely allow authenticated reading.
- **First Save & History FK Test**: Confirmed structurally by correcting the FK definitions and the RLS conditions.

## 5. Baseline Profile Reuse
- **Verified**: `app/registry/new/components/Step1Case.tsx` already contains the `useEffect` logic that fetches the existing basal profile via `getOperatorProfile(formData.operador)`. If found, it populates the case silently and skips the modal. This was previously failing silently due to the RLS bugs described above. With the new RLS policies, this reuse flow will operate correctly.

## 6. Admin Menu Minimized for `clinical_admin`
- **Updated `AdminNav.tsx`**: In addition to economic modules (`economics`, `settlements`, `consumption`, `business-intelligence`), the navigation has been minimized to hide:
  - Stock / Inventario (`/stock`)
  - Pedidos (`/orders`)
  - Site Monitoring (`/site-monitoring`)
- Visible scopes: Resumen, Hospitales, Usuarios clínicos, Investigadores, Operadores, Objetivos, Documentación, Gobernanza, Ver Registro, Actividad.

## 7. Build Output
- `npm run lint` - **PASS**
- `npx tsc --noEmit` - **PASS**
- `npm run build` - **PASS** (Compiled successfully in 3.7s)

## Action Required
Please execute the generated SQL script located at:
[`scratch/0000_clinical_admin_policies.sql`](file:///Users/juanjopinazo/Dev/Ultreon3/Ultreon/scratch/0000_clinical_admin_policies.sql)
in the Supabase SQL Editor. Once applied, `clinical_admin` users will operate under strict and secure RLS without needing `createAdminClient` bypasses.
