#!/bin/bash
set +e

echo "=== SERVER CONNECTED ==="

echo -e "\n### Connection Info ###"
echo "Server: connected"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"

echo -e "\n### Project Status ###"
if [ -d ".git" ]; then
  echo "Git branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
  echo "Working directory: $(pwd)"
else
  echo "Not a git repository"
fi

echo -e "\n### OpenCode Config ###"
if [ -f "opencode.json" ]; then
  echo "Config found: opencode.json"
else
  echo "No opencode.json found"
fi

echo -e "\n### Active Plugins ###"
if [ -d ".opencode/plugins" ]; then
  ls -1 .opencode/plugins/ 2>/dev/null | head -10 || echo "No plugins"
else
  echo "No plugins directory"
fi

echo -e "\n### Session Summary ###"
echo "Session ready for development"

exit 0
