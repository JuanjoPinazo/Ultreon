# ULTREON™ v3.1 – CLINICAL UAT TEST PACK
**Tester**: Dr. Ramón López-Palop (Coordinador del Registro)
**Rol**: Administrador Clínico Global
**Fase de Entorno**: PRELAUNCH (Los casos registrados no computan como actividad oficial).

Este documento sirve como mecanismo estructurado para la recopilación de feedback durante las pruebas clínicas (UAT). Por favor, anote sus observaciones en cada escenario.

---

## 🟢 TEST 1 — PRE-PCI (Planificación)
**Objetivo**: Evaluar la fluidez de registro para un caso puramente diagnóstico o de planificación (PRE-PCI).
**Condiciones**: Crear un nuevo caso, añadir un pull-back PRE-PCI. Registrar hallazgos (ej. Calcio, Lípidos).
- **Expected result**: La plataforma permite guardar el caso sin exigir POST-PCI. Los módulos de calcio y lípidos deben estar activos y permitir entrada de datos.
- **Issues found**: 
- **Clinical comments**: 
- **UX comments**: 
- **Suggested improvement**: 

---

## 🟢 TEST 2 — POST-PCI (Optimización)
**Objetivo**: Validar la lógica de exclusión clínica (N/A) cuando solo se utiliza OCT para optimizar el resultado final.
**Condiciones**: Crear un caso, añadir únicamente un pull-back POST-PCI.
- **Expected result**: Al avanzar a la sección de Hallazgos (Step 4), los módulos de Calcio y Lípidos deben marcarse automáticamente como **"☑ No aplicable — Todos los pull-backs del caso son POST-PCI"** y ocultar sus formularios.
- **Issues found**: 
- **Clinical comments**: 
- **UX comments**: 
- **Suggested improvement**: 

---

## 🟢 TEST 3 — PRE + POST (Caso Completo)
**Objetivo**: Confirmar el comportamiento en escenarios mixtos (Workflow estándar).
**Condiciones**: Crear un caso con un pull-back PRE-PCI y otro POST-PCI.
- **Expected result**: Los módulos de Calcio y Lípidos **NO** deben ser N/A. Se debe exigir la introducción de datos basados en la evaluación PRE-PCI.
- **Issues found**: 
- **Clinical comments**: 
- **UX comments**: 
- **Suggested improvement**: 

---

## 🟢 TEST 4 — Perfil de Operadores
**Objetivo**: Revisar la correcta configuración del panel de operadores de un centro.
**Condiciones**: Navegar a un centro (ej. Hospital de Manises), acceder al perfil de un operador y ajustar frecuencias de uso (OCT + IVUS + Angio).
- **Expected result**: El sistema debe exigir que la suma exacta sea 10. No deben aparecer flechas nativas (spinners) en los campos numéricos.
- **Issues found**: 
- **Clinical comments**: 
- **UX comments**: 
- **Suggested improvement**: 

---

## 🟢 TEST 5 — Print / Site Pack
**Objetivo**: Validar el dossier oficial de inicio de centro.
**Condiciones**: Ir a la sección "Documentación", seleccionar un hospital y previsualizar/imprimir el Dossier Completo.
- **Expected result**: 
  - Usted debe aparecer como *Investigador Coordinador del Registro*.
  - El responsable local debe aparecer como *Investigador Principal*.
  - Los operadores listados deben coincidir con el equipo médico real del centro, independientemente de sus usuarios de acceso web.
- **Issues found**: 
- **Clinical comments**: 
- **UX comments**: 
- **Suggested improvement**: 

---
*Gracias por su validación. Puede guardar este documento con sus notas y remitirlo al equipo técnico.*
