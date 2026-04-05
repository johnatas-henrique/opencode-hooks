# Plan: Extract event logging logic to separate functions

## Execution

| Step                                        | Description | Status           | Timestamp |
| ------------------------------------------- | ----------- | ---------------- | --------- |
| 1. Create logEvent function in helpers      | ✅          | 2026-04-04 22:10 |
| 2. Update opencode-hooks.ts to use logEvent | ✅          | 2026-04-04 22:10 |
| 3. Add unit tests for logEvent              | ✅          | 2026-04-04 22:15 |
| 4. Run tests to verify                      | ✅          | 2026-04-04 22:15 |

## Details

### Step 1: Create logEvent function

**File:** `.opencode/plugins/helpers/log-event.ts`

Created functions:

- `logEventConfig` - saves event configuration to file
- `logScriptOutput` - saves script output to file

### Step 2: Update opencode-hooks.ts

Replaced inline logic with function calls.

### Step 3: Add unit tests

**File:** `test/log-event.test.ts`

Created tests:

- `logEventConfig` saves config when saveToFile is true
- `logEventConfig` skips message.\* events
- `logScriptOutput` saves output

### Step 4: Run tests

Command: `npm run test:unit`

Result: All tests pass (257/257)
