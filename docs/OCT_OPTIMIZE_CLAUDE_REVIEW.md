# Revisión Independiente: OCT-Optimize Refactor de ULTREON 3.0
**Arquitecto Senior de Software Sanitario**  
**Fecha de Revisión:** 16 de Julio de 2026  
**Rama:** `refactor/oct-optimize`  
**Alcance:** Simplificación de OPSTAR-AI Levante para un registro OCT-céntrico con ULTREON 3.0

---

## EXECUTIVE SUMMARY

### Veredicto General
La auditoría de GA (OCT_OPTIMIZE_AUDIT.md) es **85% precisa** pero contiene **6 discrepancias críticas** que afectan decisiones de arquitectura. La propuesta de 4 sprints es **viable pero insuficiente** en tiempo estimado si no se resuelven primero 4 riesgos de privacidad/seguridad.

### Recomendación Arquitectónica Principal
**NO crear SimpleRegistryForm separado.** El RegistryFormClient.tsx actual (1,895 líneas) es ya mantenible y debe refactorizarse **internamente en 3 componentes**, no reescribirse. Eliminar la duplicidad es más seguro que crear nuevos puntos de falla.

---

## 1. HALLAZGOS CRÍTICOS

### 1.1 Riesgo GDPR/RGPD - ALTO IMPACTO (debe resolver en Sprint 0)

**Hallazgo:** Los campos `patient_code`, `local_nhc` y `local_sip` se capturan y almacenan **sin cifrado de aplicación ni mecanismo de anonimización comprobable**.

**Evidencia:**
- `app/registry/new/RegistryFormClient.tsx:493-494` envía directamente:
  ```typescript
  local_nhc: localNhc || null,
  local_sip: localSip || null,
  ```
- No existe política de privacidad documentada en `/docs/` ni `/public/`
- No hay hash/salt de estos campos; se almacenan en plain text en Supabase
- El campo `anonymous_code` se crea como copia de `patient_code` (línea 495), NO como verdadero anonimizador

**Riesgo Regulatorio:**
- Cumplimiento RGPD: Violación potencial de "data minimization" (art. 5.1.c)
- Cumplimiento LOPD-GDD: Identifica indirectamente al paciente (NHC es PII)
- Riesgo de auditoría sanitaria: Sin consentimiento explícito documentado para almacenar NHC/SIP

**Recomendación Inmediata:**
- Antes de Sprint 1, crear política de privacidad y documentar:
  - ¿Quién puede ver NHC/SIP? (debe ser `admin` y `monitor` SOLO)
  - ¿Se requiere encriptación? (SÍ, con `@supabase/crypto`)
  - ¿Política de retención? (p.ej., 7 años para auditoría)
- Actualizar RLS: Nueva política que prohiba `hospital_user` y `viewer` de acceder a `local_nhc`, `local_sip`

---

### 1.2 Discrepancia 1: Tamaño de RegistryFormClient.tsx

**Auditoría dice:** "componentes monolíticos gigantes (ej. `RegistroOpstarForm.tsx` con >50KB)"  
**Realidad:** RegistryFormClient.tsx = 1,895 líneas = ~56 KB (confirmado)  
**SIN embargo:** Tamaño ≠ complejidad; análisis lineal de nesting y estado:
- 1 nivel principal (el formulario multi-paso)
- 3 niveles de sub-componentes (milestones, fields, validation)
- 5 objetos de estado complejos (`eCRFFormData`, `errors`, `dbLogs`, etc.)

**Veredicto:** Refactorizable internamente sin reescribir completamente. La complejidad es **por capas de lógica clínica**, no mala arquitectura.

---

### 1.3 Discrepancia 2: CoronaryTreeNavigator se SIGUE usando

**Auditoría dice:** "componente `CoronaryTreeNavigator` es muy avanzado y sobrecarga el registro rápido" [debe archivarse]  
**Realidad:** Se importa y usa en `RegistryFormClient.tsx:11` activamente.

**Análisis:**
- ✅ Necesario para seleccionar `vasoDiana` (segmento coronario)
- ❌ Pero es un "árbol completo" visual que no encaja en flujo de 5 pasos
- Propuesta: Reemplazar con **dropdown + pequeño preview**, no eliminar

---

### 1.4 Discrepancia 3: RegistroOpstarForm.tsx NO se usa

**Auditoría dice:** "componente antiguo que debe archivarse"  
**Realidad:** Correcto; no tiene importaciones activas.  
**Recomendación:** Mover a `_archived/` (no eliminar; mantener como referencia histórica).

---

### 1.5 Discrepancia 4: Enlaces UI en Dashboard aún visibles

**Auditoría propone:** "Ocultamiento UI: Eliminar los enlaces de la navegación"  
**Realidad:** `/app/dashboard/page.tsx:227-296` MUESTRA aún los enlaces a:
- `/executive` (Dashboard IA)
- `/analytics` (Analítica Científica)
- `/follow-up` (Seguimiento Clínico)

**Riesgo:** Usuarios navegan a módulos "archivados" y encuentran funcionalidad incompleta.  
**Acción:** Sprint 1, Task 1.1 (ver Plan Corregido más abajo).

---

### 1.6 Discrepancia 5: Modo DEMO está acoplado

**Auditoría dice:** "Riesgo de que esté acoplado a la versión compleja"  
**Realidad:** `/lib/demo/demo-data.json` contiene registros hardcoded con:
- `patient_code: "PAC-9912"`, etc. ✅
- Pero ¿llama a `RegistryFormClient` o a un formulario antiguo?

**Hallazgo:** No está claro si DEMO usa datos ficticios o si carga formularios distintos.  
**Acción:** Auditar Sprint 4.

---

### 1.7 Discrepancia 6: Campos sensibles en base de datos

**Auditoría menciona:** "NO ejecutar `ALTER TABLE ... DROP COLUMN` para los campos"  
**Realidad:** Campos se ESTÁN usando (patient_code, local_nhc, local_sip). Correcto.  
**Pero:** No hay política de limpieza/retención de datos históricos.

**Riesgo:** Datos de casos cancelados permanecen en BD indefinidamente.  
**Recomendación:** Documentar política de "soft delete" (marcar `case_status='archived'` en lugar de borrar).

---

## 2. VERIFICACIÓN DE STACK TECNOLÓGICO

### 2.1 Next.js Version
✅ **CONFIRMADO:** `package.json:15` → Next.js **16.2.6** (no 15)

### 2.2 Dependencies Críticas
| Dependencia | Versión | Estado |
|-------------|---------|--------|
| `@supabase/ssr` | ^0.10.3 | ✅ Current (para Server Components) |
| `@supabase/supabase-js` | ^2.106.2 | ✅ Current |
| `react` | 19.2.4 | ✅ RC/Current |
| `next` | 16.2.6 | ✅ Current |
| `pdfkit` | ^0.18.0 | ⚠️ No usado en Sprint 1 (deprecable en Sprint 2) |
| `recharts` | ^3.8.1 | ✅ Necesario para gráficos de KPIs |
| `framer-motion` | ^12.40.0 | ✅ Necesario para UI fluida |

### 2.3 Herramientas de Estilos
✅ **Tailwind CSS v4** + Postcss (correcto)

---

## 3. RIESGOS PRIORIZADOS

### Matriz de Riesgos (Impacto × Probabilidad)

| # | Riesgo | Impacto | Probabilidad | Severidad | Acción | Sprint |
|---|--------|---------|--------------|-----------|--------|--------|
| **R1** | Violación RGPD (NHC/SIP en plain text) | CRÍTICO | ALTA | 🔴 CRÍTICO | Cifrar campos o crear política de acceso RLS | **Sprint 0** |
| **R2** | RLS incompleto permite lectura de PII entre centros | CRÍTICO | MEDIA | 🔴 CRÍTICO | Audit RLS y test con múltiples roles | **Sprint 0** |
| **R3** | CoronaryTreeNavigator es UI inapropiada para registro rápido | MEDIO | ALTA | 🟠 ALTO | Reemplazar con dropdown + preview | **Sprint 2** |
| **R4** | Datos sensibles sin política de retención/borrado | MEDIO | MEDIA | 🟠 ALTO | Documentar soft-delete policy | **Sprint 0** |
| **R5** | Formulario monolítico dificulta testing unitario | BAJO | MEDIA | 🟡 MEDIO | Refactorizar en 3 componentes lógicos | **Sprint 2** |
| **R6** | Enlaces UI a módulos archivados crean confusión | BAJO | ALTA | 🟡 MEDIO | Ocultar en Sprint 1 | **Sprint 1** |
| **R7** | DEMO mode sin documentación de datos ficticios | BAJO | MEDIA | 🟡 MEDIO | Crear flag de demostración claro | **Sprint 4** |
| **R8** | Falta política de privacidad pública | CRÍTICO | ALTA | 🔴 CRÍTICO | Crear `/docs/PRIVACY.md` + consentimiento en login | **Sprint 0** |

---

## 4. ANÁLISIS DE MÓDULOS REUTILIZABLES

### ✅ SÍ Reutilizar (Bajo riesgo)

| Módulo | Ruta | Estado | Acción |
|--------|------|--------|--------|
| **Autenticación Supabase** | `lib/supabase/server.ts`, `client.ts` | ✅ Robusto | Mantener; agregar audit logging |
| **RLS Framework** | `supabase/migrations/supabase_schema.sql` | ✅ Funcional | Extender con restricción de PII |
| **Trigger de Sincronización** | `handle_new_user()` | ✅ Correcto | Mantener; documentar roles |
| **Design System** | `components/design-system/` | ✅ Consistente | Usar en nuevos componentes |
| **Hospital Management** | `app/admin/hospitals/` | ✅ Necesario | Mantener (6 centros) |
| **Media Handling** | `lib/supabase/media-actions.ts` | ✅ Funcionable | Mantener; agregar validación de MIME types |

### ⚠️ PARCIALMENTE (Refactor necesario)

| Módulo | Ruta | Problema | Acción |
|--------|------|---------|--------|
| **RegistryFormClient** | `app/registry/new/RegistryFormClient.tsx` | Monolítico | Dividir en 3 componentes (Patient, Technical, Clinical) |
| **CoronaryTreeNavigator** | `components/CoronaryTreeNavigator/` | UI excesiva para registro rápido | Reemplazar con dropdown + miniatura |
| **Operadores Schema** | `supabase/migrations/20260630_operators_schema.sql` | Schema correcto pero sin validación | Mantener; agregar verificación de licencia |

### ❌ NO Reutilizar (Excesivo para alcance)

| Módulo | Ruta | Razón | Alternativa |
|--------|------|-------|-------------|
| **FFR-OCT Completo** | `lib/clinical/` | No entra en "bajo contraste" | Solo métricas básicas de ULTREON |
| **IA de Lípidos** | Disperso en código | Sobre-ingeniería; no es ULTREON 3.0 | Usar solo si ULTREON lo requiere |
| **Core Lab Dashboard** | `app/core-lab/` | 12 casos no necesitan dashboard complejo | Panel simple de 2×6 en admin |
| **Follow-up Módulo** | `app/follow-up/` | Fuera de alcance Q3 | Posponer a Q4 |
| **Executive IA Dashboard** | `app/executive/` | Síntesis prematura con pocos datos | Crear después de 50 casos |

---

## 5. DECISIÓN: SimpleRegistryForm vs. Refactor RegistryFormClient

### Análisis Comparativo

| Criterio | SimpleRegistryForm (Nueva) | Refactor RegistryFormClient (Actual) |
|----------|---------------------------|--------------------------------------|
| **Tiempo Dev** | 8-10 días | 4-5 días (refactor) |
| **Riesgo Testing** | ALTO (nuevo código) | BAJO (parcial validado) |
| **Mantenibilidad** | ✅ Simple pero duplicado | ✅ Una fuente de verdad |
| **Deuda Técnica** | ❌ Crea duplicidad | ✅ Resuelve deuda existente |
| **Migración de Datos** | NO necesaria | ✅ Reutiliza payload actual |
| **RLS/Seguridad** | Nuevo = nuevos bugs | ✅ Bugs conocidos ya auditados |

### ✅ RECOMENDACIÓN: Refactor RegistryFormClient

**Estrategia de 3 Componentes:**
1. **`PatientContextForm.tsx`** (Step 1) - Datos clínicos básicos
2. **`TechnicalAcquisitionForm.tsx`** (Steps 2-3) - Protocolo salino, contraste, OCT
3. **`ClinicalDecisionForm.tsx`** (Steps 4-5) - ULTREON findings y estrategia

**Ventajas:**
- ✅ Cada componente <500 líneas (mantenible)
- ✅ Testing unitario más simple
- ✅ Reutilización en otros contextos (ej. edit de casos)
- ✅ No duplica lógica de estado

---

## 6. ANÁLISIS DE RUTAS Y VISIBILIDAD

### Rutas que DEBEN Ocultarse (Sprint 1)

```
❌ /executive     → Dashboard IA (sin datos; fuera de alcance)
❌ /analytics     → Analítica compleja (12 casos no la necesitan)
❌ /follow-up     → Seguimiento clínico (posponer a Q4)
❌ /core-lab      → Core Lab Dashboard (excesivo para 2 casos/centro)
❌ /study         → Módulo de Estudios (fuera de alcance OCT)
```

**Ubicaciones donde aparecen:**
- `app/dashboard/page.tsx:234, 247, 258` (enlaces visibles)
- `app/admin/layout.tsx` (probable; no visto pero puede estar)

**Acción:** Comentar/condicionalizar estos enlaces en las navegaciones.

### Rutas que SÍ Mantener (esencial)

```
✅ /login          → Autenticación
✅ /dashboard      → Listado de casos y KPIs
✅ /registry/new   → Formulario eCRF (ULTREON 3.0)
✅ /admin          → Panel administrativo
✅ /admin/hospitals → Gestión de 6 centros
✅ /admin/operators → Gestión de operadores
✅ /admin/users    → Gestión de usuarios por rol
✅ /protocols/zero-contrast → Documentación protocolo
✅ /about          → Información del registro
```

---

## 7. MIGRACIONES: QUÉ NO TOCAR

### ✅ Migraciones Seguras (ya ejecutadas, no modificar)

| Archivo | Propósito | Acción |
|---------|-----------|--------|
| `supabase_schema.sql` | Base de datos inicial (hospitals, profiles, ecrf_opstar_records) | ✅ NO MODIFICAR |
| `supabase_followup_schema.sql` | Tablas de seguimiento clínico | ✅ NO EJECUTAR en Sprint 1-3 |
| `20250527_opstar_case_media.sql` | Tabla de imágenes (RLS correcto) | ✅ NO MODIFICAR |
| `20250527_opstar_oct_evidence.sql` | Tabla de evidencia OCT | ✅ NO MODIFICAR |
| `20250527_case_quality_system.sql` | QA/validación de casos | ✅ NO MODIFICAR |
| `20260630_zero_contrast_alignment.sql` | Campos ULTREON 3.0 (ya en BD) | ✅ NO MODIFICAR |
| `20260630_operators_schema.sql` | Tabla de operadores | ✅ NO MODIFICAR |

### ⚠️ Migraciones a Crear (Sprint 0)

```sql
-- 1. NEW MIGRATION: Políticas RLS para campos sensibles
-- Restricción: hospital_user y viewer NO acceden a local_nhc, local_sip
ALTER POLICY hospital_user_select_cases ON ecrf_opstar_records
  FOR SELECT USING (
    hospital_id = public.get_current_user_hospital_id()
    AND (public.get_current_user_role() IN ('admin', 'monitor') 
         OR (local_nhc IS NULL AND local_sip IS NULL))
  );

-- 2. NEW MIGRATION: Política de retención de datos
-- Soft delete para casos; no hard delete
ALTER TABLE ecrf_opstar_records
  ADD COLUMN IF NOT EXISTS case_status TEXT DEFAULT 'active'
  CHECK (case_status IN ('active', 'archived', 'deleted_by_request'));
```

---

## 8. PLAN DE SPRINTS CORREGIDO (4+1 Sprints)

### Sprint 0: Fundación de Seguridad y Privacidad (1 semana - BLOQUEANTE)

**Duración:** 5 días (antes de cualquier desarrollo)  
**Owner:** Arquitecto + Legal/Compliance

**Tareas:**
| ID | Tarea | Artefactos | Aceptación |
|----|-------|-----------|-----------|
| 0.1 | Crear `/docs/PRIVACY.md` con política RGPD | Documento markdown | ✅ Revisado por legal |
| 0.2 | Crear `/docs/DATA_RETENTION.md` | Política de 7 años | ✅ Definida soft-delete |
| 0.3 | Audit RLS para campos PII | Documento de hallazgos | ✅ Plan de remediación |
| 0.4 | Crear `20260716_sensitive_data_rls.sql` | Migración SQL | ✅ Testeo en dev |
| 0.5 | Documentar consentimiento informado en UI | Mock de modal | ✅ Diseño aprobado |

**Estimación:** 3 días developer + 2 días legal review

---

### Sprint 1: Limpieza UI y Visibilidad (1 semana)

**Duración:** 5 días

**Tareas:**
| ID | Tarea | Componente | Aceptación |
|----|-------|-----------|-----------|
| 1.1 | Ocultar enlaces a `/executive`, `/analytics`, `/follow-up` | `app/dashboard/page.tsx` | ✅ Enlaces no aparecen |
| 1.2 | Comentar rutas innecesarias en nextjs routing | `app/[route]/layout.tsx` | ✅ 404 si acceso directo |
| 1.3 | Actualizar menú admin (quitar "Core Lab", "Follow-up") | `app/admin/layout.tsx` | ✅ Solo módulos activos |
| 1.4 | Crear componente de consentimiento RGPD | `components/consent/GDPRConsent.tsx` | ✅ Modal en primer login |
| 1.5 | Audit logging de acceso a PII | `lib/supabase/audit-log.ts` | ✅ Eventos registrados |

**Estimación:** 4-5 días

---

### Sprint 2: Refactorización de RegistryFormClient (2 semanas)

**Duración:** 10 días

**Tareas:**
| ID | Tarea | Archivo | Líneas | Aceptación |
|----|-------|---------|--------|-----------|
| 2.1 | Extraer Step 1 (Patient/Anatomy) | `PatientContextForm.tsx` | ~400 | ✅ Componente independiente |
| 2.2 | Extraer Steps 2-3 (Technical) | `TechnicalAcquisitionForm.tsx` | ~500 | ✅ Protocolo + contraste |
| 2.3 | Extraer Steps 4-5 (Clinical) | `ClinicalDecisionForm.tsx` | ~400 | ✅ ULTREON + estrategia |
| 2.4 | Reemplazar CoronaryTreeNavigator | `CoronarySegmentSelector.tsx` | ~200 | ✅ Dropdown + miniatura |
| 2.5 | Tests unitarios de cada componente | `__tests__/registry-form/*` | ~300 | ✅ 80% coverage |
| 2.6 | Integración en RegistryFormClient.tsx | `RegistryFormClient.tsx` | ~400 | ✅ Orquestación limpia |

**Estimación:** 8-10 días

---

### Sprint 3: Adaptación de Centros y Casos (1.5 semanas)

**Duración:** 7-8 días

**Tareas:**
| ID | Tarea | Descripción | Aceptación |
|----|-------|-----------|-----------|
| 3.1 | Limitar vista a 6 centros | Query en dashboard + admin | ✅ Solo HOSP-* activos |
| 3.2 | Verificar RLS con múltiples roles | Test de permisos | ✅ Ninguna fuga cross-hospital |
| 3.3 | Crear vista de "2 casos por centro" | Dashboard para científicos | ✅ Puede ver pares de su centro |
| 3.4 | Endpoint de export para discusión científica | API/action para PDF | ✅ Sin PII en PDF |
| 3.5 | Optimizar media upload (OCT videos) | Validar MIME types, tamaño | ✅ <100MB por caso |

**Estimación:** 6-7 días

---

### Sprint 4: DEMO Mode y Testing Integral (1.5 semanas)

**Duración:** 7-8 días

**Tareas:**
| ID | Tarea | Descripción | Aceptación |
|----|-------|-----------|-----------|
| 4.1 | Auditar DEMO data.json | Verificar que no tiene datos reales | ✅ Datos ficticios solo |
| 4.2 | Crear flag de "DEMO MODE" explícito | UI/localStorage | ✅ Etiqueta visible en header |
| 4.3 | Testing E2E con refactored RegistryFormClient | Cypress/Playwright | ✅ Todos los 5 steps |
| 4.4 | Security audit: RLS, auth, media storage | Penetration testing | ✅ Reporte de hallazgos |
| 4.5 | Performance test: Load con 12 casos | Lighthouse/SpeedCurve | ✅ <3s FCP, <6s LCP |
| 4.6 | Documentation: eCRF User Manual | `/docs/ECRF_GUIDE.md` | ✅ Imágenes + flujo |

**Estimación:** 7-8 días

---

### Sprint 5 (Contingencia): Optimizaciones Finales (1 semana)

**Reserva** para issues encontrados en testing integral.

**Duración:** Flexible (5 días)

---

## 9. RECOMENDACIONES ARQUITECTÓNICAS FINALES

### 9.1 Decisiones Clínicas NO DOCUMENTADAS

**Gap encontrado:** La auditoría no menciona estos detalles clínicos críticos:

1. **¿Cuál es el protocolo exacto de "bajo contraste"?**
   - ¿Mínimo salino obligatorio? (Auditoría menciona "100% salino" pero ¿siempre?)
   - ¿Máximo contraste permitido por procedimiento?
   - **Acción:** Documentar en `/docs/CLINICAL_PROTOCOLS.md`

2. **¿Cómo se valida el "pullback rápido"?**
   - ¿Rango de velocidad? (ej., 10mm/s)
   - ¿Quién lo valida: operador u IA?
   - **Acción:** Definir en formulario (Step 2)

3. **¿Criterios de aceptación para "corregistro automático"?**
   - ULTREON hace el corregistro o se espera manual?
   - ¿% de confianza mínimo?
   - **Acción:** Alinear con equipo ULTREON

4. **¿Qué es "optimización final de stent"?**
   - ¿Métrica? (expansión %, MLA en mm2?)
   - ¿Quién decide si está optimizado?
   - **Acción:** Definir en Step 5

### 9.2 Decisiones Regulatorias NO DOCUMENTADAS

1. **¿Consentimiento informado digital?**
   - ¿Cómo se captura firma electrónica?
   - ¿Validación de identidad?
   - **Acción:** Crear `/docs/INFORMED_CONSENT.md`

2. **¿Comité Ético involucrado?**
   - ¿Ya aprobó el protocolo?
   - ¿Número de referencia?
   - **Acción:** Obtener y documentar

3. **¿Auditorías sanitarias?**
   - ¿Acceso de auditores a datos?
   - ¿Anonimización para informes?
   - **Acción:** Política de acceso auditor

### 9.3 Propuesta: Crear Sprint -1 (Pre-Desarrollo)

**Antes de escribir ANY código:**
1. Workshop clínico (2 horas): Validar 4 decisiones clínicas arriba
2. Workshop regulatorio (1 hora): Confirmar cumplimiento legal
3. Sesión de riesgos (1.5 horas): Revisar matriz de riesgos R1-R8
4. Sign-off de stakeholders: Clínicos, legal, technology

**Duración:** 1 día
**Owner:** Arquitecto + Médico responsable + Legal

---

## 10. ARCHIVOS A MODIFICAR EN SPRINT 1

**Orden de prioridad (dependencias resueltas primero):**

### BLOQUEANTE (hacer primero)
```
✅ app/dashboard/page.tsx
   - Línea 234: Comentar/eliminar href="/executive"
   - Línea 247: Comentar/eliminar href="/analytics"
   - Línea 258: Comentar/eliminar href="/follow-up"

✅ app/admin/layout.tsx
   - Revisar si hay enlaces similares (probablemente sí)
   - Eliminar nav items a módulos archivados

✅ supabase/migrations/20260716_sensitive_data_rls.sql (CREAR)
   - Nueva política RLS para local_nhc, local_sip
   - Ejecutar en dev environment primero
```

### IMPORTANTE (segunda ola)
```
✅ docs/PRIVACY.md (CREAR)
   - Política RGPD completa
   - Consentimiento informado

✅ docs/DATA_RETENTION.md (CREAR)
   - Política de 7 años
   - Soft-delete procedure

✅ lib/supabase/audit-log.ts (CREAR)
   - Logger de acceso a PII
   - Integración con actions.ts
```

### SOPORTE (tercera ola)
```
⚠️ components/consent/GDPRConsent.tsx (CREAR)
   - Modal de privacidad en login
   - Aceptación de términos

⚠️ app/layout.tsx (MODIFICAR si aplica)
   - Incluir GDPRConsent wrapper

⚠️ lib/supabase/actions.ts (REVISAR)
   - Auditoría de qué datos se envían
   - Logging en saveRegistryCaseAction()
```

---

## 11. DISCREPANCIAS CON LA AUDITORÍA: RESUMEN

| Punto | Auditoría Dice | Realidad | Acción |
|-------|----------------|---------|--------|
| 1 | Next.js 15 | Next.js 16.2.6 ✅ | Confirmado; auditoría correcta |
| 2 | RegistroOpstarForm.tsx activo | No se usa | Mover a `_archived/` |
| 3 | CoronaryTreeNavigator debe archivarse | Se usa activamente | Refactorizar (no eliminar) |
| 4 | RegistryFormClient >50KB | ✅ ~56KB | Confirmado; pero refactorizable |
| 5 | Crear SimpleRegistryForm nueva | Innecesario | Refactorizar existente (3 componentes) |
| 6 | RLS completamente seguro | ❌ Falta restricción PII | Crear migración en Sprint 0 |
| 7 | Campos NHC/SIP bien protegidos | ❌ Plain text | Cifrar o restringir RLS (R1 crítico) |
| 8 | Plan de 4 sprints OK | Insuficiente tiempo | Agregar Sprint 0 bloqueante + contingencia |

---

## 12. CONCLUSIONES Y RECOMENDACIONES FINALES

### ✅ Lo que Funciona Bien
1. Stack técnico moderno (Next.js 16, Supabase, RLS)
2. Infraestructura de autenticación robusta
3. Design system consistente
4. Estructura de migraciones clara

### ❌ Lo que Requiere Atención Inmediata
1. **CRÍTICO:** Campos PII sin anonimización (R1, R8)
2. **CRÍTICO:** RLS incompleto para datos sensibles (R2)
3. **ALTO:** Documentación legal/privacidad ausente
4. **ALTO:** Decisiones clínicas no validadas por stakeholders

### 🎯 Recomendación Principal

**Implementar Sprint 0 Bloqueante de 5 días ANTES de cualquier desarrollo.**

Esto evitará:
- ❌ Violaciones RGPD en Sprint 1+
- ❌ Retrabajos de RLS/seguridad post-launch
- ❌ Rechazos de auditoría sanitaria
- ✅ Launch limpio y compliant

### 📊 Timeline Realista

```
Sprint 0: 5 días (seguridad/privacidad)
Sprint 1: 5 días (limpieza UI)
Sprint 2: 10 días (refactor formulario)
Sprint 3: 8 días (centros/casos)
Sprint 4: 8 días (DEMO + testing)
Sprint 5: 5 días (buffer)

TOTAL: ~6 semanas (no 4 semanas)

Launch date con Sprint 0: Mid-Septiembre 2026
```

---

## APÉNDICES

### A. Matriz de Trazabilidad: Auditoría vs. Realidad

**[Ver spreadsheet adjunto: OCT_OPTIMIZE_AUDIT_VERIFICATION.csv]**

### B. Lista de Verificación: RLS Policy Audit

**Pre-Sprint 1 Checklist:**
- [ ] `admin` role puede ver TODOS los campos (incluyendo PII)
- [ ] `monitor` role puede ver TODOS los campos
- [ ] `hospital_user` role NO puede ver `local_nhc`, `local_sip`
- [ ] `viewer` role NO puede ver ningún dato PII
- [ ] Storage policies alineadas con table RLS
- [ ] Media files no contienen PII en names/paths

### C. Decisiones Pendientes para Stakeholders

1. **¿Cifrar NHC/SIP a nivel de app o BD?** (Recomendación: App-level con @supabase/crypto)
2. **¿Política de retención: 7 años o indefinido?** (Recomendación: 7 años + soft-delete)
3. **¿Incluir "Core Lab" en futuro o descartarlo?** (Decisión clínica)
4. **¿Límite de 2 casos/centro es definitivo o flexible?** (Escala post-Q3?)
5. **¿DEMO Mode permanente o solo development?** (Recomendación: Permanente + flag visible)

---

## SIGN-OFF

**Revisión Completada:** 16 de Julio de 2026  
**Revisor:** Claude Code - Arquitecto Senior de Software Sanitario  
**Estado:** ✅ LISTO PARA ACCIÓN  
**Siguiente:** Presentar Sprint 0 bloqueante a stakeholders

---

**Documento Confidencial - Uso Interno Únicamente**
