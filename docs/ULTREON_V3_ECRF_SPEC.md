# ULTREON 3.0 Clinical Registry eCRF Specification

## Variables Dictionary

### STEP 1 — CASE CONTEXT (CORE)
- `hospital_id` (Core): Relational, uuid.
- `operator_id` (Core): Relational, uuid.
- `procedure_date` (Core): Relational, date.
- `anonymous_code` (Core): Relational, string.
- `operator_experience_oct` (Core): Select (Low, Medium, High).
- `operator_experience_ultreon` (Core): Select (Low, Medium, High).
- `clinical_presentation` (Core): Select (Stable Angina, NSTEMI, STEMI, Silent Ischemia, Other).
- `lesion_type` (Core): Select (De novo, In-stent restenosis, Bypass graft, Other).
- `oct_indication` (Core): Select (Pre-PCI Assessment, Stent Optimization, Both).

### STEP 2 — OCT ACQUISITION (CORE / CONDITIONAL)
Stored in `JSONB acquisition_data`.
- `pullbacks`: Array of Pullback objects.
  - `id`: string
  - `type`: Select (PRE, POST)
  - `vessel`: Select (LAD, LCX, RCA, LM, Ramus, Bypass)
  - `speed`: Select (75 Fast, 75 Standard, 54 High Resolution)
  - `co_registration`: boolean
  - `fps`: number
  - `fast_pullback_questions`: Conditional on speed == 75 Fast.
    - `wash_quality`: Select (Excellent, Good, Poor)

### STEP 3 — OCT FINDINGS (CORE)
Stored in `JSONB findings_data`.
- `oct_findings`: string/array (Plaque rupture, Erosion, Calcification, Thrombus, etc.)
- `additional_info_not_angiographic`: boolean (Did OCT reveal info not seen on angio?) (KPI: Incremental Diagnostic Yield vs angiography)

### STEP 4 — CLINICAL DECISION (CORE)
- `planned_strategy_angio`: Select (Direct Stenting, Predilatation, Plaque Modification, Medical Therapy, CABG).
- `ultreon_changed_strategy`: boolean (KPI: Decision Change Rate). Relational column.
- `strategy_change_details`: string (Conditional on ultreon_changed_strategy).

### STEP 5 — CONDITIONAL MODULES
**Calcium Module** (JSONB `calcium_module`)
- `has_calcium_module`: boolean (Core)
- `calcium_impacted_decision`: boolean (KPI: Calcium Decision Impact Rate). Relational column.
- `calcium_treatment_chosen`: Select (Rotational, Orbital, IVL, Cutting/Scoring Balloon, Non-compliant balloon).

**Lipid Module** (JSONB `lipid_module`)
- `has_lipid_module`: boolean (Core)
- `lipid_impacted_decision`: boolean

**Left Main Module** (JSONB `left_main_module`)
- `has_left_main_module`: boolean (Core)
- `left_main_impacted_decision`: boolean

**FFR-OCT Module** (JSONB `ffr_oct_module`)
- `has_ffr_oct_module`: boolean (Core)
- `ffr_oct_impacted_decision`: boolean (KPI: FFR-OCT Decision Impact Rate). Relational column.

### STEP 6 — POST PCI (CONDITIONAL)
Stored in `JSONB post_pci_data` inside global_assessment or findings.
- `post_pci_correction_needed`: boolean (KPI: Post-PCI Correction Rate). Relational column.
- `residual_findings`: Array (Malapposition, Underexpansion, Edge Dissection, Tissue Prolapse).
- `additional_treatment`: string.

### STEP 7 — GLOBAL VALUE / ADOPTION (CORE)
Stored in `JSONB global_assessment`.
- `main_benefit`: Select (Confidence, Accuracy, Time-saving).
- `highest_impact_feature`: Select (Calcium detection, EEL detection, Stent expansion, Co-registration).
- `global_usability`: number (1-10).
- `comparison_with_previous`: Select (Worse, Same, Better, Much Better).
- `expected_oct_utilization_increase`: boolean (KPI: Future OCT Adoption Rate). Relational column.
- `future_indications`: string.
- `highest_potential_feature`: string.
