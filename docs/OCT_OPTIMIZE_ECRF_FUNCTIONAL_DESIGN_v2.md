# Diseño Funcional: eCRF OCT-Optimize (ULTREON 3.0) V2

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
- **Código Paciente (Seudonimizado):** Auto-generado en servidor por centro (ej: CENTRO-0001). [Obligatorio, read-only en UI]. No se solicita input manual. *Nota: No se recogen NHC, SIP, nombre ni fecha de nacimiento.*
- **Fecha del procedimiento:** Date picker [Obligatorio]. (Default: Hoy).
- **Edad:** Numérico (18-120) [Obligatorio].
- **Sexo:** Select (Masculino / Femenino) [Obligatorio].

### Paso 2: Procedimiento, vaso y contraste
- **Vaso diana:** Dropdown segmentación AHA simplificada [Obligatorio]. (Sustituye al CoronaryTreeNavigator visual).
- **Contraste total del procedimiento (mL):** Numérico [Obligatorio].
- **Medio/Técnica de flush utilizada:** Texto [Obligatorio]. Describir brevemente el método usado (ej: "Suero fisiológico 10 mL", "Contraste diluido"). *Sin orientación a "zero-contrast"; es registro de lo que se empleó.*
- **Contraste específico durante OCT (mL):** Numérico [Obligatorio]. Aceptar 0 mL. *Este campo es siempre visible y requerido, no condicional.*
- **Cambio a protocolo con contraste:** Booleano (Toggle Sí/No) [Obligatorio].
- **Razón del cambio:** Select con opciones predefinidas (ej: "Visibilidad insuficiente", "Complicación técnica", "Criterio médico") [Condicional: Obligatorio si hubo cambio]. *Evitar campo texto libre.*

### Paso 3: Corregistro, cambio de estrategia y optimización final
- **¿Corregistro automático ULTREON satisfactorio?:** Booleano (Sí/No) [Nullable; puede quedarse sin respuesta hasta validación clínica].
- **¿Se modificó la estrategia terapéutica (ACTP) tras OCT?:** Booleano (Sí/No) [Obligatorio].
- **Tipo de cambio de estrategia:** Checkboxes (Diámetro / Longitud / Landing zone / Preparación placa / Post-dilatación / Otro) [Condicional: Obligatorio si se modificó la estrategia].
- **Notas clínicas:** Select con opciones predefinidas o muy breve (max 100 caracteres). [Opcional]. *Evitar campos libres largos; añadir validación contra PII (NHC, SIP, nombres).*
- **¿Optimización final del stent lograda?:** Booleano (Sí/No) [Nullable; puede quedarse sin respuesta hasta validación clínica de criterios].

### Paso 4: Revisión y cierre
- **Resumen de datos:** Vista de lectura (Read-only) de los 3 pasos anteriores.
- **Check final:** "Confirmo que los datos no contienen información personal identificable" (Checkbox) [Obligatorio].
- **Estado del caso:** Mostrar indicación clara de si hay campos pendientes de validación clínica (corregistro, optimización).
- **Botón de acción:** [Cerrar Caso Definitivamente] o [Guardar como Borrador].

---

## 4. Validaciones de cada campo
- **Código Paciente:** Generado automáticamente en servidor; validación de formato en UI (read-only).
- **Edad:** Entre 18 y 120.
- **Volúmenes de Contraste:** Mayor o igual a 0. `Contraste durante OCT` no puede ser mayor al `Contraste total`.
- **Medio de Flush:** No permitir cadenas que contengan patrones similares a NHC (8+ dígitos consecutivos); advertencia "Asegúrese de no incluir datos identificables".
- **Condicionales:** Limpiar el campo hijo si el padre (toggle) cambia. (Ej. si "Cambio de protocolo" es "No", el campo "Razón" se resetea).

## 5. Reglas de Autoguardado (Sin localStorage)
- El estado local del formulario se mantiene **en memoria** (React Hook Form o Context; sin localStorage).
- Al pulsar "Siguiente" en cada paso, se realizará un **Upsert (guardado silencioso) a Supabase** con estado `draft`.
- Si el usuario pierde conexión o cierra el navegador, podrá recuperar el borrador desde su Dashboard (se obtiene de Supabase, no de localStorage).
- Los borradores se almacenan en `ecrf_opstar_records` con `case_status='draft'`.

## 6. Reglas de edición, cierre y reapertura del caso
- **Borrador (`draft`):** Completamente editable por el `hospital_user` creador.
- **Cierre (`completed`):** Al finalizar el Paso 4, el caso pasa a "completado". La UI deshabilitará la edición. Nota: Los campos nullable [PENDIENTE CLÍNICO] pueden quedar sin respuesta; el caso se cierra igual.
- **Reapertura:** Solo un usuario con rol `monitor` o `admin` podrá abrir un caso cerrado a petición justificada del centro, cambiándolo nuevamente a `draft`.

## 7. Mensajes de Error
- **Validation UI:** Textos en rojo debajo del campo (ej: "El volumen de contraste no puede ser negativo").
- **Network Errors:** "Problema de conexión al autoguardar. Se reintentará en breve." con un toast no bloqueante.
- **PII Detection:** Si el usuario intenta escribir un formato similar a un NHC en campos de texto (8-9 números), advertencia "Asegúrese de no incluir datos identificables como NHC, SIP o nombres".

## 8. Experiencia Móvil (Mobile-first)
- Elementos táctiles grandes (min 44x44px) para Toggles y Selects nativos.
- Sustitución de `CoronaryTreeNavigator` (árbol complejo y difícil en móviles) por un Dropdown estándar para el "Vaso diana".
- Scroll vertical contenido por paso; teclado numérico (`inputmode="numeric"`) predeterminado para campos de edad y contraste.
- Campos de texto restrictivos (max-length, opciones select) para evitar entrada libre de PII.

## 9. Casos incompletos y borradores
- Aparecerán en el Dashboard del centro con un badge amarillo "En progreso".
- No contarán para métricas analíticas ni estadísticas de "Casos por Centro" hasta no pasar a estado `completed`.
- Los borradores se cargan desde Supabase al reabrir; el estado en memoria se sincroniza.

## 10. Estructura del Payload final (JSON en BBDD)
```json
{
  "hospital_id": "uuid",
  "operator_id": "uuid",
  "patient_code": "CENTRO-0001",
  "procedure_date": "2026-09-01",
  "age": 65,
  "sex": "M",
  "coronary_segment": "LAD-Mid",
  "total_contrast_ml": 45,
  "flush_technique": "Suero fisiológico 10 mL",
  "contrast_during_oct_ml": 0,
  "contrast_change": true,
  "contrast_change_reason": "Visibilidad insuficiente",
  "strategy_change": true,
  "strategy_change_type": ["Diámetro", "Landing zone"],
  "ultreon_corregistro_ok": null,
  "ultreon_optimizacion_ok": null,
  "status": "completed"
}
```

---

## 11. Campos actuales reutilizables de RegistryFormClient
- Contenedores de Stepper (el layout del wizard).
- Lógica de validación con Zod/React Hook Form.
- Campos como: `hospital_id`, `operator_id`, `procedure_date`, `total_contrast_ml`.
- Lógica de Supabase `Upsert` (modificada: uso de Supabase, no localStorage).

## 12. Campos actuales que deben ocultarse o eliminarse de la UI
- Componentes de carga de **Imágenes / Media** (ya que este eCRF se centrará en clínica estructurada).
- Campos PII: `local_nhc`, `local_sip` (reemplazado por `patient_code` auto-generado).
- FFR-OCT.
- IA de Calcio / Arco Lipídico (no forma parte del foco).
- `CoronaryTreeNavigator` visual (reemplazado por dropdown).
- "Protocolo salino puro" booleano (reemplazado por campo descriptivo "Medio/Técnica de flush").

---

## 13. Wireframe Textual de cada Paso

**[Paso 1: Identificación]**
- Centro (Pre-seleccionado) [read-only]
- Código del Paciente (Read-only, auto-generado) - *Ej: CENTRO-0001*
- Fecha (Datepicker)
- Operador (Select)
- Edad (Num) | Sexo (Radio: M/F)
-> [Siguiente]

**[Paso 2: Contraste y Protocolo]**
- Vaso Diana (Select: LM, LAD, LCx, RCA...)
- Contraste total (mL) (Input Num)
- Medio/Técnica de flush (Input Text, max 100 chars) - *Ej: "Suero fisiológico 10 mL"*
- Contraste durante OCT (mL) (Input Num, min 0) [Obligatorio siempre]
- ¿Cambio de protocolo? (Toggle Sí/No)
    - *Si Sí:* Razón (Select: predefinidas)
-> [Atrás] [Siguiente]

**[Paso 3: ULTREON y Estrategia]**
- ¿Corregistro automático satisfactorio? (Toggle Sí/No) [Nullable]
- ¿Modificación de estrategia? (Toggle Sí/No)
    - *Si Sí:* Checkboxes de Motivos
- Notas clínicas (Select opciones o muy breve)
- ¿Optimización final alcanzada? (Toggle Sí/No) [Nullable]
-> [Atrás] [Siguiente]

**[Paso 4: Resumen]**
- *Lista de lectura de los campos introducidos.*
- Indicación de campos pendientes de validación clínica (si aplica).
- [ ] Check: Confirmo que no hay PII.
-> [Atrás] [Guardar y Finalizar Caso]

---

## 14. Criterios de Aceptación Funcional
- **CA1:** El formulario carga y es 100% usable en resoluciones móviles (375px ancho).
- **CA2:** El envío nunca transmite NHC, SIP ni nombres hacia Supabase.
- **CA3:** Se completa en < 3 minutos por caso (test de usabilidad interno).
- **CA4:** El autoguardado en Supabase previene pérdida de datos al recargar la página en mitad de un paso; NO se usa localStorage.
- **CA5:** `RegistryFormClient` se refactoriza dividiéndose en 4 subcomponentes limpios sin generar un nuevo componente paralelo de registro.
- **CA6:** Los campos marcados como [Nullable/PENDIENTE CLÍNICO] pueden quedar sin respuesta y no bloquean el cierre del caso. Se cierran normalmente con estado `completed`.
- **CA7:** El código seudonimizado se genera automáticamente en servidor por centro y se muestra read-only en UI.

## 15. Lista exacta de archivos que se modificarían en el futuro Sprint 1
- `app/registry/new/RegistryFormClient.tsx` (Refactor principal, partición en subcomponentes funcionales de paso).
- Creación de subcomponentes (por ej. `components/registry/Step1Identification.tsx`, `Step2Contrast.tsx`, `Step3Ultreon.tsx`, `Step4Review.tsx`).
- `components/CoronaryTreeNavigator/` (Será archivado o ignorado para dar paso al nuevo Dropdown nativo).
- Schema de Zod de validación (por ej. `lib/validations/registrySchema.ts`).
- `lib/supabase/actions.ts` (Ajustar payload de envío omitiendo PII, integrando estado draft/completed, sin localStorage).
- Posible Server Action para generar `patient_code` automáticamente en servidor (ej: `lib/supabase/generate-patient-code.ts`).
