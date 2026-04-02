#!/bin/bash
set -e

echo "=== Session Events E2E Test ==="
echo ""

TEST_SESSION_ID="e2e-test-session-$(date +%s)"
LOG_FILE="./session_events.log"

cleanup() {
  echo ""
  echo "Cleaning up..."
  if [ -f "$LOG_FILE" ]; then
    rm -f "$LOG_FILE"
  fi
}

trap cleanup EXIT

echo "Test session ID: $TEST_SESSION_ID"
echo ""

echo "1. Testing session.created event..."
echo "   (This should trigger when opencode creates a new session)"
echo "   Manual verification: Check if toast appears with 'SESSION CREATED'"
echo ""

echo "2. Testing session.compacted event..."
echo "   (This should trigger during session compaction)"
echo "   Manual verification: Check if toast appears with 'SESSION COMPACTED'"
echo ""

echo "3. Testing session.idle event..."
echo "   (This should trigger when session becomes idle)"
echo "   Manual verification: Check if toast appears with 'IDLE SESSION'"
echo ""

echo "4. Testing session.error event..."
echo "   (This should trigger on session errors)"
echo "   Manual verification: Check if toast appears with 'SESSION ERROR'"
echo ""

echo "5. Testing session.deleted event..."
echo "   (This should trigger when session is deleted)"
echo "   Manual verification: Check if toast appears with 'SESSION DELETED'"
echo ""

echo "=== Manual Test Instructions ==="
echo "To fully test the E2E flow:"
echo "1. Start a new opencode session"
echo "2. Let it idle (triggers session.idle)"
echo "3. Force compaction (triggers session.compacted)"
echo "4. Delete the session (triggers session.deleted)"
echo "5. Check $LOG_FILE for logged events"
echo ""

if [ -f "$LOG_FILE" ]; then
  echo "=== Session Events Log ==="
  cat "$LOG_FILE"
fi

echo ""
echo "=== E2E Test Complete ==="
echo "Note: Full E2E testing requires manual interaction with opencode CLI"
