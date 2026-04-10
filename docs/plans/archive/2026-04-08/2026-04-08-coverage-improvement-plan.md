# Coverage Improvement Plan: Branch 94% + Functions 90%

**Date**: 2026-04-08 22:00
**Status**: Completed
**Archived**: 2026-04-08

---

## Execution

| Step                                            | Status | Timestamp |
| ----------------------------------------------- | ------ | --------- |
| 1. Add debug.ts array test                      | ⏳     | -         |
| 2. Add show-startup-toast.ts error test         | ⏳     | -         |
| 3. Add events.ts edge case tests                | ⏳     | -         |
| 4. Add toast-silence-detector.ts edge cases     | ⏳     | -         |
| 5. Add plugin-status.ts dev.log test            | ⏳     | -         |
| 6. Add run-script-handler.ts error sanitization | ⏳     | -         |
| 7. Add opencode-hooks.ts integration tests      | ⏳     | -         |
| 8. Run tests and verify coverage                | ⏳     | -         |

---

## Execution

| Step                                            | Status | Timestamp |
| ----------------------------------------------- | ------ | --------- |
| 1. Add debug.ts array test                      | ⏳     | -         |
| 2. Add show-startup-toast.ts error test         | ⏳     | -         |
| 3. Add events.ts edge case tests                | ⏳     | -         |
| 4. Add toast-silence-detector.ts edge cases     | ⏳     | -         |
| 5. Add plugin-status.ts dev.log test            | ⏳     | -         |
| 6. Add run-script-handler.ts error sanitization | ⏳     | -         |
| 7. Add opencode-hooks.ts integration tests      | ⏳     | -         |
| 8. Run tests and verify coverage                | ⏳     | -         |

---

## Current Coverage

| Metric    | Current | Target | Gap   |
| --------- | ------- | ------ | ----- |
| Branch    | 93.28%  | 94%+   | 0.72% |
| Functions | 89.39%  | 90%+   | 0.61% |
| Lines     | 99.02%  | -      | -     |

---

## Test Plan by Priority

### HIGH Priority (Biggest Impact)

#### 1. debug.ts - line 26 (Functions: 80% → 100%)

**File:** `test/unit/debug.test.ts`

Add test for array in object property:

```typescript
it('should handle array in object property', () => {
  const input = { records: [{ secret: 'a' }, { secret: 'b' }] };
  const result = sanitizeData(input) as {
    records: Array<Record<string, unknown>>;
  };
  expect(result.records[0].secret).toBe('[REDACTED]');
});
```

#### 2. show-startup-toast.ts - lines 45-50 (Functions: 86.95% → 100%)

**File:** `test/unit/show-startup-toast.test.ts`

Add test for error path in catch block:

```typescript
it('should handle error gracefully', async () => {
  const mockError = new Error('Plugin scan failed');
  mockShowActivePluginsToast.mockRejectedValue(mockError);
  await showStartupToast();
});
```

#### 3. events.ts - lines 57, 102

**File:** `test/unit/events.test.ts`

Add tests for resolveDefaultToast edge cases:

```typescript
it('should handle undefined toast config', () => {
  const result = resolveDefaultToast({});
  expect(result).toBe(false);
});

it('should handle boolean toast config', () => {
  const result = resolveDefaultToast({ toast: false });
  expect(result).toBe(false);
});

it('should handle object toast config', () => {
  const result = resolveDefaultToast({ toast: { enabled: false } });
  expect(result).toBe(false);
});
```

---

### MEDIUM Priority

#### 4. toast-silence-detector.ts - lines 19-28, 37-42, 48-49 (Branch: 78.57%)

**File:** `test/unit/toast-silence-detector.test.ts`

Add edge case tests:

```typescript
it('should handle immediate resolve', async () => {
  mockReadFile.mockResolvedValueOnce('content');
  const result = await checkRecentActivity('/test');
  expect(result).toBe(true);
});

it('should handle readFile error', async () => {
  mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
  const result = await checkRecentActivity('/test');
  expect(result).toBe(false);
});

it('should cleanup on early exit', async () => {
  jest.useFakeTimers();
  const cleanup = await initSilenceDetector('/test');
  cleanup();
  jest.runAllTimers();
});
```

#### 5. plugin-status.ts - line 43

**File:** `test/unit/plugin-status.test.ts`

```typescript
it('should sort dev.log to end', () => {
  const files = ['config.log', 'dev.log', 'app.log'];
  const sorted = files.sort(compareFileNames);
  expect(sorted).toEqual(['app.log', 'config.log', 'dev.log']);
});
```

---

### LOW Priority

#### 6. run-script-handler.ts - line 57

**File:** `test/unit/run-script-handler.test.ts`

```typescript
it('should sanitize error with control characters', async () => {
  const mockError = 'Error: something\n\x00\x1f failed';
  const result = await runScriptAndHandle({ ... });
  expect(result).not.toContain('\x00');
});
```

#### 7. opencode-hooks.ts - lines 87-124, 347-399

**File:** `test/unit/opencode-hooks.test.ts`

```typescript
it('should call handler.buildMessage when handler exists', async () => {
  const input = { sessionID: 'test', tool: 'read' };
  await plugin.event({ event: { type: 'session.created', properties: input } });
  expect(mockHandler.buildMessage).toHaveBeenCalled();
});
```

---

## Expected Coverage Gain

| File                      | Current          | After Test | Gain |
| ------------------------- | ---------------- | ---------- | ---- |
| debug.ts                  | 80% Functions    | 100%       | +20% |
| show-startup-toast.ts     | 86.95% Functions | 100%       | +13% |
| events.ts                 | 95.14% Branch    | ~98%       | +3%  |
| toast-silence-detector.ts | 78.57% Branch    | ~90%       | +12% |
| plugin-status.ts          | 98.79% Branch    | 100%       | +1%  |

---

## Verification Criteria

- [ ] All tests pass
- [ ] No worker process warnings
- [ ] Branch coverage ≥ 94%
- [ ] Functions coverage ≥ 90%
- [ ] Build passes
- [ ] Lint passes
