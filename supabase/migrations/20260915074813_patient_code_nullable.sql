-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - PATIENT CODE NULLABLE
-- =============================================================================

-- Remove NOT NULL constraint from patient_code
-- The application now uses anonymous_code exclusively as the primary case identifier
ALTER TABLE public.ecrf_opstar_records ALTER COLUMN patient_code DROP NOT NULL;
