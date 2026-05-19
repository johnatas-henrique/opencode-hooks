# Testing Guide

## Overview

This project follows strict testing standards to ensure reliability, performance, and maintainability. All tests must be fast, deterministic, and properly categorized.

## Test Categories

### Unit Tests (`test/unit/`)

Pure unit tests that verify individual functions or components in isolation.

**Rules:**

- Must NOT depend on external services (databases, APIs, network)
- Must NOT use real `fs` operations (unless testing fs utilities directly)
- The ONLY allowed `vi.mock()` targets are: `fs`, `shell`, `http`, `.opencode/plugins/config/jsonc-loader`
- **No `__mocks__/` directory** — use `vi.hoisted()` inline per test file
- Shared mock defaults via `test/unit/helpers/mock-factories.ts` (plain factories, no `vi`)
- No `any` anywhere
- **Never** use `as Mock` from vitest — use `vi.mocked()` for type-safe mock access
- Types always from `.opencode/plugins/types/` — never inline
- One `.test.ts` per source file, mirror `.opencode/plugins/` structure
- No code duplication — extract helpers (created on demand)
- **≤500ms per test — HARD rule** (not guideline)
- No vitest globals (`import { describe, it, expect, vi } from 'vitest'`)

**Structure:**

```typescript
import { functionToTest } from '.opencode/plugins/path/to/module';
import { vi } from 'vitest';

describe('functionName', () => {
  it('does something specific', () => {
    const result = functionToTest(input);
    expect(result).toBe(expected);
  });
});
```

**Allowed Patterns:**

- Direct function calls with controlled inputs
- `vi.mock()` only for `fs`, `shell`, `http`, `.opencode/plugins/config/jsonc-loader` (with `vi.hoisted()`) — mock the loader when you want to control `loadUserConfig` return value
- Dependency Injection for providing test doubles
- `vi.mocked()` for accessing mock methods with proper types

**Forbidden Patterns:**

- `vi.mock()` for anything except the 4 allowed targets
- `as Mock` type assertion
- `any` type
- Re-exports; inline type definitions
- Real file system operations (unless the unit under test IS the fs utility)
- Tests that take >500ms
- Vitest globals (`describe`, `it`, `expect`, `vi`) without explicit import

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
import { componentToTest } from '.opencode/plugins/path/to/module';
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

1. **Unit tests**: Remove or refactor to avoid delays
2. **Integration tests**: Optimize operations, reduce file sizes, use faster assertions
3. **Never** use `vi.setTimeout()` to increase timeout — fix the test instead

**Checking test speed:**

```bash
npm run test -- --reporter=verbose
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

1. **No `any` type** — use proper types from `types/` directory
2. **Import types from `.opencode/plugins/types/`** — never define inline
3. **No re-exports** — import directly from source
4. **Use strict type checking** — ensure types match exactly
5. **No `as Mock`** — use `vi.mocked()` for typed mocks

**Correct:**

```typescript
import type { PluginStatus } from '.opencode/plugins/types/plugin';
import type { AuditConfig } from '.opencode/plugins/types/audit';

const mockFn = vi.fn() as jest.MockedFunction<typeof realFn>; // Use vi.mocked() instead
```

**Wrong:**

```typescript
// Don't define types inline
interface PluginStatus { ... }

// Don't use any
const data: any = getData();

// Don't re-export
export { PluginStatus } from './types/plugin';

// Don't use as Mock from vitest
(mockFn as Mock).mockReturnValue(42);
```

## Test File Organization

```
test/
├── unit/
│   ├── core/
│   │   ├── constants.test.ts
│   │   ├── debug.test.ts
│   │   └── toast-queue.test.ts
│   ├── config/
│   │   ├── settings.test.ts
│   │   ├── claude-settings.test.ts
│   │   └── security-rules.test.ts
│   ├── features/
│   │   ├── audit/
│   │   │   └── ... (7 test files)
│   │   ├── events/
│   │   │   ├── context.test.ts
│   │   │   ├── resolvers/
│   │   │   └── resolution/
│   │   ├── handlers/
│   │   │   └── ... (6 test files)
│   │   ├── message-formatter/
│   │   │   └── ... (6 test files)
│   │   ├── messages/
│   │   │   └── ... (5 test files)
│   │   └── scripts/
│   │       └── ... (6 test files)
│   ├── helpers/
│   │   ├── create-config.ts
│   │   ├── create-handler.ts
│   │   ├── create-context.ts
│   │   ├── audit-test-config.ts
│   │   ├── test-defaults.ts
│   │   └── mock-factories.ts
│   └── opencode-hooks.test.ts
└── integration/
    └── (future)
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
npm run test:unit            # Run unit tests only
npm run test:unit:cov        # Unit tests with coverage report
npm run test:integration     # Run integration tests only
npm run test:integration:cov # Integration tests with coverage report
npm run test                 # Run all tests
npm run test:cov             # Run all tests with coverage report
```

## Common Patterns

### Mocking fs with vi.hoisted (no **mocks**/)

```typescript
import { vi } from 'vitest';
import { loadClaudeSettings } from '.opencode/plugins/config/claude-settings';
import { defaultFs } from '../helpers/mock-factories';

const mockFs = vi.hoisted(() => defaultFs());
vi.mock('fs', () => mockFs);

describe('loadClaudeSettings', () => {
  it('loads settings from claude config', () => {
    mockFs.readFileSync.mockReturnValue('{"hooks": {}}');
    const result = loadClaudeSettings('/test/project');
    expect(result.hooks).toEqual({});
  });
});
```

### Using vi.mocked for type-safe mocks

```typescript
import { vi } from 'vitest';
import { someFunction } from '.opencode/plugins/core/module';
import { readdirSync } from 'fs';

vi.mock('fs');
const mockReaddir = vi.mocked(readdirSync);

mockReaddir.mockReturnValue(['file1.log']);
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
