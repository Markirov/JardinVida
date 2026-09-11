# AGENTS.md — Harness Multi-Agente Universal (Fuente Única de Protocolo)

> **Punto de entrada ÚNICO para cualquier agente (IA o humano) que opere en este repositorio.**
> Léelo entero antes de comenzar, y después consulta tu regla de rol dedicada en `.agents/rules/`.
> `CLAUDE.md`, `GEMINI.md` y el `AGENTS.md` de la raíz son únicamente punteros a este documento.

---

## 0 · Arranque de Sesión y Puesta al Día (Obligatorio para Todos los Roles)

> **Skill de referencia:** `.agents/skills/session-onboarding/SKILL.md`. Todo agente que inicie sesión debe ejecutar esta secuencia antes de proponer o modificar nada.

1. **Bootstrap técnico:** Ejecuta `./init.sh --no-dev` (o `bash init.sh --no-dev`). Comprueba el estado de git, dependencias, instala los hooks de verificación y muestra el backlog activo.
2. **Asimilación del Estado Vivo (Las 4 Fuentes de Verdad):**
   - **`tracking/DONE.md`**: Lee las últimas 3-5 entradas arriba para conocer el contexto inmediato, decisiones recientes y autoría.
   - **`tracking/PENDING.md`**: Lee las secciones 🔴 Alta, 🟡 Media y 🟢 Baja para conocer el backlog y prioridades.
   - **`tracking/IDEAS.md`**: Revisa el banco de ideas para no duplicar ni reinventar sistemas descartados o en pausa.
   - **`tracking/AUDIT.md`**: Lee la última auditoría técnica para conocer la deuda técnica y seguridad vigente.
3. **Selección de Tarea & Locks en `PENDING.md`:** Elige tu tarea y márcala con tu nombre y herramienta: `[En progreso - <Rol> (<Herramienta>)]` — p. ej. `[En progreso - Architect (Antigravity)]` o `[En progreso - Architect (Claude Code)]`. Si vas a editar archivos clave, anota los locks en la misma línea: `[En progreso] (Locks: src/auth/service.ts, src/components/Login.tsx)`. **No toques un archivo bloqueado por otro agente** hasta que termine. Al terminar, quita el lock.
4. **Lectura del Objetivo (GOAL):** Si tu tarea es compleja, multi-etapa o desatendida, comprueba si ya existe un `GOAL_<slug>.md` para ella en `tracking/goals/` (ver §1.6). Si existe, es tu memoria de trabajo — lee sus *Criterios de Éxito* y su *Registro de Intentos*. Si no existe y vas a crearlo, anótalo como lock en `PENDING.md`.
5. **Lectura de Regla de Rol:** Lee tu regla dedicada en `.agents/rules/` (§2).
6. **Reporte Ejecutivo Inicial:** Saluda al usuario presentándole un resumen ejecutivo de 3 puntos:
   - 📍 *Contexto inmediato (última tarea en DONE.md).*
   - 🎯 *Backlog prioritario relevante para tu rol.*
   - 🔒 *Locks activos en el repositorio.*

---

## 1 · Reglas de Oro Compartidas (Inmutables)

### 1.1 · Ciclo de Registro y Micro-Commits (3 Pasos Obligatorios)
- Al cerrar CUALQUIER tarea, el agente que la ejecutó realiza los 3 pasos inmediatamente:
  1. Actualiza `tracking/DONE.md` (añadiendo la entrada al **PRINCIPIO**, cronológico inverso).
  2. Actualiza `tracking/PENDING.md` (traslada la tarea completa a la sección "✅ Completado" al final; no dejar ítems tachados arriba).
  3. Ejecuta el commit local: `git add . && git commit -m "feat/fix/docs: descripción concisa"`.
- **Archivado de DONE.md:** Si supera ~1500 líneas, se archiva el bloque más antiguo hacia `tracking/archive/DONE-<año>-Q<trimestre>.md`.

### 1.2 · Gate de Aprobación sobre Propuestas Cruzadas
- Cuando los roles de Dominio, Producto o QA propongan cambios en el código de la aplicación o arquitectura, el rol de **Desarrollo/Arquitectura NO lo ejecuta a ciegas**: presenta al usuario la propuesta detallada y espera aprobación explícita antes de aplicarla.

### 1.3 · Enrutamiento Cognitivo de Esfuerzo
- Emplea el nivel de razonamiento y modelo más eficiente para cada tarea:
  - **Bajo esfuerzo / Modelo Flash:** Tareas sintácticas, formateo de datos, refactors mecánicos o consultas simples.
  - **Alto esfuerzo / Modelo Pro:** Condiciones de carrera, lógica concurrente, arquitectura de base de datos, seguridad crítica.

### 1.4 · Preservación de Planes de Implementación
- Todo plan arquitectónico o de diseño (`implementation_plan.md`) debe guardarse permanentemente versionado en:
  - `tracking/plans/PLAN_YYYY-MM-DD_<nombre_descriptivo>.md`.
- Queda prohibido dejar planes como archivos efímeros o anónimos.

### 1.5 · Memoria de Ejecución (GOAL.md)
- Para tareas que requieren múltiples iteraciones o verificación automatizada, se utiliza `tracking/goals/GOAL_<slug>.md`.
- **Estructura obligatoria:** Criterios de Éxito, Checklist de Fases y Registro de Intentos (con errores literales).
- **Regla de los 3 Strikes:** Si se repite el mismo error 3 veces, el agente se detiene, realiza un commit del estado parcial y solicita intervención del usuario en el chat.
- Al completarse con éxito, se archiva a `tracking/plans/YYYY-MM-DD_GOAL_<slug>.md`.

### 1.6 · Propiedad Exclusiva del Harness
- El archivo `AGENTS.md` y las reglas en `.agents/rules/` son editados ÚNICAMENTE por el rol **Lead Architect / Desarrollador Principal**. Los demás roles entregan sugerencias de mejora al usuario para que este rol las aplique.

---

## 2 · Separación de Roles y Ámbitos

| Rol | Ámbito Principal | Regla Dedicada | ¿Modifica Código? |
|---|---|---|---|
| **Lead Developer / Architect** | Código fuente del software, infraestructura, base de datos y meta-configuración del harness. | `.agents/rules/lead_developer.md` | **SÍ (Único)** |
| **Domain & Data Specialist** | Esquemas de datos, compendios JSON/YAML, reglas de negocio, glosarios y documentación técnica. | `.agents/rules/domain_specialist.md` | No |
| **Product & UX Designer** | Historias de usuario, guías de estilo, copywriting, especificaciones funcionales y assets. | `.agents/rules/product_designer.md` | No |
| **QA & Security Reviewer** | Auditorías de seguridad, cobertura de tests, detección de regresiones y consistencia de tracking. | `.agents/rules/qa_reviewer.md` | No (audita y reporta) |

---

## 3 · Seguridad de Git y Concurrencia

- **Verificación previa:** Antes de modificar nada, ejecuta `git status`. Si hay cambios sin commitear ajenos, pide confirmación.
- **Prohibido `git commit --amend`:** Nunca reescribas commits. Varias sesiones pueden coexistir sobre la misma rama; un amend puede destruir silenciosamente el trabajo de otro agente.
- **Prohibido comandos destructivos:** `git reset --hard`, `git clean -fd` están prohibidos sin confirmación humana explícita.
- **Gate de Verificación:** Todo commit debe superar la verificación del hook `pre-commit` (verificación de tipos / linting).
