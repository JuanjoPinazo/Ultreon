-- Migration: operator_profile_history_rls_hardening
-- Description: Sets the proper ownership and grants for the trigger function to ensure SECURITY DEFINER operates under the postgres superuser context, bypassing RLS correctly.

-- 1. Ensure the function is defined with SECURITY DEFINER and search_path
CREATE OR REPLACE FUNCTION public.handle_operator_profile_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        -- Close the previous version if it exists
        IF TG_OP = 'UPDATE' THEN
            UPDATE public.operator_clinical_profile_history
            SET valid_to = NOW()
            WHERE operator_id = NEW.operator_id AND valid_to IS NULL;
        END IF;

        -- Insert new version
        INSERT INTO public.operator_clinical_profile_history (
            operator_id,
            image_usage_oct,
            image_usage_ivus,
            image_usage_angio,
            experience_oct,
            experience_level_oct,
            experience_ultreon,
            valid_from
        ) VALUES (
            NEW.operator_id,
            NEW.image_usage_oct,
            NEW.image_usage_ivus,
            NEW.image_usage_angio,
            NEW.experience_oct,
            NEW.experience_level_oct,
            NEW.experience_ultreon,
            NOW()
        );

        -- Update the updated_at timestamp on the main table
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Set the owner to postgres (superuser) so it can bypass RLS when inserting into history
ALTER FUNCTION public.handle_operator_profile_history() OWNER TO postgres;

-- 3. Revoke public execute rights and grant only to authenticated roles
REVOKE ALL ON FUNCTION public.handle_operator_profile_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_operator_profile_history() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_operator_profile_history() TO service_role;
