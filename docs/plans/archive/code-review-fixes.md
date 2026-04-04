## Execution

| Step                                                | Status | Timestamp        |
| --------------------------------------------------- | ------ | ---------------- |
| 1. Extract magic numbers to constants.ts            | ✅     | 2026-04-03 23:15 |
| 2. Add cleanup function for checkOverwriteTimer     | ✅     | 2026-04-03 23:15 |
| 3. Add TTL to runOnceTracker to prevent memory leak | ✅     | 2026-04-03 23:20 |
| 4. Add logging for silent catch blocks              | ✅     | 2026-04-03 23:25 |
| 5. Verify build and tests pass                      | ✅     | 2026-04-03 23:26 |

## Overview

Fix issues identified in code review.

## Details

### 1. Extract magic numbers to constants.ts (Medium Priority)

Move hardcoded values to constants file:

- 5000 (toast duration)
- 3000 (timer duration)
- 1000 (setTimeout delay)
- 300 (toast stagger)
- 500 (staggerMs)

Add to .opencode/plugins/helpers/constants.ts

### 2. Add cleanup function for checkOverwriteTimer (High Priority)

Current issue in opencode-hooks.ts:

```typescript
let checkOverwriteTimer: ReturnType<typeof setTimeout> | null = null;
```

The timer is never cleared. Add a cleanup function that runs when plugin is disposed:

- Clear the timer in a cleanup/return function
- Ensure no timer leaks when plugin reloads

### 3. Add TTL to runOnceTracker (Medium Priority)

Current issue:

```typescript
const runOnceTracker = new Map<string, boolean>();
```

This Map grows indefinitely. Add a simple TTL mechanism:

- Store timestamp with value: Map<string, { value: boolean, timestamp: number }>
- Clean up entries older than 24 hours periodically

### 4. Add logging for silent catch blocks (Medium Priority)

Current code in opencode-hooks.ts:

```typescript
} catch {
  // Silent fail - startup toast should not break plugin
}
```

Add minimal logging instead of silent fail:

```typescript
} catch (err) {
  // Log but don't break plugin
  console.error('Startup toast error:', err);
}
```

Created: 2026-04-03 23:10
