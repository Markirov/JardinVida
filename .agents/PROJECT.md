# PROJECT.md — JardinVida (propio del proyecto, no sincronizable)

> Este archivo NO lo toca `harness update` — es tuyo. El protocolo núcleo compartido vive en `.agents/AGENTS.md`.

## Proyecto
- **Nombre:** jardin-vida-web
- **Stack:** (completar si aplica)
- **Tracking:** `tracking/` (`DONE.md`, `PENDING.md`, `IDEAS.md`, `AUDIT.md`, `goals/`, `plans/`, `archive/`)
- **Última actualización:** 2026-09-12 (Harness v2.5.0, sabor `lean` — 3 roles)

---

## Roles y ámbitos (sabor lean, 3 roles)

| Rol | Ámbito Principal | Regla Dedicada | ¿Modifica Código? |
|---|---|---|---|
| **Lead Developer / Architect** | Código fuente del software, infraestructura, base de datos y meta-configuración del harness. | `.agents/rules/lead_developer.md` | **SÍ (Único)** |
| **Domain & Product Owner** | Esquemas de datos, compendios JSON/YAML, reglas de negocio, glosarios, historias de usuario, copy, flujos UX y assets. | `.agents/rules/domain_owner.md` | No |
| **QA & Security Reviewer** | Auditorías de seguridad, cobertura de tests, detección de regresiones y consistencia de tracking. | `.agents/rules/qa_reviewer.md` | No (audita y reporta) |

**Nota:** este proyecto fusionó Domain & Data Specialist + Product & UX Designer en un solo rol (`domain_owner.md`) por decisión del usuario (prueba de la receta `lean`). Ver "Cuándo separar de nuevo" en `.agents/rules/domain_owner.md` si esto cambia.

---

## Reglas de oro propias del proyecto

_(ninguna registrada aún — añadir aquí cualquier convención de dominio específica de JardinVida que no sea protocolo núcleo)_

---

## Seguridad de Git y Concurrencia

- **Verificación previa:** Antes de modificar nada, ejecuta `git status`. Si hay cambios sin commitear ajenos, pide confirmación.
- **Prohibido `git commit --amend`:** Nunca reescribas commits. Varias sesiones pueden coexistir sobre la misma rama; un amend puede destruir silenciosamente el trabajo de otro agente.
- **Prohibido comandos destructivos:** `git reset --hard`, `git clean -fd` están prohibidos sin confirmación humana explícita.
- **Gate de Verificación:** Todo commit debe superar la verificación del hook `pre-commit` (verificación de tipos / linting).
