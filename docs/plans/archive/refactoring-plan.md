# Refactoring Plan: OpenCode Hooks

**Date:** 2026-04-02 09:15:00
**Status:** Mostly Completed (see notes)

## Execution

| Step                            | Description                                   | Status |
| ------------------------------- | --------------------------------------------- | ------ |
| 1. Extract type guard factory   | Create factory function for event type guards | ⏳     |
| 2. Create event handler factory | Extract repeated event handling pattern       | ⏳     |
| 3. Consolidate constants        | Merge duplicate SCRIPTS_DIR definitions       | ⏳     |
| 4. Add input validation         | Validate script paths before execution        | ⏳     |
| 5. Implement batch file writes  | Optimize save-to-file to batch operations     | ⏳     |
| 6. Add queue backpressure       | Implement size limits for toast queue         | ⏳     |
| 7. Refactor main plugin         | Split large function into smaller modules     | ⏳     |

---

## Analysis Summary

### Code Duplication

1. **Type guards (8x)** - Nearly identical functions checking `event.type === 'session.X'`
2. **Event handling pattern** - Same 4-step logic repeated in each case: toast → script → save → append
3. **Duplicate constants** - `SCRIPTS_DIR` defined in two places

### Performance Issues

1. **Synchronous file I/O** - Each toast/event writes to file immediately with no batching
2. **Sequential toast blocking** - Queue uses blocking `setTimeout` in loops
3. **No backpressure** - Queue can grow unbounded
4. **No config caching strategy** - Cache has no expiration

### Maintainability Problems

1. **Large function** - Main plugin ~250 lines with 8 switch cases
2. **Magic strings** - Event types, toast titles, variants scattered as literals
3. **Deep nesting** - 4+ levels in switch/if blocks
4. **No input validation** - Script paths passed directly to shell
5. **Hardcoded paths** - LOG_DIR, LOG_FILE hardcoded
6. **Mixed responsibilities** - One file handles logging, toasts, scripts, sessions

### Architectural Concerns

1. **Global singletons** - `globalToastQueue`, `cachedConfig` cause testing issues
2. **Inconsistent error handling** - Some try-catch, some not
3. **Type safety** - Excessive `as` casts

---

## Detailed Refactoring Tasks

### 1. Extract Type Guard Factory (Priority: High, Effort: Low)

**Problem:** Lines 26-33 have 8 nearly identical type guard functions.

**Solution:**

```typescript
// Create factory function
const createTypeGuard =
  (eventType: string) =>
  (event: any): boolean =>
    event.type === eventType;

// Or use a simple function
const isEventType = (event: any, type: string): boolean => event.type === type;
```

**Files to modify:**

- `.opencode/plugins/opencode-hooks.ts`

---

### 2. Create Event Handler Factory (Priority: High, Effort: Medium)

**Problem:** Each event case repeats identical 4-step pattern.

**Solution:**

```typescript
const createEventHandler = (eventConfig: EventConfig) => {
  return async (event: any) => {
    // 1. Show toast if configured
    if (eventConfig.toast) {
      await createEventToast(event, eventConfig.toast);
    }

    // 2. Run script if configured
    let output = '';
    if (eventConfig.script) {
      output = await runScript(eventConfig.script, event);
    }

    // 3. Save to file if configured
    if (config.saveToFile && output) {
      await saveToFile(event.type, output);
    }

    // 4. Append to session if configured
    if (eventConfig.appendToSession && output) {
      await appendToSession(output);
    }
  };
};
```

**Files to modify:**

- `.opencode/plugins/opencode-hooks.ts`

---

### 3. Consolidate Constants (Priority: High, Effort: Low)

**Problem:** `SCRIPTS_DIR` defined in both `constants.ts` and `run-script.ts`.

**Solution:** Import from single source in `constants.ts`.

**Files to modify:**

- `.opencode/plugins/helpers/constants.ts`
- `.opencode/plugins/helpers/run-script.ts`

---

### 4. Add Input Validation (Priority: High, Effort: Low)

**Problem:** Script paths passed directly to shell without validation.

**Solution:**

```typescript
const validateScriptPath = (path: string): boolean => {
  // Check for path traversal attempts
  if (path.includes('..') || path.startsWith('/')) {
    return false;
  }
  // Verify file exists
  return existsSync(path);
};
```

**Files to modify:**

- `.opencode/plugins/helpers/run-script.ts`

---

### 5. Implement Batch File Writes (Priority: Medium, Effort: Medium)

**Problem:** Each event/toast writes to file synchronously with no batching.

**Solution:**

```typescript
// Create a write queue with batch flushing
class BatchWriter {
  private buffer: Map<string, string[]> = new Map();
  private flushInterval: number = 1000; // 1 second

  async write(filename: string, content: string) {
    const bucket = this.buffer.get(filename) || [];
    bucket.push(content);
    this.buffer.set(filename, bucket);
  }

  async flush() {
    for (const [filename, lines] of this.buffer) {
      await appendFile(filename, lines.join('\n') + '\n');
    }
    this.buffer.clear();
  }
}
```

**Files to modify:**

- `.opencode/plugins/helpers/save-to-file.ts`

---

### 6. Add Queue Backpressure (Priority: Medium, Effort: Low)

**Problem:** Toast queue grows unbounded with no limit.

**Solution:**

```typescript
const MAX_QUEUE_SIZE = 50;
const MAX_QUEUE_AGE_MS = 30000;

const addToQueue = async (toast: ToastMessage) => {
  if (globalToastQueue.length >= MAX_QUEUE_SIZE) {
    // Remove oldest or drop new
    const oldest = globalToastQueue.shift();
    console.warn(`Queue full, dropping: ${oldest?.message}`);
  }
  // Also implement age-based eviction
};
```

**Files to modify:**

- `.opencode/plugins/helpers/toast-queue.ts`

---

### 7. Refactor Main Plugin (Priority: Low, Effort: High)

**Problem:** Main plugin function is 250+ lines with mixed responsibilities.

**Solution:** Split into modules:

- `event-handlers/` - Individual handler modules per event type
- `config/` - Configuration loading and validation
- `toast/` - Toast creation and management
- `logging/` - File operations

**Files to create:**

- `.opencode/plugins/handlers/`
- `.opencode/plugins/config/`

**Files to modify:**

- `.opencode/plugins/opencode-hooks.ts`

---

## Additional Recommendations

### Code Quality Improvements

1. **Extract magic strings to constants**

```typescript
const EVENT_TYPES = {
  SESSION_CREATED: 'session.created',
  SESSION_COMPACTED: 'session.compacted',
  // ...
} as const;

const TOAST_VARIANTS = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
} as const;
```

2. **Add error boundaries**

```typescript
const withErrorHandling = async (fn: Function) => {
  try {
    return await fn();
  } catch (error) {
    console.error('Error in handler:', error);
    // Decide: continue or abort
  }
};
```

3. **Improve type safety**

- Replace `as` casts with proper type guards
- Add discriminated unions for event types

### Testing Strategy

1. Test each helper function in isolation
2. Mock file system operations
3. Add integration tests for event flows
4. Test queue behavior under load

---

## Implementation Order

1. **Immediate** (Day 1):
   - Extract type guard factory
   - Consolidate constants
   - Add input validation

2. **Short-term** (Day 2-3):
   - Create event handler factory
   - Extract magic strings to constants
   - Add basic error handling

3. **Medium-term** (Week 1):
   - Implement batch file writes
   - Add queue backpressure
   - Improve type safety

4. **Long-term** (Week 2+):
   - Full module refactoring
   - Add comprehensive tests
   - Performance optimization

---

## Success Metrics

- [ ] Reduce main plugin from ~250 to ~100 lines
- [ ] Eliminate all code duplication
- [ ] Add input validation for all external inputs
- [ ] Implement batched I/O operations
- [ ] Add queue limits and monitoring
- [ ] Achieve 90%+ test coverage
- [ ] Reduce cyclomatic complexity per function < 10

---

## Completion Notes

Many items from this plan have been addressed:

| Item                     | Status | Notes                                 |
| ------------------------ | ------ | ------------------------------------- |
| 1. Type guard factory    | ✅     | Implemented via modular events system |
| 2. Event handler factory | ✅     | handlers.ts with resolveEventConfig   |
| 3. Consolidate constants | ✅     | Constants in constants.ts             |
| 4. Input validation      | ✅     | Added to run-script.ts                |
| 5. Batch file writes     | ❌     | Not implemented                       |
| 6. Queue backpressure    | ✅     | maxSize=50 in toast-queue.ts          |
| 7. Refactor main plugin  | ✅     | Split into helpers/modules            |

**Remaining:** Batch file writes could be implemented in future if performance becomes an issue.
