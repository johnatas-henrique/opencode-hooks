# Test Reorganization Plan

## Goal

Reorganize all test/unit/\*.test.ts files into subdirectories mirroring .opencode/plugins/ structure.

## Coverage Baseline

| Metric    | Before |
| --------- | ------ |
| Lines     | 99.08% |
| Functions | 99%    |
| Stmts     | 98.92% |
| Branches  | 97.48% |

## Status

- ✅ **DONE** - Convert all imports to absolute paths (.opencode/plugins/...)
- ✅ **DONE** - Add vitest path aliases for absolute imports
- ✅ **DONE** - Reorganize folder structure
- ✅ **DONE** - Verify tests still pass after reorganization (1120 tests, 99.08% coverage)

## Target Structure

```
test/unit/
├── config/
│   ├── claude-settings.test.ts  (.opencode/plugins/config/)
│   ├── security-rules.test.ts
│   └── settings.test.ts
├── core/
│   ├── constants.test.ts
│   ├── debug.test.ts
│   └── toast-queue.test.ts
├── features/
│   ├── audit/
│   │   ├── audit-logger.test.ts
│   │   ├── audit-plugin-integration.test.ts
│   │   ├── debug-recorder.test.ts
│   │   ├── error-recorder.test.ts
│   │   ├── event-recorder.test.ts
│   │   ├── plugin-integration.test.ts
│   │   ├── script-recorder.test.ts
│   │   └── security-recorder.test.ts
│   ├── block-system/
│   │   ├── block-handler.test.ts
│   │   ├── block-handler-null-recorder.test.ts
│   │   └── block-system.test.ts
│   ├── events/
│   │   ├── context.test.ts
│   │   ├── events.test.ts
│   │   ├── get-tool-handler.test.ts
│   │   ├── resolution/
│   │   │   ├── boolean-field.test.ts
│   │   │   ├── scripts.test.ts
│   │   │   ├── toast-resolution.test.ts
│   │   │   └���─ tool-config.test.ts
│   │   └── resolvers/
│   │       ├── build-message.test.ts
│   │       ├── event-config-builder.test.ts
│   │       ├── event-config.test.ts
│   │       ├── normalize-input.test.ts
│   │       └── tool-config-resolver.test.ts
│   ├── handlers/
│   │   ├── chat-handlers.test.ts
│   │   ├── command-handlers.test.ts
│   │   ├── experimental-handlers.test.ts
│   │   ├── handlers.test.ts
│   │   ├── lsp-handlers.test.ts
│   │   ├── message-handlers.test.ts
│   │   ├── other-handlers.test.ts
│   │   ├── server-handlers.test.ts
│   │   ├── shell-handlers.test.ts
│   │   ├── todo-handlers.test.ts
│   │   ├── tool-specific-handlers.test.ts
│   │   └── tui-handlers.test.ts
│   ├── message-formatter/
│   │   ├── build-keys-message.test.ts
│   │   ├── format-time.test.ts
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
│       ├── file-template.test.ts
│       ├── run-script-handler.test.ts
│       ├── run-script.test.ts
│       ├── script-executor.test.ts
│       ├── script-recorder.test.ts
│       └── script-runner.test.ts
├── opencode-hooks/
│   ├── additional-hooks.test.ts
│   ├── event-handler.test.ts
│   ├── opencode-hooks-disabled.test.ts
│   ├── opencode-hooks-enabled-coverage.test.ts
│   ├── opencode-hooks-specialized-coverage.test.ts
│   ├── tool-hooks.test.ts
│   └── validate-scripts-directory.test.ts
└── integration/  (existing)
```

## Imports

All relative imports (../..) replaced with absolute imports from project root:

```typescript
import { formatTime } from '.opencode/plugins/features/message-formatter/format-time';
```

## Process

### Already Completed

- [x] Convert all test files to use absolute imports (.opencode/plugins/...)
- [x] Add vitest.config.ts path aliases for test resolution

### Completed Tasks

- [x] Create folder structure (config/, core/, features/...)
- [x] Move files with git mv to new locations
- [x] Fix relative imports in mocks that broke after move
- [x] Run tests - all 1120 passing
- [x] Coverage: 99.08% (Lines), 99% (Functions), 98.92% (Stmts), 97.48% (Branches)
