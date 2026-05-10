#!/bin/bash
# Block .env writes via Write/Edit tools
# Claude hook format: returns JSON deny

deny() {
  jq -n --arg r "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
}

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.filePath // empty')

if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '(^|/)\.env($|/)'; then
    deny "Blocked .env file write via Claude hook. Environment files should not be modified."
  fi
fi

exit 0
