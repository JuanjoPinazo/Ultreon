# Actualización de Vistas de Administración (Tablas/Listados)

## Auditoría Previa
Se ha realizado una auditoría exhaustiva del código, rutas y tipos de TypeScript actuales. **NO requiere cambios de base de datos.** Todos los datos necesarios, relaciones y conteos (usuarios, investigadores, operadores por centro) ya existen en el esquema actual de Supabase y pueden derivarse o contarse directamente mediante consultas estándar en los Server Components y manipulación de estado en los Client Components.

## Archivos Modificados
1. `app/admin/hospitals/page.tsx`: Actualizada la consulta para incluir los recuentos totales de investigadores (`opstar_investigators`) y operadores (`hospital_operators`) por cada centro clínico en memoria, pasándolos como props al cliente.
2. `app/admin/hospitals/HospitalsFormClient.tsx`: Se ha reemplazado la vista de "Tarjetas/Grid" por un listado/tabla dinámico, mostrando los recuentos en una columna compacta de "Asociados" y su estado como un badge.
3. `app/admin/users/UsersFormClient.tsx`: Migrado el grid de usuarios a una tabla limpia. Se añadió una barra de búsqueda en tiempo real (por nombre/email), tal y como se solicitaba. Los roles tienen nuevos badges (ADMIN, MÉDICO, MONITOR, VISOR).
4. `app/admin/investigators/InvestigatorsFormClient.tsx`: Sustituida la vista de tarjetas por una tabla compacta. Se implementó una lógica de ordenamiento secundaria en memoria, ordenando primero por "Centro" (alfabético) y luego por "Nombre del investigador" dentro del centro, preservando el pin de Investigador Principal (★).
5. `app/admin/operators/AdminOperatorsClient.tsx`: Reconstruida la vista de operadores a formato tabla. Para resolver el requerimiento de operadores multi-centro, se mantiene una sola fila por operador (agrupando sus hospitales en la columna), pero el orden principal respeta el orden alfabético del hospital primario del operador. 

## Rutas Afectadas
- `/admin/hospitals`
- `/admin/users`
- `/admin/investigators`
- `/admin/operators`

## Componentes Reutilizados
- Se han re-usado los mismos selectores de hospitales y estilos base (`bg-slate-900`, `rounded-xl/2xl`, `bg-cyan-500`) y bordes (`border-slate-800`) para garantizar la cohesión visual del proyecto.
- No se han instalado dependencias externas para tablas (tipo react-table); se usa CSS estándar (`table`, `thead`, `tbody`, `tr`, `td`) optimizado para ser *mobile-first* (scroll horizontal) para un rendimiento perfecto.

## Comportamiento de Filtros
- **Usuarios**: Se implementó una función `useMemo` local para búsqueda textual insensible a mayúsculas/minúsculas en base al nombre o el correo electrónico.
- **Investigadores**: Conservado el filtro desplegable por Centro y modificado su comportamiento para actuar directamente sobre el subconjunto renderizado en la tabla plana.
- **Operadores**: Conservada y optimizada la lógica de búsqueda por texto. Implementado un filtro de "Todos los centros" / "Centro Específico". El orden se ajusta de forma reactiva. 

## UI Final (Diseño)
Las nuevas vistas han sido programadas priorizando densidad de información mediante:
- Cabeceras monocromáticas de tabla (`font-mono text-[10px] text-slate-400`).
- Badges visuales para el `Estado` y `Rol` en lugar de texto plano.
- Acrónimos y códigos resaltados para lectura veloz.
- Acciones ("Editar", "Eliminar") anidadas al final de cada fila a la derecha, manteniendo la confirmación *inline* de borrado con explicaciones dinámicas (Ej. "Tiene 2 usuario(s) asignado(s)").

## Resultado del Build
✅ El comando `npm run build` junto a `tsc --noEmit` y `npm run lint` se ha ejecutado satisfactoriamente sin generar nuevos errores ni advertencias de tipado. Todo compila correctamente y el sistema eCRF no ha sido alterado de ninguna manera.
