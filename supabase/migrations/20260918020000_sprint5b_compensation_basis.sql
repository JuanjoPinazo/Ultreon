-- Migration: sprint5b_compensation_basis
-- Description: Define compensation basis (PER_CASE vs PER_UNIT) and ensure constraint alignment.

-- 1. Modify registry_economic_rules to include compensation_basis
ALTER TABLE public.registry_economic_rules
ADD COLUMN IF NOT EXISTS compensation_basis TEXT DEFAULT 'PER_CASE' CHECK (compensation_basis IN ('PER_CASE', 'PER_UNIT'));

-- 2. Modify registry_case_economics to include snapshot columns for the new rule
ALTER TABLE public.registry_case_economics
ADD COLUMN IF NOT EXISTS compensation_basis_snapshot TEXT CHECK (compensation_basis_snapshot IN ('PER_CASE', 'PER_UNIT')),
ADD COLUMN IF NOT EXISTS remunerable_units_snapshot INTEGER,
ADD COLUMN IF NOT EXISTS gross_compensation_snapshot NUMERIC(12,2);

-- 3. Safely update monthly_settlements constraints
-- Drop any potentially conflicting constraint from earlier or historical migrations
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'monthly_settlements_beneficiary_id_period_year_period_mont_key'
    ) THEN
        ALTER TABLE public.monthly_settlements DROP CONSTRAINT monthly_settlements_beneficiary_id_period_year_period_mont_key;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'monthly_settlements_operator_id_beneficiary_id_period_year_per_key'
    ) THEN
        ALTER TABLE public.monthly_settlements DROP CONSTRAINT monthly_settlements_operator_id_beneficiary_id_period_year_per_key;
    END IF;
END $$;

-- Ensure operator_id exists (just in case this runs in an env without previous local migration)
ALTER TABLE public.monthly_settlements
ADD COLUMN IF NOT EXISTS operator_id UUID REFERENCES public.operators(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS unit_count INTEGER NOT NULL DEFAULT 0;

-- Apply the definitive unique constraint
ALTER TABLE public.monthly_settlements
ADD CONSTRAINT monthly_settlements_operator_id_beneficiary_id_period_year_per_key UNIQUE (operator_id, beneficiary_id, period_year, period_month);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
