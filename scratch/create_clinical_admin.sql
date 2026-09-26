-- 1. Añadir el nuevo rol 'clinical_admin' al tipo ENUM.
-- Nota: En PostgreSQL, no se puede hacer ALTER TYPE dentro de un bloque transaccional o condicional fácilmente.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'clinical_admin';

-- 2. Cambiar el rol del Dr. Ramón López Palop
UPDATE public.profiles
SET role = 'clinical_admin'
WHERE full_name ILIKE '%Ramón López-Palop%' OR full_name ILIKE '%Ramon Lopez Palop%' OR full_name ILIKE '%Ramon Lopez-Palop%' OR full_name ILIKE '%Ramón López Palop%';

-- 3. Hardening RLS (Ejemplo de políticas)
-- Se asume que las políticas actuales para admin y super_admin permiten el acceso a las tablas económicas.
-- Se añadirán restricciones explícitas o simplemente NO se incluirá a clinical_admin en las políticas de economía.

-- Deny policies for clinical_admin on economic tables (if we want explicit deny, but Postgres RLS is default deny unless ALLOW is provided).
-- We will just make sure it's not granted.
