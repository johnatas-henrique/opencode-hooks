# Testing Guide

## Overview

This project follows strict testing standards to ensure reliability, performance, and maintainability. All tests must be fast, deterministic, and properly categorized.

## Test Categories

### Unit Tests (`test/unit/`)

Pure unit tests that verify individual functions or components in isolation.

**Rules:**

- Must NOT depend on external services (databases, APIs, network)
- Must NOT use real `fs` operations (unless testing fs utilities directly)
- **Mock `fs` and `shell` only when necessary** - these are the ONLY allowed mocks
- No other mocks allowed - use Dependency Injection (DI) instead
- Test one thing per test case
- Must complete in **≤500ms** per test

**Structure:**

```typescript
import { functionToTest } from '../../.opencode/plugins/path/to/module';

describe('module-name', () => {
  it('should do something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

**Allowed Patterns:**

- Direct function calls with controlled inputs
- Mocking `fs` module for file system tests
- Mocking `shell` module for shell command tests
- Dependency Injection for providing test doubles

**Forbidden Patterns:**

- Using `vi.mock()` for anything except `fs` or `shell`
- Testing multiple behaviors in one test
- Using real file system operations (unless the unit under test IS the file system utility)
- Tests that take >500ms

### Integration Tests (`test/integration/`)

Tests that verify interactions between components or with external systems.

**Rules:**

- Can use real `fs` operations
- Can use real shell commands
- Must clean up all created files/directories
- Must complete in **≤500ms** per test (use real operations efficiently)
- Test interaction between components, not isolated behavior

**Structure:**

```typescript
import { componentToTest } from '../../.opencode/plugins/path/to/module';
import fs from 'fs';
import path from 'path';

describe('component integration', () => {
  const testDir = path.join(process.cwd(), 'test-tmp');

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  it('should interact correctly with filesystem', () => {
    // real fs operations here
  });
});
```

## Performance Requirements

### Strict 500ms Limit

**Every test must complete in 500ms or less.**

If a test takes longer:

1. **Unit tests**: Remove the test or refactor to not need delays
2. **Integration tests**: Optimize real operations, reduce file sizes, use faster assertions
3. **Never** use `vi.setTimeout()` to increase timeout - fix the test instead

**Checking test speed:**

```bash
# Run tests with verbose output to see timing
npm run test:unit -- --reporter=verbose
```

**Common causes of slow tests:**

- Waiting for timers/timeouts (`setTimeout`, `setInterval`)
- Polling loops with delays
- Large file operations
- Network calls (should not exist in unit/integration tests)

## Coverage Requirements

- **Unit tests**: Minimum 90% coverage (lines, branches, functions, statements)
- **Integration tests**: No coverage requirement, but must cover critical paths

Run coverage:

```bash
npm run test:unit:cov  # Unit tests with coverage
npm run test:cov      # All tests with coverage
```

## TypeScript Rules for Tests

1. **No `any` type** - use proper types from `types/` directory
2. **Import types from `types/` folder** - never define inline
3. **No re-exports** - import directly from source
4. **Use strict type checking** - ensure types match exactly

**Correct:**

```typescript
import type { PluginStatus } from '.opencode/plugins/types/plugin';
import type { AuditConfig } from '.opencode/plugins/types/audit';
```

**Wrong:**

```typescript
// Don't define types inline
interface PluginStatus { ... }

// Don't use any
const data: any = getData();

// Don't re-export
export { PluginStatus } from './types/plugin';
```

## Test File Organization

```
test/
├── unit/
│   ├── core/
│   │   └── toast-queue.test.ts
│   ├── features/
│   │   ├── audit/
│   │   │   └── plugin-integration.test.ts
│   │   └── messages/
│   │       └── plugin-status.test.ts
│   └── helpers/
│       └── test-helper.test.ts
└── integration/
    ├── plugins/
    │   └── show-active-plugins.test.ts
    └── scripts/
        └── run-script.test.ts
```

## Best Practices

### Naming

- Test files: `{module-name}.test.ts`
- Test descriptions: present tense, specific ("creates queue", not "should create queue")
- Use quotes in descriptions: `it('returns null when log dir does not exist')`

### Assertions

- One assertion per test (when possible)
- Be specific: `toBe(42)` > `toBeTruthy()`
- Test edge cases: empty arrays, null inputs, boundary values

### Cleanup

- Always clean temporary files in `afterAll`
- Reset mocks in `beforeEach`
- Don't leak state between tests

### Error Testing

```typescript
// Correct
expect(() => function()).toThrow('specific error message');

// Wrong
expect(() => function()).toThrow();  // Too vague
```

## Running Tests

```bash
npm run test:unit        # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test              # Run all tests
npm run test:unit:cov    # Unit tests with coverage report
```

## Common Patterns

### Testing with fs mocks (unit tests only)

```typescript
vi.mock('fs', () => ({
  readdirSync: vi.fn(() => ['file1.log']),
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => 'content'),
}));

// Get mocked functions with proper typing
const mockReaddirSync = readdirSync as unknown as ReturnType<typeof vi.fn>;
```

### Testing with real fs (integration tests)

```typescript
import fs from 'fs';
import path from 'path';

const testDir = path.join(process.cwd(), 'test-tmp');

beforeEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
});
```

### Dependency Injection pattern

```typescript
// Module exports function that accepts dependencies
export function createSomething(deps: { helper: Helper }) {
  return {
    doWork() {
      return deps.helper.doIt();
    },
  };
}

// Test with injected double
it('does work', () => {
  const mockHelper = { doIt: vi.fn().mockReturnValue(42) };
  const something = createSomething({ helper: mockHelper });
  expect(something.doWork()).toBe(42);
});
```
