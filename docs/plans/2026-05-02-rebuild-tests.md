# Test Rebuild Plan

Branch: `feat/add-claude-code-hooks-implementation`

## Overview

Rebuild all tests from scratch — unit tests first, integration later, coverage last.

**Rules:**

- `vi.mock` ONLY for: `fs`, `shell`, `http`, `settings` (explanation below)
- **No `__mocks__/` directory** — use `vi.hoisted()` inline per test file
- Shared mock defaults via `test/unit/helpers/mock-factories.ts` (plain factories, no `vi`)
- No `any` anywhere (code or tests)
- No `as Mock` from vitest — use `vi.mocked()` for type-safe mock access
- Types always from `.opencode/plugins/types/` — never inline
- BDD style: `describe('functionName')` / `it('does something')`
- One `.test.ts` per source file, mirror `.opencode/plugins/` structure
- No code duplication — extract helpers (created on demand during Phase 3)
- **≤500ms per test — HARD rule** (not guideline)
- Ignore coverage during this session
- No vitest globals (`import { describe, it, expect, vi } from 'vitest'`)

### Why `settings` is mocked

`config/settings.ts` is user-editable configuration. Tests must never depend on its real content — if a user changes their config, tests break. Always mock `settings` when importing it directly or transitively. Most tests avoid this via DI (receiving `UserEventsConfig` as parameter). Only `opencode-hooks.test.ts` imports it at module level.

## Phases

### Phase 0 — Cleanup

Delete:

- `test/unit/` (all subdirs and files)
- `test/integration/` (all subdirs and files)
- `test/e2e/` (both .sh files)
- `test/smoke-test.ts`

Also delete `test/helpers/` entirely — REBUILD ALL HELPERS FROM SCRATCH.
No file reuse. Every helper will be created fresh on demand during Phase 3.

Also DELETE these specific files:
| File | Reason |
|------|--------|
| `test/__mocks__/fs.ts` | Specific to old saveToFile |
| `test/__mocks__/fs-promises.js` | JS file, old pattern |
| `test/__mocks__/plugin.ts` | Obsolete typing |
| `test/__mocks__/user-config.ts` | Duplicated by create-config |
| `test/__mocks__/@opencode-ai/plugin.ts` | Contaminated with Mock type |
| `test/__mocks__/.opencode/plugins/config/settings.ts` | Replaced by new mock |
| `test/__mocks__/.opencode/plugins/helpers/events.ts` | Mocks real implementation |
| `test/helpers/create-test-config.ts` | Duplicate of create-config |
| `test/helpers/create-resolver.ts` | Creates real resolver instances |
| `test/helpers/mock-plugin-input.ts` | Duplicate, uses Mock type |
| `test/helpers/mock-shared.ts` | Duplicate, uses Mock type |
| `test/helpers/mock-test-helpers.ts` | vi.mock() everywhere |
| `test/helpers/test-cleanup.ts` | Integration-only utility |
| `test/fixtures/index.ts` | Empty |

### Phase 1 — Infrastructure

Create directory structure:

```
test/unit/
├── core/
│   ├── constants.test.ts
│   ├── debug.test.ts
│   └── toast-queue.test.ts
├── config/
│   ├── settings.test.ts
│   ├── claude-settings.test.ts
│   └── security-rules.test.ts
├── features/
│   ├── audit/
│   │   ├── audit-logger.test.ts
│   │   ├── debug-recorder.test.ts
│   │   ├── error-recorder.test.ts
│   │   ├── event-recorder.test.ts
│   │   ├── plugin-integration.test.ts
│   │   ├── script-recorder.test.ts
│   │   └── security-recorder.test.ts
│   ├── block-system/
│   │   └── block-handler.test.ts
│   ├── core/
│   │   └── toast-director.test.ts
│   ├── events/
│   │   ├── context.test.ts
│   │   ├── events.test.ts
│   │   ├── resolution/
│   │   │   ├── boolean-field.test.ts
│   │   │   ├── scripts.test.ts
│   │   │   └── toast.test.ts
│   │   └── resolvers/
│   │       ├── build-message.test.ts
│   │       ├── event-config-builder.test.ts
│   │       ├── event-config.resolver.test.ts
│   │       ├── normalize-input.test.ts
│   │       └── tool-config.resolver.test.ts
│   ├── handlers/
│   │   ├── message-handlers.test.ts
│   │   ├── misc-handlers.test.ts
│   │   ├── session-handlers.test.ts
│   │   ├── tool-after-handlers.test.ts
│   │   ├── tool-before-handlers.test.ts
│   │   └── tool-handlers.test.ts
│   ├── message-formatter/
│   │   ├── build-keys-message.test.ts
│   │   ├── format-time.test.ts
│   │   ├── format-value.test.ts
│   │   ├── get-value-by-path.test.ts
│   │   ├── mask-sensitive.test.ts
│   │   └── truncate.test.ts
│   ├── messages/
│   │   ├── append-to-session.test.ts
│   │   ├── plugin-status.test.ts
│   │   ├── show-active-plugins.test.ts
│   │   ├── show-startup-toast.test.ts
│   │   └── toast-silence-detector.test.ts
│   └── scripts/
│       ├── adapters.test.ts
│       ├── executor.test.ts
│       ├── run-script.test.ts
│       ├── run-script-handler.test.ts
│       ├── script-executor.test.ts
│       └── script-runner.test.ts
├── opencode-hooks.test.ts
└── helpers/
    ├── create-config.ts
    ├── create-handler.ts
    ├── create-context.ts
    ├── audit-test-config.ts
    ├── test-defaults.ts
    └── mock-factories.ts
```

### Phase 2 — Write Unit Tests

Execution order (bottom-up, dependencies first):

| Order | File                                        | Mock needed   | Approach                                             |
| ----- | ------------------------------------------- | ------------- | ---------------------------------------------------- |
| 1     | `core/constants.ts`                         | none          | Pure data, test structure                            |
| 2     | `message-formatter/format-time.ts`          | none          | Pure function                                        |
| 3     | `message-formatter/format-value.ts`         | none          | Pure function                                        |
| 4     | `message-formatter/get-value-by-path.ts`    | none          | Pure function                                        |
| 5     | `message-formatter/mask-sensitive.ts`       | none          | Pure function                                        |
| 6     | `message-formatter/truncate.ts`             | none          | Pure function                                        |
| 7     | `message-formatter/build-keys-message.ts`   | none          | Pure function                                        |
| 8     | `events/resolution/boolean-field.ts`        | none          | Pure function                                        |
| 9     | `events/resolution/scripts.ts`              | none          | Pure function (ScriptEntry type)                     |
| 10    | `events/resolution/toast.ts`                | none          | Pure function                                        |
| 11    | `events/resolvers/normalize-input.ts`       | none          | Pure function                                        |
| 12    | `events/resolvers/build-message.ts`         | none          | Pure function                                        |
| 13    | `events/resolvers/event-config-builder.ts`  | none          | Class with DI                                        |
| 14    | `config/security-rules.ts`                  | none          | Pure predicate functions                             |
| 15    | `block-system/block-handler.ts`             | none          | Blocking logic                                       |
| 16    | `events/resolvers/event-config.resolver.ts` | none          | Class with DI (context)                              |
| 17    | `events/resolvers/tool-config.resolver.ts`  | none          | Class with DI (context)                              |
| 18    | `events/context.ts`                         | none          | Factory with DI (UserEventsConfig)                   |
| 19    | `events/events.ts`                          | none          | Thin wrapper via context                             |
| 20    | `core/toast-director.ts`                    | none          | Class with DI (showFn)                               |
| 21    | `core/toast-queue.ts`                       | none          | Functions with DI (showFn param)                     |
| 22    | `core/debug.ts`                             | fs            | File system debug logging                            |
| 23    | `config/claude-settings.ts`                 | fs            | Read Claude settings files                           |
| 24    | `audit/audit-logger.ts`                     | fs            | Audit logging                                        |
| 25    | `audit/debug-recorder.ts`                   | fs            | Debug recording                                      |
| 26    | `audit/error-recorder.ts`                   | fs            | Error recording                                      |
| 27    | `audit/event-recorder.ts`                   | fs            | Event recording                                      |
| 28    | `audit/script-recorder.ts`                  | fs            | Script recording                                     |
| 29    | `audit/security-recorder.ts`                | fs            | Security recording                                   |
| 30    | `audit/plugin-integration.ts`               | fs            | Orchestrates audit                                   |
| 31    | `messages/append-to-session.ts`             | fs            | Session appending                                    |
| 32    | `scripts/adapters.ts`                       | shell         | Shell adapters                                       |
| 33    | `scripts/executor.ts`                       | shell         | Script execution                                     |
| 34    | `scripts/script-executor.ts`                | shell         | Script execution                                     |
| 35    | `scripts/script-runner.ts`                  | shell         | Script runner                                        |
| 36    | `scripts/run-script.ts`                     | shell         | Run shell scripts                                    |
| 37    | `scripts/run-script-handler.ts`             | shell         | Error handling around scripts                        |
| 38    | `handlers/session-handlers.ts`              | none          | BuildMessage logic with DI                           |
| 39    | `handlers/tool-handlers.ts`                 | none          | BuildMessage logic with DI                           |
| 40    | `handlers/message-handlers.ts`              | none          | BuildMessage logic with DI                           |
| 41    | `handlers/misc-handlers.ts`                 | none          | BuildMessage logic with DI                           |
| 42    | `handlers/tool-before-handlers.ts`          | none          | BuildMessage logic with DI                           |
| 43    | `handlers/tool-after-handlers.ts`           | none          | BuildMessage logic with DI                           |
| 44    | `messages/plugin-status.ts`                 | none          | Pure logic                                           |
| 45    | `messages/show-active-plugins.ts`           | none          | Pure logic                                           |
| 46    | `messages/show-startup-toast.ts`            | none          | DI + toast-queue                                     |
| 47    | `messages/toast-silence-detector.ts`        | none          | Pure detection logic                                 |
| 48    | `config/settings.ts`                        | settings      | User config (structural test, may need minimal mock) |
| 49    | `opencode-hooks.ts` (736 lines)             | settings + fs | Entry point, test exported functions                 |

Skipped:

- `features/handlers/index.ts` — barrel/aggregation (ignored per instruction)
- `.opencode/plugins/types/` (12 files) — types only, no logic
- `.opencode/plugins/features/events/context.ts` — covered by #18 context tests

### Phase 3 — Integration Tests (next session)

After all 48+ unit test files pass.

### Phase 4 — Coverage (next session)

After integration tests pass.

### Phase 5 — Finalize Docs

Update `docs/agent-instructions/testing-guide.md` with final rules:

- List `fs`, `shell`, `http`, `settings` as the ONLY allowed `vi.mock` targets
- No `__mocks__/` directory — use `vi.hoisted()` inline
- ≥500ms test rule is hard, not guideline
- Use `vi.mocked()` instead of `as Mock`
- Helpers created on demand during test writing
- Reflect any pattern adjustments discovered during Phase 2

Do this after Phase 2 completes and before handoff to execution agent.

## Typing

No additional libraries needed. Use:

- Types from `.opencode/plugins/types/`
- `vi.mocked()` for accessing mock methods (type-safe)
- `ReturnType<typeof vi.fn>` for mock return types when needed
- Strict typing, no `any` cast

## Test Patterns

```typescript
// Pattern: pure function test (no mocks)
import { getValueByPath } from '.opencode/plugins/features/message-formatter/get-value-by-path';

describe('getValueByPath', () => {
  it('retrieves nested value by dot path', () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getValueByPath(obj, 'a.b.c')).toBe(42);
  });
});

// Pattern: class with DI (no mocks)
describe('EventConfigResolverImpl', () => {
  it('resolves event config from context', () => {
    const context = createMockContext({
      /* config */
    });
    const resolver = new EventConfigResolverImpl(context);
    const result = resolver.resolve('session.created');
    expect(result.enabled).toBe(true);
  });
});

// Pattern: fs mock needed — inline vi.hoisted, no __mocks__/
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

// Pattern: accessing mocked functions with proper types
import { vi } from 'vitest';
import { readdirSync } from 'fs';

vi.mock('fs');
const mockReaddir = vi.mocked(readdirSync);

mockReaddir.mockReturnValue(['file1.log']);
```

## Helper Design Notes

- Helpers created on demand during Phase 2, not upfront
- Each helper is a plain function (no `vi` inside, except when absolutely necessary for test setup)
- `mock-factories.ts` exports plain objects/function factories for fs, shell, http, settings
- `create-context.ts` may use `vi.fn()` for callbacks (allowed — it's test helper, not `vi.mock`)
- Helpers live in `test/unit/helpers/` and mirror the plugin's dependency injection needs
