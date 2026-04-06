# Improve runScriptAndHandle Function

## Objective

Refactor `runScriptAndHandle` to:

1. Use config object instead of many positional parameters
2. Implement proper `runOnlyOnce` logic per script
3. Implement `appendToSession` conditional
4. Add `isPrimarySession` helper to distinguish primary vs subagent sessions

## Problems Identified

1. **Too many parameters** (7 total): Risk of ordering bugs
2. **Missing `runOnlyOnce` per script**: Currently only tracks by event type, not by individual script
3. **Missing `appendToSession` conditional**: Doesn't check `resolved.appendToSession` before calling
4. **`toastQueue` parameter unnecessary**: Can use `useGlobalToastQueue()` global
5. **`arg` vs `toolName`**: Confusing naming, need clarification

---

## Execution

| Step                                               | Status | Timestamp        |
| -------------------------------------------------- | ------ | ---------------- |
| 1. Export getProp from default-handlers.ts         | ✅     | 2026-04-05 23:35 |
| 2. Create isPrimarySession helper                  | ✅     | 2026-04-05 23:36 |
| 3. Create RunScriptConfig interface                | ✅     | 2026-04-05 23:36 |
| 4. Refactor runScriptAndHandle with config object  | ✅     | 2026-04-05 23:37 |
| 5. Implement runOnlyOnce per script                | ✅     | 2026-04-05 23:40 |
| 6. Implement appendToSession conditional           | ✅     | 2026-04-05 23:40 |
| 7. Update call sites in tool.execute.before        | ✅     | 2026-04-05 23:42 |
| 8. Update call sites in tool.execute.after         | ✅     | 2026-04-05 23:42 |
| 9. Remove old runOnlyOnce logic from event handler | ✅     | 2026-04-05 23:43 |
| 10. Build, lint, test                              | ✅     | 2026-04-05 23:45 |

---

## Status: COMPLETED (2026-04-05 23:45)

---

## Detailed Steps

### Step 1: Export getProp

**File:** `.opencode/plugins/helpers/default-handlers.ts`

Export the existing `getProp` function:

```typescript
export const getProp = (
  event: Record<string, unknown>,
  path: string
): unknown => {
  // ... existing code
};
```

**Also export from:** `.opencode/plugins/helpers/index.ts`

---

### Step 2: Create isPrimarySession Helper

**File:** `.opencode/plugins/helpers/session.ts` (new file)

```typescript
let primarySessionId: string | null = null;
const knownSessions = new Set<string>();

export function isPrimarySession(sessionId: string): boolean {
  // If we haven't seen any session yet, this is primary
  if (!primarySessionId) {
    primarySessionId = sessionId;
    knownSessions.add(sessionId);
    return true;
  }

  // If we've seen this session before, check if it's primary
  if (knownSessions.has(sessionId)) {
    return sessionId === primarySessionId;
  }

  // New session - add to known but it's not primary (likely subagent)
  knownSessions.add(sessionId);
  return false;
}

export function getPrimarySessionId(): string | null {
  return primarySessionId;
}
```

**Note:** This is a simplified version. Can be enhanced later to detect session switches.

**Export from:** `.opencode/plugins/helpers/index.ts`

---

### Step 3: Create RunScriptConfig Interface

**File:** `.opencode/plugins/helpers/run-script-types.ts` (new file)

```typescript
import type { PluginInput } from '@opencode-ai/plugin';
import type { ResolvedEventConfig } from './event-types';

export interface RunScriptConfig {
  $: PluginInput['$'];
  script: string;
  scriptArg: string; // tool name or subagentType, passed as arg to script
  toolName?: string; // tool name for logging (optional, default: scriptArg)
  timestamp: string;
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
}
```

---

### Step 4: Refactor runScriptAndHandle

**File:** `.opencode/plugins/helpers/run-script-handler.ts` (new file)

```typescript
import { runScript } from './run-script';
import { appendToSession } from './append-to-session';
import { logScriptOutput } from './log-event';
import { useGlobalToastQueue } from './toast-queue';
import { TOAST_DURATION } from './constants';
import { isPrimarySession } from './session';
import type { RunScriptConfig } from './run-script-types';

let runOnceTracker = new Map<string, boolean>();

export async function runScriptAndHandle(
  config: RunScriptConfig
): Promise<void> {
  const {
    $,
    script,
    scriptArg,
    toolName = scriptArg,
    timestamp,
    eventType,
    resolved,
    sessionId,
  } = config;

  // Check runOnlyOnce per script (only in primary sessions)
  const runOnceKey = `${sessionId}:${eventType}:${script}:${scriptArg}`;

  if (resolved.runOnlyOnce) {
    if (runOnceTracker.has(runOnceKey)) {
      return; // Already ran this script in this session
    }
  }

  // Execute script
  try {
    const output = await runScript($, script, scriptArg);

    // Save to file if configured
    if (resolved.saveToFile && output) {
      await logScriptOutput(timestamp, output);
    }

    // Append to session if configured (individual per script)
    if (resolved.appendToSession && output) {
      await appendToSession({ $ }, sessionId, output);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);

    await saveToFile({
      content: `[${timestamp}] - Script error: ${script} - ${errorMessage}\n`,
      showToast: useGlobalToastQueue().add,
    });

    useGlobalToastQueue().add({
      title: '====SCRIPT ERROR====',
      message: `Script: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
      variant: 'error',
      duration: TOAST_DURATION.FIVE_SECONDS,
    });
  }

  // Mark as run once (only in primary sessions)
  if (resolved.runOnlyOnce && isPrimarySession(sessionId)) {
    runOnceTracker.set(runOnceKey, true);
  }
}
```

---

### Step 5: Update Call Sites

**In `.opencode/plugins/opencode-hooks.ts`:**

**tool.execute.before (around line 217):**

```typescript
// BEFORE
await runScriptAndHandle(
  $,
  script,
  input.tool,
  timestamp,
  'tool.execute.before',
  input.tool
);

// AFTER
await runScriptAndHandle({
  $,
  script,
  scriptArg: input.tool,
  toolName: input.tool,
  timestamp,
  eventType: 'tool.execute.before',
  resolved,
  sessionId: input.sessionID || 'unknown',
});
```

**tool.execute.after task (around line 263):**

```typescript
await runScriptAndHandle({
  $,
  script,
  scriptArg: subagentType,
  toolName: input.tool,
  timestamp,
  eventType: 'tool.execute.after',
  resolved,
  sessionId: input.sessionID || 'unknown',
});
```

**tool.execute.after normal (around line 274):**

```typescript
await runScriptAndHandle({
  $,
  script,
  scriptArg: input.tool,
  toolName: input.tool,
  timestamp,
  eventType: 'tool.execute.after',
  resolved,
  sessionId: input.sessionID || 'unknown',
});
```

---

### Step 6: Remove Old runOnlyOnce Logic

The current event handler has runOnlyOnce logic at lines 151-154 and 183-185 that needs to be removed since it's now handled in `runScriptAndHandle`.

**Lines to remove/change:**

- Line 151-153: Check `getRunOnce(event.type)` - remove
- Line 183-185: `setRunOnce(event.type)` - remove

---

### Step 7: Build and Test

```bash
npm run build && npm run lint && npm test
```

---

## Files to Create/Modify

| File                            | Action                                          |
| ------------------------------- | ----------------------------------------------- |
| `helpers/default-handlers.ts`   | Export `getProp`                                |
| `helpers/session.ts`            | NEW - isPrimarySession helper                   |
| `helpers/run-script-types.ts`   | NEW - RunScriptConfig interface                 |
| `helpers/run-script-handler.ts` | NEW - runScriptAndHandle function               |
| `helpers/index.ts`              | Export new functions                            |
| `opencode-hooks.ts`             | Update call sites, remove old runOnlyOnce logic |

---

## Expected Results

- ✅ Config object instead of many parameters
- ✅ `runOnlyOnce` works per script, not just per event type
- ✅ `appendToSession` is conditional based on config
- ✅ `isPrimarySession` helper ready for future improvements
- ✅ Cleaner, more maintainable code
- ✅ All tests passing
