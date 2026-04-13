# Fix: runOnce - Session Detection for Subagents

**Date:** 2026-04-11  
**Status:** Completed

## Current Problem

The `runOnce` feature is supposed to run scripts only once per event, but it's not working correctly for subagent sessions. We can't distinguish between:

- Primary sessions (created by user)
- Subagent sessions (created by task agents)

## Current Implementation

### Code Locations

1. **config.ts** - Field defined:

```typescript
runOnlyOnce?: boolean;
```

2. **user-events.config.ts** - Usage example:

```typescript
[EventType.SESSION_CREATED]: {
  enabled: false,
  runOnlyOnce: true,  // supposed to run only once
  ...
}
```

3. **run-script-handler.ts** - Logic:

```typescript
const runOnceTracker = new Map<string, boolean>();

if (resolved.runOnlyOnce) {
  if (!isSessionPrimary(sessionId)) {
    return; // skip if not primary
  }
  if (runOnceTracker.has(runOnceKey)) {
    return; // skip if already ran
  }
  runOnceTracker.set(runOnceKey, true);
}
```

4. **session.ts** - has `isPrimarySession`:

```typescript
export function isPrimarySession(sessionId?: string): boolean {
  return sessionId && primarySessions.has(sessionId);
}
```

### What Exists But Doesn't Work

- `runOnlyOnce` field is defined in config
- `isPrimarySession()` function exists in session.ts
- But **there's no logic to populate `primarySessions` Set**

## Solution Approach

### New Detection Logic

1. **Create Set to track subagent sessions:**

```typescript
const subagentSessionIds = new Set<string>();
```

2. **Detect in session.created event:**

```typescript
// In event hook - session.created
const info = (event as any).properties?.info;
if (info?.parentID) {
  // This session was created by a subagent
  subagentSessionIds.add(info.id);
}
```

3. **Helper function:**

```typescript
function isSubagent(sid: string | undefined): boolean {
  return !!sid && subagentSessionIds.has(sid);
}
```

4. **Update runOnce logic:**

```typescript
if (resolved.runOnlyOnce) {
  if (isSubagent(sessionId)) {
    return; // skip subagent sessions entirely
  }
  if (runOnceTracker.has(runOnceKey)) {
    return;
  }
  runOnceTracker.set(runOnceKey, true);
}
```

## Execution

| Step | Description                                         | Status | Timestamp        |
| ---- | --------------------------------------------------- | ------ | ---------------- |
| 1    | Add subagentSessionIds Set in run-script-handler.ts | ✅     | 2026-04-11 15:45 |
| 2    | Update session.created handler to detect parentID   | ✅     | 2026-04-11 15:45 |
| 3    | Create isSubagent helper function                   | ✅     | 2026-04-11 15:45 |
| 4    | Update runOnce logic in runScriptAndHandle          | ✅     | 2026-04-11 15:45 |
| 5    | Fix grep tool normalization in events.ts            | ✅     | 2026-04-11 15:50 |
| 6    | Remove runOnceTracker, use only subagent detection  | ✅     | 2026-04-11 15:55 |
| 7    | Update tests                                        | ✅     | 2026-04-11 15:55 |
| 8    | Build, lint, test                                   | ✅     | 2026-04-11 15:56 |

## Key Insight

The `parentID` in `session.created` event properties indicates the session was created by another session (subagent). If `parentID` exists, it's a subagent session.
