-- Migration to add is_demo flag to ecrf_opstar_records
ALTER TABLE public.ecrf_opstar_records 
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
