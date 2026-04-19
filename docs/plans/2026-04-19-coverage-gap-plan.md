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
| `create-config.ts`              | 69-79           | 100%     | 33.33%  | helper functions not tested                                |
| `create-handler.ts`             | 23-43           | 0%       | 0%      | helper functions not tested                                |

## Execution Plan

### Phase 1: Test Helpers (easiest wins)

| #   | File                                  | Tests to Add                                           | Target Lines |
| --- | ------------------------------------- | ------------------------------------------------------ | ------------ |
| 1   | `test/helpers/create-config.test.ts`  | 4 tests: `withEvent`, `withToolEvent` with variations  | 69-79        |
| 2   | `test/helpers/create-handler.test.ts` | 5 tests: `createHandler`, `createHandlers`, edge cases | 23-43        |

### Phase 2: Core Plugin Files

| #   | File                               | Tests to Add                                                            | Target Lines    |
| --- | ---------------------------------- | ----------------------------------------------------------------------- | --------------- |
| 3   | `test/unit/opencode-hooks.test.ts` | 2 tests: `logDisabledEvents=true` with disabled event                   | 80-88           |
| 4   | `test/unit/toast-queue.test.ts`    | 6 tests: re-entry lock, dropped toasts, addMultiple drop, timer cleanup | 53-59,71,97,110 |
| 5   | `test/unit/block-handler.test.ts`  | 1 test: `notify` with `details.message` undefined                       | 16              |
| 6   | `test/unit/events.test.ts`         | 2 tests: `getHandler` with existing and non-existing event              | 45              |

### Phase 3: Feature Files

| #   | File                                         | Tests to Add                  | Target Lines |
| --- | -------------------------------------------- | ----------------------------- | ------------ |
| 7   | `test/unit/save-to-file-resolution.test.ts`  | 1 test: error handling branch | 30           |
| 8   | `test/unit/toast-resolution.test.ts`         | 2 tests: branches 31,47       | 31,47        |
| 9   | `test/unit/save-to-file-persistence.test.ts` | 1 test: branch 37             | 37           |
| 10  | `test/unit/run-script.test.ts`               | 1 test: branch 48             | 48           |
| 11  | `test/unit/block-system.test.ts`             | 1 test: branch 55             | 55           |

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

- No `any` types
- No ESLint/TS rule disabling
- Proper type assertions only
- All tests must pass (469 → ~494+)
- Coverage must reach 99.9%+ on all 4 metrics
