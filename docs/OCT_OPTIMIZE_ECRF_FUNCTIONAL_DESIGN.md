# Diseño Funcional: eCRF OCT-Optimize (ULTREON 3.0)

**Objetivo:** Diseñar funcionalmente un eCRF rápido, mobile-first y adecuado para aproximadamente 600 casos multicéntricos, asegurando el cumplimiento de tiempos (menos de 3 minutos por caso) y la estricta privacidad de los pacientes.

---

## 1. Flujo recomendado del formulario
El eCRF seguirá un flujo lineal guiado por un asistente (Wizard) optimizado para pantallas táctiles y ratón. Contará con autoguardado implícito entre pasos, evitando la pérdida de información en entornos hospitalarios (conexión inestable).

- **Paso 1:** Identificación y Trazabilidad Básica.
- **Paso 2:** Protocolo Técnico y Consumo de Contraste.
- **Paso 3:** Navegación ULTREON y Toma de Decisiones.
- **Paso 4:** Revisión de Calidad y Cierre.

## 2. Número de pasos y justificación
Se recomiendan **4 pasos** (frente a los más complejos de la versión anterior).
- **Justificación:** Dividir la carga cognitiva en 4 pantallas breves asegura que no haya scroll vertical excesivo (ideal para mobile-first) y permite que el registro se complete en **menos de 3 minutos**, centrando al usuario clínico únicamente en el uso de OCT ULTREON 3.0, el contraste y la optimización del stent.

---

## 3. Campos por Paso

### Paso 1: Centro, operador y paciente seudonimizado
- **Centro:** Dropdown / Select [Obligatorio]. Auto-completado según el `hospital_user` logueado.
- **Operador principal:** Dropdown (UUID) [Obligatorio]. Dinámico según el centro.
- **Código Paciente (Pseudo-anonimizado):** Texto (ej: CENTRO-0001) [Obligatorio]. *Nota: No se recogen NHC, SIP, nombre ni fecha de nacimiento.*
- **Fecha del procedimiento:** Date picker [Obligatorio]. (Default: Hoy).
- **Edad:** Numérico (18-120) [Obligatorio].
- **Sexo:** Select (Masculino / Femenino) [Obligatorio].

### Paso 2: Procedimiento, vaso y contraste
- **Vaso diana:** Dropdown segmentación AHA simplificada [Obligatorio]. (Sustituye al CoronaryTreeNavigator visual).
- **Contraste total del procedimiento (mL):** Numérico [Obligatorio].
- **Protocolo salino puro utilizado:** Booleano (Toggle Sí/No) [Obligatorio].
- **Contraste específico durante OCT (mL):** Numérico [Condicional: Obligatorio si el protocolo salino puro es "No"].
- **Cambio a protocolo con contraste:** Booleano (Toggle Sí/No) [Obligatorio].
- **Razón del cambio:** Texto libre [Condicional: Opcional si hubo cambio].

### Paso 3: Corregistro, cambio de estrategia y optimización final
- **¿Corregistro automático ULTREON satisfactorio?:** Booleano (Sí/No) [PENDIENTE de validación clínica de criterios].
- **¿Se modificó la estrategia terapéutica (ACTP) tras OCT?:** Booleano (Sí/No) [Obligatorio].
- **Tipo de cambio de estrategia:** Checkboxes (Diámetro / Longitud / Landing zone / Preparación placa / Post-dilatación / Otro) [Condicional: Obligatorio si se modificó la estrategia].
- **Notas clínicas:** Texto libre [Opcional].
- **¿Optimización final del stent lograda?:** Booleano (Sí/No) [PENDIENTE de validación clínica de criterios (ej. expansión %, MLA)].

### Paso 4: Revisión y cierre
- **Resumen de datos:** Vista de lectura (Read-only) de los 3 pasos anteriores.
- **Check final:** "Confirmo que los datos no contienen información personal identificable" (Checkbox) [Obligatorio].
- **Botón de acción:** [Cerrar Caso Definitivamente] o [Guardar como Borrador].

---

## 4. Validaciones de cada campo
- **Código Paciente:** Regex para formato estandarizado según el centro, y validación de unicidad en la base de datos para ese centro.
- **Edad:** Entre 18 y 120.
- **Volúmenes de Contraste:** Mayor o igual a 0. `Contraste durante OCT` no puede ser mayor al `Contraste total`.
- **Condicionales:** Limpiar el campo hijo si el padre (toggle) cambia a negativo. (Ej. si "Protocolo Salino" vuelve a "Sí", "Contraste específico durante OCT" se debe resetear o fijar a 0).

## 5. Reglas de Autoguardado
- El estado local del formulario (React Hook Form o estado global) guardará en `localStorage` o Context los datos al instante.
- Al pulsar "Siguiente" en cada paso, se realizará un **Upsert (guardado silencioso)** a Supabase con estado `draft`.
- Si el usuario pierde conexión, podrá recuperar el borrador desde su Dashboard.

## 6. Reglas de edición, cierre y reapertura del caso
- **Borrador (`draft`):** Completamente editable por el `hospital_user` creador.
- **Cierre (`completed`):** Al finalizar el Paso 4, el caso pasa a "completado". La UI deshabilitará la edición.
- **Reapertura:** Solo un usuario con rol `monitor` o `admin` podrá abrir un caso cerrado a petición justificada del centro, cambiándolo nuevamente a `draft`.

## 7. Mensajes de Error
- **Validation UI:** Textos en rojo debajo del campo (ej: "El volumen de contraste no puede ser negativo").
- **Network Errors:** "Problema de conexión al autoguardar. Se reintentará en breve." con un toast no bloqueante.
- **Identificadores PII:** Si el usuario intenta escribir un formato similar a un NHC (8-9 números), advertencia "Asegúrese de usar el código pseudo-anonimizado del estudio, NO el número de historia clínica".

## 8. Experiencia Móvil (Mobile-first)
- Elementos táctiles grandes (min 44x44px) para Toggles y Selects nativos.
- Sustitución de `CoronaryTreeNavigator` (árbol complejo y difícil en móviles) por un Dropdown estándar para el "Vaso diana".
- Scroll vertical contenido por paso; teclado numérico (`inputmode="numeric"`) predeterminado para campos de edad y contraste.

## 9. Casos incompletos y borradores
- Aparecerán en el Dashboard del centro con un badge amarillo "En progreso".
- No contarán para métricas analíticas ni estadísticas de "Casos por Centro" hasta no pasar a estado `completed`.

## 10. Estructura del Payload final (JSON en BBDD)
```json
{
  "hospital_id": "uuid",
  "operator_id": "uuid",
  "anonymous_code": "VAL-001",
  "procedure_date": "2026-09-01",
  "age": 65,
  "sex": "M",
  "coronary_segment": "LAD-Mid",
  "total_contrast_ml": 45,
  "saline_protocol_used": true,
  "contrast_during_oct_ml": 0,
  "strategy_change": true,
  "strategy_change_type": ["Diámetro", "Landing zone"],
  "ultreon_corregistro_ok": true,
  "ultreon_optimizacion_ok": true,
  "status": "completed"
}
```

## 11. Campos actuales reutilizables de RegistryFormClient
- Contenedores de Stepper (el layout del wizard).
- Lógica de validación con Zod/React Hook Form.
- Campos como: `hospital_id`, `operator_id`, `procedure_date`, `total_contrast_ml`, `saline_protocol_used`.
- Lógica de Supabase `Upsert`.

## 12. Campos actuales que deben ocultarse o eliminarse de la UI
- Componentes de carga de **Imágenes / Media** (ya que este eCRF se centrará en clínica estructurada).
- Campos PII: `local_nhc`, `local_sip`, `patient_code` (reemplazado puramente por `anonymous_code`).
- FFR-OCT.
- IA de Calcio / Arco Lipídico (no forma parte del foco).
- `CoronaryTreeNavigator` visual (reemplazado por dropdown).

---

## 13. Wireframe Textual de cada Paso

**[Paso 1: Identificación]**
- [ ] Centro (Pre-seleccionado)
- [ ] Código del Paciente (Input Text) - *Aviso: Use el código del cuaderno offline*
- [ ] Fecha (Datepicker)
- [ ] Operador (Select)
- [ ] Edad (Num) | [ ] Sexo (Radio: M/F)
-> [Siguiente]

**[Paso 2: Contraste y Protocolo]**
- [ ] Vaso Diana (Select: LM, LAD, LCx, RCA...)
- [ ] Contraste total (mL) (Input Num)
- [ ] ¿Protocolo salino puro? (Toggle Sí/No)
    - *Si No:* [ ] Contraste durante OCT (mL)
- [ ] ¿Cambio de protocolo? (Toggle Sí/No)
    - *Si Sí:* [ ] Motivo (Textarea)
-> [Atrás] [Siguiente]

**[Paso 3: ULTREON y Estrategia]**
- [ ] ¿Corregistro automático satisfactorio? (Toggle Sí/No) [PENDIENTE CLÍNICO]
- [ ] ¿Modificación de estrategia? (Toggle Sí/No)
    - *Si Sí:* [ ] Checkboxes de Motivos
- [ ] Notas clínicas adicionales (Textarea)
- [ ] ¿Optimización final alcanzada? (Toggle Sí/No) [PENDIENTE CLÍNICO]
-> [Atrás] [Siguiente]

**[Paso 4: Resumen]**
- *Lista de lectura de los campos introducidos.*
- [ ] Check: Confirmo que no hay PII.
-> [Atrás] [Guardar y Finalizar Caso]

---

## 14. Criterios de Aceptación Funcional
- **CA1:** El formulario carga y es 100% usable en resoluciones móviles (375px ancho).
- **CA2:** El envío nunca transmite NHC, SIP ni nombres hacia Supabase.
- **CA3:** Se completa en < 3 minutos por caso (test de usabilidad interno).
- **CA4:** El autoguardado previene pérdida de datos al recargar la página en mitad de un paso.
- **CA5:** `RegistryFormClient` se refactoriza dividiéndose en 4 subcomponentes limpios sin generar un nuevo componente paralelo de registro.
- **CA6:** Los campos marcados como [PENDIENTE CLÍNICO] se implementan según la última validación del IP en el Workshop.

## 15. Lista exacta de archivos que se modificarían en el futuro Sprint 1
- `app/registry/new/RegistryFormClient.tsx` (Refactor principal, partición en subcomponentes funcionales de paso).
- Creación de subcomponentes (por ej. `components/registry/Step1Identification.tsx`, `Step2Contrast.tsx`, `Step3Ultreon.tsx`, `Step4Review.tsx`).
- `components/CoronaryTreeNavigator/` (Será archivado o ignorado para dar paso al nuevo Dropdown nativo).
- Schema de Zod de validación (por ej. `lib/validations/registrySchema.ts`).
- `lib/supabase/actions.ts` (Ajustar payload de envío omitiendo PII e integrando el estado de borrador/completado).
