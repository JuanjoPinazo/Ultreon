-- 0001_initial_schema.sql
-- Enums y tablas base

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS
-- ==========================================

-- Roles de usuario
CREATE TYPE user_role AS ENUM (
  'admin',
  'hospital_user',
  'monitor',
  'viewer'
);

-- Estado del caso
CREATE TYPE case_status AS ENUM (
  'draft',
  'submitted',
  'locked',
  'archived'
);

-- Calidad del lavado
CREATE TYPE wash_quality AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor'
);

-- Tipo de evidencia (para Storage/Media)
CREATE TYPE evidence_type AS ENUM (
  'oct_video',
  'oct_image',
  'angiography',
  'report'
);

-- Fase de evidencia
CREATE TYPE evidence_phase AS ENUM (
  'pre',
  'post'
);

-- Tipo de cambio de estrategia (Ultreon)
CREATE TYPE strategy_change_type AS ENUM (
  'stent_size',
  'stent_length',
  'lesion_preparation',
  'post_dilation',
  'other',
  'none'
);

-- Tipo de centro hospitalario
CREATE TYPE center_type AS ENUM (
  'academic',
  'private',
  'public_general',
  'demo'
);

-- Estado general (activo/inactivo)
CREATE TYPE record_status AS ENUM (
  'active',
  'inactive'
);

-- ==========================================
-- 2. TABLAS BASE
-- ==========================================

-- Tabla: hospitals
CREATE TABLE IF NOT EXISTS public.hospitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  country VARCHAR(100),
  center_type center_type DEFAULT 'public_general',
  status record_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: profiles
-- Extiende auth.users de Supabase
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role user_role DEFAULT 'hospital_user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Función para actualizar updated_at (helper trigger)
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers base para updated_at
CREATE TRIGGER update_hospitals_modtime
BEFORE UPDATE ON public.hospitals
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

CREATE TRIGGER update_profiles_modtime
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
