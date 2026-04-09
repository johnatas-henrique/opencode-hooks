# Test Coverage & Quality Improvement Plan

**Date**: 2026-04-07
**Status**: Completed
**Archived**: 2026-04-08
**Branch**: refactor/cleanup-and-simplify

---

## Execution

| Step                                            | Status | Timestamp                              |
| ----------------------------------------------- | ------ | -------------------------------------- |
| 1. Test sanitizeData function in debug.ts       | ✅     | 2026-04-07 22:45                       |
| 2. Add tests for edge cases in events.ts        | ✅     | 2026-04-07 22:50                       |
| 3. Fix empty string variant bug in events.ts    | ✅     | 2026-04-07 22:55                       |
| 4. Simplify nullish coalescing in events.ts     | ⏸️     | Descartado - altera comportamento core |
| 5. Add tests for experimental hooks             | ✅     | 2026-04-08 12:45                       |
| 6. Add test isolation                           | ✅     | 2026-04-08 12:48                       |
| 7. Run full test suite and verify 100% coverage | ✅     | 2026-04-08 12:50                       |

---

## Completed (From Previous Session)

- ✅ 13 new tests for sanitizeData in debug.ts
- ✅ Fixed empty string variant bug (events.ts: `??` → `||`)
- ✅ 449 tests passing (was 436)

---

## NEW: Code Simplification - Nullish Coalescing

### Current Issues Identified

After analyzing 17 uses of `??` in the codebase, we found unnecessary fallbacks:

| File                    | Current Pattern             | Issue                                  |
| ----------------------- | --------------------------- | -------------------------------------- |
| events.ts:165           | `handler?.title ?? ''`      | Handler always exists for known events |
| events.ts:168           | `handler?.duration ?? 2000` | Handler always exists for known events |
| events.ts:89,102        | `toast.enabled ?? true`     | Should default to false, not true      |
| default-handlers.ts:281 | `diagnostics?.length ?? 0`  | Type safety issue                      |

### Analysis & Fixes

#### 1. events.ts:165,168 - Handler fallback to empty/string Default

**Current** (for unknown events in lines 161-178):

```typescript
toastTitle: handler?.title ?? '',
toastDuration: handler?.duration ?? 2000,
```

**Problem**: If event is not in user config, it's written to `session_unknown_events.log` but then returns an ENABLED config with handler defaults. This is inconsistent.

**Fix**: Unknown events should return `DISABLED_CONFIG`:

```typescript
// Instead of returning config with handler defaults:
// Remove these lines entirely
// If userEventConfig === undefined, it's unknown → return DISABLED_CONFIG
// Or add userEventConfig for unknown events in user-events.config.ts
```

#### 2. events.ts:89,102 - toast.enabled Default

**Current**:

```typescript
toast.enabled ?? true;
```

**Problem**: This forces toast ON by default (less secure). Should be `false` as default.

**Fix**: Change to `false`:

```typescript
toast.enabled ?? false;
```

#### 3. default-handlers.ts:281 - diagnostics Type Safety

**Current**:

```typescript
const diagnostics = getProp(event, 'properties.diagnostics') as
  | Array<unknown>
  | undefined;
diagnostics?.length ?? 0;
```

**Problem**: We cast to `Array<unknown> | undefined` but then use optional chaining.

**Fix**: Use proper typing or remove unnecessary Optional:

```typescript
const diagnostics = getProp(event, 'properties.diagnostics') as Array<unknown>;
diagnostics.length;
```

### Files to Modify

1. **events.ts**:
   - Remove fallback for unknown events (lines 161-178)
   - Change `toast.enabled ?? true` to `toast.enabled ?? false` (2 occurrences)
2. **default-handlers.ts**:
   - Fix diagnostics typing (line 276-281)

---

## Coverage Analysis (Current)

- **Statements**: 98.29%
- **Branches**: 91.26%
- **Functions**: 80.95%
- **Lines**: 99.30%

### Remaining Gaps

| File                      | Lines   | What                                |
| ------------------------- | ------- | ----------------------------------- |
| opencode-hooks.ts         | 300-451 | Experimental hooks not fully tested |
| events.ts                 | 57,102  | Edge cases from config object       |
| toast-queue.ts            | 118     | flush() timing                      |
| toast-silence-detector.ts | 19-49   | Error handling                      |

---

## Implementation Notes

### Step 4.1: Fix Unknown Events Behavior

In events.ts, change:

```typescript
// Current: returns enabled config for events not in config
if (userEventConfig === undefined) {
  // Save to unknown events log
  return {
    enabled: true,  // ← This should be false
    toast: getWithDefault(true, defaultCfg, 'toast', false),
    ...
  };
}

// New: return disabled config for unknown events
if (userEventConfig === undefined) {
  // Log unknown event
  saveToFile({...}, UNKNOWN_EVENT_LOG_FILE);
  return DISABLED_CONFIG;
}
```

### Step 4.2: Fix toast Default

Change in events.ts lines 89 and 102:

```typescript
// From:
return toast.enabled ?? true;
// To:
return toast.enabled ?? false;
```

### Step 4.3: Fix Diagnostics Type

In default-handlers.ts:

```typescript
// From:
const diagnostics = getProp(event, 'properties.diagnostics') as
  | Array<unknown>
  | undefined;
return `Diagnostics: ${diagnostics?.length ?? 0}\n`;

// To:
const diagnostics = getProp(event, 'properties.diagnostics') as Array<unknown>;
return `Diagnostics: ${diagnostics.length}\n`;
```

---

## Expected Outcome

After simplification:

- ~4 fewer nullish coalescing operators in events.ts
- Cleaner unknown event handling (disabled by default)
- Better type safety in handlers
- Same or better test coverage
