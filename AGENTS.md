# AGENTS.md - OpenCode Hooks

## Project Overview

TypeScript plugin system for OpenCode AI that provides event-driven hooks for session lifecycle, tool execution, file operations, and UI notifications (toasts). Supports all 28 documented OpenCode events.

## Build / Lint / Test Commands

```bash
npm run build              # Compile TypeScript (tsc)
npm run test               # Run unit tests
npm run test:unit          # Run unit tests with experimental VM modules
npm run test:e2e           # Run E2E lifecycle tests (bash script)
npm run test:ci            # Run tests with coverage
npm run coverage           # Full coverage report
npm run coverage:report    # Text-summary coverage only
npm run lint               # Run ESLint
npm run lint:fix           # Auto-fix ESLint errors
npm run format             # Run Prettier
npm run format:check       # Check formatting only
```

### Running a Single Test

```bash
# Run a specific test file
NODE_OPTIONS='--experimental-vm-modules' npx jest test/handlers.test.ts --forceExit

# Run tests matching a pattern
NODE_OPTIONS='--experimental-vm-modules' npx jest -t "session.created" --forceExit

# Run with coverage for a single file
NODE_OPTIONS='--experimental-vm-modules' npx jest test/events.test.ts --coverage --forceExit
```

## Code Style & Conventions

### Imports

- Use ES module syntax with `import type` for type-only imports
- Group imports: external packages first, then relative imports
- Barrel exports via `helpers/index.ts` — import from there, not individual files
- Alias `@opencode-ai/plugin` and `@opencode-ai/sdk` are mocked in tests

### Formatting (Prettier)

- Single quotes, semicolons required
- 2-space indentation
- Trailing commas (ES5 style)

### TypeScript

- Strict mode: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` enabled
- Target ES2020, module `nodenext`, `esModuleInterop` enabled
- Use `as const` for readonly object literals (e.g., `OpenCodeEvents`)
- Type aliases over interfaces for simple shapes
- `Record<string, unknown>` for generic event object types
- **Never use `any`** — define proper types in `types/` files
- Event properties accessed via `getProp()` helper to avoid unsafe indexing

### Naming Conventions

- **Files**: kebab-case (`toast-queue.ts`, `event-types.ts`)
- **Types/Interfaces**: PascalCase (`EventHandler`, `ResolvedEventConfig`)
- **Functions**: camelCase (`resolveEventConfig`, `resolveToolConfig`)
- **Enums**: PascalCase (`EventType`)
- **Event types**: dot-separated lowercase (`session.created`, `tool.execute.after`)

### Error Handling

- Wrap script execution in `try/catch`, save errors to file and show toast
- Never throw from event handlers — fail silently and continue
- Script errors must not break the event pipeline
- Use `err instanceof Error ? err.message : String(err)` for safe message extraction

### Testing (Jest)

- Test files live in `test/` with `.test.ts` suffix
- Use `jest.fn()` for mocks; place shared mocks in `test/__mocks__/`
- Reset shared state with `beforeEach` (e.g., `resetGlobalToastQueue()`)
- Coverage thresholds: 80% statements/lines, 60% branches, 65% functions
- Test tsconfig uses `commonjs` module (not `nodenext`)
- Mock `user-events.config.ts` and `handlers.ts` in tests that use `events.ts`

### ESLint Rules

- `@typescript-eslint/no-unused-vars`: prefix unused args/vars with `_` to ignore
- `@typescript-eslint/no-explicit-any`: forbidden — define proper types instead
- Follows `typescript-eslint/recommended` + `js/recommended`

## Project Structure

```
.opencode/plugins/
  opencode-hooks.ts            # Main plugin entry point
  types/
    opencode-hooks.ts          # OpenCode event type definitions
    event-properties.ts        # Event property type definitions
  helpers/
    event-types.ts             # EventType enum and interfaces (DO NOT EDIT)
    handlers.ts                # Default handlers + message builders (DO NOT EDIT)
    events.ts                  # Config resolution logic (DO NOT EDIT)
    user-events.config.ts      # User configuration (ONLY FILE TO EDIT)
    toast-queue.ts             # Staggered toast notification queue
    run-script.ts              # Shell script execution
    save-to-file.ts            # File persistence utility
    append-to-session.ts       # Session context appending
    constants.ts               # Shared constants
src/                           # Placeholder (mock project)
test/                          # Jest tests + mocks
plans/                         # Implementation plans (keep in English)
```

## Git Workflow

- Always create a new branch before making changes
- Use `gh` CLI for GitHub interactions (PRs, issues, CI)
- Commit author: `Johnatas Henrique <johnatas.henrique@gmail.com>`
- Plans in `plans/` must be written in English with timestamps

## Key Patterns

- **Plugin API**: Exports `event`, `tool.execute.before`, `tool.execute.after`, and `shell.env` handlers
- **Config system**: Flat structure — events not listed use global defaults; `event: false` disables entirely
- **Toast queue**: Singleton via `getGlobalToastQueue()` with staggered display and backpressure
- **Script resolution**: `runScripts: false` wins over `scripts` array; default script name = event name with dashes
- **Message builders**: Each handler has a `buildMessage` function that preserves event data (error.name, sessionID, etc.)
- **No comments in code**: Code must be self-documenting; only add comments if truly necessary and not obvious from reading
