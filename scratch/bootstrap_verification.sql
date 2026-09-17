-- 8. VERIFICACIÓN SQL

-- Verify tables exist
select to_regclass('public.registry_center_targets');
select to_regclass('public.registry_operator_targets');
select to_regclass('public.registry_target_history');

-- Verify registry_center_targets columns
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'registry_center_targets'
order by ordinal_position;
