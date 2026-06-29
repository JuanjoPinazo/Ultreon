-- =============================================================================
-- OPSTAR-AI LEVANTE REGISTRY - ZERO-CONTRAST OCT ALIGNMENT MIGRATION
-- =============================================================================

ALTER TABLE public.ecrf_opstar_records
  -- Administrative / Identifiers
  ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES public.operators(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS procedure_date date,
  ADD COLUMN IF NOT EXISTS patient_code text,
  ADD COLUMN IF NOT EXISTS local_nhc text,
  ADD COLUMN IF NOT EXISTS local_sip text,
  ADD COLUMN IF NOT EXISTS anonymous_code text,

  -- Anatomy
  ADD COLUMN IF NOT EXISTS coronary_segment text,
  ADD COLUMN IF NOT EXISTS coronary_vessel text,
  ADD COLUMN IF NOT EXISTS coronary_group text,

  -- Projections / RX Orientation
  ADD COLUMN IF NOT EXISTS projection_horizontal text,
  ADD COLUMN IF NOT EXISTS projection_vertical text,
  ADD COLUMN IF NOT EXISTS axial_rotation numeric,

  -- Saline / Clearing Protocol
  ADD COLUMN IF NOT EXISTS saline_protocol_used boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS syringe_size_ml numeric,
  ADD COLUMN IF NOT EXISTS fast_pullback_seconds numeric,
  ADD COLUMN IF NOT EXISTS contrast_during_oct_ml numeric,
  ADD COLUMN IF NOT EXISTS total_contrast_ml numeric,
  ADD COLUMN IF NOT EXISTS wash_quality text,
  
  -- Contrast conversion details
  ADD COLUMN IF NOT EXISTS contrast_conversion_needed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contrast_conversion_reason text,

  -- ULTREON AI findings
  ADD COLUMN IF NOT EXISTS ultreon_calcium boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultreon_calcium_arc_gt_180 boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultreon_eel_detected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lesion_length_mm numeric,
  ADD COLUMN IF NOT EXISTS proximal_reference_mm numeric,
  ADD COLUMN IF NOT EXISTS distal_reference_mm numeric,
  ADD COLUMN IF NOT EXISTS mla_mm2 numeric,

  -- Post-stent optimization
  ADD COLUMN IF NOT EXISTS final_stent_expansion_percent numeric,

  -- Strategy modification
  ADD COLUMN IF NOT EXISTS ultreon_modified_strategy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS strategy_change_type text,
  ADD COLUMN IF NOT EXISTS strategy_change_notes text,

  -- Management
  ADD COLUMN IF NOT EXISTS case_status text DEFAULT 'completed';

-- Cleanup legacy unused columns if they exist (safe dropdowns/deletions)
-- We will keep the legacy columns in database structure for safety, 
-- but they are no longer used in the application payload.
