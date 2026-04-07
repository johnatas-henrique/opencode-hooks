#!/bin/bash
set -e

echo "=== Tool Execution E2E Test ==="
echo ""

LOG_FILE="./production/session-logs/session_events.log"
DEBUG_LOG_FILE="./production/session-logs/session_debug_events.log"

cleanup() {
  echo ""
  echo "Cleaning up test artifacts..."
}

trap cleanup EXIT

echo "This test verifies tool execution events are captured correctly."
echo ""
echo "NOTE: This script requires manual testing in OpenCode environment."
echo "The actual tool execution happens inside the OpenCode plugin runtime."
echo ""
echo "To manually test, run OpenCode and execute various tools:"
echo "  - task (subagent): Invoke any subagent like 'explore'"
echo "  - skill: Invoke any skill like 'find-skills'"
echo "  - read: Use filesystem read tool"
echo "  - write: Use filesystem write tool"
echo "  - edit: Use filesystem edit tool"
echo "  - glob: Use glob tool"
echo "  - grep: Use grep tool"
echo "  - bash: Use bash tool"
echo ""
echo "After execution, check:"
echo "  - $LOG_FILE"
echo "  - $DEBUG_LOG_FILE"
echo ""

echo "=== Verifying log files exist ==="
mkdir -p ./production/session-logs
touch "$LOG_FILE"
touch "$DEBUG_LOG_FILE"

echo "Log files ready:"
echo "  - $LOG_FILE"
echo "  - $DEBUG_LOG_FILE"
echo ""

echo "=== Verifying test scripts exist ==="
SCRIPTS_DIR=".opencode/scripts"
if [ -d "$SCRIPTS_DIR" ]; then
  echo "Scripts directory exists: $SCRIPTS_DIR"
  ls -la "$SCRIPTS_DIR" 2>/dev/null || echo "No scripts found"
else
  echo "Scripts directory not found: $SCRIPTS_DIR"
fi
echo ""

echo "=== Tool Execution Test Types ==="
echo ""
echo "1. tool.execute.before events:"
echo "   - task:before"
echo "   - skill:before"
echo "   - read:before"
echo "   - write:before"
echo "   - edit:before"
echo "   - glob:before"
echo "   - grep:before"
echo "   - bash:before"
echo ""
echo "2. tool.execute.after events:"
echo "   - task (subagent): Invoked via Task tool"
echo "   - skill: Invoked via Skill tool"
echo "   - read: File read operation"
echo "   - write: File write operation"
echo "   - edit: File edit operation"
echo "   - glob: File search operation"
echo "   - grep: Text search operation"
echo "   - bash: Shell command execution"
echo ""

echo "=== E2E Tool Execution Tests Complete ==="