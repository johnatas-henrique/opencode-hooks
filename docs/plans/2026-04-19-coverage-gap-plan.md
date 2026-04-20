# Coverage Gap Analysis — 99.9% Target Plan

## Current Coverage

| Metric     | Current | Target | Gap   |
| ---------- | ------- | ------ | ----- |
| Statements | 98.99%  | 99.9%+ | 0.91% |
| Branches   | 97.39%  | 99.9%+ | 2.51% |
| Functions  | 96.72%  | 99.9%+ | 3.18% |
| Lines      | 98.94%  | 99.9%+ | 0.96% |

## Uncovered Source Files

| File                            | Lines           | Branch % | Funcs % | Description                                                |
| ------------------------------- | --------------- | -------- | ------- | ---------------------------------------------------------- |
| `opencode-hooks.ts`             | 80-88           | 90.66%   | 100%    | `logDisabledEvents` → `saveToFile` with toast              |
| `toast-queue.ts`                | 53-59,71,97,110 | 88.63%   | 100%    | processing lock re-entry, dropped toasts, addMultiple drop |
| `block-handler.ts`              | 16              | 90.9%    | 100%    | branch not covered in check                                |
| `events.ts`                     | 45              | 100%     | 80%     | function not covered                                       |
| `save-to-file.ts` (resolution)  | 30              | 95.45%   | 100%    | branch error handling                                      |
| `toast.ts` (resolution)         | 31,47           | 91.66%   | 100%    | branches not covered                                       |
| `save-to-file.ts` (persistence) | 37              | 94.73%   | 100%    | branch not covered                                         |
| `run-script.ts`                 | 48              | 92.85%   | 100%    | branch not covered                                         |
| `block-system.ts`               | 55              | 91.66%   | 100%    | branch not covered                                         |

**NOTE:** `create-config.ts` and `create-handler.ts` are TEST HELPER code (in `test/helpers/`), not production code. They do NOT need tests.

## Execution Plan

### Status Progress

| Metric       | Before | After  | Target | Gap    |
| ------------ | ------ | ------ | ------ | ------ |
| % Statements | 98.99% | 99.63% | 99.9+  | +0.64% |
| % Branches   | 97.39% | 98.86% | 99.9+  | +2.81% |
| % Functions  | 96.72% | 100%   | 99.9+  | +2.81% |
| % Lines      | 98.94% | 99.72% | 99.9+  | +0.67% |

### Completed Gaps

| #   | File                                                     | Action                                      | Status |
| --- | -------------------------------------------------------- | ------------------------------------------- | ------ |
| 3   | `.opencode/plugins/opencode-hooks.ts`                    | Test logDisabledEvents with events disabled | ✅     |
| 5   | `.opencode/plugins/block-system/block-handler.ts`        | Test missing branch for check.check         | ✅     |
| 6   | `.opencode/plugins/features/events/events.ts`            | Cover missing function                      | ✅     |
| 9   | `.opencode/plugins/features/persistence/save-to-file.ts` | 1 test: branch 37                           | ✅     |
| 10  | `.opencode/plugins/features/scripts/run-script.ts`       | 1 test: branch 48                           | ✅     |
| 11  | `.opencode/plugins/plugins/types/block-system.ts`        | 1 test: branch 55                           | ✅     |

### Pending Gaps

| #   | File                                                           | Action                     | Target Lines |
| --- | -------------------------------------------------------------- | -------------------------- | ------------ |
| 7   | `.opencode/plugins/features/events/resolution/save-to-file.ts` | Test error handling branch | 30           |
| 8   | `.opencode/plugins/features/events/resolution/toast.ts`        | 2 tests: branches 31,47    | 31,47        |

### Complex Gaps (Deferred)

| #   | File                                    | Action                              | Reason                              |
| --- | --------------------------------------- | ----------------------------------- | ----------------------------------- |
| 4   | `.opencode/plugins/core/toast-queue.ts` | Test re-entry lock + dropped toasts | Requires extensive mock refactoring |

### Large Gaps (Deferred)

| #   | File                                  | Action                | Reason                |
| --- | ------------------------------------- | --------------------- | --------------------- |
| ❌  | `.opencode/plugins/opencode-hooks.ts` | Lines 218,205,386-561 | Large gap (176 lines) |

### Phase 4: Validation

| #   | Action                            | Success Criteria                                                     |
| --- | --------------------------------- | -------------------------------------------------------------------- |
| 12  | `npm run test:unit -- --coverage` | Statements ≥ 99.9%, Branch ≥ 99.9%, Functions ≥ 99.9%, Lines ≥ 99.9% |
| 13  | `npm run lint`                    | 0 errors                                                             |
| 14  | `npx tsc --noEmit`                | 0 errors                                                             |
| 15  | Commit                            | `test: add coverage for 11 source files (99.9%+ target)`             |

## Technical Details per Gap

### 1. `opencode-hooks.ts` (80-88)

- Test: When `logDisabledEvents=true` and event disabled
- Should call `saveToFile` with `JSON.stringify({ timestamp, type: 'EVENT_DISABLED', data: eventType })`
- Should use `useGlobalToastQueue().add` as `showToast`

### 2. `toast-queue.ts` (53-59, 71, 97, 110)

- Test 1: `processingLock` re-entry (line 53) — call `processQueue()` while already processing → `await processingLock`
- Test 2: `activeTimers` cleanup (line 71) — verify `activeTimers.shift()` called after processing
- Test 3: dropped toast in `add()` (line 97) — fill queue to maxSize, add 1 more → `logDroppedToast` called
- Test 4: dropped toast in `addMultiple()` (line 110) — fill queue, call `addMultiple([toast1, toast2])` → drop multiple

### 3. `block-handler.ts` (16)

- Test: `notify` with `details` undefined
- `defaultEffects.notify('title')` → message should be `''`

### 4. `events.ts` (45)

- Test 1: `getHandler('session.created')` → returns handler
- Test 2: `getHandler('unknown.event')` → returns undefined

## Rules

## Execution Table

| Step | Phase      | Action                                    | Files  | Expected Outcome                         | Status |
| ---- | ---------- | ----------------------------------------- | ------ | ---------------------------------------- | ------ |
| 1    | Helpers    | Create `create-config.test.ts`            | 1 file | 4 tests, lines 69-79 covered             | ⏳     |
| 2    | Helpers    | Create `create-handler.test.ts`           | 1 file | 5 tests, lines 23-43 covered             | ⏳     |
| 3    | Core       | Extend `opencode-hooks.test.ts`           | 1 file | 2 tests, lines 80-88 covered             | ⏳     |
| 4    | Core       | Extend `toast-queue.test.ts`              | 1 file | 6 tests, lines 53-59,71,97,110 covered   | ⏳     |
| 5    | Core       | Extend `block-handler.test.ts`            | 1 file | 1 test, line 16 covered                  | ⏳     |
| 6    | Core       | Extend `events.test.ts`                   | 1 file | 2 tests, line 45 covered                 | ⏳     |
| 7    | Feature    | Extend `save-to-file-resolution.test.ts`  | 1 file | 1 test, line 30 covered                  | ⏳     |
| 8    | Feature    | Extend `toast-resolution.test.ts`         | 1 file | 2 tests, lines 31,47 covered             | ⏳     |
| 9    | Feature    | Extend `save-to-file-persistence.test.ts` | 1 file | 1 test, line 37 covered                  | ⏳     |
| 10   | Feature    | Extend `run-script.test.ts`               | 1 file | 1 test, line 48 covered                  | ⏳     |
| 11   | Feature    | Extend `block-system.test.ts`             | 1 file | 1 test, line 55 covered                  | ⏳     |
| 12   | Validation | Run `npm run test:unit -- --coverage`     | -      | All 4 metrics ≥ 99.9%                    | ⏳     |
| 13   | Validation | Run `npm run lint`                        | -      | 0 errors                                 | ⏳     |
| 14   | Validation | Run `npx tsc --noEmit`                    | -      | 0 errors                                 | ⏳     |
| 15   | Validation | Commit                                    | -      | `test: add coverage for 11 source files` | ⏳     |

## Success Criteria

- [ ] `npm run test:unit -- --coverage` shows Statements ≥ 99.9%, Branch ≥ 99.9%, Functions ≥ 99.9%, Lines ≥ 99.9%
- [ ] `npm run lint` returns 0 errors
- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] All tests pass (469 → ~494+)
- [ ] Single commit with proper conventional commit message
- No `any` types
- No ESLint/TS rule disabling
- Proper type assertions only
- All tests must pass (469 → ~494+)
- Coverage must reach 99.9%+ on all 4 metrics
