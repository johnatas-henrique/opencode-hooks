#!/bin/bash

PROJECT_NAME="$(basename "$(pwd)")"

if [ -t 0 ]; then
  SESSION_ID="${1:-$PROJECT_NAME}"
  EVENT_TYPE="legacy"
else
  INPUT_JSON=$(cat)
  SESSION_ID=$(echo "$INPUT_JSON" | jq -r '.sessionID // .session_id // empty')
  EVENT_TYPE=$(echo "$INPUT_JSON" | jq -r '.event_type // empty')
  if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" = "null" ]; then
    SESSION_ID="$PROJECT_NAME"
  fi
fi

echo "[MemPalace] Final mining for session: $SESSION_ID"

SESSION_FILE="/tmp/session_${SESSION_ID}_exit.json"
TRANSCRIPT_DIR="/tmp/mempalace_exit_$SESSION_ID"
TRANSCRIPT_FILE="$TRANSCRIPT_DIR/transcript_exit.jsonl"
LAST_MSG_FILE="/tmp/mempalace_last_msg_$SESSION_ID"

mkdir -p "$TRANSCRIPT_DIR"

opencode export "$SESSION_ID" > "$SESSION_FILE"

LAST_MSG=$(cat "$LAST_MSG_FILE" 2>/dev/null || echo 0)

jq -c --argjson last "$LAST_MSG" \
  '.messages[$last:] | .[] | {message: {role: .info.role, content: [.parts[] | select(.type=="text") | {type: .type, text: .text}]}}' \
  "$SESSION_FILE" > "$TRANSCRIPT_FILE"

if [ -s "$TRANSCRIPT_FILE" ]; then
  mempalace mine "$TRANSCRIPT_DIR" --mode convos --wing "$PROJECT_NAME"
  
  NEW_LAST=$(jq '.messages | length' "$SESSION_FILE")
  echo "$NEW_LAST" > "$LAST_MSG_FILE"
  
  echo "[MemPalace-Exit] Mined messages from index $LAST_MSG to $NEW_LAST"
else
  echo "[MemPalace-Exit] No new messages to mine"
fi
