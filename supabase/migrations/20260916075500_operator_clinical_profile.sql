-- Migration: Operator Clinical Profile (Basal Profile)
-- Creates a dedicated table for the operator's clinical practice profile
-- and a history table to track versions.

CREATE TABLE IF NOT EXISTS public.operator_clinical_profiles (
    operator_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_usage_oct INT NOT NULL DEFAULT 0,
    image_usage_ivus INT NOT NULL DEFAULT 0,
    image_usage_angio INT NOT NULL DEFAULT 0,
    experience_oct TEXT,
    experience_level_oct TEXT,
    experience_ultreon TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_image_usage CHECK (image_usage_oct + image_usage_ivus + image_usage_angio = 10)
);

-- Enable RLS
ALTER TABLE public.operator_clinical_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for operator_clinical_profiles
CREATE POLICY "Operators can read their own profile"
    ON public.operator_clinical_profiles FOR SELECT
    USING (auth.uid() = operator_id);

CREATE POLICY "Operators can update their own profile"
    ON public.operator_clinical_profiles FOR UPDATE
    USING (auth.uid() = operator_id);

CREATE POLICY "Operators can insert their own profile"
    ON public.operator_clinical_profiles FOR INSERT
    WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Admins and Monitors can read all profiles"
    ON public.operator_clinical_profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'monitor')
        )
    );

-- History table
CREATE TABLE IF NOT EXISTS public.operator_clinical_profile_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    image_usage_oct INT NOT NULL,
    image_usage_ivus INT NOT NULL,
    image_usage_angio INT NOT NULL,
    experience_oct TEXT,
    experience_level_oct TEXT,
    experience_ultreon TEXT,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ DEFAULT NULL
);

-- Enable RLS on history
ALTER TABLE public.operator_clinical_profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can read their own history"
    ON public.operator_clinical_profile_history FOR SELECT
    USING (auth.uid() = operator_id);

CREATE POLICY "Admins and Monitors can read all history"
    ON public.operator_clinical_profile_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin', 'monitor')
        )
    );

-- Function to handle versioning
CREATE OR REPLACE FUNCTION handle_operator_profile_history()
RETURNS TRIGGER AS $$
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

-- Trigger for versioning
DROP TRIGGER IF EXISTS operator_profile_versioning ON public.operator_clinical_profiles;
CREATE TRIGGER operator_profile_versioning
    BEFORE INSERT OR UPDATE ON public.operator_clinical_profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_operator_profile_history();
