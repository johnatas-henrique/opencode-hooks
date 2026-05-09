#!/bin/bash
# Block git commit --no-verify
# Native script: exit code 2 = block
# Reads stdin (JSON with tool input)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Detecta --no-verify ou -n como argumentos separados (não como parte de outra flag)
CMD=" $COMMAND "
if [[ "$CMD" == *" --no-verify "* ]] || [[ "$CMD" == *" -n "* ]]; then
  echo "Blocked --no-verify flag. Use 'git commit' without '--no-verify'."
  exit 2
fi

exit 0
