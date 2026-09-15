-- 0003_zero_contrast_registry.sql
-- Tabla principal del registro Zero-Contrast (ecrf_opstar_records)

CREATE TABLE IF NOT EXISTS public.ecrf_opstar_records (
  -- Campos base
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE RESTRICT NOT NULL,
  operator_id UUID REFERENCES public.operators(id) ON DELETE RESTRICT NOT NULL,
  
  -- Fechas y Demografía
  procedure_date DATE NOT NULL,
  patient_code VARCHAR(100) NOT NULL, -- Código anónimo del paciente del estudio
  local_nhc VARCHAR(100), -- Número Historia Clínica Local (desencriptable localmente)
  local_sip VARCHAR(100), -- Número SIP Local
  anonymous_code VARCHAR(100), -- Identificador anónimo secundario
  
  -- Datos Clínicos de la Lesión
  coronary_segment VARCHAR(100),
  coronary_vessel VARCHAR(100),
  coronary_group VARCHAR(100),
  
  -- Protocolo y Contraste
  saline_protocol_used BOOLEAN DEFAULT false,
  syringe_size_ml NUMERIC(5,2),
  fast_pullback_seconds INTEGER,
  contrast_during_oct_ml NUMERIC(5,2),
  total_contrast_ml NUMERIC(5,2),
  wash_quality wash_quality,
  contrast_conversion_needed BOOLEAN DEFAULT false,
  contrast_conversion_reason TEXT,
  
  -- Mediciones Ultreon (OCT)
  ultreon_calcium BOOLEAN DEFAULT false,
  ultreon_calcium_arc_gt_180 BOOLEAN DEFAULT false,
  ultreon_eel_detected BOOLEAN DEFAULT false,
  lesion_length_mm NUMERIC(5,2),
  proximal_reference_mm NUMERIC(5,2),
  distal_reference_mm NUMERIC(5,2),
  mla_mm2 NUMERIC(5,2),
  final_stent_expansion_percent NUMERIC(5,2),
  
  -- Estrategia e Intervención
  ultreon_modified_strategy BOOLEAN DEFAULT false,
  strategy_change_type strategy_change_type DEFAULT 'none',
  strategy_change_notes TEXT,
  
  -- Control de registro
  case_status case_status DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para updated_at
CREATE TRIGGER update_ecrf_opstar_records_modtime
BEFORE UPDATE ON public.ecrf_opstar_records
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Índices para mejorar rendimiento
CREATE INDEX idx_ecrf_hospital ON public.ecrf_opstar_records(hospital_id);
CREATE INDEX idx_ecrf_operator ON public.ecrf_opstar_records(operator_id);
CREATE INDEX idx_ecrf_date ON public.ecrf_opstar_records(procedure_date);
CREATE INDEX idx_ecrf_status ON public.ecrf_opstar_records(case_status);
