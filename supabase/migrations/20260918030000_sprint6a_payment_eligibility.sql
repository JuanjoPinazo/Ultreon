-- Migration: sprint6a_payment_eligibility
-- Description: Fiscal compliance and payment eligibility

-- 1. Create Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contract_status_type') THEN
    CREATE TYPE contract_status_type AS ENUM ('PENDING', 'ELIGIBLE', 'BLOCKED', 'EXPIRED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fmv_status_type') THEN
    CREATE TYPE fmv_status_type AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'compatibility_status_type') THEN
    CREATE TYPE compatibility_status_type AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_method_type') THEN
    CREATE TYPE billing_method_type AS ENUM ('PROFESSIONAL_INVOICE', 'ENTITY_INVOICE', 'SELF_BILLING');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_eligibility_status_type') THEN
    CREATE TYPE payment_eligibility_status_type AS ENUM ('PENDING', 'ELIGIBLE', 'BLOCKED', 'EXPIRED');
  END IF;
END $$;

-- 2. Extend payment_beneficiaries
ALTER TABLE public.payment_beneficiaries
ADD COLUMN IF NOT EXISTS billing_method billing_method_type DEFAULT 'PROFESSIONAL_INVOICE';

-- 3. Create operator_compliance_profiles table
CREATE TABLE IF NOT EXISTS public.operator_compliance_profiles (
    operator_id UUID PRIMARY KEY REFERENCES public.operators(id) ON DELETE CASCADE,
    
    contract_status contract_status_type DEFAULT 'PENDING',
    contract_valid_from DATE,
    contract_valid_to DATE,
    
    fmv_status fmv_status_type DEFAULT 'PENDING',
    fmv_reference TEXT,
    fmv_method TEXT,
    estimated_minutes_per_case NUMERIC(12,2),
    reference_hourly_rate NUMERIC(12,2),
    calculated_rate_per_case NUMERIC(12,2),
    approved_rate_per_case NUMERIC(12,2),
    
    compatibility_required BOOLEAN DEFAULT false,
    compatibility_status compatibility_status_type DEFAULT 'NOT_REQUIRED',
    
    center_authorization_status TEXT,
    tax_profile_status TEXT,
    
    vat_applicable BOOLEAN DEFAULT false,
    vat_rate NUMERIC(5,2) DEFAULT 0,
    withholding_applicable BOOLEAN DEFAULT false,
    withholding_rate NUMERIC(5,2) DEFAULT 0,
    
    eligibility_status payment_eligibility_status_type DEFAULT 'PENDING',
    notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.operator_compliance_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage operator compliance"
ON public.operator_compliance_profiles
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPERADMIN')));

-- 4. Extend registry_case_economics for snapshots
ALTER TABLE public.registry_case_economics
ADD COLUMN IF NOT EXISTS tax_base_snapshot NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS vat_rate_snapshot NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS vat_amount_snapshot NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS withholding_rate_snapshot NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS withholding_amount_snapshot NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS payment_amount_snapshot NUMERIC(12,2);

-- 5. Extend monthly_settlements for rigorous fiscal decomposition
ALTER TABLE public.monthly_settlements
ADD COLUMN IF NOT EXISTS tax_base NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS vat_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS withholding_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS invoice_total NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS professional_net_before_vat NUMERIC(12,2) DEFAULT 0;

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
