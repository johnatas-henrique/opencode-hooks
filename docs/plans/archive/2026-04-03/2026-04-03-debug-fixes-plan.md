# Debug Fixes Plan

**Date**: 2026-04-03 00:26
**Status**: Completed
**Archived**: 2026-04-03

## Execution

| Step | Description                                                 | Status | Timestamp        |
| ---- | ----------------------------------------------------------- | ------ | ---------------- |
| 1    | Fix `resolveScripts` to handle boolean `true` event configs | ✅     | 2026-04-03 00:20 |
| 2    | Add try/catch to `save-to-file.ts`                          | ✅     | 2026-04-03 00:22 |
| 3    | Remove double error logging in `run-script.ts`              | ✅     | 2026-04-03 00:23 |
| 4    | Remove `console.warn` from `toast-queue.ts`                 | ✅     | 2026-04-03 00:24 |
| 5    | Add parameters to `shell.env` hook                          | ✅     | 2026-04-03 00:25 |
| 6    | Run all tests and verify (203/203 passing)                  | ✅     | 2026-04-03 00:26 |

---

## Issue #1 (CRITICAL): `resolveScripts` ignores boolean `true` event configs

### Problem

When an event is set to `true` in `user-events.config.ts`:

```typescript
events: {
  [EventType.SESSION_CREATED]: true,  // boolean, not object
}
```

The `resolveScripts` function receives `true` (boolean), but only handles objects:

```typescript
function resolveScripts(cfg: EventConfig, ...): string[] {
  if (typeof cfg === 'object' && cfg !== null) {
    // ... handles object config
  }
  return []; // <-- boolean true falls through here, returns empty array!
}
```

**Result:** Events set to `true` won't run any scripts, even if `runScripts: true` globally.

### Fix

Update `resolveScripts` to handle boolean `true`:

```typescript
function resolveScripts(
  cfg: EventConfig,
  handlerDefaultScript: string,
  globalRunScripts: boolean
): string[] {
  if (typeof cfg === 'object' && cfg !== null) {
    if (cfg.runScripts === false) {
      return [];
    }
    if (cfg.scripts !== undefined) {
      return cfg.scripts;
    }
    if (cfg.runScripts === true || globalRunScripts) {
      return [handlerDefaultScript];
    }
    return [];
  }
  if (cfg === true) {
    return globalRunScripts ? [handlerDefaultScript] : [];
  }
  return [];
}
```

### Files to modify

- `.opencode/plugins/helpers/events.ts`

### Tests to add/update

- `test/events.test.ts` - Add test for event set to `true` runs default script

---

## Issue #2 (HIGH): `save-to-file.ts` has no error handling

### Problem

```typescript
await appendFile(`${LOG_DIR}/${validFilename}`, contentTrimmed);
```

If `LOG_DIR` doesn't exist or there are permission issues, this throws and breaks the entire event pipeline.

### Fix

```typescript
export const saveToFile = async ({
  content,
  filename = LOG_FILE,
}: {
  content: string;
  filename?: string;
}): Promise<void> => {
  try {
    const validFilename = isValidFilename(filename) ? filename : LOG_FILE;
    const contentTrimmed = content.trim().replace(/^\s+/gm, '') + '\n';
    await appendFile(`${LOG_DIR}/${validFilename}`, contentTrimmed);
  } catch {
    // Silently fail - logging should not break the event pipeline
  }
};
```

### Files to modify

- `.opencode/plugins/helpers/save-to-file.ts`

### Tests to add/update

- `test/save-to-file.test.ts` - Add test for filesystem error handling

---

## Issue #3 (LOW): Double error logging in `run-script.ts`

### Problem

`run-script.ts` saves error to file AND throws:

```typescript
catch (error) {
  await saveToFile({ content: `[ERROR] Script ${scriptPath} failed: ...` });
  throw error;
}
```

Then `opencode-hooks.ts` catches and saves again:

```typescript
catch (err) {
  await saveToFile({ content: `[${timestamp}] - Script error: ${script} - ...` });
  toastQueue.add({ ... });
}
```

**Result:** Duplicate error entries in log file.

### Fix

Remove the saveToFile from `run-script.ts` - let the caller handle error logging:

```typescript
catch (error) {
  throw error; // Just rethrow, caller handles logging
}
```

### Files to modify

- `.opencode/plugins/helpers/run-script.ts`

---

## Issue #4 (MEDIUM): `console.warn` in toast-queue.ts

### Problem

```typescript
console.warn(`Toast queue full, dropping: ${dropped?.title || 'unknown'}`);
```

Console output can impact TUI experience.

### Fix

Replace `console.warn` with silent drop (or save to log file):

```typescript
// Option A: Silent drop (simplest)
queue.shift(); // Just drop, no warning

// Option B: Save to log (better for debugging)
import { saveToFile } from './save-to-file';
saveToFile({
  content: `[WARN] Toast queue full, dropping: ${dropped?.title || 'unknown'}\n`,
});
```

### Files to modify

- `.opencode/plugins/helpers/toast-queue.ts`

---

## Issue #5 (LOW): `shell.env` hook has no parameters

### Problem

```typescript
'shell.env': async () => {
```

OpenCode may pass input/output to this hook for environment variable injection.

### Fix

```typescript
'shell.env': async (input: unknown, output: unknown) => {
  // input/output available for future env injection features
  const timestamp = new Date().toISOString();
  // ... rest of implementation
}
```

### Files to modify

- `.opencode/plugins/opencode-hooks.ts`

---

## Impact Assessment

| Issue               | Severity     | Effort | Risk                             |
| ------------------- | ------------ | ------ | -------------------------------- |
| #1 resolveScripts   | **CRITICAL** | Low    | Low - adds missing functionality |
| #2 save-to-file     | **HIGH**     | Low    | Low - adds defensive coding      |
| #3 double logging   | Low          | Low    | None - removes redundancy        |
| #4 console.warn     | Medium       | Low    | None - removes console output    |
| #5 shell.env params | Low          | Low    | None - adds parameters           |

---

## Commits Planned

### Commit 1

**Files:** `events.ts`, `test/events.test.ts`
**Message:** `fix: resolveScripts to handle boolean true event configs`

### Commit 2

**Files:** `save-to-file.ts`, `test/save-to-file.test.ts`
**Message:** `fix: add error handling to save-to-file to prevent pipeline breaks`

### Commit 3

**Files:** `run-script.ts`, `toast-queue.ts`
**Message:** `refactor: remove duplicate error logging and console output`

### Commit 4

**Files:** `opencode-hooks.ts`
**Message:** `fix: add input/output parameters to shell.env hook`

---

## Result ✅

All issues from this plan were fixed. This plan was completed.
