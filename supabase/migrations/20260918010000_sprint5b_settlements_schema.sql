-- Migration: sprint5b_settlements_schema
-- Description: Add required columns for Monthly Settlements flow (Adjusted for Operator-based settlements)

-- 1. Drop existing constraint
ALTER TABLE public.monthly_settlements
DROP CONSTRAINT IF EXISTS monthly_settlements_beneficiary_id_period_year_period_mont_key;

-- 2. Add columns
ALTER TABLE public.monthly_settlements
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.operators(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS unit_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS invoice_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_number TEXT,
ADD COLUMN IF NOT EXISTS invoice_date DATE;

-- 3. Add new constraint combining operator and beneficiary
-- If operator_id is null (for older records before this migration), the constraint will still hold for just beneficiary_id where operator_id is null, but ideally operator_id should be NOT NULL moving forward. 
-- However, since there might be existing records, we allow it to be nullable for now or assume it gets backfilled. 
-- For the sake of the constraint, Postgres treats NULLs as distinct unless specified otherwise in some contexts, but let's add the constraint.
ALTER TABLE public.monthly_settlements
ADD CONSTRAINT monthly_settlements_operator_id_beneficiary_id_period_year_per_key UNIQUE (operator_id, beneficiary_id, period_year, period_month);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
