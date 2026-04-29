# TypeScript Error Fix Plan — 351 Errors

## Overview

Tests pass (469/469) but `npx tsc --noEmit` shows 351 TypeScript compiler errors in VSCode.

## Root Cause Analysis

| Category                                          | Count | Root Cause                                        |
| ------------------------------------------------- | ----- | ------------------------------------------------- |
| `Cannot find namespace 'vi'`                      | 33    | `@types/vitest` not installed                     |
| `EventHandler` import path                        | 2     | Importing from wrong module                       |
| Module `features/events/interfaces` doesn't exist | 2     | Importing non-existent file                       |
| Mock `PluginInput` incompatible                   | 40+   | Missing `experimental_workspace` and other fields |
| Property access on `unknown`                      | 14    | Objects typed as `{}` instead of interfaces       |
| Mock methods on real functions                    | 15+   | Missing `vi.mock()` setup                         |
| Type assignability (Event, Model, Permission)     | ~200  | Partial objects where full types expected         |
| Module not found / export missing                 | 11    | Broken import paths after refactoring             |

## Execution Plan

### Phase 1: Structural Fixes (~90 errors)

1. **Install `@types/vitest`**

   ```bash
   npm install -D @types/vitest
   ```

2. **Fix `EventHandler` imports**
   - `test/helpers/create-handler.ts`: Import from `.opencode/plugins/types/events`
   - `test/helpers/create-resolver.ts`: Import from `.opencode/plugins/types/events`

3. **Fix missing module imports**
   - `test/helpers/create-resolver.ts`: Remove import from non-existent `features/events/interfaces`

4. **Update mock `PluginInput`**
   - `test/__mocks__/@opencode-ai/plugin.ts`: Add `experimental_workspace` field
   - Ensure mock matches real `@opencode-ai/plugin` type

### Phase 2: Test Type Fixes (~260 errors)

5. **Fix `additional-hooks.test.ts`** (68 errors - largest file)
   - Add type assertions for partial objects
   - Fix mock client setup
   - Add `import { vi } from 'vitest'` where needed

6. **Fix `event-handler.test.ts`** (18 errors)
   - Correct event type assignments
   - Fix property access on unknown types

7. **Fix `tool-hooks.test.ts`** (16 errors)
   - Update mock setup
   - Fix type assertions

8. **Fix `audit-logger.test.ts`** (14 errors)
   - Correct audit config types
   - Fix mock methods

9. **Fix remaining files** (~10 errors each)
   - `run-script-handler.test.ts` (13 errors)
   - `resolution.tool-config.test.ts` (10 errors)
   - `normalize-input.test.ts` (9 errors)
   - `event-recorder.test.ts` (9 errors)
   - Others with ≤7 errors

### Phase 3: Validation

10. Run `npx tsc --noEmit` — expect 0 errors
11. Run `npm run test:unit` — expect 469/469 passing
12. Verify coverage baseline maintained: 99.08% | 97.38% | 97.18% | 99.03%
13. Commit: `fix: resolve 351 TypeScript compiler errors`

## Technical Decisions

- **Type assertions vs Complete mocks:** Use `as unknown as Type` for intentionally partial test objects. Create complete mocks only for critical functionality.
- **Phased approach:** Structural fixes first (imports, types, base mocks), then individual test files.
- **Agent delegation:** Use `typescript-reviewer` for each test phase to ensure type safety without breaking runtime.

## Risk Assessment

| Risk                                  | Probability | Mitigation                |
| ------------------------------------- | ----------- | ------------------------- |
| Tests fail after type fixes           | Low         | Validate after each phase |
| Incomplete mocks cause runtime errors | Medium      | Strategic type assertions |
| Coverage regression                   | Low         | Maintain baseline metrics |

## File Impact Summary

| File                                       | Errors | Action                      |
| ------------------------------------------ | ------ | --------------------------- |
| `test/unit/additional-hooks.test.ts`       | 68     | Type assertions, mock fixes |
| `test/unit/event-handler.test.ts`          | 18     | Event type corrections      |
| `test/unit/tool-hooks.test.ts`             | 16     | Mock setup updates          |
| `test/unit/audit-logger.test.ts`           | 14     | Config type fixes           |
| `test/unit/run-script-handler.test.ts`     | 13     | Type corrections            |
| `test/unit/resolution.tool-config.test.ts` | 10     | Import fixes                |
| `test/unit/normalize-input.test.ts`        | 9      | Type assertions             |
| `test/unit/event-recorder.test.ts`         | 9      | Mock updates                |
| Other test files                           | ~194   | Various fixes               |
| Helper files                               | 4      | Import path corrections     |
| Mock files                                 | 40+    | Type compatibility updates  |

## Execution Table

| Step | Phase      | Action                         | Files                                   | Expected Outcome        | Status |
| ---- | ---------- | ------------------------------ | --------------------------------------- | ----------------------- | ------ |
| 1    | Structural | Add `vitest` to tsconfig types | `tsconfig.json`                         | 33 `vi` errors resolved | ✅     |
| 2    | Structural | Fix `EventHandler` import      | `test/helpers/create-handler.ts`        | 2 errors resolved       | ✅     |
| 3    | Structural | Fix missing module import      | `test/helpers/create-resolver.ts`       | 2 errors resolved       | ✅     |
| 4    | Structural | Update mock `PluginInput`      | `test/__mocks__/@opencode-ai/plugin.ts` | ~40 errors resolved     | ✅     |
| 5-13 | Test Fixes | Fix all 23 test files          | `test/unit/*.test.ts`                   | ~260 errors resolved    | ✅     |
| 14   | Validation | Run `npx tsc --noEmit`         | -                                       | 0 errors                | ✅     |
| 15   | Validation | Run `npm run test:unit`        | -                                       | 469/469 passing         | ✅     |
| 16   | Validation | Run `npm run lint`             | -                                       | 0 errors                | ✅     |
| 17   | Validation | Commit fixes                   | -                                       | 3 commits created       | ✅     |

## Results

- **TypeScript errors:** 351 → 0
- **ESLint errors:** 150 → 0
- **Tests:** 469/469 passing
- **Files modified:** 28 test files + 4 mocks/helpers + 1 tsconfig + 1 eslint config

## Commits Created

| Hash      | Message                                                | Files |
| --------- | ------------------------------------------------------ | ----- |
| `a68eae9` | `fix(types): resolve 351 TypeScript compiler errors`   | 8     |
| `c43090a` | `fix(tests): add proper type assertions to test files` | 23    |
| `4053943` | `docs: add typescript error fix plan`                  | 1     |

## Success Criteria

- [x] `npx tsc --noEmit` returns 0 errors
- [x] `npm run test:unit` passes 469/469 tests
- [x] `npm run lint` returns 0 errors
- [x] VSCode shows no TypeScript errors
- [x] 3 commits with proper conventional commit messages
