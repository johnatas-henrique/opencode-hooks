#!/bin/bash
set -e

echo "=== LOG SKILL ==="

SKILL_NAME="$1"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)

mkdir -p production/session-logs

echo "[$TIMESTAMP] | Skill invoked: ${SKILL_NAME:-unknown}" >> production/session-logs/skill-audit.log
echo "Skill logged to audit trail"

exit 0
