#!/usr/bin/env bash
# verify.sh — Script de verificación integral del proyecto
# Retorna 0 solo si todas las pruebas pasan exitosamente.
set -euo pipefail

echo "=================================================="
echo "  VERIFICACIÓN INTEGRAL DE PROYECTO"
echo "=================================================="

# 1. Comprobación para proyectos Node / TypeScript
if [ -f "package.json" ]; then
  if grep -q '"typescript"' package.json 2>/dev/null; then
    echo "▶ Verificando tipos con TypeScript..."
    npx tsc --noEmit
    echo "✔ Tipos TypeScript correctos."
  fi

  if grep -q '"lint"' package.json 2>/dev/null; then
    echo "▶ Ejecutando linter..."
    npm run lint
    echo "✔ Linter superado."
  fi

  if grep -q '"test"' package.json 2>/dev/null; then
    echo "▶ Ejecutando tests..."
    npm test --if-present
    echo "✔ Tests superados."
  fi
fi

# 2. Comprobación para proyectos Python
if [ -f "pyproject.toml" ] || [ -f "requirements.txt" ]; then
  if command -v pytest >/dev/null 2>&1; then
    echo "▶ Ejecutando pytest..."
    pytest
    echo "✔ Pytest superado."
  fi
fi

echo "=================================================="
echo "✅ TODAS LAS COMPROBACIONES COMPLETADAS CON ÉXITO"
echo "=================================================="
exit 0
