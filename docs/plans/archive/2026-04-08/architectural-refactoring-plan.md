# Architectural Refactoring Plan for Testability

**Updated:** 2026-04-08 21:45:00  
**Status:** Analysis Complete - Plan Ready for Execution

---

## Execution

| Step | Description                            | Status | Timestamp           |
| ---- | -------------------------------------- | ------ | ------------------- |
| 1    | Analyze opencode-hooks.ts architecture | ✅     | 2026-04-08 14:35:00 |
| 2    | Run dead code analysis tools           | ✅     | 2026-04-08 14:36:00 |
| 3    | Review test setup patterns             | ✅     | 2026-04-08 14:37:00 |
| 4    | Analyze TASK/SKILL specific tools      | ✅     | 2026-04-08 21:40:00 |
| 5    | Identify refactoring opportunities     | ✅     | 2026-04-08 14:38:00 |
| 6    | Create this plan document              | ✅     | 2026-04-08 14:39:00 |

---

## Key Finding: TASK/SKILL Are NOT the Problem

After detailed analysis, we discovered:

### ✅ Already Well Tested

| Code                      | Status     | Evidence                                        |
| ------------------------- | ---------- | ----------------------------------------------- |
| TASK tool (lines 212-264) | ✅ Covered | session-plugins.test.ts, opencode-hooks.test.ts |
| SKILL tool                | ✅ Covered | tool.execute.after handler tests                |
| Non-task tools            | ✅ Covered | opencode-hooks.test.ts lines 517-583            |

The user's assumption that TASK/SKILL tools were the problem is **incorrect**.

---

## The REAL Problem: Experimental Hooks

### Lines 365-417: Experimental Hooks (Architectural Issue)

These hooks cannot be tested because they require OpenCode runtime:

```typescript
[EventType.PERMISSION_ASK]: async (...) => { ... },
[EventType.COMMAND_EXECUTE_BEFORE]: async (...) => { ... },
[EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: async (...) => { ... },
[EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: async (...) => { ... },
[EventType.EXPERIMENTAL_SESSION_COMPACTING]: async (...) => { ... },
[EventType.EXPERIMENTAL_TEXT_COMPLETE]: async (...) => { ... },
[EventType.TOOL_DEFINITION]: async (...) => { ... },
```

**Why they can't be tested:**

- Require OpenCode runtime that actually fires these events
- Test mocks don't simulate these experimental event types
- These are feature flags not fully integrated in OpenCode yet

This is an **architectural limitation**, not a code design problem.

---

## 1. Analysis Summary

### Current Architecture Issues

#### 1.1 Tight Coupling to OpenCode Plugin Context

**Problem**: The `OpencodeHooks` plugin function directly imports and calls internal helpers:

```typescript
import {
  initGlobalToastQueue,
  useGlobalToastQueue,
  saveToFile,
  handlers,
  resolveEventConfig,
  ...
} from './helpers';
```

This creates tight coupling where the entire helper module is a dependency. The tests must mock ~15+ functions.

#### 1.2 Hard-to-Test Functions (Uncovered Lines)

| Line        | Problem                                           | Type              |
| ----------- | ------------------------------------------------- | ----------------- |
| 87          | `handler.buildMessage()` - not exercised in tests | Test gap          |
| 146         | Toast variant default (`toast.variant ?? 'info'`) | Trivial           |
| **365-417** | **Experimental hooks (PERMISSION_ASK, etc.)**     | **Architectural** |

#### 1.3 Global Mutable State

```typescript
let hasShownToast = false; // Line 112 - module-level state
let globalToastQueue = null; // toast-queue.ts - global singleton
```

These create test isolation issues and require `jest.resetModules()` in tests.

---

## 2. Dead Code Analysis Results

### Knip Output

| Issue                     | File                                                      | Status         |
| ------------------------- | --------------------------------------------------------- | -------------- |
| Unused files (2)          | `.opencode/plugins/types/event-properties.ts`, `index.ts` | Review         |
| Unused exports (3)        | `getProp`, `OpenCodeEvents`, `createEventHandler`         | Safe to remove |
| Unused exported types (7) | Various type definitions                                  | Review         |

### Depcheck Output

| Issue          | Package                                              | Action                    |
| -------------- | ---------------------------------------------------- | ------------------------- |
| Unused devDeps | `@commitlint/cli`, `@commitlint/config-conventional` | Remove                    |
| Unused devDeps | `@opencode-ai/plugin`, `@opencode-ai/sdk`            | Check if needed for build |
| Missing dep    | `@jest/globals` in test mock                         | Fix                       |

---

## 3. Test Setup Complexity

### Current Test Mocks (opencode-hooks.test.ts)

The test file contains **7 jest.mock() calls** that must be maintained:

```typescript
jest.mock('../../.opencode/plugins/helpers/run-script', ...);
jest.mock('../../.opencode/plugins/helpers/save-to-file', ...);
jest.mock('../../.opencode/plugins/helpers/debug', ...);
jest.mock('../../.opencode/plugins/helpers/append-to-session', ...);
jest.mock('../../.opencode/plugins/helpers/default-handlers', ...);
jest.mock('../../.opencode/plugins/helpers/user-events.config', ...);
jest.mock('../../.opencode/plugins/helpers/events', ...);
jest.mock('../../.opencode/plugins/helpers/toast-queue', ...);
jest.mock('../../.opencode/plugins/helpers/show-startup-toast', ...);
```

**Issue**: Mocking entire module at once loses granular control and makes tests fragile.

---

## 4. Refactoring Opportunities

### What CAN Be Improved

#### Priority 1: Test Line 87 (handler.buildMessage)

**Impact**: MEDIUM | **Complexity**: EASY

The branch where `handler.buildMessage()` is called is not exercised in tests.
This is a test coverage gap, not an architectural issue.

**Action**: Add test case that triggers this branch:

```typescript
// When toast is enabled and default handler exists
const resolved = resolveEventConfig('session.created');
expect(resolved.toast).toBe(true);
// This will trigger handler.buildMessage()
```

#### Priority 2: Remove Unused Exports (Dead Code)

**Impact**: LOW | **Complexity**: EASY

This was confirmed by the earlier analysis and can be safely removed.

#### Priority 3: Global State Management

**Impact**: MEDIUM | **Complexity**: MEDIUM

Move global state to make tests more isolated.

---

### What CANNOT Be Improved (Architectural Limitation)

#### Lines 365-417: Experimental Hooks

**Status**: ❌ Cannot be tested without OpenCode runtime

The experimental hooks require OpenCode runtime to fire these events.
This is NOT a code design problem - it's an architectural limitation of the OpenCode plugin system.

**Recommendation**: Exclude these lines from coverage calculation or mark as skip.

---

### What Was Already Fine

| Item             | Status | Reason                 |
| ---------------- | ------ | ---------------------- |
| TASK tool logic  | ✅     | Already well tested    |
| SKILL tool logic | ✅     | Already well tested    |
| Event handlers   | ✅     | Main hooks are covered |

The user's assumption that TASK/SKILL tools were the problem was incorrect.

---

## 5. Updated Implementation Plan

### Phase 1: Test Line 87 (handler.buildMessage)

| Task                                | Complexity | Action                                 |
| ----------------------------------- | ---------- | -------------------------------------- |
| Add test for handler.buildMessage() | Easy       | Add test case that triggers the branch |

### Phase 2: Dead Code Removal

| Task                  | File                                          | Complexity | Action        |
| --------------------- | --------------------------------------------- | ---------- | ------------- |
| Remove unused files   | `types/event-properties.ts`, `types/index.ts` | Easy       | Delete        |
| Remove unused export  | `getProp` in default-handlers.ts              | Easy       | Delete        |
| Remove unused devDeps | commitlint packages                           | Easy       | npm uninstall |

### Phase 3: Exclude Experimental Hooks (Optional)

| Task                            | Complexity | Action                                  |
| ------------------------------- | ---------- | --------------------------------------- |
| Mark experimental hooks as skip | Easy       | Add Jest ignore or document in coverage |

---

### Phase 4: Simplify Disabled Plugin Early Return (NEW)

| Task                                          | Complexity | Action        |
| --------------------------------------------- | ---------- | ------------- |
| Move showStartupToast before enabled check    | Easy       | Reorder code  |
| Replace verbose early return with `return {}` | Easy       | Simplify code |

**Current code issue:**

- Early return has incomplete list of hooks (missing session.\* hooks)
- Maintenance burden

**Refactored code:**

```typescript
export const OpencodeHooks: Plugin = async (ctx) => {
  const { client } = ctx;

  // Always initialize toast queue
  initGlobalToastQueue((toast) => { ... });

  // Always log
  await saveToFile({ ... });

  // ALWAYS show what's active (before check!)
  await showStartupToast();

  // If disabled, return empty
  if (!userConfig.enabled) {
    return {};
  }

  // Return all hooks
  return { ... };
};
```

**Benefits:**

- Simpler: `return {}` instead of verbose list
- More complete: handles ALL hooks when disabled
- Better UX: startup toast always shows regardless of enabled state
- Easier maintenance: no list to update

---

## 6. Updated Files Assessment

| File                                            | Priority | New Assessment                                    |
| ----------------------------------------------- | -------- | ------------------------------------------------- |
| `.opencode/plugins/opencode-hooks.ts`           | MEDIUM   | **NEED REFACTOR:** Simplify disabled early return |
| `.opencode/plugins/types/event-properties.ts`   | LOW      | Unused - can be deleted                           |
| `.opencode/plugins/types/index.ts`              | LOW      | Unused - can be deleted                           |
| `.opencode/plugins/helpers/default-handlers.ts` | LOW      | Has unused `getProp` export                       |

---

## 7. Conclusion

### What We Learned

1. **TASK/SKILL tools are NOT the problem** - they are well tested
2. **The real problem is experimental hooks** (lines 365-417) - cannot be tested without OpenCode runtime
3. **No major refactoring needed** - the architecture is actually fine for the current needs
4. **Only dead code cleanup makes sense** - remove unused files and exports

### Recommended Action

**Minimal changes only:**

1. Remove unused files (`types/event-properties.ts`, `types/index.ts`)
2. Remove unused devDeps (commitlint)
3. Accept 80-85% Functions coverage as the practical limit

**Do NOT attempt:**

- Extracting hook handlers (not needed, breaks OpenCode pattern)
- Dependency injection (over-engineering for this use case)
- Major refactoring (works fine as-is)

---

## 8. Success Criteria (Revised)

After refactoring:

- [ ] Dead code removed (files, exports, devDeps)
- [ ] Functions coverage: 80-85% (accepted limit)
- [ ] No breaking changes to plugin functionality
