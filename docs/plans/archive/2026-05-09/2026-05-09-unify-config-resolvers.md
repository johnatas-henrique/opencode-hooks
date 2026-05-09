# Plan: Unify config resolvers

## Goal

Eliminate duplicated resolution logic between `ConfigBuilder` and
`ToolConfigResolverImpl` by extracting a shared `DefaultConfigResolver`.
Rename all `Impl`-suffixed classes to communicate actual responsibilities.

## Context

`ConfigBuilder` (190 lines) and `ToolConfigResolverImpl` (336 lines) each
contain their own version of:

- `buildDefault` / `getDefaultConfig` — ~80% identical
- `buildMerged` / `resolveBase` — ~90% identical
- `tryBuildMessage`, `getDefaultScript` — 100% identical
- `applyClaudeScripts` — ~70% identical (tool version can activate
  `runScripts` when Claude scripts are found)

Both classes also use the `Impl` suffix anti-pattern (`EventConfigResolverImpl`,
`ToolConfigResolverImpl`).

## Solution: `DefaultConfigResolver` + renaming

### New module

`features/events/resolvers/default-config-resolver.ts`

A class with a single `ConfigResolverContext` dependency that holds the five
shared methods. The `applyClaudeScripts` method uses `toolName` as a
discriminator — when defined, the tool-style `runScripts` activation applies;
when undefined, the event-style `runScripts` guard applies.

### Renames

| Before                    | After                           | Rationale                             |
| ------------------------- | ------------------------------- | ------------------------------------- |
| `EventConfigResolverImpl` | `DelegatingEventConfigResolver` | Delegates everything to ConfigBuilder |
| `ToolConfigResolverImpl`  | `DefaultToolConfigResolver`     | is the only (default) tool resolver   |

### ConfigBuilder

Loses 5 private methods (~190 → ~75 lines) by delegating to
`DefaultConfigResolver`. Keeps only its constructor, `resolve()` entry point,
and `isEventDisabled()`.

### DefaultToolConfigResolver (was ToolConfigResolverImpl)

`getDefaultConfig()` replaced by `defaultResolver.buildDefault()` with a
3-line post-processing step to preserve the tool-specific `scripts` behavior
(runScripts + handler.defaultScript adds the script).

`resolveBase()` replaced by `defaultResolver.buildMerged()`, with the
`userEventConfig === false` edge case handled inline via
`DEFAULTS.config.disabled`.

`applyClaudeScripts()`, `tryBuildMessage()`, `getDefaultScript()` delegate
to `defaultResolver`.

## Files changed

| File                               | Change                                        |
| ---------------------------------- | --------------------------------------------- |
| `default-config-resolver.ts` (NEW) | +119 lines — shared methods                   |
| `event-config-builder.ts`          | -5 private methods, use DefaultConfigResolver |
| `tool-config.resolver.ts`          | renamed class, use DefaultConfigResolver      |
| `event-config.resolver.ts`         | renamed class                                 |
| `context.ts`                       | updated imports + instantiations              |
| 2 test files                       | updated imports + describe blocks             |
| `docs/architecture-deepening.md`   | mark implemented, add rename note             |

## Validation

- `npm run build` — TypeScript compilation
- `npm run lint` — ESLint
- `npm run test:cov` — 596 tests passing
