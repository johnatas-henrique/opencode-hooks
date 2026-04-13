#!/bin/bash
set -e

echo "=== PRE-COMPACT ==="

echo -e "\n### Active Session State ###"
if [ -f "production/session-state/active.md" ]; then
  LINE_COUNT=$(wc -l < "production/session-state/active.md")
  echo "Total lines: $LINE_COUNT"
  if [ "$LINE_COUNT" -gt 100 ]; then
    head -100 production/session-state/active.md
  else
    cat production/session-state/active.md
  fi
else
  echo "No active session state found"
fi

echo -e "\n### Files Modified ###"
if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && git rev-parse HEAD >/dev/null 2>&1; then
  echo "Unstaged:"
  git diff --name-only || echo "None"
  echo "Staged:"
  git diff --staged --name-only || echo "None"
  echo "Untracked:"
  git ls-files --others --exclude-standard || echo "None"
else
  echo "No commits yet (no git history)"
fi

echo -e "\n### Design Docs - Work In Progress ###"
if [ -d "design/gdd" ]; then
  for file in design/gdd/*.md; do
    if [ -f "$file" ]; then
      MATCHES=$(grep -n -E "TODO|WIP|PLACEHOLDER|\[TO BE CONFIGURED\]|\[TBD\]" "$file" 2>/dev/null || true)
      if [ -n "$MATCHES" ]; then
        echo "File: $file"
        echo "$MATCHES"
      fi
    fi
  done
fi

echo -e "\n### Recovery Instructions ###"
echo "After compaction, read production/session-state/active.md to recover full context"

exit 0
