# Code Style & Conventions

## Imports

- Use ES module syntax with `import type` for type-only imports
- Group imports: external packages first, then relative imports
- Barrel exports via `features/*/index.ts` for features and `types/index.ts` for types
- Alias `@opencode-ai/plugin` and `@opencode-ai/sdk` are mocked in tests

## Formatting (Prettier)

- Single quotes, semicolons required
- 2-space indentation
- Trailing commas (ES5 style)

## TypeScript

- Strict mode: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes` enabled
- Target ES2020, module `nodenext`, `esModuleInterop` enabled
- Use `as const` for readonly object literals
- Type aliases over interfaces for simple shapes
- `Record<string, unknown>` for generic event object types
- **Never use `any`** — define proper types in `types/` files
- Event properties accessed via `getProp()` helper to avoid unsafe indexing

## Naming Conventions

- **Files**: kebab-case (`toast-queue.ts`, `event-types.ts`)
- **Types/Interfaces**: PascalCase (`EventHandler`, `ResolvedEventConfig`)
- **Functions**: camelCase (`resolveEventConfig`, `resolveToolConfig`)
- **Enums**: PascalCase (`EventType`)
- **Event types**: dot-separated lowercase (`session.created`, `tool.execute.after`)

## Error Handling

- Wrap script execution in `try/catch`, save errors to file and show toast
- Never throw from event handlers — fail silently and continue
- Script errors must not break the event pipeline
- Use `err instanceof Error ? err.message : String(err)` for safe message extraction
- Script errors never use `console.error` — log to file and show toast instead

## ESLint Rules

- `@typescript-eslint/no-unused-vars`: prefix unused args/vars with `_` to ignore
- `@typescript-eslint/no-explicit-any`: forbidden — define proper types instead
- Follows `typescript-eslint/recommended` + `js/recommended`

## General Rules

- No comments in code unless truly necessary and not obvious from reading
- Code must be self-documenting

## Type Consolidation

**All types and interfaces MUST be defined in `types/` directory.**

- Define types in `types/*.ts` files (e.g., `types/audit.ts`)
- Export types from `types/index.ts` for barrel access
- Re-export types from feature `index.ts` when needed by consumers
- **NEVER** define `export interface` or `export type` outside `types/` directory
- Exception: type aliases like `type X = Y | Z` that are implementation details may be local

```typescript
// ✅ CORRECT: types/audit.ts
export interface AuditConfig { ... }

// ❌ WRONG: features/audit/audit-logger.ts
export interface AuditConfig { ... }
```
