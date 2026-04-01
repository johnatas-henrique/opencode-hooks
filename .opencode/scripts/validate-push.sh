#!/bin/bash
set -e

echo "=== VALIDATE PUSH ==="

TARGET_BRANCH="$1"

if [[ -z "$TARGET_BRANCH" ]]; then
  echo "Usage: validate-push.sh <branch>"
  exit 1
fi

echo "Target branch: $TARGET_BRANCH"

if [[ "$TARGET_BRANCH" == "main" || "$TARGET_BRANCH" == "master" || "$TARGET_BRANCH" == "develop" ]]; then
  echo "WARNING: Push to protected branch detected!"
  echo "Ensure:"
  echo "  - Build passes"
  echo "  - Unit tests pass"
  echo "  - No S1/S2 bugs exist"
fi

exit 0
