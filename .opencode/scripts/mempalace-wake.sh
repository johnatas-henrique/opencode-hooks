#!/bin/bash
# Injeta L0 + L1 via wake-up
# Evento: session.created (disparado ao iniciar sessão)
#
# Uso: ./mempalace-wake.sh <session_id>

# Obtém diretório atual do OpenCode
PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

OUTPUT=$(mempalace wake-up --wing "$PROJECT_NAME" 2>/dev/null)

if [ -n "$OUTPUT" ]; then
  echo "=== MEMPALACE L0 (wing: $PROJECT_NAME) ==="
  echo "$OUTPUT"
  echo "============================================"
fi