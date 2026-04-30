#!/bin/bash
# Mineração automática a cada X mensagens
# Evento: chat.message (disparado a cada mensagem)
#
# Uso: ./mempalace-mine.sh <session_id>
# O session_id é passado pelo opencode-hooks via scriptArg

MINE_EVERY=5              # mining a cada 5 mensagens
SESSION_DIR="$HOME/.local/share/opencode/sessions"

# Obtém diretório atual do OpenCode (onde o projeto está aberto)
PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

# Session ID vem do argumento ($1) ou usa PROJECT_NAME como fallback
SESSION_ID="${1:-$PROJECT_NAME}"
COUNTER_FILE="/tmp/mempalace_count_$SESSION_ID"

# Incrementa contador
COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

echo "[MemPalace] Message $COUNT of session $SESSION_ID (project: $PROJECT_NAME)"

# Verifica threshold (múltiplo de MINE_EVERY)
if [ $((COUNT % MINE_EVERY)) -eq 0 ]; then
  echo "=== MINING (every $MINE_EVERY messages) ==="

  # Mine conversas da sessão usando o diretório do projeto como wing
  if [ -d "$SESSION_DIR" ]; then
    mempalace mine "$SESSION_DIR" --mode convos --wing "$PROJECT_NAME" 2>/dev/null
  else
    echo "Sessions directory not found: $SESSION_DIR"
  fi

  echo "============================================="
fi