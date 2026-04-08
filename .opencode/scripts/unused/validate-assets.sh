#!/bin/bash
set -e

echo "=== VALIDATE ASSETS ==="

CHANGED_FILES="$1"

if [[ -z "$CHANGED_FILES" ]]; then
  CHANGED_FILES=$(git diff --name-only)
fi

echo -e "\n### Naming Convention Check ###"
for file in $CHANGED_FILES; do
  if [[ "$file" == assets/* ]]; then
    FILENAME=$(basename "$file")
    if [[ "$FILENAME" =~ [A-Z] || "$FILENAME" =~ [[:space:]] || "$FILENAME" =~ - ]]; then
      echo "WARNING: $file uses uppercase, spaces, or hyphens - use lowercase with underscores"
    fi
  fi
done

echo -e "\n### JSON Validation ###"
for file in $CHANGED_FILES; do
  if [[ "$file" == assets/data/*.json ]]; then
    echo "Validating: $file"
    if ! python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
      echo "ERROR: Invalid JSON in $file"
    fi
  fi
done

exit 0
