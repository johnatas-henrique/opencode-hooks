# Config Independence Plan

**Date/Time:** 2026-04-08 22:25:00  
**Goal:** Ensure tests don't depend on user config, add missing tests

---

## Execution

| Step                                                      | Status | Timestamp  |
| --------------------------------------------------------- | ------ | ---------- |
| 1. Check showStartupToast config dependency               | ⏳     | -          |
| 2. Add handleDebugLog test with forced debug: true        | ⏳     | -          |
| 3. Verify tests don't depend on user-events.config (DONE) | ✅     | Already OK |

---

## Step 1: showStartupToast Analysis

### Current Behavior

In `opencode-hooks.ts`:

```typescript
// Line 136-139 - Always called regardless of userConfig.enabled
if (!hasShownToast) {
  hasShownToast = true;
  await showStartupToast();
}
```

This is called BEFORE the `if (!userConfig.enabled)` check.

### Question

Should showStartupToast execute when:

- `userConfig.enabled = false`?
- `userConfig.toast = false`?

### Options

| Option | Description                      |
| ------ | -------------------------------- |
| A      | Always show (current behavior)   |
| B      | Only show when toast is enabled  |
| C      | Only show when plugin is enabled |

---

## Step 2: handleDebugLog Test

### Current Coverage

- `debug.ts` Functions: 80%
- Line 26 uncovered: `data.map((item) => sanitizeData(item))` - array top-level

### Required Test

Add test that forces debug mode regardless of user config:

```typescript
it('should handle top-level array in debug log', () => {
  const input = [{ key: 'value1' }, { key: 'value2' }];
  const result = sanitizeData(input) as Array<Record<string, unknown>>;
  expect(result[0].key).toBe('value1');
});
```

---

## Step 3: Tests Dependency Verification (✅ DONE)

Test-engineer verified: **All tests properly mock user-events.config.ts**

All 8 test files using user-events.config.ts use proper mocks.

---

## Verification Criteria

- [ ] showStartupToast behavior documented/fixed
- [ ] handleDebugLog test added
- [ ] No tests depend on real user config (already verified)
