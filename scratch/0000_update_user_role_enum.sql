-- 1. ADD MISSING VALUES TO user_role ENUM
-- We add 'clinical_admin' and other roles that might be missing
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'clinical_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'scientific_reviewer';

-- 2. VERIFY GET_CURRENT_USER_ROLE
-- Re-create the function to ensure it uses the user_role type
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.user_role AS $$
DECLARE
  current_role public.user_role;
BEGIN
  SELECT role::public.user_role INTO current_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN current_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
