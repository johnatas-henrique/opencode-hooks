# Plan: Extract event logging logic to separate functions

## Execution

| Step                                        | Description | Status | Timestamp |
| ------------------------------------------- | ----------- | ------ | --------- |
| 1. Create logEvent function in helpers      | ⏳          | -      |
| 2. Update opencode-hooks.ts to use logEvent | ⏳          | -      |
| 3. Add unit tests for logEvent              | ⏳          | -      |
| 4. Run tests to verify                      | ⏳          | -      |

## Details

### Step 1: Create logEvent function

**File:** `.opencode/plugins/helpers/log-event.ts`

Create functions:

```typescript
export async function logEventConfig(
  timestamp: string,
  eventType: string,
  resolved: ResolvedEventConfig,
  toastQueue: ToastQueue
): Promise<void> {
  if (resolved.saveToFile && !eventType.startsWith('message.')) {
    await saveToFile({
      content: `[${timestamp}] - ${eventType} - ${JSON.stringify(resolved)}\n`,
      showToast: toastQueue.add,
    });
  }
}

export async function logScriptOutput(
  timestamp: string,
  output: string,
  toastQueue: ToastQueue
): Promise<void> {
  await saveToFile({
    content: `[${timestamp}] ${output}\n`,
    showToast: toastQueue.add,
  });
}
```

### Step 2: Update opencode-hooks.ts

Replace inline logic with function calls.

### Step 3: Add unit tests

**File:** `test/log-event.test.ts`

Tests for:

- `logEventConfig` saves config when saveToFile is true
- `logEventConfig` skips message.\* events
- `logScriptOutput` saves output

### Step 4: Run tests

Command: `npm run test:unit`

Expected: All tests pass
