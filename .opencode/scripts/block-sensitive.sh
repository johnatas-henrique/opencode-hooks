#!/bin/bash
# block-sensitive.sh
# PreToolUse hook for Bash/read/write tools.
# Covers gaps from block-destructive.sh: --no-verify, protected branches,
# .env writes, credentials/secrets/ssh access.
#
# Intended for use with source: "claude" in tool.execute.before config.

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
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.filePath // empty')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Block --no-verify flag
if echo "$COMMAND" | grep -qE '\s(-(-)?no-verify)\b'; then
  deny "Blocked --no-verify flag. Use 'git commit' without --no-verify."
fi

# Block push to protected branches
if echo "$COMMAND" | grep -qE '\bgit\s+push\b' && echo "$COMMAND" | grep -qE '\b(main|master|develop)\b'; then
  deny "Blocked push to protected branch (main/master/develop). Create a PR instead."
fi

# Block .env writes (write/filesystem_write_file tools)
if [ "$TOOL_NAME" = "write" ] || [ "$TOOL_NAME" = "filesystem_write_file" ]; then
  if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '(^|/)\.env($|/)'; then
    deny "Blocked .env file write. Environment files should not be modified by the agent."
  fi
fi

# Block reading sensitive files
if [ "$TOOL_NAME" = "read" ] || [ "$TOOL_NAME" = "filesystem_read_file" ]; then
  if [ -n "$FILE_PATH" ]; then
    if echo "$FILE_PATH" | grep -qE '(credentials\.json|/secrets/|\.ssh/)'; then
      deny "Blocked access to sensitive file: $FILE_PATH"
    fi
  fi
fi

# Block writing to sensitive files
if [ "$TOOL_NAME" = "write" ] || [ "$TOOL_NAME" = "filesystem_write_file" ]; then
  if [ -n "$FILE_PATH" ]; then
    if echo "$FILE_PATH" | grep -qE '(credentials\.json|/secrets/|\.ssh/)'; then
      deny "Blocked writing to sensitive file: $FILE_PATH"
    fi
  fi
fi

exit 0
