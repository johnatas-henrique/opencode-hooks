# Jest to Vitest Migration Plan

**Created:** 2026-04-17  
**Agent:** plan  
**Status:** Draft - Ready for Implementation

---

## Goal

Migrate from Jest to Vitest to improve test execution speed and fix Istanbul coverage issues.

---

## Current State

| Aspect             | Current                                                    |
| ------------------ | ---------------------------------------------------------- |
| Test Runner        | Jest 30.3.0                                                |
| TypeScript         | ts-jest                                                    |
| Coverage           | Istanbul                                                   |
| Test Files         | 40 files                                                   |
| Coverage Threshold | statements: 80%, branches: 60%, functions: 65%, lines: 80% |

---

## Migration Steps

| Step | Action                              | Risk   |
| ---- | ----------------------------------- | ------ |
| 1    | Install Vitest + V8 coverage        | Low    |
| 2    | Create `vitest.config.ts`           | Low    |
| 3    | Replace `jest` → `vi` in test files | Medium |
| 4    | Remove Jest deps from package.json  | Low    |
| 5    | Update scripts in package.json      | Low    |
| 6    | Run tests with Vitest               | -      |
| 7    | Fix any issues                      | -      |

---

## Detailed Execution

### Step 1: Install dependencies

```bash
npm install -D vitest @vitest/coverage-v8
```

### Step 2: Create vitest.config.ts

Replace `jest.config.js`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts', '.opencode/plugins/**/*.test.ts'],
    exclude: ['test/e2e/**', '**/node_modules/**'],
    clearMocks: true,
    fakeTimers: { enableGlobally: false },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: 'coverage',
      include: [
        '.opencode/plugins/**/*.ts',
        '!/**/*.test.ts',
        '!node_modules/**',
        '!.opencode/plugins/types/**',
        '!**/index.ts',
      ],
      thresholds: {
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
```

### Step 3: Replace jest → vi

Main changes in test files:

| Jest                       | Vitest                      |
| -------------------------- | --------------------------- |
| `jest.fn()`                | `vi.fn()`                   |
| `jest.spyOn`               | `vi.spyOn`                  |
| `jest.mock()`              | `vi.mock()`                 |
| `jest.clearAllMocks()`     | `vi.clearAllMocks()`        |
| `jest.resetAllMocks()`     | `vi.resetAllMocks()`        |
| `jest.mockResolvedValue()` | `vi.mockResolvedValue()`    |
| `jest.mockRejectedValue()` | `vi.mockRejectedValue()`    |
| `expect.any(String)`       | `expect.any(String)` (same) |

### Step 4: Remove Jest deps

```bash
npm uninstall jest @types/jest ts-jest
```

### Step 5: Update package.json scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:unit": "vitest run --exclude 'test/integration/**' --exclude 'test/e2e/**'",
  "test:integration": "vitest run 'test/integration/**'",
  "test:cov": "vitest run --coverage"
}
```

### Step 6: Validate

```bash
npm run test:unit
```

---

## Expected Results

- **Speed:** 3-10x faster test execution
- **Coverage:** V8 provider (no Istanbul issues)
- **ESM:** Native support (no --experimental-vm-modules needed)

---

## Rollback Plan

If issues occur:

```bash
# Revert to Jest
npm install -D jest @types/jest ts-jest
```

---

## Execution

| Step | Description                     | Status | Timestamp |
| ---- | ------------------------------- | ------ | --------- |
| 1    | Install dependencies            | ⏳     | -         |
| 2    | Create vitest.config.ts         | ⏳     | -         |
| 3    | Replace jest → vi in test files | ⏳     | -         |
| 4    | Remove Jest dependencies        | ⏳     | -         |
| 5    | Update package.json scripts     | ⏳     | -         |
| 6    | Run and validate tests          | ⏳     | -         |
