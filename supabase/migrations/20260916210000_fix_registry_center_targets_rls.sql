-- Migration: fix_registry_center_targets_rls
-- Description: Fix RLS policies on registry_center_targets without rewriting history

DROP POLICY IF EXISTS "Admins can do everything on registry_center_targets" ON public.registry_center_targets;
DROP POLICY IF EXISTS "Hospital users can view their own targets" ON public.registry_center_targets;

CREATE POLICY "Admins can do everything on registry_center_targets"
ON public.registry_center_targets
FOR ALL
TO authenticated
USING (
    public.is_admin()
);

CREATE POLICY "Hospital users can view their own targets"
ON public.registry_center_targets
FOR SELECT
TO authenticated
USING (
    registry_center_targets.hospital_id = public.get_current_user_hospital_id()
);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
