# Fix Critical Issues - Implementation Plan

**Created:** 2026-04-03

## Execution

| Step | Description                                                            | Status |
| ---- | ---------------------------------------------------------------------- | ------ |
| 1    | Research current implementation of all 4 files                         | ⏳     |
| 2    | Fix memory leak in opencode-hooks.ts (lines 118-123)                   | ⏳     |
| 3    | Fix race condition in toast-queue.ts (lines 43-68)                     | ⏳     |
| 4    | Fix script argument sanitization in run-script.ts (lines 13-22)        | ⏳     |
| 5    | Fix synchronous file reads in toast-silence-detector.ts (lines 30, 69) | ⏳     |
| 6    | Run tests to verify all fixes                                          | ⏳     |

---

## Issue 1: Memory Leak in opencode-hooks.ts

### Location

`.opencode/plugins/opencode-hooks.ts:118-123`

### Current Implementation

```typescript
setTimeout(() => {
  const newCount = countToastsInLog(logFile);
  if (newCount > ourToastCount) {
    wasOverwritten = true;
  }
}, 3000);
```

### Problem

The nested setTimeout is never cleaned up. If the parent Promise.race resolves early or if the component is disposed, the inner timer continues running and may access stale state.

### Solution

1. Store the nested timer in a variable
2. Clear it in the cleanup path
3. Add a flag check to prevent execution after cleanup

```typescript
let checkOverwriteTimer: ReturnType<typeof setTimeout>;
const checkOverwrite = () => {
  if (!logFile || resolved) return;
  checkOverwriteTimer = setTimeout(() => {
    if (!logFile || resolved) return;
    const newCount = countToastsInLog(logFile);
    if (newCount > ourToastCount) {
      wasOverwritten = true;
    }
  }, 3000);
};
```

---

## Issue 2: Race Condition in toast-queue.ts

### Location

`.opencode/plugins/helpers/toast-queue.ts:43-68`

### Current Implementation

```typescript
const processQueue = () => {
  if (processing || queue.length === 0) return;
  processing = true;
  // ...
};
```

### Problem

The `processing` flag check is not atomic. Multiple simultaneous calls to `processQueue()` (from multiple `add()` calls) can pass the check before `processing` is set to `true`, causing duplicate processing.

### Solution

Use a mutex/lock pattern with async/await:

```typescript
let processingLock: Promise<void> | null = null;

const processQueue = async () => {
  if (processingLock) {
    await processingLock;
    if (queue.length === 0) return;
  }

  processingLock = (async () => {
    while (queue.length > 0) {
      // ... processing logic
    }
    processingLock = null;
  })();

  await processingLock;
};
```

---

## Issue 3: Script Argument Sanitization in run-script.ts

### Location

`.opencode/plugins/helpers/run-script.ts:13-22`

### Current Implementation

```typescript
const result =
  args.length > 0
    ? await $`./${SCRIPTS_DIR}/${scriptPath} ${args.join(' ')}`.quiet()
    : await $`./${SCRIPTS_DIR}/${scriptPath}`.quiet();
```

### Problem

Arguments are passed directly to the shell without sanitization. Special characters like `;`, `|`, `&&`, `$(...)` could enable command injection.

### Solution

1. Sanitize each argument to escape shell metacharacters
2. Pass arguments as separate array elements instead of string interpolation

```typescript
const shellSpecialChars = /[;&|`$(){}[\]<>\\!#*?"'\n\r]/g;

const sanitizeArg = (arg: string): string => {
  return arg.replace(shellSpecialChars, '\\$&');
};

export const runScript = async (
  $: PluginInput['$'],
  scriptPath: string,
  ...args: string[]
): Promise<string> => {
  if (!validateScriptPath(scriptPath)) {
    throw new Error(`Invalid script path: ${scriptPath}`);
  }

  const sanitizedArgs = args.map(sanitizeArg);

  if (sanitizedArgs.length > 0) {
    const result =
      await $`./${SCRIPTS_DIR}/${scriptPath} ${sanitizedArgs}`.quiet();
    return result.text();
  }

  const result = await $`./${SCRIPTS_DIR}/${scriptPath}`.quiet();
  return result.text();
};
```

---

## Issue 4: Synchronous File Reads in toast-silence-detector.ts

### Location

`.opencode/plugins/helpers/toast-silence-detector.ts:30, 69`

### Current Implementation

```typescript
const content = readFileSync(logFile, 'utf-8');
```

### Problem

File is read synchronously on every poll (default 200ms). This blocks the Node.js event loop and can cause performance issues.

### Solution

Use async file operations with `fs.promises`:

```typescript
import { readFile } from 'fs/promises';

// In the check function:
const content = await readFile(logFile, 'utf-8');

// Also update countToastsInLog:
export async function countToastsInLog(logFile: string): Promise<number> {
  try {
    const content = await readFile(logFile, 'utf-8');
    const matches = content.match(TOAST_PATTERN);
    return matches ? matches.length : 0;
  } catch {
    return 0;
  }
}
```

Note: The caller in `opencode-hooks.ts:116` will need to use `await` when calling `countToastsInLog`.

---

## Testing Strategy

1. Run existing test suite to ensure no regressions
2. Add new tests for:
   - Timer cleanup verification
   - Race condition prevention
   - Argument sanitization edge cases
   - Async file operations
3. Verify backward compatibility

---

## Files to Modify

1. `.opencode/plugins/opencode-hooks.ts` - Fix memory leak
2. `.opencode/plugins/helpers/toast-queue.ts` - Fix race condition
3. `.opencode/plugins/helpers/run-script.ts` - Fix sanitization
4. `.opencode/plugins/helpers/toast-silence-detector.ts` - Fix sync reads

---

## Backward Compatibility

- All changes maintain existing API contracts
- Default behavior preserved
- Only internal implementation details changed
