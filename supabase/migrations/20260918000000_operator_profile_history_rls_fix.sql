-- Migration: operator_profile_history_rls_fix
-- Description: Sets the handle_operator_profile_history function to SECURITY DEFINER to bypass RLS on INSERTs to the history table.

CREATE OR REPLACE FUNCTION handle_operator_profile_history()
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

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
