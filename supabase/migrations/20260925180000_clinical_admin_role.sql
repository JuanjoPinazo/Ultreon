-- 1. Añadir el nuevo rol 'clinical_admin' a la restricción de check de roles en perfiles
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_role_check
CHECK (role IN ('admin', 'super_admin', 'monitor', 'hospital_user', 'scientific_reviewer', 'viewer', 'clinical_admin'));

-- 2. Cambiar el rol del Dr. Ramón López Palop
UPDATE public.profiles
SET role = 'clinical_admin'
WHERE email = 'lopez_albmar@gva.es' OR full_name ILIKE '%Ramón López-Palop%';
