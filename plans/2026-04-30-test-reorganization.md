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

## Target Structure

```
test/unit/
├── config/
│   ├── claude-settings.XXX.test.ts  (.opencode/plugins/config/)
│   ├── security-rules.XXX.test.ts
│   └── settings.XXX.test.ts
├── core/
│   ├── constants.XXX.test.ts
│   ├── debug.XXX.test.ts
│   └── toast-queue.XXX.test.ts
├── features/
│   ├── audit/
│   │   ├── audit-logger.XXX.test.ts
│   │   ├── audit-plugin-integration.XXX.test.ts
│   │   ├── debug-recorder.XXX.test.ts
│   │   ├── error-recorder.XXX.test.ts
│   │   ├── event-recorder.XXX.test.ts
│   │   ├── plugin-integration.XXX.test.ts
│   │   ├── script-recorder.XXX.test.ts
│   │   └── security-recorder.XXX.test.ts
│   ├── block-system/
│   │   ├── block-handler.XXX.test.ts
│   │   ├── block-handler-null-recorder.XXX.test.ts
│   │   └── block-system.XXX.test.ts
│   ├── events/
│   │   ├── context.XXX.test.ts
│   │   ├── events.XXX.test.ts
│   │   ├── get-tool-handler.XXX.test.ts
│   │   ├── resolution/
│   │   │   ├── boolean-field.XXX.test.ts
│   │   │   ├── scripts.XXX.test.ts
│   │   │   ├── toast-resolution.XXX.test.ts
│   │   │   └���─ tool-config.XXX.test.ts
│   │   └── resolvers/
│   │       ├── build-message.XXX.test.ts
│   │       ├── event-config-builder.XXX.test.ts
│   │       ├── event-config.XXX.test.ts
│   │       ├── normalize-input.XXX.test.ts
│   │       └── tool-config-resolver.XXX.test.ts
│   ├── handlers/
│   │   ├── chat-handlers.XXX.test.ts
│   │   ├── command-handlers.XXX.test.ts
│   │   ├── experimental-handlers.XXX.test.ts
│   │   ├── handlers.XXX.test.ts
│   │   ├── lsp-handlers.XXX.test.ts
│   │   ├── message-handlers.XXX.test.ts
│   │   ├── other-handlers.XXX.test.ts
│   │   ├── server-handlers.XXX.test.ts
│   │   ├── shell-handlers.XXX.test.ts
│   │   ├── todo-handlers.XXX.test.ts
│   │   ├── tool-specific-handlers.XXX.test.ts
│   │   └── tui-handlers.XXX.test.ts
│   ├── message-formatter/
│   │   ├── build-keys-message.XXX.test.ts
│   │   ├── format-time.XXX.test.ts
│   │   ├── get-value-by-path.XXX.test.ts
│   │   ├── mask-sensitive.XXX.test.ts
│   │   └── truncate.XXX.test.ts
│   ├── messages/
│   │   ├── append-to-session.XXX.test.ts
│   │   ├── plugin-status.XXX.test.ts
│   │   ├── show-active-plugins.XXX.test.ts
│   │   ├── show-startup-toast.XXX.test.ts
│   │   └── toast-silence-detector.XXX.test.ts
│   └── scripts/
│       ├── adapters.XXX.test.ts
│       ├── executor.XXX.test.ts
│       ├── file-template.XXX.test.ts
│       ├── run-script-handler.XXX.test.ts
│       ├── run-script.XXX.test.ts
│       ├── script-executor.XXX.test.ts
│       ├── script-recorder.XXX.test.ts
│       └── script-runner.XXX.test.ts
├── opencode-hooks/
│   ├── additional-hooks.XXX.test.ts
│   ├── event-handler.XXX.test.ts
│   ├── opencode-hooks-disabled.XXX.test.ts
│   ├── opencode-hooks-enabled-coverage.XXX.test.ts
│   ├── opencode-hooks-specialized-coverage.XXX.test.ts
│   ├── tool-hooks.XXX.test.ts
│   └── validate-scripts-directory.XXX.test.ts
└── integration/  (existing)
```

## Imports

All relative imports (../..) replaced with absolute imports from project root:

```typescript
import { formatTime } from '.opencode/plugins/features/message-formatter/format-time';
```

## Process

1. Create all folder structure first
2. Move files one by one with git mv
3. Update imports to absolute paths
4. Run `npm run test:cov` after each file
5. Verify coverage unchanged
