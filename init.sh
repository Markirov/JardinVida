#!/usr/bin/env bash
# init.sh — Bootstrap de sesión multi-agente
# Uso:  bash init.sh          (chequeo + arranca dev si aplica)
#       bash init.sh --no-dev (solo chequeo de estado + backlog)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

C=$'\033[36m'; G=$'\033[32m'; Y=$'\033[33m'; R=$'\033[31m'; N=$'\033[0m'
PENDING="tracking/PENDING.md"
DONE="tracking/DONE.md"

banner() {
  printf '%s\n' \
    "${C}==============================================================${N}" \
    "${C}  AGENTIC HARNESS — Bootstrap de Sesión${N}" \
    "${C}  Directorio raíz: ${ROOT}${N}" \
    "${C}==============================================================${N}"
}

step_git() {
  echo ""; echo "${Y}[1/5] Estado de Git${N}"
  if command -v git >/dev/null 2>&1 && [ -d .git ]; then
    local branch dirty
    branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'detached')"
    dirty="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
    echo "  Rama: ${branch}"
    if [ "$dirty" != "0" ]; then
      echo "  ${Y}⚠ ${dirty} archivo(s) con cambios sin commitear.${N}"
      echo "  ${Y}  Si necesitas tocar estos archivos, coordina con el usuario primero.${N}"
    else
      echo "  ${G}Working tree limpio.${N}"
    fi
  else
    echo "  ${Y}(Sin repositorio git inicializado — omitido)${N}"
  fi
}

step_deps() {
  echo ""; echo "${Y}[2/5] Detección de Entorno y Dependencias${N}"
  if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
      echo "  ${G}Entorno Node.js: node_modules presente.${N}"
    else
      echo "  ${Y}Instalando dependencias de Node.js...${N}"
      npm install
    fi
  elif [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
    echo "  ${G}Entorno Python detectado.${N}"
  elif [ -f "Cargo.toml" ]; then
    echo "  ${G}Entorno Rust detectado.${N}"
  else
    echo "  ${C}Proyecto agnóstico / general.${N}"
  fi
}

step_hooks() {
  echo ""; echo "${Y}[3/5] Git Hooks (Gate de Calidad y Tipos)${N}"
  if [ -d .git ]; then
    local src="scripts/git-hooks/pre-commit" dst=".git/hooks/pre-commit"
    if [ -f "$src" ]; then
      if [ ! -f "$dst" ] || ! cmp -s "$src" "$dst"; then
        mkdir -p .git/hooks
        cp "$src" "$dst" && chmod +x "$dst" 2>/dev/null || true
        echo "  ${G}Hook pre-commit instalado/actualizado correctamente.${N}"
      else
        echo "  ${G}Hook pre-commit ya instalado y al día.${N}"
      fi
    fi
  fi
}

step_backlog() {
  echo ""; echo "${Y}[4/5] Resumen de Backlog y Estado Vivo${N}"
  if [ -f "$PENDING" ]; then
    echo "  ${C}— Tareas Pendientes en tracking/PENDING.md:${N}"
    sed -n '1,/^## ✅ Completado/p' "$PENDING" | sed 's/^/    /' | head -n 40
  else
    echo "  ${R}No se encontró $PENDING${N}"
  fi
  if [ -f "$DONE" ]; then
    echo ""
    echo "  ${C}— Últimas entradas en tracking/DONE.md:${N}"
    grep -E '^- \[x\]' "$DONE" | head -n 3 | sed 's/^/    /'
  fi
}

step_dev() {
  echo ""; echo "${Y}[5/5] Servidor de Desarrollo${N}"
  if [ "${1:-}" = "--no-dev" ]; then
    echo "  (Omitido por flag --no-dev)"; return
  fi
  if [ -f "package.json" ] && grep -q '"dev"' package.json 2>/dev/null; then
    echo "  Arrancando servidor de desarrollo con 'npm run dev'..."
    npm run dev
  else
    echo "  (No se detectó script de desarrollo dev automático)"; return
  fi
}

banner
step_git
step_deps
step_hooks
step_backlog
step_dev "${1:-}"
