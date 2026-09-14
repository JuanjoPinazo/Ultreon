# ULTREON V3 Protocol Concordance Audit

## A. Global usability
- **Source:** 1-7
- **Status:** PASS
- **Correcciones:** Modificado el esquema Zod `global_usability` de `.max(10)` a `.max(7)`. Ajustado el componente UI a `max="7"`.

## B. Value versus previous version
- **Source:** numeric 1-7 (no Same/Better/Worse)
- **Status:** PASS
- **Correcciones:** Convertido `comparison_with_previous` a numérico 1-7 en el esquema y en el componente UI (antes era un `<select>`).
- **Aviso:** El comparador "previous version" puede ser ambiguo. Requiere confirmación humana si el protocolo no define sin ambigüedad a qué "versión anterior" se refiere (¿versión de la App, del hardware de OCT, o del eCRF?).

## C. Expected increase in OCT use
- **Source:** Categorical (all cases, majority >50%, selected cases <50%, no increase)
- **Status:** PASS
- **Correcciones:** Eliminado el boolean. Convertido a Zod Enum y `<input type="radio">` con las 4 categorías indicadas. Añadida la variable `expected_oct_utilization_drivers: z.array(z.string()).optional()` para el backend.

## D. Main clinical benefit
- **Source:** Select choices with text only when Other.
- **Status:** PASS
- **Correcciones:** Reemplazado input de texto libre por `<select>` estricto con opciones: lesion_characterization, stent_selection, pci_optimization, confidence, less_contrast, efficiency, avoided_unnecessary_treatment, other.

## E. Greatest decision impact feature
- **Source:** Select choices with text only when Other.
- **Status:** PASS
- **Correcciones:** Reemplazado input de texto libre por `<select>` con opciones: fast_pullback, auto_coregistration, ai_lipid_morphology, ffr_oct, left_main_imaging, other.

## F. Required binary questions
- **Status:** PASS
- **Correcciones:** Para campos CORE (ej. `ultreon_changed_strategy`, `incremental_diagnostic_yield`), se ha sustituido el checkbox único (que asume No al no responder) por botones de radio explícitos (Sí / No) validando con Zod `required_error`.

## Remaining Field Audit

### FFR-OCT Module
- **Status:** PASS. No se captura ningún valor cuantitativo (Pd/Pa) en el esquema ni UI. Se limita a uso, escenario, impacto clínico y confianza.

### Lipid Module
- **Status:** PASS. No se capturan métricas de "lipid arc" ni "TCFA thickness". Solo impacto en decisión.

### Left Main Module
- **Status:** PASS. No se capturan métricas de "polygon of confluence" o desplazamiento de carina.

### Privacy / PII
- **Status:** PASS. `ultreon_registry_cases` no posee NHC, SIP, nombres o fechas de nacimiento. Solo `anonymous_code`.

### Uploads / Media
- **Status:** PASS. No se implementan uploads ni guardado binario asociado a los pullbacks. Solo metadata.
