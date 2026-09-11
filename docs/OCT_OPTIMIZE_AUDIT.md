# Auditoría del Repositorio OPSTAR-AI Levante - Refactor OCT-Optimize

**Fecha:** 16 de Julio de 2026
**Rama:** `refactor/oct-optimize`
**Objetivo:** Transición hacia un registro simplificado enfocado en OCT con ULTREON 3.0, bajo consumo de contraste, pullback rápido y optimización de stent en 6 centros (2 casos por centro).

---

## 1. Arquitectura actual del proyecto
El proyecto está construido sobre un stack moderno y escalable:
- **Framework:** Next.js 16 (App Router) y React 19.
- **Estilos y UI:** Tailwind CSS v4, Framer Motion para animaciones, Recharts para gráficos y componentes de diseño personalizados.
- **Backend/Database:** Supabase (PostgreSQL) usando `@supabase/ssr` y `@supabase/supabase-js`.
- **Estructura:** Arquitectura modular basada en carpetas dentro de `app/` para el enrutamiento y `components/` para la interfaz.

## 2. Funcionalidades ya implementadas
El sistema tiene una amplia gama de módulos desarrollados:
- Autenticación y control de roles (Login).
- Dashboard general de métricas.
- Formularios de entrada de datos (eCRF) muy exhaustivos (`RegistroOpstarForm.tsx`).
- Navegación anatómica coronaria avanzada (`CoronaryTreeNavigator`).
- Módulos adicionales: Core Lab, Seguimiento Clínico (Follow-up), Panel Ejecutivo, Analítica.
- Modo DEMO integrado para simulaciones.

## 3. Tablas, migraciones y relaciones de Supabase existentes
La base de datos cuenta con una estructura compleja definida a través de múltiples migraciones (ej. `supabase_schema.sql`, `20260630_zero_contrast_alignment.sql`, etc.):
- **`hospitals`**: Gestión de centros (id, código, ciudad, etc.).
- **`profiles`**: Gestión de usuarios vinculados a `auth.users` con roles (`admin`, `hospital_user`, `monitor`, `viewer`).
- **`ecrf_opstar_records`**: Tabla central con docenas de campos que abarcan desde detalles de la lesión y anatomía, hasta IA, FFR-OCT y seguimiento.
- **`operators`**: Gestión de operadores.

## 4. Rutas y módulos disponibles
El directorio `app/` contiene los siguientes módulos enrutables:
- `/about`, `/admin`, `/analytics`, `/cases`, `/core-lab`, `/dashboard`, `/demo`, `/executive`, `/follow-up`, `/login`, `/protocols`, `/registry`, `/study`.

## 5. Componentes que podemos reutilizar
- **Autenticación y Roles:** Toda la infraestructura de Supabase Auth y el trigger `handle_new_user` es robusta y reutilizable.
- **Layouts y Design System:** Plantillas base, menús de navegación, tarjetas, modales y `globals.css`.
- **Listado y gestión de hospitales:** Requerido para los "Seis centros" del nuevo alcance.

## 6. Componentes demasiado complejos o fuera del nuevo alcance
Los siguientes elementos exceden la necesidad actual de "registro sencillo" y deben aislarse:
- **FFR-OCT:** Funcionalidad no prioritaria en el nuevo alcance.
- **IA de lípidos:** Exceso de carga de datos no alineada con el enfoque mecánico de ULTREON 3.0.
- **Zero Contrast (Estricto):** Concepto sustituido por "Bajo consumo de contraste".
- **Core Lab complejo:** El dashboard `CoreLabDashboardClient.tsx` es innecesariamente denso para solo 12 casos (2 por centro).
- **Seguimiento clínico excesivo:** El módulo `app/follow-up/` y sus migraciones asociadas.
- **Mapas coronarios avanzados:** El componente `CoronaryTreeNavigator` es muy avanzado y sobrecarga el registro rápido.

## 7. Riesgos técnicos, clínicos y de protección de datos
- **Técnicos:** Componentes monolíticos gigantes (ej. `RegistroOpstarForm.tsx` con >50KB de código) dificultan la mantenibilidad y aumentan la deuda técnica.
- **Clínicos/Privacidad:** La captura de `local_nhc`, `local_sip`, y `patient_code` presenta un riesgo de cumplimiento con el RGPD. Se debe asegurar una seudonimización robusta (ej. usar solo `anonymous_code`).
- **Seguridad:** Las políticas RLS son extensas; un error en su configuración podría exponer datos entre centros si no se simplifican.

## 8. Dependencias y código duplicado
- **Dependencias pesadas:** Uso de librerías como `pdfkit` que podrían ser innecesarias si los reportes no son esenciales en la primera fase.
- **Duplicidad:** La lógica de estado compleja en los formularios puede estar replicada o acoplada, haciendo que modificaciones pequeñas rompan el formulario completo.

## 9. Estado real de autenticación, roles y RLS
- Completamente operativo.
- **Roles:** `admin`, `hospital_user`, `monitor`, `viewer`.
- **RLS:** Implementado correctamente en tablas clave. Los usuarios de hospital solo ven sus propios casos y los admins tienen acceso global. Se gestiona de forma automatizada mediante un trigger al crear el usuario.

## 10. Estado del modo DEMO
- Existen módulos específicos (`app/demo/` y `lib/demo/`).
- Riesgo de que esté acoplado a la versión "compleja" del eCRF, requiriendo su actualización o inhabilitación temporal hasta estabilizar el registro sencillo.

## 11. Propuesta para simplificar sin borrar todavía ninguna funcionalidad
- **Ocultamiento UI:** Eliminar los enlaces de la navegación principal (sidebar/header) a los módulos descartados (`/core-lab`, `/follow-up`, `/executive`, `/analytics`).
- **Simplificación del Formulario:** Crear un **nuevo** componente `SimpleRegistryForm.tsx` en lugar de destruir `RegistroOpstarForm.tsx`, enlazándolo en `/registry`.
- **Vistas en BD:** Mantener la tabla `ecrf_opstar_records` intacta, pero que la aplicación inserte solo los campos esenciales (calidad de imagen, contraste, corregistro, estrategia ACTP). Los demás quedarán como `NULL` o valores por defecto.

## 12. Plan inicial de refactorización por sprints
- **Sprint 1: Limpieza Estructural.** Ocultar menús, rutas y módulos pesados. Aislar el enrutamiento para que el usuario solo vea Login, Dashboard simple y Registro.
- **Sprint 2: Nuevo eCRF Simplificado.** Desarrollar la interfaz para capturar los datos requeridos (Uso OCT ULTREON 3.0, contraste, pullback rápido, corregistro automático, estrategia y optimización de stent).
- **Sprint 3: Adaptación de Centros y Casos.** Limitar la vista a 6 centros y preparar el panel de control para manejar exactamente 2 casos por centro para la "discusión científica".
- **Sprint 4: Refactorización de BD y Testing.** Validar el RLS para el nuevo flujo, auditar la seguridad de datos (anonimización) y adaptar el modo DEMO al nuevo formulario.

## 13. Lista exacta de archivos a tratar
- **Modificar:** `app/layout.tsx` (menús), `app/page.tsx`, `components/design-system` (adaptación UI).
- **Conservar:** `supabase/migrations/*`, `lib/supabaseClient.ts`, `package.json`, configuraciones de Tailwind.
- **Archivar (Ocultar de la vista):**
  - `app/core-lab/`
  - `app/follow-up/`
  - `app/executive/`
  - `app/analytics/`
  - `components/CoronaryTreeNavigator/`
  - `components/RegistroOpstarForm.tsx` (sustituir en UI, pero mantener el archivo como referencia).

## 14. Posibles migraciones destructivas que debemos evitar
- **NO ejecutar `DROP TABLE`** sobre `ecrf_opstar_records`, `operators`, o tablas de seguimiento.
- **NO ejecutar `ALTER TABLE ... DROP COLUMN`** para los campos de IA de lípidos o FFR-OCT. Simplemente dejaremos de enviarlos desde el frontend.
- **NO eliminar políticas RLS existentes**, solo extenderlas si es necesario, para evitar exponer datos históricos que ya estén almacenados.
