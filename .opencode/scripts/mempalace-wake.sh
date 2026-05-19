#!/bin/bash

PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

if [ -t 0 ]; then
  SESSION_ID="${1:-$PROJECT_NAME}"
else
  INPUT_JSON=$(cat)
  SESSION_ID=$(echo "$INPUT_JSON" | jq -r '.session_id // empty')
  
  if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
    SESSION_ID="$PROJECT_NAME"
  fi
fi

OUTPUT=$(mempalace wake-up --wing "$PROJECT_NAME" 2>/dev/null)

if [ -n "$OUTPUT" ]; then
  echo "=== MEMPALACE L0 (session: $SESSION_ID, wing: $PROJECT_NAME) ==="
  echo "$OUTPUT"
  echo "============================================"
fi
