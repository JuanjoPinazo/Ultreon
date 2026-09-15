-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - ADD USER_ID TO OPERATORS
-- =============================================================================

-- 1. ADD user_id TO operators
ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. CREATE INDEX FOR user_id
CREATE INDEX IF NOT EXISTS idx_operators_user_id ON public.operators(user_id);
