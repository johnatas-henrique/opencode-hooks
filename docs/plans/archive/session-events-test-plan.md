# Session Events Plugin Test Plan

**Status:** Superseded by modular-events-plan.md
**Note:** The session-plugins.ts was refactored into the modular event system (opencode-hooks.ts with handlers.ts)

## Execution

| Step                                                   | Status | Timestamp |
| ------------------------------------------------------ | ------ | --------- |
| 1. Analyze plugin structure and event handlers         | ⏳     | -         |
| 2. Design test strategy (mock vs E2E)                  | ⏳     | -         |
| 3. Create test infrastructure (jest + mocks)           | ⏳     | -         |
| 4. Write unit tests for each session event handler     | ⏳     | -         |
| 5. Create integration test with real session lifecycle | ⏳     | -         |
| 6. Add automation script for CI/CD                     | ⏳     | -         |
| 7. Run tests and verify all events                     | ⏳     | -         |

---

## 1. Analyze Plugin Structure and Event Handlers

**Current Implementation:** `session-plugins.ts`

| Event               | Current Behavior                      | Test Coverage Goal                 |
| ------------------- | ------------------------------------- | ---------------------------------- |
| `session.created`   | Toast (variant: warning, 2s)          | ✅ Verify toast triggered          |
| `session.compacted` | Toast + runScript("session-start.sh") | ✅ Verify toast + script execution |
| `session.deleted`   | Toast (variant: warning, 2s)          | ✅ Verify toast triggered          |
| `session.idle`      | Toast (variant: info, 2s)             | ✅ Verify toast triggered          |
| `session.error`     | Toast with error details              | ✅ Verify error message extracted  |
| `session.diff`      | No action (empty case)                | ✅ Verify no crash                 |
| `session.status`    | No action (empty case)                | ✅ Verify no crash                 |
| `session.updated`   | No action (empty case)                | ✅ Verify no crash                 |

---

## 2. Test Strategy

### Approach: Hybrid (Unit + Integration)

**Unit Tests (Jest)**

- Mock `client.tui.showToast`
- Mock `runScript` function
- Verify each event handler calls correct methods with expected parameters

**Integration Tests**

- Manual/E2E test via real opencode session
- Verify actual toast appears on UI
- Verify scripts actually execute

### Test Framework

- **Framework:** Jest (already in package.json)
- **Mocking:** ts-jest + manual mocks for opencode SDK types
- **Assertions:** Jest expect + custom matchers for event properties

---

## 3. Test Infrastructure

### Create: `test/session-plugins.test.ts`

```typescript
// Imports and mocks
// Event type factories for each session event
// Test suite for each event handler
```

### Create: `test/__mocks__/opencode-sdk.ts`

```typescript
// Mock all SDK types: EventSessionCreated, EventSessionCompacted, etc.
// Mock client.tui.showToast
// Mock $ (shell runner)
```

### Create: `test/fixtures/session-events.ts`

```typescript
// Factory functions for each event type
// Example: createSessionCreatedEvent(), createSessionIdleEvent(), etc.
```

---

## 4. Unit Test Cases

### Test Suite: `session.created`

| Test Case                         | Expected Behavior                      |
| --------------------------------- | -------------------------------------- |
| Valid session created             | Toast with variant "warning" triggered |
| Toast contains correct session ID | properties.info.id appears in message  |
| Toast duration is 2000ms          | duration field equals 2000             |

### Test Suite: `session.compacted`

| Test Case                                | Expected Behavior                       |
| ---------------------------------------- | --------------------------------------- |
| Compacted event triggers toast           | Toast with variant "info" triggered     |
| runScript called with "session-start.sh" | Shell script executed                   |
| Session ID present in toast              | properties.sessionID appears in message |

### Test Suite: `session.deleted`

| Test Case                           | Expected Behavior                      |
| ----------------------------------- | -------------------------------------- |
| Deleted event triggers toast        | Toast with variant "warning" triggered |
| Session ID matches event properties | Correct id in message                  |

### Test Suite: `session.idle`

| Test Case                     | Expected Behavior                   |
| ----------------------------- | ----------------------------------- |
| Idle event triggers toast     | Toast with variant "info" triggered |
| Session ID captured correctly | properties.sessionID in message     |

### Test Suite: `session.error`

| Test Case                         | Expected Behavior                    |
| --------------------------------- | ------------------------------------ |
| Error event triggers toast        | Toast with variant "error" triggered |
| Error name extracted correctly    | properties.error.name shown          |
| Error message extracted correctly | properties.error.data.message shown  |
| Unknown error shows fallback      | "Unknown error" / "Unknown message"  |

### Test Suite: `session.diff` / `session.status` / `session.updated`

| Test Case                | Expected Behavior               |
| ------------------------ | ------------------------------- |
| No crash on these events | Handler completes without error |
| No toast triggered       | showToast not called            |

---

## 5. Integration Test Approach

### Manual E2E Test Script

Create `test/e2e/session-lifecycle.sh` to trigger real events:

```bash
#!/bin/bash
# Start a new session and verify events fire
opencode --session-id test-session-001
# ... perform actions to trigger events
# Verify session_events.log contains expected entries
```

### Automated via OpenCode CLI (if supported)

Use opencode's `--events` flag or plugin loading to verify:

1. Load plugin on startup
2. Create new session → verify toast
3. Wait for idle → verify toast
4. Delete session → verify toast

---

## 6. Script to Automate Tests

### Update `package.json` scripts:

```json
{
  "scripts": {
    "test:unit": "jest test/unit/session-plugins.test.ts",
    "test:integration": "bash test/e2e/run-session-tests.sh",
    "test": "npm run test:unit && npm run test:integration"
  }
}
```

### Create: `test/ci/run-all-tests.sh`

```bash
#!/bin/bash
set -e

echo "=== Running Session Plugin Tests ==="

# Unit tests
npm run test:unit

# Verify coverage
npx jest --coverage --coverageThreshold='{"statements":95}'

# Integration (optional in CI)
if [ "$CI" != "true" ]; then
  npm run test:integration
fi

echo "=== All tests passed ==="
```

---

## 7. Verification Checklist

After implementation, verify:

- [ ] All 8 session events have test coverage
- [ ] Unit tests pass: `npm run test:unit`
- [ ] Code coverage ≥ 95%
- [ ] Lint passes: `npm run eslint`
- [ ] TypeScript compiles: `npm run build`
- [ ] Integration test runs in local session
- [ ] CI script works: `npm test`

---

## Technical Notes

### SDK Mock Strategy

```typescript
// test/__mocks__/@opencode-ai/sdk.ts
export const mockEventSessionCreated = {
  type: 'session.created',
  properties: {
    info: { id: 'session-123', createdAt: new Date() },
  },
} as EventSessionCreated;
```

### Toast Verification

```typescript
expect(client.tui.showToast).toHaveBeenCalledWith({
  body: expect.objectContaining({
    variant: 'warning',
    duration: 2000,
  }),
});
```

### Script Execution Verification

```typescript
expect(runScript).toHaveBeenCalledWith($, 'session-start.sh');
```

---

## Dependencies to Add

```bash
# Add to devDependencies if needed
npm install --save-dev ts-jest @types/jest
```

---

## Timeline Estimate

| Task                          | Time       |
| ----------------------------- | ---------- |
| Infrastructure setup          | 30min      |
| Unit tests (8 event handlers) | 1hr        |
| Mock refinement               | 20min      |
| Integration test              | 30min      |
| CI script                     | 15min      |
| **Total**                     | **~2.5hr** |

---

## Next Steps

1. Confirm this plan is acceptable
2. Proceed with implementation (Step 3+)
3. Run first test cycle
4. Refine based on results
