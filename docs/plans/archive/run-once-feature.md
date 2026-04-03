# Plan: Run-Once Feature for Events

**Date:** 2026-04-02
**Status:** Completed

## Execution

| Step                                                                     | Status | Timestamp        |
| ------------------------------------------------------------------------ | ------ | ---------------- |
| 1. Add `runOnce` property to EventOverride and ToolOverride interfaces   | ✅     | 2026-04-03 17:40 |
| 2. Add `runOnce` to ResolvedEventConfig interface                        | ✅     | 2026-04-03 17:41 |
| 3. Update `resolveScripts` to propagate runOnce to resolved config       | ✅     | 2026-04-03 17:42 |
| 4. Implement runOnce tracking with Map in plugin                         | ✅     | 2026-04-03 17:43 |
| 5. Add logic to skip script execution when runOnce was already triggered | ✅     | 2026-04-03 17:44 |
| 6. Update user-events.config.ts to demonstrate runOnce usage             | ✅     | 2026-04-03 17:45 |
| 7. Run tests to verify changes                                           | ✅     | 2026-04-03 17:46 |

---

## Overview

Add a `runOnce` option to event and tool configurations that allows scripts to execute only on the first occurrence of an event, skipping subsequent executions within the same OpenCode process lifetime.

---

## Technical Details

### 1. Type Definitions (event-types.ts)

Add `runOnce?: boolean` to:

- `EventOverride` interface (line ~55-61)
- `ToolOverride` interface (line ~63-69)
- `ResolvedEventConfig` interface (line ~87-97)

### 2. Script Resolution Logic (events.ts)

Modify `resolveScripts` function to include `runOnce` in the returned config:

- After resolving scripts, check if `userEventConfig.runOnce` is true
- Add `runOnce` to the return value

### 3. Plugin Implementation (opencode-hooks.ts)

Add tracking mechanism:

```typescript
const runOnceTracker = new Map<string, boolean>();
```

In the event handler, before executing scripts:

- Check if `resolved.runOnce` is true
- If true, check the tracker for this event type
- If already triggered, skip script execution
- If not triggered, execute scripts and mark as triggered

### 4. Usage Example (user-events.config.ts)

```typescript
[EventType.SESSION_CREATED]: {
  toast: { duration: 5000 },
  scripts: ['session-created.sh'],
  runOnce: true  // Only runs on first session created
},
```

---

## Files to Modify

1. `.opencode/plugins/helpers/event-types.ts`
2. `.opencode/plugins/helpers/events.ts`
3. `.opencode/plugins/opencode-hooks.ts`
4. `.opencode/plugins/helpers/user-events.config.ts`
