#!/bin/bash
set -e

echo "=== LOG AGENT ==="

AGENT_NAME="$1"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

mkdir -p production/session-logs

echo "[$TIMESTAMP] | Agent invoked: ${AGENT_NAME:-unknown}" >> production/session-logs/agent-audit.log
echo "Agent logged to audit trail"

exit 0
