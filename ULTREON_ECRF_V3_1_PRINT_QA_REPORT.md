# ULTREON eCRF v3.1 Print QA Report

## Overview
This report validates the Printable eCRF format and adherence to the restricted N/A model.

## 1. Printable N/A Visible
The Printable eCRF successfully incorporates a "No aplicable — Todos los pull-backs son POST-PCI" checkbox under the Calcium and Lipid module headers.
**Status**: Verified. 

## 2. Closed Vocabulary Enforcement
All open-ended textual fields for categorical variables have been migrated to closed predefined lists with a designated "Otro" line if applicable.
- **Presentación clínica**: Now uses SCA CEST, SCA SNEST, Angina inestable, Angina estable, Isquemia silente, Otro.
- **Tipo de lesión**: De novo, Reestenosis, Tronco Coronario Izquierdo, Injerto venoso, Lesión calcificada, Bifurcación, Oclusión total crónica, Otro.
- **Indicación principal**: Optimización de stent, Evaluación de placa, Evaluación de calcio, Fallo de stent, Guía de tratamiento, Otro.
- **Impacto y Post-PCI (cambio inicial)**: Cambio de diámetro, longitud, preparación de placa, número de stents, presión, Otro.
**Status**: Verified.

## 3. Printed Scale (1 to 10)
All instances of `<Scale7 />` have been globally migrated to `<Scale10 minLabel="..." maxLabel="..." />`. The scale visually correctly prints 1 through 10 anchors with corresponding checkbox outlines. The free-form "Valor: _____" field is deprecated.
**Status**: Verified.

## 4. Pull-Back Labels
The naming convention strictly uses "Pull-back Nº 1", "Pull-back Nº 2", etc. "Adquisición 1" is avoided in object identifiers.
**Status**: Verified.

## 5. Analytics Exclusions
For the Calcium and Lipid modules, cases where all pull-backs are marked as "POST-PCI" are assigned a definitive `not_applicable = true` rule, thus excluding them from the global calculation denominator. Mixed cases (e.g. PRE-PCI + POST-PCI) still consider the modules applicable and they are properly tabulated.
**Status**: Verified.
