#!/bin/bash

echo "=== VALIDATE COMMIT ==="

STAGED_FILES=$(git diff --cached --name-only)

if [ -z "$STAGED_FILES" ]; then
    echo "No staged files to validate."
    exit 0
fi

echo ""
echo "Staged files to validate:"
echo "$STAGED_FILES" | sed 's/^/  - /'
echo ""

FOUND_VALIDATION=0

echo "### Shell Scripts Validation ###"
for file in $STAGED_FILES; do
  case "$file" in
    *.sh)
      echo "Checking: $file"
      if [ -f "$file" ]; then
        if ! head -1 "$file" | grep -q "^#!/"; then
          echo "  ERROR: Missing shebang in $file"
          exit 1
        fi
        if ! grep -q "set -e" "$file"; then
          echo "  WARNING: Missing 'set -e' in $file"
        fi
        if ! grep -q "exit 0" "$file"; then
          echo "  WARNING: Missing 'exit 0' at end of $file"
        fi
        FOUND_VALIDATION=1
      fi
      ;;
  esac
done

echo ""
echo "### Design Documents Check ###"
for file in $STAGED_FILES; do
  case "$file" in
    design/gdd/*.md)
      echo "Checking: $file"
      if [ -f "$file" ]; then
        for section in "Overview" "Player Fantasy" "Detailed" "Formulas" "Edge Cases" "Dependencies" "Tuning Knobs" "Acceptance Criteria"; do
          if ! grep -q "$section" "$file"; then
            echo "  WARNING: Missing section: $section"
          fi
        done
        FOUND_VALIDATION=1
      fi
      ;;
  esac
done

echo ""
echo "### JSON Data Files Validation ###"
for file in $STAGED_FILES; do
  case "$file" in
    assets/data/*.json)
      echo "Validating: $file"
      if [ -f "$file" ]; then
        if ! python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
          echo "ERROR: Invalid JSON in $file"
          exit 1
        fi
        FOUND_VALIDATION=1
      fi
      ;;
  esac
done

echo ""
echo "### Hardcoded Gameplay Values ###"
for file in $STAGED_FILES; do
  case "$file" in
    src/gameplay/*)
      echo "Checking: $file"
      if [ -f "$file" ]; then
        HARDCODED=$(grep -n -E "(damage|health|speed)\s*[:=]\s*[0-9]+" "$file" 2>/dev/null || true)
        if [ -n "$HARDCODED" ]; then
          echo "WARNING in $file: Found hardcoded values - use data files instead"
          echo "$HARDCODED"
        fi
        FOUND_VALIDATION=1
      fi
      ;;
  esac
done

echo ""
echo "### TODO/FIXME Ownership ###"
for file in $STAGED_FILES; do
  case "$file" in
    src/*)
      echo "Checking: $file"
      if [ -f "$file" ]; then
        UNOWNED=$(grep -n -E "(TODO|FIXME|HACK)\([^)]*\)" "$file" 2>/dev/null || true)
        if [ -z "$UNOWNED" ]; then
          UNOWNED=$(grep -n -E "(TODO|FIXME|HACK)" "$file" 2>/dev/null || true)
          if [ -n "$UNOWNED" ]; then
            echo "WARNING in $file: Found unowned TODO/FIXME - use TODO(name) format"
            echo "$UNOWNED"
          fi
        fi
        FOUND_VALIDATION=1
      fi
      ;;
  esac
done

echo ""
echo "### OpenCode Config Files ###"
for file in $STAGED_FILES; do
  case "$file" in
    .opencode/*|.opencode/hooks/*|.opencode/plugins/*)
      echo "Checking: $file"
      if [ -f "$file" ]; then
        case "$file" in
          *.sh)
            if ! grep -q "exit 0" "$file"; then
              echo "  WARNING: Missing 'exit 0' at end of $file"
            fi
            ;;
        esac
        FOUND_VALIDATION=1
      fi
      ;;
  esac
done

echo ""
if [ "$FOUND_VALIDATION" -eq 0 ]; then
    echo "No matching validators for staged files - skipping validation."
    echo "(Files matched patterns: shell, design/gdd, assets/data, src/gameplay, src, .opencode)"
fi

echo ""
echo "Validation complete. Proceeding with commit."

exit 0