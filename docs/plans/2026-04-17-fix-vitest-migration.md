# Jest → Vitest Migration Fixes

> **ARCHIVED:** 2026-04-17
> **Reason:** Migration complete - 38 test files, 847 tests passing, vitest.config.ts with 95% thresholds configured.

**Date:** 2026-04-17
**Goal:** Fix all remaining Jest→Vitest migration issues in opencode-hooks project

## Issues Fixed

### 1. Wrong Vitest APIs

#### 1.1 vi.requireActual() → vi.importActual()

- test/**mocks**/fs.ts:1
- test/unit/event-handler.test.ts:390
- test/unit/tool-hooks.test.ts:390
- test/unit/tool-execute-after.test.ts:494

#### 1.2 vi.requireMock() → vi.importMock()

- test/unit/show-active-plugins.test.ts:19

#### 1.3 jest.spyOn() → vi.spyOn()

- test/**mocks**/fs.ts:2

### 2. jest.fn() → vi.fn()

- test/unit/additional-hooks.test.ts:Line 199 (mockRunScript)
- test/unit/additional-hooks.test.ts:Inside vi.mock for run-script
- test/unit/event-handler.test.ts:Line 29 (mockRunScript)
- test/unit/event-handler.test.ts:Inside vi.mock blocks
- test/unit/tool-hooks.test.ts:Line 28 (mockRunScript)
- test/unit/tool-hooks.test.ts:Inside vi.mock blocks

### 3. vi.unmock() inside test bodies → Move to top level

- test/unit/event-handler.test.ts: Multiple locations (lines 462-467, 528-533, 595-600, 689-692, 751-754)
- In each `it` block, `vi.unmock()` calls need to be moved to `beforeEach` at top level, OR converted to proper `vi.doMock()` pattern

### 4. Mock completeness issues (fs/promises)

- test/unit/audit-logger.test.ts: Mock only provides 5 methods; need to ensure all needed exports are covered

### 5. Dynamic require() patterns

- Files using require() with vi.doMock() are actually correct for Vitest when using vi.resetModules()
- Need to verify no remaining jest.require\* calls

## Files to Modify

1. test/**mocks**/fs.ts
2. test/unit/event-handler.test.ts
3. test/unit/tool-hooks.test.ts
4. test/unit/tool-execute-after.test.ts
5. test/unit/show-active-plugins.test.ts
6. test/unit/additional-hooks.test.ts
7. test/unit/audit-logger.test.ts (check mock completeness)
8. test/unit/debug.test.ts (check for jest. refs)
9. test/unit/file-template.test.ts (check require usage)
10. test/unit/show-startup-toast.test.ts (check require usage)

## Strategy

1. Replace all incorrect API names
2. Convert jest.fn() to vi.fn()
3. Move vi.unmock() to top-level beforeEach or convert test structure to use vi.doMock() at top-level
4. Ensure mock factories don't capture outer scope variables (Vitest hoisting)
5. Complete fs/promises mock with all necessary exports
6. Run tests to verify
