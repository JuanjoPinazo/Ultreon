-- Rollback premature go live

-- 1. Reclassify test case
ALTER TABLE public.ultreon_registry_cases DISABLE TRIGGER USER;

UPDATE public.ultreon_registry_cases
SET is_demo = true,
    is_prelaunch = true,
    core_data = jsonb_set(
        coalesce(core_data, '{}'::jsonb),
        '{audit_trail}',
        coalesce(core_data->'audit_trail', '[]'::jsonb) || '[{"timestamp": "2026-09-19T09:20:00Z", "action": "QA Day-0 synthetic validation executed before official start date.", "system": "Rollback Script"}]'::jsonb
    )
WHERE anonymous_code = 'TEST-LIVE-00000001';

ALTER TABLE public.ultreon_registry_cases ENABLE TRIGGER USER;

-- 2. Restore hospital phase
UPDATE public.ultreon_registry_hospital_settings
SET phase = 'CENTER_PRELAUNCH'
WHERE hospital_id = '6daf691c-3354-459f-94c5-70fd0e876d28';
