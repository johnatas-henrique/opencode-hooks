# 2026-04-10: Refactor resolveToolConfig to Inherit Directly from Default

## 🎯 Objective

Refactor `resolveToolConfig` to inherit configuration directly from `userConfig.default` when `userConfig.events[toolEventType]` is undefined, aligning tool behavior with event behavior and eliminating inconsistent 3-level inheritance.

## 📌 Problem

Currently, `resolveToolConfig` relies on `resolveEventConfig(toolEventType)`, which returns handler defaults if `toolEventType` is not defined in `events`. This creates an inconsistent 3-level hierarchy:

```
userConfig.default → userConfig.events[toolEventType] → userConfig.tools[toolEventType][toolName]
```

When `toolEventType` is missing (e.g., `"tool.execute.after"`), tools lose access to `default` — breaking predictability and forcing users to define empty event entries just to enable defaults.

## ✅ Proposed Solution

Modify `resolveToolConfig` to:

- **Skip** `resolveEventConfig(toolEventType)` if `userConfig.events[toolEventType]` is `undefined`
- **Fallback directly** to `userConfig.default` as the base config
- **Preserve** tool-specific overrides as before

Result: 2-level hierarchy — identical to events:

```
userConfig.default → userConfig.tools[toolEventType][toolName]
```

## 🧭 Implementation Steps (READ-ONLY)

| Step | Action                       | Details                                                                                                                          |
| ---- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Locate `resolveToolConfig`   | `/home/johnatas/projects/opencode-hooks/.opencode/plugins/helpers/events.ts:272-345`                                             |
| 2    | Identify current inheritance | `const eventBase = resolveEventConfig(toolEventType);` — currently always called                                                 |
| 3    | Define fallback logic        | Add function `getDefaultConfig()` that returns a `ResolvedEventConfig` built from `userConfig.default` (mirroring lines 198–223) |
| 4    | Replace event base lookup    | Change to:                                                                                                                       |

```ts
const eventBase =
  userConfig.events[toolEventType] !== undefined
    ? resolveEventConfig(toolEventType)
    : getDefaultConfig();
```

| 5 | Preserve override behavior | Keep using `getWithDefault(toolConfig, defaultCfg, key, eventBase.value)` — unchanged |
| 6 | Validate edge cases | Ensure these still work:

- `tools: { "tool.execute.after": { "task": { toast: false } } }` → overrides toast
- `default: { toast: true }` → base value
- `events: { "tool.execute.after": false }` → disables all tools |
  | 7 | Update documentation | Modify comment above `resolveToolConfig`:

```ts
/**
 * Resolves the tool configuration for a given tool event and tool name.
 * Merges tool-specific overrides directly from userConfig.default, bypassing event config unless explicitly defined.
 */
```

| 8 | Review test coverage | Check `test/unit/events.test.ts` and `test/unit/property/events.property.test.ts` for coverage of undefined event cases — add if missing |

## ✅ Outcome After Refactor

**Before** (inconsistent):

```ts
// user-events.config.ts
{ default: { toast: true }, // ignored if "tool.execute.after" not in events
  tools: { "tool.execute.after": { "task": { toast: false } } }
}
// → toast: true (from handler), then false (override)
```

**After** (consistent):

```ts
// user-events.config.ts
{ default: { toast: true }, // now used as base
  tools: { "tool.execute.after": { "task": { toast: false } } }
}
// → toast: true (from default), then false (override)
```

## ⚠️ Impact

- ✅ **No breaking changes** if `toolEventType` is defined
- ✅ **Improves predictability** when `toolEventType` is undefined
- ✅ **No changes to `resolveEventConfig`** — only `resolveToolConfig` modified
- ✅ **Backward compatible** — existing configs continue to work

## Execution

| Step                                    | Status | Timestamp |
| --------------------------------------- | ------ | --------- |
| 1. Analyze `resolveToolConfig` logic    | ⏳     | -         |
| 2. Define `getDefaultConfig()` fallback | ⏳     | -         |
| 3. Update `eventBase` logic             | ⏳     | -         |
| 4. Update documentation comment         | ⏳     | -         |
| 5. Validate with test cases             | ⏳     | -         |
| 6. Generate and review diff             | ⏳     | -         |

## 📝 Next Steps

Awaiting user approval to proceed with implementation. No changes have been made to code yet.
