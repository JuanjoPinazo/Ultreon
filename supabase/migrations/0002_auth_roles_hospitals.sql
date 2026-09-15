-- 0002_auth_roles_hospitals.sql
-- Tablas de operadores e investigadores

-- Tabla: operators (Operadores que realizan los procedimientos)
CREATE TABLE IF NOT EXISTS public.operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  national_id VARCHAR(50), -- DNI/NIF/Passport opcional
  status record_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de relación: hospital_operators (Un operador puede estar en varios hospitales)
CREATE TABLE IF NOT EXISTS public.hospital_operators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  operator_id UUID REFERENCES public.operators(id) ON DELETE CASCADE,
  is_main_center BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(hospital_id, operator_id)
);

-- Tabla: opstar_investigators (Investigadores principales/secundarios asociados a perfiles)
CREATE TABLE IF NOT EXISTS public.opstar_investigators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE CASCADE,
  is_principal_investigator BOOLEAN DEFAULT false,
  specialty VARCHAR(100),
  status record_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, hospital_id)
);

-- Triggers para updated_at
CREATE TRIGGER update_operators_modtime
BEFORE UPDATE ON public.operators
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_investigators_modtime
BEFORE UPDATE ON public.opstar_investigators
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
