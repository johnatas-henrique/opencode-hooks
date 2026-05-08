#!/bin/bash
# Block git commit --no-verify
# Native script: exit code 2 = block
# Reads stdin (JSON with tool input)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if echo "$COMMAND" | grep -qE 'git\s+commit.*(--no-verify|-[a-zA-Z]*n[a-zA-Z]*)'; then
  echo "Blocked --no-verify flag. Use 'git commit' without --no-verify."
  exit 2
fi

exit 0
