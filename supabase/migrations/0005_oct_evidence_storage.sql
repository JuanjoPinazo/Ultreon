-- 0005_oct_evidence_storage.sql
-- Tablas de evidencia OCT y Storage

-- Tabla de evidencias vinculadas al caso
CREATE TABLE IF NOT EXISTS public.opstar_oct_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.ecrf_opstar_records(id) ON DELETE CASCADE,
  evidence_type evidence_type NOT NULL,
  evidence_phase evidence_phase NOT NULL,
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  content_type VARCHAR(100),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_oct_evidence_modtime
BEFORE UPDATE ON public.opstar_oct_evidence
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- Índices para búsqueda de evidencias
CREATE INDEX idx_evidence_case ON public.opstar_oct_evidence(case_id);
CREATE INDEX idx_evidence_type ON public.opstar_oct_evidence(evidence_type);

-- NOTA: Las políticas de Storage reales requieren que el bucket exista en storage.buckets.
-- Como el esquema se reconstruirá desde cero, es recomendable crear los buckets vía API/UI 
-- o insertarlos manualmente si la tabla de supabase storage.buckets está accesible en la restauración.

-- Ejemplo de inserción en storage.buckets (solo funciona si se tiene acceso al esquema storage)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('opstar-oct-evidence', 'opstar-oct-evidence', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('opstar-case-media', 'opstar-case-media', false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('opstar-exports', 'opstar-exports', false) ON CONFLICT DO NOTHING;
