# RFC: Test Suite Rearchitecture

**Status**: Draft - User decisions incorporated  
**Priority**: High  
**Date**: 2026-04-16  
**Author**: Johnatas Henrique

---

## Summary

Transform the test suite from mock-heavy, rigid tests to reliable, maintainable tests that give developers confidence. The plugin is visual (toasts, UI), making testing challenging — this RFC addresses both the technical debt and the developer experience.

---

## User Decisions

| Decision        | Choice             | Rationale                            |
| --------------- | ------------------ | ------------------------------------ |
| Phase order     | RFC-003 first      | DI enables pure function testing     |
| Visual testing  | Contract testing   | TUI can't use Playwright screenshots |
| Coverage target | Full spec coverage | All edge cases must be tested        |
| Mock tolerance  | External only      | fs, OpenCode API only                |

---

## Problem Statement

### Current Issues

| Issue                 | Evidence                                             | Impact                                  |
| --------------------- | ---------------------------------------------------- | --------------------------------------- |
| **Too many mocks**    | 162 `jest.mock`/`jest.doMock` calls                  | Tests are brittle, hard to understand   |
| **Mock inside tests** | `jest.doMock` repeated 40+ times in `events.test.ts` | Can't reuse, verbose, slow              |
| **Config coupling**   | Every test mocks `userConfig`                        | Hard to test resolution logic           |
| **Visual plugin**     | Agents can't see toasts                              | Debugging requires reading verbose logs |
| **Low confidence**    | "I don't know if it works"                           | Developers do manual testing            |

### Current Test Stats

```
Total test files: 27
Total tests: ~662
Mocks: 162 (jest.mock/doMock)

Most mocked files:
- userConfig (config)
- handlers (default-handlers)
- saveToFile (persistence)
- toastQueue (core)
```

### Example of Problem

```typescript
// events.test.ts - each test that needs different config does this:
it('should return enabled: true when event config is boolean true', () => {
  jest.resetModules();  // <-- Red flag
  jest.doMock('...config', () => ({
    userConfig: { enabled: true, events: { 'session.test': true }, ... }
  }));
  // ... 20+ lines setup
  const { resolveEventConfig } = require('...events');
  const config = resolveEventConfig('session.test');
  expect(config.enabled).toBe(true);
});
```

**Problems:**

1. `jest.resetModules()` is a red flag — module state is leaking
2. Same mock setup repeated 20+ times
3. Test is 15 lines but tests only 1 assertion
4. Can't test edge cases without more mocks

---

## Root Causes

### 1. Global State Without DI

```typescript
// events.ts - depends on global userConfig
import { userConfig } from './config';

export function resolveEventConfig(...) {
  if (!userConfig.enabled) { ... }  // Can't swap for tests
}
```

### 2. Side Effects Mixed with Logic

```typescript
// opencode-hooks.ts - has toast, saveToFile, script execution
async function executeHook(params) {
  if (resolved.toast) {
    useGlobalToastQueue().add({ ... });  // Side effect
  }
  const results = await Promise.all(
    resolved.scripts.map(runScriptAndHandle)  // Async side effect
  );
}
```

### 3. No Test-Friendly API

Handlers are objects with methods:

```typescript
handlers['session.created'] = {
  title: '====SESSION CREATED====',
  buildMessage: (event) => '...',
  // ...
};
```

Testing handlers requires mocking the entire `handlers` object.

---

## Proposed Architecture

### Strategy 1: Dependency Injection (RFC-003)

Make dependencies injectable:

```typescript
// Before (can't test)
export function resolveEventConfig(eventType) {
  if (!userConfig.enabled) { ... }  // Global
}

// After (testable)
export function resolveEventConfig(eventType, context) {
  if (!context.enabled) { ... }  // Injectable
}
```

### Strategy 2: Pure Function Extraction

Extract pure logic from side effects:

```typescript
// Before (mixed)
async function executeHook(params) {
  if (resolved.toast) {
    useGlobalToastQueue().add({ ... });  // Side effect
  }
}

// After (separated)
function shouldShowToast(resolved) {
  return resolved.toast;
}

async function executeHook(params) {
  if (shouldShowToast(resolved)) {
    showToast(resolved);  // Injected
  }
}
```

### Strategy 3: Test Fixtures (not mocks)

Instead of mocking, use real data fixtures:

```typescript
// fixtures/user-configs.ts
export const configs = {
  minimal: { enabled: true, default: {} },
  withDefaults: { enabled: true, default: { toast: true } },
  withEvents: { enabled: true, events: { 'session.created': true } },
};

// tests/events/resolution.test.ts
describe('resolveEventConfig', () => {
  it.each(configs.minimal)('works with minimal config');
});
```

### Strategy 4: Visual Testing for TUI

The plugin uses TUI (Terminal UI), not browser. Cannot use Playwright screenshots.

**Options for visual testing:**

**A) Contract Testing (Recommended for TUI)**
Test that toast was called with correct params:

```typescript
// tests/integration/toast-contract.test.ts
it('shows toast with correct params', async () => {
  await executeHook(mockSessionCreatedEvent);

  expect(toastQueue.add).toHaveBeenCalledWith({
    title: '====SESSION CREATED====',
    message: expect.stringContaining('Session Id:'),
    variant: 'success',
    duration: 2000,
  });
});
```

**B) Log Verification**
Verify logged output matches expected:

```typescript
it('logs correct event data', async () => {
  await executeHook(mockEvent);

  expect(saveToFile).toHaveBeenCalledWith(
    expect.objectContaining({
      content: expect.stringContaining('"type":"EVENT"'),
    })
  );
});
```

**C) Pure Function Output**
After RFC-003, test pure functions that generate output:

```typescript
it('generates correct toast params', () => {
  const params = resolveToastParams('session.created', mockEvent);
  expect(params).toMatchInlineSnapshot({
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: 2000,
  });
});
```

### Strategy 5: Behavior-Driven Integration Tests

Test user-facing behavior, not internals:

```typescript
// tests/integration/plugin-behavior.test.ts
describe('Plugin Behavior', () => {
  it('shows toast when event has toast: true', async () => {
    const { executeHook } = await createPlugin({
      events: { 'session.created': { toast: true } },
    });

    await executeHook(mockSessionCreatedEvent);

    expect(toastQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '====SESSION CREATED====',
      })
    );
  });
});
```

---

## Test Pyramid Target

### Current (inverted)

```
         ┌─────────────────────────────┐
         │   Integration (flaky)       │  ~10 tests
         │   mocked everywhere         │
         ├─────────────────────────────┤
         │   Unit Tests (mock-heavy)   │  ~650 tests
         │   162 mocks                │
         └─────────────────────────────┘
```

### Target

```
         ┌─────────────────────────────┐
         │   E2E / Behavior Tests      │  ~20 tests
         │   Real plugin, no mocks      │
         ├─────────────────────────────┤
         │   Integration Tests          │  ~100 tests
         │   DI containers, minimal    │
         ├─────────────────────────────┤
         │   Pure Unit Tests          │  ~500 tests
         │   Functions, no mocks       │
         └─────────────────────────────┘
```

---

## Migration Path

### Phase 1: Categorize Tests

1. Identify pure functions that can be tested without mocks
2. Identify tests that test integration, not units
3. Identify tests that are "write once, never touch again"

### Phase 2: Create Test Fixtures

```typescript
// tests/fixtures/
├── configs/
│   ├── minimal.ts
│   ├── with-toast.ts
│   ├── with-scripts.ts
│   └── tool-overrides.ts
├── events/
│   ├── session-created.ts
│   ├── tool-execute.ts
│   └── permission-ask.ts
└── handlers/
    └── mock-handlers.ts
```

### Phase 3: Extract Pure Functions (RFC-003)

Implement RFC-003 to enable pure function testing.

### Phase 4: Snapshot Tests for Visual Output

```typescript
// tests/snapshots/
├── toasts/
│   ├── session-created.snap
│   ├── tool-execute.snap
│   └── permission-ask.snap
└── messages/
    ├── default.snap
    └── custom.snap
```

### Phase 5: Behavior-Driven Integration

```typescript
// tests/integration/plugin-behavior.test.ts
describe('Toast Behavior', () => {
  describe('when event.toast is true', () => {
    it('shows toast with correct title');
    it('shows toast with correct variant');
    it('shows toast with correct duration');
  });
});
```

---

## Tools & Patterns

### 1. Factory Functions for Setup

```typescript
// tests/helpers/create-resolver.ts
export function createResolver(overrides = {}) {
  const config = { ...defaultConfig, ...overrides };
  const context = createContext(config);
  return createFactory(context);
}

// Usage
const resolver = createResolver({
  events: { 'session.created': true },
});
```

### 2. Data-Driven Tests

```typescript
describe.each([
  [{ toast: true }, true],
  [{ toast: false }, false],
  [undefined, false], // uses default
])('toast resolution', (input, expected) => {
  it(`returns ${expected} for ${JSON.stringify(input)}`, () => {
    // test
  });
});
```

### 3. Matchers for Common Assertions

```typescript
// tests/matchers/toast.ts
expect.extend({
  toBeValidToast(received) {
    if (!received.title || !received.message) {
      return { pass: false, message: () => 'Invalid toast' };
    }
    return { pass: true };
  },
});
```

### 4. Test Doubles Instead of Mocks

```typescript
// Instead of mocking saveToFile
const fakeFileSystem = {
  writes: [],
  write(content) {
    this.writes.push(content);
  },
};

// Pass as parameter or inject via context
```

---

## Files to Change

| File                                       | Action                   | Priority | Phase         |
| ------------------------------------------ | ------------------------ | -------- | ------------- |
| `tests/fixtures/`                          | Create fixtures          | High     | After RFC-003 |
| `tests/helpers/`                           | Create factories         | High     | After RFC-003 |
| `tests/unit/events.test.ts`                | Refactor to use fixtures | High     | After RFC-003 |
| `tests/integration/toast-contract.test.ts` | Add contract tests       | High     | After RFC-003 |
| `jest.config.js`                           | Update config if needed  | Low      | TBD           |

---

## Open Questions

1. ~~Visual diffing~~: **Resolved** - Using contract testing for TUI
2. **CI compatibility**: Will contract tests work in CI? (Yes, no visual diff needed)
3. **Test parallelization**: Can we run tests in parallel now?

---

## Expected Outcomes

| Metric         | Before   | After               |
| -------------- | -------- | ------------------- |
| Mock count     | 162      | <20 (external only) |
| Test isolation | Poor     | High                |
| Debugging time | Hours    | Minutes             |
| Confidence     | Low      | High                |
| Manual testing | Required | Rare                |
| Spec coverage  | Partial  | **Full**            |

---

## Implementation Status

### Completed (RFC-004)

#### Test Helper Factories (`test/helpers/`)

| File                | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `create-handler.ts` | Factory for creating `EventHandler` mocks with sensible defaults |
| `create-config.ts`  | Factory for creating `UserConfig` test fixtures                  |
| `index.ts`          | Barrel export                                                    |

**Usage Example:**

```typescript
import { createHandler, createHandlers } from '../helpers';

// Single handler with overrides
const handler = createHandler({
  title: '====CUSTOM====',
  variant: 'success',
  duration: 5000,
});

// Multiple handlers at once
const handlers = createHandlers({
  'session.created': { title: '====CREATED====' },
  'session.error': { title: '====ERROR====', variant: 'error' },
});
```

```typescript
import { createUserConfig, withEvent, withToolEvent } from '../helpers';

// Full config
const config = createUserConfig();

// With event override
const config = createUserConfig(
  withEvent('session.created', {
    toast: true,
    debug: true,
  })
);

// With tool-specific override
const config = createUserConfig(
  withToolEvent(EventType.TOOL_EXECUTE_AFTER, 'my-tool', { toast: false })
);
```

#### Toast Contract Tests (`test/integration/toast-contract.test.ts`)

8 passing tests covering:

- Handler resolution for known/unknown events
- Toast visibility conditions
- Default variant/duration from handler

---

## Next Steps

- [x] ~~Review this RFC~~
- [x] ~~Implement RFC-003 (DI enables pure function testing)~~
- [x] ~~Implement RFC-001 (Block System refactor)~~
- [x] ~~Implement RFC-002 (Message formatters)~~
- [x] ~~Create test fixtures (helpers)~~
- [x] ~~Add contract tests for toast behavior~~
- [ ] Refactor `events.test.ts` to use fixtures (low priority)
- [ ] Add full spec coverage tests
