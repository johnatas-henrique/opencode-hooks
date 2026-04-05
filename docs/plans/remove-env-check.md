# Plan: Remove process.env.NODE_ENV check from opencode-hooks.ts

## Execution

| Step                                                 | Description | Status           | Timestamp |
| ---------------------------------------------------- | ----------- | ---------------- | --------- |
| 1. Revert changes from previous attempt              | ✅          | 2026-04-04 22:00 |
| 2. Create showStartupToast function in helpers       | ✅          | 2026-04-04 22:00 |
| 3. Call showStartupToast from plugin (no parameters) | ✅          | 2026-04-04 22:00 |
| 4. Mock showStartupToast in tests                    | ✅          | 2026-04-04 22:00 |
| 5. Run tests to verify                               | ✅          | 2026-04-04 22:00 |
| 6. Add unit tests for showStartupToast               | ✅          | 2026-04-04 22:05 |

## Details

### Step 6: Add unit tests for showStartupToast

**File:** `test/show-startup-toast.test.ts`

Created comprehensive tests for the extracted function:

- `should add initial loading toast`
- `should call waitForToastSilence when logFile exists`
- `should show active plugins toast after silence detected`
- `should save error to file when showActivePluginsToast throws`
- `should use custom getLogFile when provided`

After adding tests, removed the mock from other test files since function is tested independently.

### Step 5: Run tests

Command: `npm run test:unit`

Result: All tests pass (251/251)
