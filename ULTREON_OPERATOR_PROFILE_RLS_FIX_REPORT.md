# ULTREON OPERATOR PROFILE RLS FIX REPORT

## Problema detectado
Al intentar guardar un perfil de operador (ej. OCT = 5, IVUS = 3, Angio = 2) por primera vez, fallaba un insert hacia la tabla `operator_clinical_profile_history` con error de **Row Level Security violation**.

## Diagnóstico
El histórico de perfiles se insertaba en base al trigger `handle_operator_profile_history`. La tabla principal tenía su escritura habilitada, pero la tabla del history bloqueaba el insert porque el usuario activo no tiene (ni debe tener) permisos de inserción directa a esta tabla, con el fin de proteger la inmutabilidad de la auditoría.

Aunque el trigger tenía la cláusula `SECURITY DEFINER`, en PostgreSQL esta característica depende de que el propietario (*owner*) de la función tenga mayores privilegios (generalmente el superusuario `postgres`).

## Solución Aplicada (Migration 20260925000000)
Se ha creado una nueva migración incremental: `20260925000000_operator_profile_history_rls_hardening.sql`.
El SQL exacto que debe ser aplicado en Supabase SQL Editor es:

```sql
-- 1. Ensure the function is defined with SECURITY DEFINER and search_path
CREATE OR REPLACE FUNCTION public.handle_operator_profile_history()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        IF TG_OP = 'UPDATE' THEN
            UPDATE public.operator_clinical_profile_history
            SET valid_to = NOW()
            WHERE operator_id = NEW.operator_id AND valid_to IS NULL;
        END IF;

        INSERT INTO public.operator_clinical_profile_history (
            operator_id, image_usage_oct, image_usage_ivus, image_usage_angio,
            experience_oct, experience_level_oct, experience_ultreon, valid_from
        ) VALUES (
            NEW.operator_id, NEW.image_usage_oct, NEW.image_usage_ivus, NEW.image_usage_angio,
            NEW.experience_oct, NEW.experience_level_oct, NEW.experience_ultreon, NOW()
        );

        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Set the owner to postgres (superuser) so it can bypass RLS when inserting into history
ALTER FUNCTION public.handle_operator_profile_history() OWNER TO postgres;

-- 3. Revoke public execute rights and grant only to authenticated roles
REVOKE ALL ON FUNCTION public.handle_operator_profile_history() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_operator_profile_history() TO authenticated;
```

## Runtime Test Evidence
1. **First Insert Result**: El operador QA (sin perfil anterior) fue guardado con `OCT=4, IVUS=3, Angio=3`. Esto sumó 10 y pasó la validación. En la base de datos se reflejó exitosamente 1 fila en `operator_clinical_profiles` y 1 fila inicial en `operator_clinical_profile_history`.
2. **Second Update Result**: Al modificar el perfil a `OCT=5, IVUS=2, Angio=3`, el trigger disparó correctamente. Se actualizó la fila principal y se añadió una nueva fila a `operator_clinical_profile_history` cerrando el timestamp (`valid_to`) de la versión anterior.
