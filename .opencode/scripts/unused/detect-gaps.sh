#!/bin/bash
set -e

echo "=== DETECT GAPS ==="

echo -e "\n### Fresh Project Detection ###"
if [ -f ".opencode/docs/technical-preferences.md" ]; then
  ENGINE_CONFIGURED=$(grep -c "Engine:" .opencode/docs/technical-preferences.md || echo "0")
else
  ENGINE_CONFIGURED=0
fi

HAS_CONCEPT=$(ls design/gdd/game-concept.md 2>/dev/null | wc -l)
HAS_SRC=$(ls src/*.* 2>/dev/null | wc -l)

if [ "$ENGINE_CONFIGURED" -eq 0 ] && [ "$HAS_CONCEPT" -eq 0 ] && [ "$HAS_SRC" -eq 0 ]; then
  echo "Fresh project detected - suggest running /start or /project-stage-detect"
fi

echo -e "\n### Codebase vs Design Docs Ratio ###"
SRC_COUNT=$(find src/ -type f \( -name "*.gd" -o -name "*.cs" -o -name "*.cpp" -o -name "*.rs" -o -name "*.py" -o -name "*.js" -o -name "*.ts" \) 2>/dev/null | wc -l)
DOC_COUNT=$(ls design/gdd/*.md 2>/dev/null | wc -l)
echo "Source files: $SRC_COUNT"
echo "Design docs: $DOC_COUNT"

if [ "$SRC_COUNT" -gt 50 ] && [ "$DOC_COUNT" -lt 5 ]; then
  echo "WARNING: Sparse documentation (>50 source files, <5 design docs)"
fi

echo -e "\n### Undocumented Prototypes ###"
if [ -d "prototypes" ]; then
  for dir in prototypes/*/; do
    if [ -d "$dir" ]; then
      if [ ! -f "${dir}README.md" ] && [ ! -f "${dir}CONCEPT.md" ]; then
        echo "Undocumented: $dir"
      fi
    fi
  done
fi

echo -e "\n### Core Systems Without Architecture Docs ###"
if [ -d "src/core" ] || [ -d "src/engine" ]; then
  if [ ! -d "docs/architecture" ]; then
    echo "WARNING: src/core or src/engine exists but docs/architecture/ doesn't"
  else
    ADR_COUNT=$(ls docs/architecture/*.md 2>/dev/null | wc -l)
    if [ "$ADR_COUNT" -lt 3 ]; then
      echo "WARNING: Only $ADR_COUNT ADRs in docs/architecture/"
    fi
  fi
fi

echo -e "\n### Production Planning ###"
if [ "$SRC_COUNT" -gt 100 ]; then
  HAS_SPRINTS=$(ls production/sprints/ 2>/dev/null | wc -l)
  HAS_MILESTONES=$(ls production/milestones/ 2>/dev/null | wc -l)
  if [ "$HAS_SPRINTS" -eq 0 ] || [ "$HAS_MILESTONES" -eq 0 ]; then
    echo "WARNING: >100 source files but missing production/sprints/ or production/milestones/"
  fi
fi

echo -e "\nFor comprehensive analysis, run /project-stage-detect"

exit 0
