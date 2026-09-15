-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - UNIQUE ANONYMOUS CODE
-- =============================================================================

-- Add UNIQUE constraint to anonymous_code to prevent race conditions during insertion
ALTER TABLE public.ecrf_opstar_records ADD CONSTRAINT ecrf_opstar_records_anonymous_code_key UNIQUE (anonymous_code);
