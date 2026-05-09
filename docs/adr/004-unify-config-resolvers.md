# ADR-003: Unify config resolvers

## Status

Implemented

## Context

The config resolution layer had two parallel implementations:

- `ConfigBuilder` (190 lines) — resolved event configs, used exclusively
  by `EventConfigResolverImpl`
- `ToolConfigResolverImpl` (336 lines) — resolved tool configs, duplicated
  `ConfigBuilder`'s logic for `getDefaultConfig`/`resolveBase`

Both classes used the `Impl` suffix anti-pattern, which communicates nothing
about their role.

## Decision

Extract a `DefaultConfigResolver` class with constructor-injected
`ConfigResolverContext` that holds the five shared methods:
`buildDefault`, `buildMerged`, `applyClaudeScripts`, `tryBuildMessage`,
`getDefaultScript`. Both `ConfigBuilder` and `DefaultToolConfigResolver`
use it via composition.

Renamed `EventConfigResolverImpl` → `DelegatingEventConfigResolver` and
`ToolConfigResolverImpl` → `DefaultToolConfigResolver`.

### `applyClaudeScripts` discriminator

The `toolName` parameter serves as a discriminator between event and tool
behavior. When defined (tool context), Claude scripts are always merged and
`runScripts` is activated if it was previously `false`. When undefined
(event context), the `config.runScripts` guard applies.

## Consequences

- ConfigBuilder reduced from 190 to 75 lines
- DefaultToolConfigResolver (was Impl) reduced from 336 to 280 lines
- ~80 lines of duplicated logic eliminated net
- Names communicate actual responsibility: "Delegating" (delegates to
  ConfigBuilder), "Default" (the one-and-only tool resolver)
- Tools now trigger `onUnknownEvent` for missing handlers (same behavior
  as events), previously silent
