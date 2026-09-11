# Workshop de Decisiones: OCT-Optimize ULTREON 3.0
**Registro Multicéntrico de OCT con ULTREON 3.0**

**Fecha de Sesión:** [PENDIENTE DE PROGRAMAR]  
**Duración Estimada:** 3 horas  
**Participantes Requeridos:**
- Promotor del Estudio
- Investigador Coordinador / Investigador Principal
- Responsables de Privacidad / DPO
- Representante Legal
- Representante CEIm (cuando corresponda)
- Representante de Tecnología/Arquitectura

**Objetivos del Workshop:**
1. Validar alcance clínico y regulatorio
2. Cerrar definiciones operacionales
3. Confirmar conformidad con regulaciones
4. Establecer gobernanza y responsabilidades
5. Firmar acta de validación antes de Sprint 0

---

## 1. ALCANCE DEFINITIVO DEL REGISTRO

### 1.1 Centros Participantes

**Estado:** ✅ DEFINIDO (según OCT_OPTIMIZE_DECISION.md)

| Centro | Comunidad | Referencia | Inicio Previsto | Responsable |
|--------|-----------|-----------|-----------------|------------|
| La Fe | Valencia | HOSP-LAFE | Sept 2026 | [PENDIENTE] |
| Clínico de Valencia | Valencia | HOSP-CLINICO-VA | Sept 2026 | [PENDIENTE] |
| Hospital General de Valencia | Valencia | HOSP-GENERAL-VA | Sept 2026 | [PENDIENTE] |
| Hospital Manises | Valencia | HOSP-MANISES | Sept 2026 | [PENDIENTE] |
| La Ribera (Alzira) | Valencia | HOSP-RIBERA | Sept 2026 | [PENDIENTE] |
| Hospital San Juan | Alicante | HOSP-SANJUAN | Sept 2026 | [PENDIENTE] |
| General de Alicante | Alicante | HOSP-GENERAL-ALI | Sept 2026 | [PENDIENTE] |
| General de Elche | Alicante | HOSP-ELCHE | Sept 2026 | [PENDIENTE] |
| Torrevieja | Alicante | HOSP-TORREVIEJA | Sept 2026 | [PENDIENTE] |
| General de Castellón | Castellón | HOSP-CASTELLON | Sept 2026 | [PENDIENTE] |

**Decisión D1.1:** ¿Está confirmada la participación de estos 10 centros y sus responsables locales designados?
- **Opciones:** Sí, confirmar todos / Sí, confirmar con cambios / No, replanificar
- **Responsable de validar:** Promotor + Investigador Coordinador
- **Impacto técnico:** Tamaño de BD, licencias Supabase, plan de escalado
- **Fecha límite:** [PENDIENTE - Sugerir: 20 julio 2026]

---

### 1.2 Volumen de Casos

**Estado:** ✅ PROPUESTO

| Parámetro | Valor | Rationale |
|-----------|-------|-----------|
| **Objetivo total de casos** | ~600 casos | 60 casos/centro × 10 centros |
| **Ritmo por centro** | ~15 casos/mes | 4 casos/semana (marzo clínico realista) |
| **Período de inclusión** | 4 meses | Septiembre 2026 - Diciembre 2026 |
| **Margen de sobreestimación** | 10% | Buffer para variabilidad |

**Decisión D1.2:** ¿Es aceptable el objetivo de 600 casos con ritmo de 60 casos/centro en 4 meses?
- **Opciones:** Aceptar / Reducir a [X] casos / Extender período a [X] meses
- **Responsable de validar:** Investigador Coordinador + Centros participantes
- **Impacto técnico:** Infraestructura de Supabase, almacenamiento de imágenes, capacidad de cómputo
- **Fecha límite:** [PENDIENTE - Sugerir: 20 julio 2026]

---

### 1.3 Período de Inclusión

**Estado:** ✅ PROPUESTO

| Hito | Fecha | Responsable |
|------|-------|------------|
| Aprobación CEIm | [PENDIENTE] | CEIm |
| Entrenamiento de centros | Agosto 2026 | Coordinador + Centros |
| Inicio escalonado | Septiembre 2026 | Centro 1 (referencia) |
| Ramp-up total | Octubre 2026 | Todos los centros activos |
| Cierre de inclusión | Diciembre 2026 | [FECHA A VALIDAR] |

**Decisión D1.3:** ¿Es septiembre 2026 una fecha realista para inicio escalonado?
- **Opciones:** Sí, es realista / No, retrasar a [MES] / Iniciar antes (agosto) si es posible
- **Responsable de validar:** Investigador Coordinador + Centros
- **Impacto técnico:** Timeline de desarrollo (Sprint 0-4), disponibilidad de ambiente de testing
- **Fecha límite:** [PENDIENTE - Sugerir: 22 julio 2026]

---

### 1.4 Criterios de Selección de Casos para Discusión Científica

**Estado:** ❌ PENDIENTE DE DEFINICIÓN

La auditoría menciona "2 casos por centro" para discusión científica. Esta es una selección POSTERIOR, NO el tamaño total del registro.

**Decisión D1.4:** ¿Cómo se seleccionarán los 2 casos por centro para discusión científica?

**Sub-decisiones:**
- **D1.4a:** ¿Sobre qué universo se seleccionan? (primeros 60, mejores resultados, representativos de patología, etc.)
- **D1.4b:** ¿Quién los selecciona?** (coordinador del centro, comité central, criterios preestablecidos)
- **D1.4c:** ¿Qué datos se incluyen en la presentación?** (solo ULTREON findings, incluir imágenes de OCT, etc.)
- **D1.4d:** ¿Dónde/cuándo ocurre la discusión?** (congreso, reunión interna, webinar)

**Responsable de validar:** Investigador Coordinador + Consejo Científico  
**Impacto técnico:** Funcionalidad de export/presentación, gestión de media  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

## 2. DEFINICIONES CLÍNICAS

**NOTA IMPORTANTE:** Las siguientes definiciones requieren validación clínica. Aquí se presentan como marcos para discusión, NO como decisiones finales.

---

### 2.1 "Bajo Uso de Contraste"

**Estado:** ❌ PENDIENTE DE DEFINICIÓN

**Definición Propuesta (para validación):**
Un procedimiento OCT-guiado cumple el protocolo de "bajo uso de contraste" cuando:
- [PENDIENTE: Especificar volumen máximo de contraste inyectado]
- [PENDIENTE: Especificar volumen de contraste durante adquisición OCT]
- [PENDIENTE: Especificar qué se considera "protocolo 100% salino"]

**Decisión D2.1:** ¿Cuál es la definición operacional de "bajo uso de contraste"?

**Sub-decisiones:**
- **D2.1a:** Volumen total de contraste por procedimiento (mL máximo permitido)
  - Opciones: <30 mL / <50 mL / <75 mL / [OTRO: _____]
  - Responsable: Investigador Coordinador
  - Fecha límite: [PENDIENTE]

- **D2.1b:** Volumen específico de contraste durante OCT (mL máximo)
  - Opciones: 0 mL (salino puro) / ≤5 mL / ≤10 mL / [OTRO: _____]
  - Responsable: Investigador Coordinador
  - Fecha límite: [PENDIENTE]

- **D2.1c:** ¿Es obligatorio "protocolo 100% salino" para todos los casos o solo para el subgrupo "zero-contrast"?
  - Opciones: Todos deben usar salino / Subgrupo dedicado / Flexible según criterio médico
  - Responsable: Investigador Coordinador
  - Fecha límite: [PENDIENTE]

---

### 2.2 Especificación de Contraste: Componentes Registrables

**Estado:** ❌ PENDIENTE DE DEFINICIÓN

¿Qué campos de contraste deben capturarse en el eCRF?

**Decisión D2.2:** Campos de contraste a registrar

| Campo | Descripción | Obligatorio | Unidad | Validar | Responsable |
|-------|-------------|------------|--------|---------|------------|
| `total_contrast_ml` | Volumen total de contraste en todo el procedimiento | SÍ | mL | Min/Max | Clínico |
| `contrast_ocr_acquisition_ml` | Volumen específico durante adquisición OCT | SÍ | mL | Min/Max | Clínico |
| `contrast_converstion_needed` | ¿Se necesitó cambiar a protocolo con contraste? | SÍ | Booleano | N/A | Clínico |
| `contrast_conversion_reason` | Si sí, motivo clínico | CONDICIONAL | Texto | [Opciones] | Clínico |
| [OTROS: _____] | [PENDIENTE DE DEFINIR] | [?] | [?] | [?] | [?] |

**Responsable de validar:** Investigador Coordinador  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

### 2.3 Pullback Interpretable

**Estado:** ❌ PENDIENTE DE DEFINICIÓN

¿Qué se considera un "pullback interpretable" en el contexto de ULTREON 3.0?

**Decisión D2.3:** Criterios de pullback interpretable

**Sub-decisiones:**
- **D2.3a:** ¿Hay requisito de velocidad de pullback?
  - Opciones: Sí, rango de [X-Y] mm/s / No, cualquier velocidad / Depende de equipo
  - Responsable: Investigador Coordinador
  - Fecha límite: [PENDIENTE]

- **D2.3b:** ¿Hay requisito de claridad/calidad de imagen?
  - Opciones: Excelente (0 artefactos) / Buena (artefactos <20%) / Aceptable (<40%) / [OTRO]
  - Responsable: Investigador Coordinador
  - Fecha límite: [PENDIENTE]

- **D2.3c:** ¿Qué hacer si el pullback es no-interpretable?
  - Opciones: Repetir / Registrar como "fallo" / Abandonar el caso / [OTRO]
  - Responsable: Investigador Coordinador
  - Fecha límite: [PENDIENTE]

---

### 2.4 Corregistro Automático Satisfactorio (ULTREON)

**Estado:** ❌ PENDIENTE DE DEFINICIÓN

¿Qué criterios definen un "corregistro automático satisfactorio"?

**Decisión D2.4:** Validación de corregistro ULTREON

| Aspecto | Opción A | Opción B | Opción C | Recomendación | Validar |
|--------|----------|----------|----------|---|---|
| **Métrica de éxito** | Score ULTREON ≥85 | Score ≥90 | Score visual cualitativo | [PENDIENTE] | IP |
| **Threshold de aceptación** | Automático si Score ≥X | Manual si Score <X | Siempre requiere validación clínica | [PENDIENTE] | IP |
| **Registro de fallo** | Registrar si falla | Crear caso "fallido" | Abandonar registro | [PENDIENTE] | IP |
| **Criterios de reintento** | ¿Reintento automático? | ¿Parámetros de reintento? | [PENDIENTE] | [PENDIENTE] | IP |

**Responsable de validar:** Investigador Principal (IP)  
**Nota Técnica:** ULTREON proporciona el score; nosotros registramos el resultado  
**Fecha límite:** [PENDIENTE - Sugerir: 30 julio 2026]

---

### 2.5 Cambio de Estrategia Terapéutica

**Estado:** ⚠️ PARCIALMENTE DEFINIDO

Un caso registra "cambio de estrategia" cuando ULTREON 3.0 modifica la decisión terapéutica inicial.

**Decisión D2.5:** Tipos de cambios de estrategia registrables

| Tipo de Cambio | Descripción | Registrable | Opcional |
|---|---|---|---|
| **Diámetro de stent** | Cambio de tamaño planificado | ✅ SÍ | No |
| **Longitud de stent** | Cambio de longitud planificada | ✅ SÍ | No |
| **Material de stent** | Cambio de tipo (DES, BMS, etc.) | ✅ SÍ | No |
| **Zona de aterrizaje (landing zone)** | Cambio de referencia proximal/distal | ✅ SÍ | No |
| **Preparación de placa** | Necesidad de atherectomía, scoring, etc. | ✅ SÍ | No |
| **Post-dilatación adicional** | Inflaciones extra respecto a plan | ✅ SÍ | No |
| **Cambio de vaso diana** | Abandono/cambio a otro vaso | ✅ SÍ | [Validar] |
| **Abandono del procedimiento** | No se implanta stent (ICP deferida) | ✅ SÍ | No |
| **Otros cambios clínicos** | Campo libre de texto | ⚠️ CONDICIONAL | Sí |

**Sub-decisión D2.5a:** ¿Se capturan los cambios como checkbox independientes o como campo de "notas"?
- Opciones: Checkboxes estructurados / Campo de texto libre / Híbrido (checkboxes + campo libre adicional)
- Responsable: Investigador Coordinador
- Fecha límite: [PENDIENTE]

**Responsable de validar:** Investigador Coordinador  
**Impacto técnico:** Diseño de formulario, análisis de datos posterior  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

### 2.6 Optimización Final de la ACTP

**Estado:** ❌ PENDIENTE DE DEFINICIÓN

¿Qué métricas definen que una ACTP está "optimizada" según ULTREON 3.0?

**Decisión D2.6:** Criterios de optimización de stent post-implantación

| Métrica | Parámetro | Rango Óptimo | Registrar | Responsable |
|---------|-----------|--------------|-----------|------------|
| **Expansión del stent** | % de expansión respecto a referencia | [PENDIENTE: ≥___%] | ✅ SÍ | IP |
| **MLA (Minimal Lumen Area)** | Área luminal mínima post-stent | [PENDIENTE: ≥___ mm²] | ✅ SÍ | IP |
| **Apposición de struts** | % de struts bien adosados | [PENDIENTE: ≥___%] | ⚠️ CONDICIONAL | IP |
| **Disección de bordes** | Ausencia de disección en referencias | Sí = optimizado | ✅ SÍ | IP |
| **Malaposición de struts** | Ausencia o <5% malaposicionados | Sí = optimizado | ⚠️ CONDICIONAL | IP |
| **Score ULTREON final** | Score post-optimización | [PENDIENTE: ≥___ puntos] | ✅ SÍ | IP |
| **Decisión clínica: "Optimizado"** | Validación manual del operador | Booleano | ✅ SÍ | Operador |

**Sub-decisión D2.6a:** ¿ULTREON calcula automáticamente estas métricas o requiere entrada manual?
- Responsable: Representante ULTREON (si está en workshop)
- Fecha límite: [PENDIENTE]

**Sub-decisión D2.6b:** ¿Hay un score compuesto de "optimización global" o se registran cada métrica independientemente?
- Opciones: Score único / Métricas individuales / Hibrido
- Responsable: Investigador Principal
- Fecha límite: [PENDIENTE]

**Responsable de validar:** Investigador Principal  
**Impacto técnico:** Integración ULTREON API, validación de datos  
**Fecha límite:** [PENDIENTE - Sugerir: 30 julio 2026]

---

## 3. DATOS MÍNIMOS DEL eCRF

**Estado:** ⚠️ PARCIALMENTE DEFINIDO

### 3.1 Datos Imprescindibles

**Obligatorios para cada caso. Sin estos campos, el caso NO se puede guardar.**

| Campo | Tipo | Validación | Rationale | Privacidad |
|-------|------|-----------|-----------|-----------|
| **Centro** | Select (dropdown) | De lista de 10 centros | Trazabilidad | Público |
| **Fecha del procedimiento** | Date | Rango: Sept 2026 - Dic 2026 | Cronología | Público |
| **Código de paciente** | Text (anónimo) | Patrón: PAC-NNNN | Pseudo-anonimización | ✅ CRÍTICO |
| **Edad (años)** | Numeric | 18-120 | Eligibilidad + estadística | Público |
| **Sexo** | Select (M/F/Otro) | Enumerado | Estadística básica | Público |
| **Operador ID** | Select (dropdown) | De lista de operadores | Trazabilidad | Restringido (admin/monitor) |
| **Vaso diana (AHA)** | Select (1-3, ramas, etc.) | Código AHA estándar | Anatomía | Público |
| **Contraste total (mL)** | Numeric | Validar rango | Análisis principal | Público |
| **ULTREON disponible** | Booleano | Sí/No | Verificación de alcance | Público |
| **ULTREON score** | Numeric | 0-100 | Calidad de análisis | Público |
| **Cambio de estrategia** | Booleano | Sí/No | Análisis primario | Público |
| **Optimización final** | Booleano | Sí/No | Análisis primario | Público |

### 3.2 Datos Opcionales

**Recomendados pero no obligatorios. El caso se puede guardar sin estos datos.**

| Campo | Tipo | Rationale | ¿Incluir? | Responsable |
|-------|------|-----------|-----------|------------|
| **Comorbilidades** | Checkboxes (DM, HTA, ICC, etc.) | Estadística descriptiva | [PENDIENTE] | IP |
| **Presentación clínica** | Select (ACS-NSTEMI, STEMI, estable, etc.) | Estratificación de riesgo | [PENDIENTE] | IP |
| **Función ventricular** | Select (Normal, leve, moderada, severa) | FEVI o visual | [PENDIENTE] | IP |
| **EuroScore** | Numeric | Validación de riesgo | [PENDIENTE] | IP |
| **Lesión B2C** | Booleano | Complejidad | [PENDIENTE] | IP |
| **Calcio severo** | Booleano | Factor técnico | [PENDIENTE] | IP |
| **FFR previo** | Numeric | Si disponible | [PENDIENTE] | IP |
| **Medicación dual post-procedimiento (DAPT)** | Select (6m, 12m, >12m) | Tratamiento | [PENDIENTE] | IP |
| **Notas clínicas adicionales** | Text (libre) | Información contextual | ✅ SÍ | Operador |

### 3.3 Datos que DEBEN Eliminarse / NO Registrar

**❌ NO INCLUIR ESTOS CAMPOS EN SUPABASE:**

| Campo | Razón |
|-------|-------|
| **NHC (Historia Clínica)** | Identificador directo de paciente; RGPD crítico |
| **SIP (Seguridad Social)** | Identificador directo de paciente; RGPD crítico |
| **Nombre del paciente** | PII; usar solo código PAC-NNNN en BD |
| **Fecha de nacimiento** | PII; usar solo edad en años |
| **Teléfono/Email del paciente** | PII; no necesario para registro |
| **Dirección** | PII; no necesario |
| **DNI/Pasaporte** | Identificador directo; absolutamente prohibido |
| **Nombre del operador (si es redundante con Operador ID)** | Usar solo UUID del operador |
| **Notas clínicas que mencionen identificadores** | No permitir NHC/SIP en campos de texto libre |

---

### 3.4 Estrategia de Pseudo-anonimización

**Estado:** ❌ PENDIENTE DE VALIDACIÓN

**Propuesta de Implementación:**

1. **En el centro (offline):**
   - El hospital mantiene su propio registro local (HIS/CRF físico) con NHC/SIP
   - Asigna un código PAC-NNNN único y registra la correspondencia en acta offline
   - Envía a la plataforma SOLO el código PAC-NNNN

2. **En Supabase (online):**
   - Tabla `ecrf_opstar_records` contiene SOLO datos clínicos + código PAC-NNNN
   - Campo `patient_code` (PAC-NNNN) es único dentro del centro pero no global
   - NO hay tablas de "pacientes" con NHC/SIP

3. **Para seguimiento o queries:**
   - El centro puede cruzar el código PAC-NNNN con su registro local offline
   - La plataforma nunca deshace la pseudo-anonimización

**Decisión D3.4:** ¿Se acepta esta estrategia de pseudo-anonimización con archivo offline por centro?
- **Opciones:** Aceptar / Modificar a [PROPUESTA ALTERNATIVA] / Requerir cifrado en plataforma
- **Responsable de validar:** DPO + Promotor
- **Impacto técnico:** Cambios en UI (no pedir NHC/SIP), validación de patrón PAC-NNNN
- **Impacto legal:** Cumplimiento RGPD, base jurídica de tratamiento
- **Fecha límite:** [PENDIENTE - Sugerir: 22 julio 2026]

---

### 3.5 Confirmación: NHC y SIP NO en Supabase

**Decisión D3.5:** Confirmación explícita

**Pregunta:** ¿Se confirma que el NHC y el SIP NO se almacenarán en Supabase bajo ninguna circunstancia?

- **Opciones:** 
  - ✅ Confirmado: NO almacenar NHC/SIP en BD, usar código PAC-NNNN
  - ❌ NO confirmado: Necesitamos almacenar NHC/SIP con [JUSTIFICACIÓN]

- **Responsable de validar:** DPO + Promotor
- **Fecha límite:** [PENDIENTE - Sugerir: 22 julio 2026]

Si la respuesta es NO, se requiere una justificación clínica específica y una evaluación de impacto RGPD.

---

## 4. PRIVACIDAD Y REGULACIÓN

**NOTA CRÍTICA:** Estas decisiones REQUIEREN validación del DPO y/o asesor legal. No son decisiones técnicas sino regulatorias.

---

### 4.1 Base Jurídica del Tratamiento

**Estado:** ❌ PENDIENTE DE VALIDACIÓN

**Decisión D4.1:** ¿Cuál es la base jurídica para el tratamiento de datos personales?

| Base Jurídica Posible | RGPD Art. | Requisitos | ¿Aplica? | Responsable |
|----------------------|-----------|-----------|---------|------------|
| **Consentimiento informado** | 6.1.a | Consentimiento previo, específico, libremente dado | [PENDIENTE] | DPO |
| **Cumplimiento de obligación legal** | 6.1.c | Ley que requiera el tratamiento | [PENDIENTE] | DPO |
| **Interés legítimo** | 6.1.f | Evaluación de impacto; no prevalece privacidad de interesado | [PENDIENTE] | DPO |
| **Investigación científica** | Recital 159, 33 LOPDGDD | Interés público en salud; protecciones específicas | [PENDIENTE] | DPO |

**Sub-decisiones:**
- **D4.1a:** ¿La participación es voluntaria o es parte de la asistencia?
  - Responsable: Promotor + DPO
  - Fecha límite: [PENDIENTE]

- **D4.1b:** ¿Hay alguna obligación legal (REC, CEIm mandate) que requiera este tratamiento?
  - Responsable: Promotor + DPO
  - Fecha límite: [PENDIENTE]

- **D4.1c:** Si es interés legítimo, ¿se ha realizado DPIA (Data Protection Impact Assessment)?
  - Responsable: DPO
  - Fecha límite: [PENDIENTE]

---

### 4.2 Consentimiento Informado

**Estado:** ❌ PENDIENTE DE VALIDACIÓN

**Decisión D4.2:** ¿Se requiere consentimiento informado específico para este registro?

| Aspecto | Opción A | Opción B | Decisión | Responsable |
|--------|----------|----------|---------|------------|
| **¿Consentimiento requerido?** | Sí, específico | No, cubierto por asistencia | [PENDIENTE] | CEIm/DPO |
| **Formato** | Papel impreso | Digital (e-signature) | [PENDIENTE] | Promotor |
| **Gestión** | Cada centro mantiene original | Central (plataforma) | [PENDIENTE] | Promotor |
| **Archivo en BD** | Sí, escaneo/prueba | No, solo confirmación booleana | [PENDIENTE] | DPO |
| **Revocación** | Posible, con efecto retroactivo | Posible, sin efecto retroactivo | [PENDIENTE] | DPO |
| **Hoja de información (HIP)** | Incluir en espacio de usuario | Disponible en web pública | [PENDIENTE] | Promotor |

**Sub-decisión D4.2a:** ¿Cuál es el texto exacto del consentimiento?
- Estado: [PENDIENTE - Proporcionar por Promotor/DPO]
- Fecha límite: [PENDIENTE]

**Responsable de validar:** CEIm + DPO  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

### 4.3 Seudonimización

**Estado:** ⚠️ PARCIALMENTE DEFINIDO

**Decisión D4.3:** Niveles y método de seudonimización

| Nivel | Definición | Implementación | Aplica | Responsable |
|-------|-----------|-----------------|--------|------------|
| **Anonimización verdadera** | Imposible reverso bajo ninguna circunstancia | Hash de una vía (PAC-NNNN) | ⚠️ [VALIDAR] | DPO |
| **Seudonimización fuerte** | Reversible solo con clave cifrada separada | PAC-NNNN + tabla offline del centro | ✅ PROPUESTO | DPO |
| **Datos en claro** | Todos los datos incluyendo PII | NO APLICAR | ❌ NO | DPO |

**Sub-decisión D4.3a:** ¿La seudonimización es reversible (verdadera seudonimización) o irreversible (anonimización)?
- Opciones: Reversible (para seguimiento clínico) / Irreversible (máxima protección)
- Responsable: DPO + Investigador Principal
- Fecha límite: [PENDIENTE]

**Sub-decisión D4.3b:** Si es reversible, ¿quién guarda la clave de reversión?
- Opciones: Centro investigador local / Promotor central / Tercero independiente
- Responsable: DPO + Promotor
- Fecha límite: [PENDIENTE]

**Responsable de validar:** DPO  
**Impacto técnico:** Modelo de BD, gestión de claves  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

### 4.4 Conservación de Datos

**Estado:** ❌ PENDIENTE DE VALIDACIÓN

**Decisión D4.4:** Política de retención y borrado

| Aspecto | Opción A | Opción B | Decisión | Responsable |
|--------|----------|----------|---------|------------|
| **Período de conservación** | 7 años | 10 años | [PENDIENTE] | DPO/Promotor |
| **Justificación** | Prescripción médica | Obligación legal | [PENDIENTE] | DPO |
| **Borrado después** | Hard delete (permanente) | Soft delete (marcado como archivado) | [PENDIENTE] | DPO |
| **Restauración posible** | No | Sí (30 días buffer) | [PENDIENTE] | DPO |
| **Auditoría de borrado** | Registrada en log | No registrada | [PENDIENTE] | Seguridad |

**Sub-decisión D4.4a:** Justificación legal de los 7 años (o el período elegido)
- ¿Basado en prescripción médica? ¿Obligación legal específica?
- Responsable: DPO
- Fecha límite: [PENDIENTE]

**Sub-decisión D4.4b:** ¿Hay excepciones para fines de investigación (p.ej., mantener datos despersonalizados indefinidamente)?
- Opciones: Sí / No / Sí, con restricciones
- Responsable: Investigador Principal + DPO
- Fecha límite: [PENDIENTE]

**Responsable de validar:** DPO + Promotor  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

### 4.5 Acceso por Roles

**Estado:** ✅ PARCIALMENTE DEFINIDO

**Matriz de Control de Acceso en Supabase:**

| Rol | Tabla ecrf_opstar_records | Campos sensibles | Imágenes | Operaciones |
|-----|---------------------------|-----------------|----------|------------|
| **Admin (Promotor)** | ✅ Ver todos | ✅ Incluido | ✅ Ver todos | ✅ CRUD completo + borrado |
| **Monitor (Calidad)** | ✅ Ver todos | ✅ Incluido | ✅ Ver todos | ✅ Leer + validar (sin borrar) |
| **Hospital_user (Operador/Centro)** | ✅ Ver propios | ❌ OCULTADO | ✅ Ver propios | ✅ CRUD propios (no otros) |
| **Viewer (Investigador externo)** | ✅ Ver datos clínicos | ❌ SIN PII | ✅ Ver todos (sin descarga) | ❌ Solo lectura |
| **Público** | ❌ No acceso | ❌ No acceso | ❌ No acceso | ❌ No acceso |

**Decisión D4.5:** ¿Se acepta esta matriz de control de acceso?

- **Opciones:** 
  - ✅ Aceptada tal como está
  - ❌ Requiere cambios en [ROL/ACCESO específico]

- **Responsable de validar:** DPO + Promotor
- **Impacto técnico:** RLS policies en Supabase, validación en aplicación
- **Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

**Sub-decisión D4.5a:** ¿Los campos técnicos (contraste, ULTREON scores) se consideran "sensibles" o "públicos" para purposes de acceso?
- Responsable: Investigador Principal
- Fecha límite: [PENDIENTE]

---

### 4.6 Gestión de Imágenes (OCT, angiografía)

**Estado:** ⚠️ PARCIALMENTE DEFINIDO

**Decisión D4.6:** Política de almacenamiento y acceso a imágenes

| Aspecto | Especificación | Responsable |
|--------|---|---|
| **Almacenamiento** | Supabase Storage (bucket `cases/{case_id}/`) | Tech |
| **Formato** | DICOM (estándar) o formato propietario ULTREON | Tech + IP |
| **Compresión** | ¿Con pérdida o sin pérdida? | IP |
| **Retención** | [PENDIENTE: Igual que eCRF o diferente?] | DPO |
| **Backup** | ¿Dónde se guardan backups? ¿Encriptados? | Tech |
| **Acceso público** | No; requiere autenticación | Tech |
| **Descarga** | ¿Permitir descarga a centro? | IP + DPO |
| **Exportación de imágenes identificadas** | ¿Incluir PAC-NNNN o completa anonimización? | DPO |
| **Auditoría de acceso** | Registrar quién descargó qué imágenes | Security |

**Sub-decisiones:**
- **D4.6a:** ¿Las imágenes se consideran parte del eCRF (sameRetention) o datos secundarios (retención diferente)?
  - Responsable: DPO + IP
  - Fecha límite: [PENDIENTE]

- **D4.6b:** ¿Se permiten descargas bulk de imágenes para análisis post-hoc?
  - Opciones: Sí, a cualquier rol autorizado / Solo a admin / No permitir
  - Responsable: DPO
  - Fecha límite: [PENDIENTE]

**Responsable de validar:** DPO + Responsable de Seguridad  
**Fecha límite:** [PENDIENTE - Sugerir: 30 julio 2026]

---

### 4.7 Clasificación Regulatoria del Registro

**Estado:** ❌ PENDIENTE DE VALIDACIÓN

**Decisión D4.7:** ¿Qué tipo de registro es OCT-Optimize a nivel regulatorio?

| Clasificación Posible | Definición | Regulación | Requisitos | ¿Aplica? | Responsable |
|---|---|---|---|---|---|
| **Registro de Investigación** | Observacional; académico; sin intervención adicional | ICH-GCP, GDPR, LOPDGDD | CEIm aprobación | [PENDIENTE] | Promotor |
| **Dispositivo médico (ULTREON 3.0)** | Si ULTREON es clasificado como dispositivo clase IIb+ | MDR (EU) 2017/745 | Evaluación conformidad | [PENDIENTE] | Promotor |
| **Tratamiento de datos especiales (salud)** | Art. 9 GDPR; categoría especial | GDPR + LOPDGDD | Justificación específica | ✅ SÍ | DPO |
| **Datos genéticos/biomarcadores** | Si se recolectan datos genéticos | GDPR Art. 9 + restricciones | Consentimiento reforzado | [PROBABLEMENTE NO] | DPO |

**Sub-decisión D4.7a:** ¿Es un registro observacional puro o hay algún componente intervencionista?
- Responsable: Investigador Principal + Promotor
- Fecha límite: [PENDIENTE]

**Sub-decisión D4.7b:** ¿ULTREON 3.0 es un dispositivo médico regulado (MDR) o software de análisis?
- Responsable: Representante ULTREON (si está presente)
- Fecha límite: [PENDIENTE]

**Responsable de validar:** CEIm + DPO + Asesor Legal  
**Fecha límite:** [PENDIENTE - Sugerir: 30 julio 2026]

---

## 5. GOBERNANZA

**Estado:** ⚠️ PARCIALMENTE DEFINIDO

### 5.1 Promotor del Estudio

**Decisión D5.1:** Identificación formal del Promotor

| Aspecto | Valor | Responsable | Fecha |
|--------|-------|------------|-------|
| **Nombre de la Institución** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| **Representante Legal** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| **Contacto Técnico** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| **Contacto Administrativo** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |

**Responsable de validar:** Promotor  
**Fecha límite:** [PENDIENTE - Sugerir: 20 julio 2026]

---

### 5.2 Investigador Coordinador / Investigador Principal

**Decisión D5.2:** Designación formal

| Cargo | Nombre | Centro | Email | Teléfono | Fecha de Designación |
|------|--------|--------|-------|----------|----------------------|
| **Investigador Principal** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| **Investigador Coordinador** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| **Coordinador de Datos** | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |

**Responsabilidades:**
- IP: Validación de criterios clínicos, firmas de aprobación
- IC: Coordinación entre centros, resolución de queries
- CD: Gestión del registro, calidad de datos

**Responsable de validar:** Promotor  
**Fecha límite:** [PENDIENTE - Sugerir: 20 julio 2026]

---

### 5.3 Responsables por Centro

**Decisión D5.3:** Designación de investigadores locales en cada centro

| Centro | Investigador Local | Email | Teléfono | Fecha Designación | Entrenamiento |
|--------|-------------------|-------|----------|-------------------|---------------|
| La Fe | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| Clínico de Valencia | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| General de Valencia | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| Manises | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| La Ribera | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| San Juan | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| General de Alicante | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| General de Elche | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| Torrevieja | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |
| General de Castellón | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] |

**Responsable de validar:** Investigador Coordinador  
**Fecha límite:** [PENDIENTE - Sugerir: 30 julio 2026]

---

### 5.4 Propiedad de Datos y Acceso

**Decisión D5.4:** ¿Quién es propietario de los datos?

| Aspecto | Opción A | Opción B | Decisión | Responsable |
|--------|----------|----------|---------|------------|
| **Propiedad** | Cada centro (propios datos) | Promotor central | [PENDIENTE] | Legal |
| **Acceso a datos de otro centro** | No permitido sin consentimiento | Permitido a admin/monitor | [PENDIENTE] | DPO |
| **Salida de datos del sistema** | Requiere aprobación | Automático | [PENDIENTE] | DPO |
| **Licencia de uso** | Exclusiva del promotor | Compartida con centros | [PENDIENTE] | Promotor |

**Responsable de validar:** Promotor + DPO  
**Fecha límite:** [PENDIENTE - Sugerir: 30 julio 2026]

---

### 5.5 Publicaciones

**Decisión D5.5:** Política de autoría y publicaciones

| Aspecto | Especificación | Responsable |
|--------|---|---|
| **Primer autor de manuscript** | [PENDIENTE: IP, Coordinador, Promotor?] | Promotor |
| **Criterios de coautoría** | [PENDIENTE] | Promotor |
| **Embargo antes de publicación** | [PENDIENTE: 6m, 12m, ninguno?] | Promotor |
| **Revisión de manuscript** | Quién debe revisar antes de someter | Promotor |
| **Datos suplementarios** | ¿Se comparten datos raw? | DPO + IP |
| **Conflicto de intereses** | ¿Cómo se gestiona ULTREON como co-desarrollador?** | Promotor |

**Responsable de validar:** Promotor + Investigador Principal  
**Fecha límite:** [PENDIENTE - Sugerir: Posterior a aprobación CEIm]

---

### 5.6 Gestión de Incidencias

**Decisión D5.6:** Proceso de notificación y resolución de problemas

| Tipo de Incidencia | Tiempo de Notificación | Escalada | Responsable de Resolver |
|---|---|---|---|
| **Bug técnico en plataforma** | 24h | A coordinador técnico | Tech team |
| **Fallo de entrada de datos** | Inmediato en sesión | A coordinador de datos | Centro local |
| **Sospecha de incumplimiento GDPR** | Inmediato (<1h) | A DPO | DPO |
| **Caso clínico anómalo (posible desvío protocolo)** | 24h | A IP | IP + Centro local |
| **Pérdida/corrupción de datos** | Inmediato | A Promotor + DPO | Tech + DPO |
| **Acceso no autorizado detectado** | Inmediato | A Security | Security team |

**Responsable de validar:** Promotor + Coordinador de Datos  
**Fecha límite:** [PENDIENTE - Sugerir: 25 julio 2026]

---

## 6. TABLA FINAL DE DECISIONES PARA VALIDACIÓN

**INSTRUCCIONES DE USO:**
1. Cada decisión tiene un ID único (D1.1, D2.1, etc.)
2. El responsable de validar DEBE proporcionar una respuesta clara (sí/no/modificar)
3. Todas las decisiones DEBEN estar firmadas antes de Sprint 0
4. Los cambios post-firma requieren enmienda formal

---

| ID | Decisión | Opciones | Recomendación Técnica | Responsable de Validar | Estado | Fecha Límite | Notas |
|---|---|---|---|---|---|---|---|
| **D1.1** | Confirmación de 10 centros participantes | Sí, confirmar / Cambios | Mantener actual para escalabilidad | Promotor + IC | ⏳ PENDIENTE | 20-jul | Impacta capacidad Supabase |
| **D1.2** | Objetivo de 600 casos en 4 meses | Aceptar / Reducir / Extender | Realista con infraestructura actual | IC + Centros | ⏳ PENDIENTE | 20-jul | Ritmo: 60 casos/centro |
| **D1.3** | Inicio en septiembre 2026 | Sí / Retrasar a [mes] / Adelantar | Viable con Sprint 0-4 completado | IC + Tech | ⏳ PENDIENTE | 22-jul | Requiere aprobación CEIm |
| **D1.4** | Criterios de selección 2 casos/centro (discusión científica) | Primeros / Mejores / Representativos / [Otro] | Representativos de patología | IC + Comité Científico | ⏳ PENDIENTE | 25-jul | Decisión posterior a inclusión |
| **D2.1a** | Volumen máximo de contraste total | <30 / <50 / <75 / [Otro] mL | Definir con equipo clínico | IP | ⏳ PENDIENTE | 25-jul | CRÍTICO para protocolo |
| **D2.1b** | Volumen de contraste durante OCT | 0 (salino puro) / ≤5 / ≤10 / [Otro] mL | Depende de protocolo ULTREON | IP | ⏳ PENDIENTE | 25-jul | CRÍTICO para protocolo |
| **D2.1c** | ¿Protocolo 100% salino obligatorio para todos?** | Todos / Subgrupo / Flexible | Flexible permite mayor adherencia | IP | ⏳ PENDIENTE | 25-jul | Validar en piloto |
| **D2.2** | Campos de contraste a registrar en eCRF | Checkboxes + campos específicos | Estructura definida en tabla 3.2 | IC + IP | ⏳ PENDIENTE | 25-jul | Impacta análisis posterior |
| **D2.3a** | ¿Requisito de velocidad de pullback?** | Sí, [X-Y] mm/s / No / Depende de equipo | Validar con ULTREON specs | IP | ⏳ PENDIENTE | 25-jul | Impacta calidad |
| **D2.3b** | Criterios de claridad de OCT pullback | Excelente / Buena / Aceptable / [Otro] | Definir cualidad visual estándar | IP | ⏳ PENDIENTE | 25-jul | Entrenamiento operadores |
| **D2.3c** | Acción si pullback no-interpretable | Repetir / Registrar fallo / Abandonar | Repetir (hasta X intentos) | IP | ⏳ PENDIENTE | 25-jul | Impacta flujo clínico |
| **D2.4** | Métrica de éxito de corregistro ULTREON | Score ≥85 / Score ≥90 / Cualitativo | Depende de ULTREON algorithm | IP | ⏳ PENDIENTE | 30-jul | Validar con representante ULTREON |
| **D2.5a** | Tipos de cambios de estrategia a registrar | Checkboxes / Text libre / Híbrido | Checkboxes + campo libre adicional | IC | ⏳ PENDIENTE | 25-jul | Impacta análisis primario |
| **D2.6a** | ¿ULTREON calcula métricas o entrada manual?** | Automático / Manual / Híbrido | Automático si posible | Tech | ⏳ PENDIENTE | 30-jul | Integración API |
| **D2.6b** | Score compuesto de optimización o métricas individuales | Score único / Individuales / Híbrido | Individuales + score compuesto | IP | ⏳ PENDIENTE | 30-jul | Impacta análisis |
| **D3.4** | Aceptación de estrategia pseudo-anonimización (PAC-NNNN + archivo offline) | Aceptar / Modificar / Rechazar | Recomendado (cumple RGPD) | DPO + Promotor | ⏳ PENDIENTE | 22-jul | CRÍTICO para privacidad |
| **D3.5** | Confirmación: NHC y SIP NO en Supabase | Confirmado / No confirmado | CRÍTICO: Confirmado = mejor privacidad | DPO + Promotor | ⏳ PENDIENTE | 22-jul | Si NO, requiere justificación + DPIA |
| **D4.1** | Base jurídica del tratamiento (art. RGPD) | Consentimiento / Obligación legal / Interés legítimo / Otro | Consentimiento + interés científico | DPO | ⏳ PENDIENTE | 25-jul | Impacta DPIA |
| **D4.2** | ¿Se requiere consentimiento informado específico?** | Sí, papel / Sí, digital / No, cubierto | Sí, específico (digital recomendado) | CEIm + DPO | ⏳ PENDIENTE | 25-jul | Requiere HIP |
| **D4.3a** | Seudonimización: ¿reversible o irreversible?** | Reversible (para seguimiento) / Irreversible | Reversible (seudonimización fuerte) | DPO + IP | ⏳ PENDIENTE | 25-jul | Impacta seguimiento |
| **D4.3b** | ¿Quién guarda la clave de reversión?** | Centro local / Promotor central / Tercero | Centro local (máxima privacidad) | DPO | ⏳ PENDIENTE | 25-jul | Impacta gobernanza |
| **D4.4** | Período de conservación de datos | 7 años / 10 años / [Otro] | Validar con prescripción médica | DPO + Promotor | ⏳ PENDIENTE | 25-jul | Base legal requerida |
| **D4.4b** | ¿Datos despersonalizados indefinidamente para investigación?** | Sí / No / Sí con restricciones | Sí (investigación futura sin acceso paciente) | IP + DPO | ⏳ PENDIENTE | 25-jul | Permite reutilización científica |
| **D4.5** | Matriz de control de acceso por roles (Ver tabla 4.5) | Aceptada / Modificaciones | Aceptada tal como está (ajustable) | DPO + Promotor | ⏳ PENDIENTE | 25-jul | Impacta RLS en Supabase |
| **D4.5a** | ¿Campos técnicos (contraste, ULTREON) son sensibles o públicos?** | Sensibles (restringido) / Públicos | Públicos (investigación facilita) | IP | ⏳ PENDIENTE | 25-jul | Impacta análisis colaborativo |
| **D4.6a** | Retención de imágenes OCT: ¿igual que eCRF o diferente?** | Igual / Diferente (especificar) | Igual (7-10 años) | DPO | ⏳ PENDIENTE | 30-jul | DICOM/propietario ULTREON |
| **D4.6b** | ¿Permitir descarga bulk de imágenes para análisis?** | Sí, autorizado / Solo admin / No | Sí, a roles autorizados (admin/monitor) | DPO | ⏳ PENDIENTE | 30-jul | Auditoría de descarga |
| **D4.7** | Clasificación regulatoria (registro, dispositivo, etc.) | Observacional / Dispositivo IIb+ / Otro | Investigación observacional + GDPR especial | CEIm + Legal | ⏳ PENDIENTE | 30-jul | Impacta requisitos |
| **D5.1** | Identificación formal del Promotor | [Nombre institución] | [PENDIENTE: Proporcionar] | Promotor | ⏳ PENDIENTE | 20-jul | Mandatorio |
| **D5.2** | Designación de Investigador Principal y Coordinador | [Nombres/centros] | [PENDIENTE: Proporcionar] | Promotor | ⏳ PENDIENTE | 20-jul | Mandatorio |
| **D5.3** | Responsables locales en cada centro (10 centros) | [Nombres/centros] | [PENDIENTE: Proporcionar] | IC | ⏳ PENDIENTE | 30-jul | Entrena, valida localmente |
| **D5.4** | Propiedad de datos y acceso cross-center | Cada centro / Promotor central | Promotor central (acceso monitor) | Legal + DPO | ⏳ PENDIENTE | 30-jul | Impacta gobernanza |
| **D5.5** | Política de autoría y publicaciones | [Criterios específicos] | [PENDIENTE: Documento aparte] | Promotor + IP | ⏳ PENDIENTE | POST-CEIm | Posterior a aprobación |
| **D5.6** | Proceso de gestión de incidencias y SLAs | Tiempos y escalada (ver tabla 5.6) | Aprobado tal como está | Coordinador + DPO | ⏳ PENDIENTE | 25-jul | Impacta operaciones |

---

## 7. CRITERIOS DE SALIDA DE SPRINT 0

**Sprint 0 no es desarrollo; es validación y diseño.**

### Criterios de Aceptación (TODOS deben estar ✅)

#### Apartado Clínico
- [ ] **C1:** Definiciones clínicas finales validadas por IP (contraste, pullback, corregistro, optimización)
- [ ] **C2:** Protocolo de "bajo contraste" formalizado (rangos de mL específicos)
- [ ] **C3:** Criterios de selección de 2 casos/centro documentados
- [ ] **C4:** Endpoints y análisis primarios definidos (impacto datos a capturar)

#### Apartado Regulatorio y Privacidad
- [ ] **R1:** Base jurídica del tratamiento validada por DPO y asesor legal
- [ ] **R2:** Consentimiento informado (HIP) aprobado por CEIm (si procede)
- [ ] **R3:** DPIA (Data Protection Impact Assessment) completado por DPO
- [ ] **R4:** Política de retención de datos formalizada (años, borrado soft/hard)
- [ ] **R5:** Estrategia de pseudo-anonimización validada (PAC-NNNN + archivo offline)
- [ ] **R6:** Confirmación: NHC y SIP NO en Supabase (firmado)

#### Apartado de Gobernanza
- [ ] **G1:** Promotor, IP y IC designados formalmente (nombres, centros, contactos)
- [ ] **G2:** Responsables locales designados en los 10 centros
- [ ] **G3:** Tabla de trazabilidad de decisiones completada (tabla 6)
- [ ] **G4:** Proceso de gestión de incidencias aprobado

#### Apartado de Datos Mínimos
- [ ] **D1:** Lista final de campos obligatorios, opcionales, prohibidos aprobada
- [ ] **D2:** Campos de contraste especificados (volumen total, OCT, conversión)
- [ ] **D3:** Campos de ULTREON (score, cambio estrategia, optimización) definidos
- [ ] **D4:** Patrón de código de paciente (PAC-NNNN) formalizado

#### Apartado Técnico
- [ ] **T1:** Diagrama de flujo de datos (entrada → Supabase → export) aprobado
- [ ] **T2:** Esquema de BD actualizado (sin campos PII: NHC, SIP, DOB, etc.)
- [ ] **T3:** Plan de refactorización de RegistryFormClient (3 componentes) diseñado
- [ ] **T4:** RLS policies diseñadas (matriz de acceso por rol)
- [ ] **T5:** Plan de testing (unitario, integración, E2E) propuesto

#### Apartado de Comunicación
- [ ] **Comm1:** Acta de workshop firmada por todos los participantes
- [ ] **Comm2:** Documento de decisiones (este archivo) completado y validado
- [ ] **Comm3:** Cronograma de Sprints 1-4 realista presentado y aceptado
- [ ] **Comm4:** Matriz de riesgos técnicos + mitigation plan acordada

### Firma de Validación

**Este documento debe ser FIRMADO por:**

| Rol | Nombre | Institución | Fecha | Firma |
|-----|--------|-----------|-------|-------|
| Promotor | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |
| Investigador Principal | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |
| Investigador Coordinador | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |
| Delegado de Protección de Datos (DPO) | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |
| Asesor Legal | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |
| Representante CEIm | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |
| Responsable Técnico/Arquitecto | [PENDIENTE] | [PENDIENTE] | [PENDIENTE] | [_____] |

---

## APÉNDICES

### A. Próximos Pasos Post-Workshop

1. **Compilar Acta de Decisiones** (24h post-sesión)
   - Documento con todas las decisiones finales
   - Cierre de items ⏳ PENDIENTE → ✅ VALIDADO

2. **Procesar Aprobaciones Formales** (máx. 48h)
   - CEIm: Aprobación del protocolo
   - DPO: Aprobación de DPIA
   - Asesor Legal: Confirmación de base jurídica

3. **Iniciar Sprint 0: Fase de Diseño** (una vez firmado)
   - Detalle funcional de formulario (wireframes)
   - Diseño de BD (schema SQL)
   - Documentación de RLS policies

4. **Preparar ambiente de Testing**
   - Supabase dev instance con 10 centros ficticios
   - Datos de prueba sintéticos

### B. Referencias Normativas Mencionadas

- **GDPR Art. 6, 9:** Base jurídica, datos especiales
- **LOPDGDD arts. 33, 36:** Normativa española complementaria
- **RGDPD Recital 159:** Investigación científica
- **ICH-GCP:** Buenas prácticas clínicas (si aplica)
- **MDR EU 2017/745:** Si ULTREON se clasifica como dispositivo

### C. Plantilla de DPIA Mínimo Requerido

El DPO debe completar:
1. Descripción del tratamiento
2. Necesidad y proporcionalidad
3. Evaluación de riesgos (privacidad, seguridad, trazabilidad)
4. Medidas de mitigación (técnicas, organizativas)
5. Consulta a interesados (CEIm, centros)

---

**Documento Preparado para Workshop**  
**Revisor Independiente: Claude Code - Arquitecto Senior de Software Sanitario**  
**Fecha: 16 de Julio de 2026**

**ESTADO:** ⏳ LISTA PARA PRESENTACIÓN A STAKEHOLDERS

---

## INSTRUCCIONES FINALES

**Para el Promotor/Coordinador:**
1. Imprime o comparte este documento con todos los participantes del workshop
2. Completa las secciones [PENDIENTE] donde puedas antes del taller
3. Programa la sesión con mínimo 3 horas
4. Asegúrate de que DPO, CEIm y asesor legal asisten (crítico)
5. Toma nota de cada decisión y guarda el acta firmada

**Para el DPO:**
- Prioridad: Validar decisiones D3.4, D3.5, D4.x
- Prepara DPIA template antes del workshop

**Para Investigador Principal:**
- Prioridad: Validar decisiones D2.x (clínicas) y D4.5a
- Documenta protocolos de contraste/pullback antes del taller

**Para Responsable Técnico:**
- Asiste a sprint de diseño (post-workshop)
- Implementa decisiones en schema de BD + RLS + UI

---

**Fin del documento de Workshop**
