# CLAUDE.md — Puntero de Protocolo

> Puntero para el entorno Claude Code.
> El protocolo núcleo está en **`.agents/AGENTS.md`**; lo propio de este proyecto (roles, reglas de dominio) está en **`.agents/PROJECT.md`** — lee ambos al empezar cada sesión.

## Resumen Operativo Rápido
1. Lee `.agents/AGENTS.md` y `.agents/PROJECT.md`, y asimila las 4 fuentes vivas (`tracking/DONE.md`, `tracking/PENDING.md`, `tracking/IDEAS.md`, `tracking/AUDIT.md`).
2. Adopta tu rol asignado según `.agents/rules/`.
3. Respeta locks de archivos activos: `(Locks: <ruta>)`.
4. Ejecuta commits tras actualizar el tracking (sin `--amend`).
