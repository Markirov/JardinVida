# AGENTS.md — Puntero de Protocolo Multi-Agente

> Este archivo existe porque Codex CLI, Claude Code y otros harnesses compatibles leen por defecto `AGENTS.md` desde la raíz del repositorio.
> La fuente **ÚNICA, canónica y completa** del protocolo del proyecto vive en **`.agents/AGENTS.md`** — léelo entero al iniciar cada sesión.

## Reglas No Negociables (Resumen de Seguridad)

1. **Lee `.agents/AGENTS.md` al inicio de cada sesión.** Es el punto de entrada único e inmutable.
2. **Actualiza SIEMPRE** el tracking del proyecto tras cada cambio:
   - Añade lo completado al inicio de `tracking/DONE.md`.
   - Actualiza prioridades y traslada ítems cerrados a Completado en `tracking/PENDING.md`.
3. **Micro-commits tras cada tarea:** Registra el avance y realiza el commit local inmediatamente (`git add . && git commit -m "feat/fix/docs: ..."`).
4. **NUNCA ejecutes comandos destructivos:** Prohibido `git reset --hard`, `git clean -fd`, `rm -rf` o equivalentes sin confirmación expresa del usuario.
5. **Prohibido `git commit --amend`:** Evita sobreescritura de historial cuando varias sesiones o agentes operan sobre el mismo working tree.
