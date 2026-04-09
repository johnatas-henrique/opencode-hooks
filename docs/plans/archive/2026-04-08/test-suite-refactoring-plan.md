# Test Suite Refactoring Plan

**Date:** 2026-04-08 09:15  
**Status:** Draft

## Problem

Current test suite has 436 passing tests but suffers from quality issues:

1. **Duplicate tests** - Same functionality tested multiple times
2. **Over-testing edge cases** - Too many variations of similar scenarios
3. **Massive mocks** - Test files reimplementing the code being tested
4. **Poor naming** - "Property-based" tests that aren't actually property-based

---

## Execution

| Step | Description                             | Status              |
| ---- | --------------------------------------- | ------------------- |
| 1    | Analyze current test coverage by module | ✅ 2026-04-08 09:15 |
| 2    | Create detailed refactoring plan        | ⏳ -                |
| 3    | Remove duplicate toast-queue tests      | ⏳ -                |
| 4    | Consolidate events.test.ts edge cases   | ⏳ -                |
| 5    | Simplify opencode-hooks.test.ts mocks   | ⏳ -                |
| 6    | Rename/cleanup property tests           | ⏳ -                |
| 7    | Run tests after refactoring             | ⏳ -                |

---

## Current Test Files

| File                         | Lines | Tests | Issue                             |
| ---------------------------- | ----- | ----- | --------------------------------- |
| `events.test.ts`             | 958   | ~60   | Too many edge case variations     |
| `opencode-hooks.test.ts`     | 1011  | ~30   | Massive mock reimplementing logic |
| `handlers.test.ts`           | 323   | ~40   | Testing implementation details    |
| `toast-queue.test.ts`        | 293   | ~20   | Duplicate of manual-toast-queue   |
| `manual-toast-queue.test.ts` | 45    | ~5    | Duplicate of toast-queue          |
| `events.property.test.ts`    | 165   | ~10   | Not actual property-based         |
| Others                       | -     | ~270  | Generally OK                      |

---

## Proposed Changes

### 1. Remove `manual-toast-queue.test.ts` (45 lines)

**Reason:** 100% duplicate of `toast-queue.test.ts`

Tests to remove:

- "should initialize and use global queue" - duplicate
- "should throw error when not initialized" - duplicate
- "should create queue with createToastQueue" - duplicate

### 2. Consolidate `events.test.ts` (958 → ~300 lines)

**Problem:** 30+ tests for `enabled` variations that are nearly identical.

Current pattern:

```typescript
it('should return enabled: true when event base is false but tool has enabled: true', ...)
it('should return enabled: false when event base is false and tool has enabled: false', ...)
it('should inherit enabled: false from event base when tool has no enabled property', ...)
it('should return enabled: true when event base is true and tool has enabled: true', ...)
```

**Proposed:** Combine into parameterized tests using `it.each`

```typescript
it.each([
  { eventEnabled: false, toolEnabled: true, expected: true },
  { eventEnabled: false, toolEnabled: false, expected: false },
  { eventEnabled: true, toolEnabled: true, expected: true },
])('should return enabled=$expected when event=$eventEnabled tool=$toolEnabled', ...)
```

### 3. Simplify `opencode-hooks.test.ts` (1011 → ~400 lines)

**Problem:** Mock at lines 195-306 literally re-implements `resolveEventConfig` and `resolveToolConfig` functions being tested.

**Proposed:**

- Use actual `events.ts` module with targeted mocks
- Test behavior, not implementation details
- Reduce test count from ~30 to ~15 focused integration tests

### 4. Rename `events.property.test.ts`

**Problem:** Called "property-based" but uses simple loops, not a property-based testing library.

**Option A:** Rename to `events.validation.test.ts`
**Option B:** Remove - adds little value over `events.test.ts`

### 5. Reduce `handlers.test.ts` (323 → ~150 lines)

**Problem:** 40 tests verifying "unknown" fallback for each handler - too coupled to implementation.

**Proposed:**

- Keep 2-3 representative tests
- Add parameterized test for all handlers have required fields (already exists at line 275)
- Remove detailed message format tests

---

## Target Result

| Metric                     | Current | Target   |
| -------------------------- | ------- | -------- |
| Test files                 | 21      | 18       |
| Total tests                | 436     | ~200-250 |
| Lines in largest test file | 1011    | ~400     |
| Duplicate coverage         | Yes     | No       |

---

## Risk Mitigation

1. **Run full test suite after each change**
2. **Keep failing test as reference before removing**
3. **Document what each test validates**
4. **Use git to easily revert if needed**

---

## Notes

- This refactoring focuses on reducing redundancy, not removing coverage
- Some edge cases may be consolidated but not removed
- Goal: faster test runs, easier maintenance, clearer intent
