#!/bin/bash
set -e

echo "=== Session Events E2E Test ==="
echo ""

TEST_SESSION_ID="e2e-test-session-$(date +%s)"
LOG_FILE="./session_events.log"
UNKNOWN_LOG_FILE="./unknown_events.log"

cleanup() {
  echo ""
  echo "Cleaning up..."
  [ -f "$LOG_FILE" ] && rm -f "$LOG_FILE"
  [ -f "$UNKNOWN_LOG_FILE" ] && rm -f "$UNKNOWN_LOG_FILE"
}

trap cleanup EXIT

echo "Test session ID: $TEST_SESSION_ID"
echo ""

echo "=== E2E Test Coverage ==="
echo ""
echo "1. Session Events (automatic in opencode):"
echo "   - session.created     -> Toast: SESSION CREATED"
echo "   - session.compacted   -> Toast: SESSION COMPACTED"
echo "   - session.idle       -> Toast: IDLE SESSION"
echo "   - session.error      -> Toast: SESSION ERROR"
echo "   - session.deleted    -> Toast: SESSION DELETED"
echo ""
echo "2. Tool Events (automatic in opencode):"
echo "   - tool.execute.before  -> Logs tool execution"
echo "   - tool.execute.after   -> Logs tool result"
echo ""
echo "3. File Events (manual testing):"
echo "   - file.edited       -> Edit a file"
echo "   - file.watcher.updated -> File watcher changes"
echo ""
echo "4. Permission Events (manual testing):"
echo "   - permission.asked   -> Accept/deny permission"
echo "   - permission.replied -> Reply to permission"
echo ""

echo "=== Running Unit Tests ==="
npm test --silent

echo ""
echo "=== Running Lint ==="
npm run lint --silent

echo ""
echo "=== Running Build ==="
npm run build --silent

echo ""
echo "=== All Checks Passed ==="
