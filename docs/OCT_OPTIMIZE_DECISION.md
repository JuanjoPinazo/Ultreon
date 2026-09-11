# Documento de Conciliación y Decisiones: OCT-Optimize

**Fecha:** 16 de Julio de 2026
**Objetivo:** Conciliar la Auditoría de Arquitectura (GA) y la Revisión Independiente (Claude), corrigiendo errores fundamentales y estableciendo el alcance real del proyecto.

---

## 1. Alcance Real del Proyecto (Corregido)

A diferencia de lo asumido en las auditorías previas, el tamaño y alcance del registro será significativamente mayor y más focalizado:
- **Ámbito Geográfico:** Registro multicéntrico en la Comunidad Valenciana (Murcia queda fuera del alcance).
- **Centros Participantes (Mínimo inicial ~10 centros):** La Fe, Clínico de Valencia, General de Valencia, Manises, La Ribera, San Juan, General de Alicante, General de Elche, Torrevieja y General de Castellón.
- **Volumen y Ritmo:** Objetivo de **60 casos por centro** durante 4 meses (aprox. 15 casos al mes / 4 por semana por centro). Esto supone un volumen total estimado de **~600 casos**.
- **Cronograma:** Inicio deseado en **septiembre de 2026** (algunos centros podrían iniciar antes).
- **Discusión Científica:** La selección de "2 casos por centro" mencionada en la primera auditoría se refiere **únicamente a una selección posterior** para discusión científica, NO al tamaño real del registro.

---

## 2. Errores Detectados en Ambas Auditorías

Se han detectado errores técnicos y conceptuales graves en los análisis previos:

1. **Error en RLS (Row Level Security):** La revisión de Claude sugirió modificar las políticas de RLS para ocultar columnas específicas (`local_nhc`, `local_sip`). **Esto es técnicamente incorrecto en PostgreSQL/Supabase**, ya que el RLS controla el acceso a *filas* enteras, no actúa como seguridad por *columnas*. 
2. **Alucinación de Dependencias (`@supabase/crypto`):** La recomendación de usar `@supabase/crypto` es falsa. Este paquete no existe en el ecosistema oficial de NPM ni de Supabase. El cifrado se realizaría mediante Web Crypto API a nivel de aplicación o con la extensión `pgcrypto` en PostgreSQL, pero no a través de ese paquete inexistente.
3. **Asunción de Regulaciones y Retención:** La revisión asume unilateralmente una retención de 7 años y procesos de consentimiento específicos. Estas métricas no pueden fijarse por el equipo de ingeniería; deben emanar del CEIm, el DPO y el promotor del estudio.
4. **Confusión sobre el Tamaño del Registro:** Las auditorías dimensionaron erróneamente el sistema para 12 casos totales, cuando la arquitectura debe soportar ~600 casos.

---

## 3. Decisiones Aceptadas

- **Refactorización del Formulario:** Se **acepta** la recomendación de **NO crear un formulario nuevo (`SimpleRegistryForm`) duplicado**. Se mantendrá y refactorizará el actual `RegistryFormClient` dividiéndolo lógicamente para simplificar su mantenimiento y alinearlo con ULTREON 3.0, evitando deuda técnica por duplicidad.
- **Gestión de Datos PII (NHC/SIP):** Para anular completamente el riesgo RGPD, **se evitará almacenar el NHC y el SIP en Supabase**. Si estos datos son estrictamente necesarios para la trazabilidad clínica, se propondrá mantenerlos únicamente a nivel local en el centro investigador (p.ej., en un cuaderno de recogida paralelo físico o en el HIS del hospital), enviando a Supabase únicamente un código pseudo-anonimizado del estudio.
- **Limpieza de UI:** Se acepta la estrategia de ocultamiento temporal en UI de los módulos que están fuera del alcance inicial (Follow-up, Analytics complejos, Executive).

---

## 4. Decisiones Clínicas Pendientes (A definir con Promotor/Clínicos)

1. **Protocolo exacto de "bajo consumo de contraste" y "pullback rápido":** Validar qué parámetros métricos definirán si el protocolo se cumplió o no.
2. **Criterios de "corregistro automático" y "optimización final del stent":** Necesitamos el consenso clínico sobre qué campos registrar (p. ej., porcentaje de expansión, MLA).
3. **Trazabilidad de Casos:** Dado que no guardaremos NHC/SIP en plataforma, confirmar el mecanismo offline o pseudo-anonimizado que usarán los centros para identificar sus propios casos de cara al seguimiento o resolución de queries.

---

## 5. Decisiones Regulatorias Pendientes (A definir con CEIm/DPO/Promotor)

1. **Retención de datos:** Validar con el DPO los plazos legales reales de custodia de los datos del eCRF y la política de borrado lógico vs. físico.
2. **Consentimiento Informado:** Verificar si los casos requieren consentimiento firmado específico para este registro, si están cubiertos por asistencia habitual, y si este consentimiento se gestiona en papel en cada hospital o requiere captura digital.
3. **Documentación Oficial:** Confirmar que la hoja de información al paciente (HIP) y las resoluciones del CEIm estén en orden antes de habilitar la subida de casos reales.

---

## 6. Sprint 0 Corregido (Análisis y Diseño)

Dado el nuevo volumen de ~600 casos y la participación de 10 centros, el **Sprint 0** será estrictamente analítico, sin desarrollo de código:

**Objetivo del Sprint 0:**
1. Reunión de alineamiento clínico/regulador para resolver las decisiones pendientes (Secciones 4 y 5).
2. Diseño funcional detallado de la refactorización de `RegistryFormClient` (dividido en pasos: Paciente/Técnico/Clínico).
3. Diseño de la estrategia final para asegurar la no-inclusión de datos PII (NHC/SIP) en la base de datos.
4. Ajuste de la arquitectura de la base de datos y UI para soportar y monitorizar a los 10 centros valencianos durante el periodo de 4 meses.

---

## 7. Recomendación del Siguiente Paso

**Paso Inmediato:** Programar una **sesión de validación conjunta (Workshop) con el Promotor Clínico, el Investigador Principal y el Delegado de Protección de Datos (DPO)** para cerrar definitivamente las decisiones clínicas y regulatorias pendientes detalladas en este documento. 

*Nota: Durante esta fase de auditoría y conciliación, no se ha modificado el código fuente, la base de datos, las migraciones ni la configuración de la aplicación.*
