-- Migration: Fix hospital_case_counters schema (Legacy to V3)
-- Description: Renames the legacy 'last_value' column to 'counter_value' without losing data.

BEGIN;

DO $$
BEGIN
    -- 1. If legacy 'last_value' exists, rename it to 'counter_value'
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'hospital_case_counters' 
          AND column_name = 'last_value'
    ) THEN
        ALTER TABLE public.hospital_case_counters RENAME COLUMN last_value TO counter_value;
    END IF;

    -- 2. If neither existed, ensure 'counter_value' is created (Fallback)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'hospital_case_counters' 
          AND column_name = 'counter_value'
    ) THEN
        ALTER TABLE public.hospital_case_counters ADD COLUMN counter_value BIGINT NOT NULL DEFAULT 0;
    END IF;

    -- 3. Ensure created_at and updated_at exist just in case
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'hospital_case_counters' 
          AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.hospital_case_counters ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'hospital_case_counters' 
          AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.hospital_case_counters ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
    END IF;
END $$;

-- 4. Schema Cache Reload
NOTIFY pgrst, 'reload schema';

COMMIT;
