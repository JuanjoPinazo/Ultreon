-- 0006_demo_center_and_bi.sql
-- Tablas de Gobernanza, BI y Métricas de Centros (OPSTAR)

-- Gobernanza del estudio (opstar_study_governance)
CREATE TABLE IF NOT EXISTS public.opstar_study_governance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  document_url TEXT,
  version VARCHAR(50),
  published_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Objetivos por centro (opstar_center_objectives)
CREATE TABLE IF NOT EXISTS public.opstar_center_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  target_cases INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, start_date, end_date)
);

-- Métricas económicas / BI por centro (opstar_center_business_metrics)
-- Solo visible para admin
CREATE TABLE IF NOT EXISTS public.opstar_center_business_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  period_month DATE NOT NULL, -- Siempre el primer día del mes
  stent_savings_eur NUMERIC(10,2) DEFAULT 0,
  contrast_savings_eur NUMERIC(10,2) DEFAULT 0,
  procedure_time_savings_min INTEGER DEFAULT 0,
  total_roi_eur NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, period_month)
);

-- Triggers para updated_at
CREATE TRIGGER update_governance_modtime
BEFORE UPDATE ON public.opstar_study_governance
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_objectives_modtime
BEFORE UPDATE ON public.opstar_center_objectives
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_business_metrics_modtime
BEFORE UPDATE ON public.opstar_center_business_metrics
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
