# Plan: Fix Event-Specific Enabled Flag

**Status:** Not Started (may be obsolete - refactored to modular system)

## Problem

When user sets `"session.created": false` in the events config, the event still runs because the code doesn't check `eventConfig.enabled` inside each switch case.

---

## Execution

| Step                                     | Status | Timestamp |
| ---------------------------------------- | ------ | --------- |
| 1. Analyze current code flow             | ⏳     | -         |
| 2. Add enabled check in each switch case | ⏳     | -         |
| 3. Build and test                        | ⏳     | -         |

---

## Current Code Issue

In `session-plugins.ts`, after getting eventConfig:

```typescript
const eventConfig = getEventConfig(event.type);

if (eventConfig.enabled === false) {
  return;  // This check exists at the top
}

switch (event.type) {
  case "session.created": {
    // BUG: No enabled check here!
    // Even if eventConfig.enabled = false, the code continues here
    if (eventConfig.toast) { ... }
    // ...
  }
}
```

---

## Root Cause

The `eventConfig.enabled` check is done BEFORE the switch, but if:

1. Event IS specified in JSON with `false` → works (returns early)
2. Event NOT specified in JSON → uses global defaults → but the check is bypassed inside switch

Actually, more specifically: the code only checks `eventConfig.enabled === false` before entering switch, but doesn't check it INSIDE each case.

---

## Solution

Add `if (eventConfig.enabled === false)` inside each switch case at the start:

```typescript
case "session.created": {
  if (eventConfig.enabled === false) break;  // ADD THIS

  const sessionEvent = event as EventSessionCreated;
  if (eventConfig.toast) { ... }
  // ...
}
```

This ensures that even if global defaults are used (when event not in JSON), the per-event override works correctly.

---

## Events to Fix

All these events need the check added:

- session.created
- session.compacted
- server.instance.disposed
- session.deleted
- session.diff
- session.error
- session.idle

---

## Files to Modify

| File                                   | Action                         |
| -------------------------------------- | ------------------------------ |
| `.opencode/plugins/session-plugins.ts` | Add enabled check in each case |

---

## Verification

After fix, test:

1. Set `"session.created": false` in JSON → event should NOT run
2. Set all globals to `false` but `"session.created": { enabled: true }` → only this should run
3. No events specified → all should run (current behavior)
