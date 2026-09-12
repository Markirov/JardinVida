# AGENTS.md — Puntero de Protocolo Multi-Agente

> Este archivo existe porque Codex CLI, Claude Code y otros harnesses compatibles leen por defecto `AGENTS.md` desde la raíz del repositorio.
> El protocolo núcleo vive en **`.agents/AGENTS.md`**; lo propio de este proyecto (roles, reglas de dominio) vive en **`.agents/PROJECT.md`** — lee ambos al iniciar cada sesión.

## Reglas No Negociables (Resumen de Seguridad)

1. **Lee `.agents/AGENTS.md` y `.agents/PROJECT.md` al inicio de cada sesión.**
2. **Actualiza SIEMPRE** el tracking del proyecto tras cada cambio:
   - Añade lo completado al inicio de `tracking/DONE.md`.
   - Actualiza prioridades y traslada ítems cerrados a Completado en `tracking/PENDING.md`.
3. **Micro-commits tras cada tarea:** Registra el avance y realiza el commit local inmediatamente (`git add . && git commit -m "feat/fix/docs: ..."`).
4. **NUNCA ejecutes comandos destructivos:** Prohibido `git reset --hard`, `git clean -fd`, `rm -rf` o equivalentes sin confirmación expresa del usuario.
5. **Prohibido `git commit --amend`:** Evita sobreescritura de historial cuando varias sesiones o agentes operan sobre el mismo working tree.
