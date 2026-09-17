-- 9. SQL DE VERIFICACIÓN

-- Comprobar targets activos por centro
SELECT h.name as hospital_name, t.* 
FROM public.registry_center_targets t
JOIN public.hospitals h ON h.id = t.hospital_id
WHERE t.active = true;

-- Comprobar operator targets
SELECT o.first_name, o.last_name, ot.* 
FROM public.registry_operator_targets ot
JOIN public.operators o ON o.id = ot.operator_id
WHERE ot.active = true;

-- Comprobar histórico (History)
SELECT * 
FROM public.registry_target_history
ORDER BY changed_at DESC;

-- Comprobar RLS
-- Para hacer esto puedes usar el rol anónimo o autenticado seteando claim de id
-- set request.jwt.claim.sub = 'uuid-del-hospital-user';
-- SELECT * FROM public.registry_center_targets;

-- Comprobar casos contabilizados (Lógica que refleja progress.ts)
SELECT count(*) 
FROM public.ultreon_registry_cases c
WHERE c.status = 'COMPLETED' 
  AND c.is_demo = false
  AND c.hospital_id = 'uuid-hospital-manises'
  AND c.procedure_date >= '2026-10-01'
  AND (c.procedure_date <= '2026-12-31' OR '2026-12-31' IS NULL);
