# AGENTS.md - OpenCode Hooks

## Project Overview

TypeScript plugin system for OpenCode AI that provides event-driven hooks for session lifecycle, tool execution, file operations, and UI notifications (toasts).

## Build / Lint / Test Commands

```bash
npm run build              # Compile TypeScript (tsc)
npm run test               # Run unit tests
npm run test:unit          # Run unit tests with experimental VM modules
npm run test:e2e           # Run E2E lifecycle tests (bash script)
npm run test:ci            # Run tests with coverage
npm run coverage           # Full coverage report
npm run coverage:report    # Text-summary coverage only
npm run eslint             # Lint src/**/*.ts
```

### Running a Single Test

```bash
# Run a specific test file
NODE_OPTIONS='--experimental-vm-modules' npx jest test/toast-queue.test.ts --forceExit

# Run tests matching a pattern
NODE_OPTIONS='--experimental-vm-modules' npx jest -t "toast-queue" --forceExit

# Run with coverage for a single file
NODE_OPTIONS='--experimental-vm-modules' npx jest test/events-config.test.ts --coverage --forceExit
```

## Code Style & Conventions

### Imports

- Use ES module syntax with `import type` for type-only imports
- Group imports: external packages first, then relative imports
- Barrel exports via `helpers/index.ts` — import from there, not individual files
- Alias `@opencode-ai/plugin` and `@opencode-ai/sdk` are mocked in tests

### Formatting (Prettier)

- Single quotes, semicolons required
- 2-space tab width
- Trailing commas (ES5 style)

### TypeScript

- Strict mode: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` enabled
- Target ES2020, module `nodenext`, `esModuleInterop` enabled
- Use `as const` for readonly object literals (e.g., `OpenCodeEvents`)
- Type aliases over interfaces for simple shapes
- `Record<string, unknown>` for generic object types
- Avoid `any` — use `as any` only when bridging untyped plugin APIs

### Naming Conventions

- **Files**: kebab-case (`toast-queue.ts`, `events-config.ts`)
- **Types/Interfaces**: PascalCase (`EventHandlerConfig`, `ResolvedEventConfig`)
- **Functions**: camelCase (`loadEventsConfig`, `resolveEventConfig`)
- **Constants**: UPPER_SNAKE_CASE (`OpenCodeEvents`)
- **Event types**: dot-separated lowercase (`session.created`, `tool.execute.after`)

### Error Handling

- Wrap script execution in `try/catch`, log with `console.error`
- Never throw from event handlers — fail silently and continue
- Script errors should not break the event pipeline

### Testing (Jest)

- Test files live in `test/` with `.test.ts` suffix
- Use `jest.fn()` for mocks; place shared mocks in `test/__mocks__/`
- Reset shared state with `beforeEach` (e.g., `resetGlobalToastQueue()`)
- Coverage thresholds: 80% statements/lines, 60% branches, 65% functions
- Test tsconfig uses `commonjs` module (not `nodenext`)

### ESLint Rules

- `@typescript-eslint/no-unused-vars`: prefix unused args/vars with `_` to ignore
- Follows `typescript-eslint/recommended` + `js/recommended`

## Project Structure

```
.opencode/plugins/
  opencode-hooks.ts        # Main plugin entry point
  types/                   # Type definitions (events, inputs/outputs)
  helpers/                 # Shared utilities (barrel exported via index.ts)
    events-config.ts       # Event configuration loading & merging
    events.ts              # Event/tool config resolution
    handlers.ts            # Event handler implementations
    toast-queue.ts         # Staggered toast notification queue
    save-to-file.ts        # File persistence utility
    run-script.ts          # Shell script execution
    append-to-session.ts   # Session context appending
    create-toast.ts        # Toast creation helper
    constants.ts           # Shared constants
    user-events.config.ts  # User-specific event config
src/                       # Placeholder (mock project)
test/                      # Jest tests + mocks
plans/                     # Implementation plans (keep in English)
```

## Git Workflow

- Always create a new branch before making changes
- Use `gh` CLI for GitHub interactions (PRs, issues, CI)
- Commit author: `Johnatas Henrique <johnatas.henrique@gmail.com>`
- Plans in `plans/` must be written in English with timestamps

## Key Patterns

- **Plugin API**: Exports `event` and `tool.execute.after` handlers
- **Config system**: Events can be enabled/disabled per-type with toast, script, save-to-file options
- **Toast queue**: Singleton pattern via `getGlobalToastQueue()` with staggered display
- **Config cache**: Use `resetConfigCache()` in tests to avoid stale state
