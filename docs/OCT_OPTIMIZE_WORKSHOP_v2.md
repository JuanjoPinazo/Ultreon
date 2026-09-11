# Workshop de Decisiones: OCT-Optimize ULTREON 3.0 (V2)
**Registro Multicéntrico de OCT con ULTREON 3.0**

**Fecha de Sesión:** [PENDIENTE DE PROGRAMAR]  
**Duración:** 2 horas  
**Participantes Requeridos:**
- Promotor del Estudio
- Investigador Principal (IP)
- Delegado de Protección de Datos (DPO)
- Representante Legal
- Representante CEIm (si procede)
- Responsable Técnico

---

## 1. ALCANCE DEL REGISTRO

### ✅ Confirmado
- **Centros:** 10 centros españoles (Comunidad Valenciana)
- **Volumen:** ~600 casos en 4 meses
- **Ritmo:** ~60 casos/centro
- **Período:** Septiembre 2026 - Diciembre 2026
- **Selección posterior:** 2 casos representativos por centro para discusión científica

### ⏳ Requiere Confirmación
**D1.1:** ¿Están designados los investigadores principales en cada centro?
- Responsable: Promotor
- Fecha límite: 20-julio

---

## 2. MODELO DE DATOS DEL PACIENTE

### ⏳ PROPUESTA: Pseudo-anonimización Descentralizada (Ver D4.1)

**Estrategia propuesta (pendiente de validación DPO/Promotor):**
1. **En el centro (offline):**
   - Cada centro mantiene tabla de correspondencia: `[Código PAC-Centro] ↔ [NHC del hospital]`
   - Esta tabla NO se envía a la plataforma
   - Se almacena bajo responsabilidad del centro (papel o HIS local)

2. **En Supabase (online):**
   - Campo `patient_code`: Formato `CENTRO-0001`, `CENTRO-0002`, etc.
   - Único dentro de cada centro, no identificable globalmente
   - NO hay tabla inversa en la plataforma

3. **Cumplimiento:**
   - Los datos en Supabase son seudonimizados pero siguen siendo datos personales (per AEPD)
   - Responsable de la tabla de correspondencia: Centro investigador local
   - La plataforma nunca realiza des-anonimización
   
*Ver D4.1 en sección 4 para decisión formal sobre esta propuesta.*

---

## 3. CAMPOS DEL eCRF

### ✅ Campos Imprescindibles (sin estos, el caso NO se guarda)

| Campo | Tipo | Razón |
|-------|------|-------|
| Centro (ID) | Select (dinámico, actualizable) | Trazabilidad |
| Fecha procedimiento | Date | Cronología |
| Código paciente (CENTRO-0001) | Text | Pseudo-anonimización |
| Edad (años) | Numeric (18-120) | Estadística básica |
| Sexo | Select (M/F) | Estadística básica |
| Operador (ID) | UUID (dropdown) | Trazabilidad |
| Vaso diana (AHA) | Select (estándar) | Anatomía |

### ✅ Campos de Contraste

| Campo | Tipo | Objetivo |
|-------|------|----------|
| Contraste total (mL) | Numeric | Medir consumo real (SIN límites pre-establecidos) |
| Protocolo salino utilizado | Booleano | Sí/No (documentar método) |
| Contraste durante OCT (mL) | Numeric | Medir consumo específico OCT |
| Cambio a protocolo con contraste | Booleano | Sí/No (registrar si fue necesario) |
| Razón cambio | Text (optional) | Contexto clínico |

**NOTA:** No se establecen umbrales (ej: <30 mL, <50 mL). Primero se miden; después se analizan.

### ⏳ Campos ULTREON: Requieren Validación Técnica

**D3.1:** ¿Qué métricas entrega ULTREON 3.0 exactamente?
- ¿Es una puntuación numérica? ¿Rango? ¿Unidades?
- ¿Qué significa "corregistro satisfactorio"?
- ¿Qué significa "optimización final"?
- Responsable: Representante ULTREON o IP
- Fecha límite: 30-julio

*Mientras se confirma, el formulario incluye campos booleanos:*
- `ultreon_corregistro_ok`: Sí/No
- `ultreon_optimizacion_ok`: Sí/No

### ✅ Campos de Cambio de Estrategia

| Aspecto | Registrar |
|--------|-----------|
| ¿Se modificó la estrategia terapéutica? | Booleano |
| Si sí, tipo de cambio | Checkboxes: Diámetro / Longitud / Landing zone / Preparación placa / Post-dilatación / Otro |
| Notas clínicas adicionales | Text libre |

### ❌ Campos NO Incluir

**NUNCA almacenar en Supabase:**
- NHC / SIP / Historia clínica
- Nombre paciente
- Fecha nacimiento
- Teléfono / Email / Dirección
- DNI / Pasaporte
- Tipo de stent (BMS/DES) - demasiado específico
- EuroSCORE
- DAPT duración
- FFR previo
- **Imágenes de OCT** (este registro se enfoca en datos clínicos estructurados, no en media)

*Razón: Complejidad innecesaria para objetivo principal (medir OCT + bajo contraste).*

### ⏳ Requiere Confirmación
**D3.2:** ¿Se acepta esta lista de campos (imprescindibles + contraste + ULTREON)?
- Responsable: IP + Coordinador de datos
- Fecha límite: 25-julio

---

## 4. PRIVACIDAD Y REGULACIÓN

### ⏳ Requiere Validación Legal y de DPO

**D4.1:** Modelo de pseudo-anonimización (PROPUESTA)
- Almacenamiento de NHC/SIP: NO en Supabase
- Estrategia: Cada centro mantiene tabla de correspondencia `[CENTRO-0001] ↔ [NHC local]` de forma offline/desacoplada
- Tabla de correspondencia: Bajo responsabilidad y custodia del centro investigador
- Datos en Supabase: Seudonimizados pero siguen siendo datos personales per AEPD
- ¿Se acepta esta propuesta?
- Responsable: DPO + Promotor
- Fecha límite: 22-julio

**D4.2:** Base jurídica del tratamiento (Art. 6 GDPR)
- ¿Consentimiento informado específico?
- ¿Obligación legal alternativa?
- ¿Interés legítimo?
- Responsable: DPO + Asesor Legal
- Fecha límite: 25-julio

**D4.3:** ¿Se requiere consentimiento informado formal?
- ¿Formato (papel/digital)?
- ¿Gestión centralizada o por centro?
- ¿Quién guarda el documento?
- Responsable: CEIm + DPO
- Fecha límite: 25-julio

**D4.4:** Período de conservación de datos
- ¿7 años? ¿10 años? ¿Indefinido?
- ¿Justificación legal?
- ¿Soft-delete o hard-delete?
- Responsable: DPO + Promotor
- Fecha límite: 25-julio

**D4.5:** ¿Aplica DPIA (Data Protection Impact Assessment)?
- Responsable: DPO
- Fecha límite: 30-julio

### ✅ Decisiones Técnicas (Ya Definidas)

| Aspecto | Decisión |
|--------|----------|
| **Acceso a datos seudonimizados en plataforma** | Por rol: admin/monitor ver todo; hospital_user solo su centro; viewer solo datos clínicos autorizados |
| **Auditoría de acceso** | Sí, loguear accesos a datos sensibles |

**NOTA:** No se asume digital-only, ICH-GCP ni otras regulaciones sin validación explícita.

---

## 5. GOBERNANZA MÍNIMA

### ⏳ Requiere Identificación

**D5.1:** Promotor del Estudio
- Nombre institución
- Representante legal
- Contacto técnico

**D5.2:** Investigador Principal
- Nombre y centro
- Email / Teléfono

**D5.3:** Investigador Coordinador
- Nombre y centro
- Email / Teléfono

**D5.4:** Responsables locales (10 centros)
- Nombre y centro para cada uno
- Email / Teléfono

**Fecha límite para todos:** 20-julio (Promotor debe proporcionar)

### ✅ Responsabilidades Claras

| Rol | Responsabilidad |
|-----|-----------------|
| **Promotor** | Aprobación CEIm, gestión regulatoria, consentimiento |
| **IP** | Definición de criterios clínicos, validación de datos |
| **IC** | Coordinación entre centros, resolución de queries |
| **Centro local** | Custodia tabla PAC-NNNN ↔ NHC |
| **DPO** | Evaluación GDPR, consentimiento, retención |
| **Tech** | Infraestructura, RLS, seguridad |

---

## 6. TABLA FINAL DE DECISIONES

| ID | Decisión | Responsable | Fecha Límite | Estado |
|----|----------|------------|--------------|--------|
| **D1.1** | Investigadores principales designados (centros) | Promotor | 20-julio | ⏳ |
| **D4.1** | Estrategia pseudo-anonimización (CENTRO-0001 + tabla offline) | DPO + Promotor | 22-julio | ⏳ |
| **D3.1** | Métricas ULTREON exactas (corregistro, optimización) | IP o representante ULTREON | 30-julio | ⏳ |
| **D3.2** | Lista final de campos eCRF aprobada | IP + Coordinador | 25-julio | ⏳ |
| **D4.2** | Base jurídica (Art. 6 GDPR) | DPO + Legal | 25-julio | ⏳ |
| **D4.3** | Consentimiento informado (sí/no, formato, gestión) | CEIm + DPO | 25-julio | ⏳ |
| **D4.4** | Período conservación datos + borrado | DPO + Promotor | 25-julio | ⏳ |
| **D4.5** | DPIA requerida o no | DPO | 30-julio | ⏳ |
| **D5.1** | Promotor identificado | Promotor | 20-julio | ⏳ |
| **D5.2** | IP e IC identificados | Promotor | 20-julio | ⏳ |
| **D5.3** | Responsables por centro designados | Promotor/IC | 20-julio | ⏳ |

---

## 7. CRITERIOS DE SALIDA DEL WORKSHOP

**Todos estos items deben estar ✅ ANTES de comenzar Sprint 0:**

### Clínico
- [ ] IP define qué registrar de ULTREON (D3.1)
- [ ] Lista de campos aprobada (D3.2)

### Regulatorio
- [ ] Base jurídica clara (D4.1)
- [ ] Consentimiento definido (D4.2)
- [ ] Retención de datos definida (D4.3)
- [ ] DPIA sí/no (D4.4)

### Gobernanza
- [ ] Promotor, IP, IC e investigadores locales identificados
- [ ] Responsabilidades claras para cada rol

### Firma Final

Todos los presentes firman acta confirming:
- Tabla PAC-NNNN ↔ NHC se gestiona en el centro, NO en plataforma
- Datos seudonimizados siguen siendo datos personales (per AEPD)
- Se respetan límites de privacidad según decisiones D4.x

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| Promotor | [____] | [____] | [____] |
| IP | [____] | [____] | [____] |
| DPO | [____] | [____] | [____] |
| Asesor Legal | [____] | [____] | [____] |
| Responsable Técnico | [____] | [____] | [____] |

---

## 8. PRÓXIMOS PASOS

1. **Pre-workshop (antes de sesión):**
   - Promotor: Proporcionar nombres de investigadores
   - DPO: Preparar evaluación inicial de GDPR
   
2. **Workshop (2 horas):**
   - Presentar y validar 10 decisiones (D1.1 → D5.3)
   - Firmar acta

3. **Post-workshop (24-48 horas):**
   - Compilar acta de decisiones
   - DPO completa DPIA si procede
   - Promotor obtiene aprobaciones (CEIm, Legal)

4. **Inicio Sprint 0 (cuando D1.1 → D5.3 están ✅):**
   - Diseño funcional del formulario
   - Esquema de BD (sin campos PII)
   - RLS policies por rol

---

**Documento Compacto para Workshop**  
**Revisor: Claude Code**  
**Fecha: 16-julio-2026**

**LISTA PARA PRESENTACIÓN**
