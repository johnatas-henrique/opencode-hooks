# OpenCode Hooks - Types Reorganization Plan

**Created:** 2026-04-14 02:50  
**Agent:** plan  
**Status:** Draft - Ready for Implementation

---

## Current State Analysis

### Types Directory (.opencode/plugins/types/)

| File                | Exports | Purpose                                               |
| ------------------- | ------- | ----------------------------------------------------- |
| `config.ts`         | 16      | User config, EventType enum, Script types             |
| `opencode-hooks.ts` | 90+     | OpenCode core (session props, tool types, normalized) |

### Types scattered in helpers/

| File                            | Exports                      | Should be in      |
| ------------------------------- | ---------------------------- | ----------------- |
| `helpers/default-handlers.ts`   | EventHandler                 | `types/events.ts` |
| `helpers/config/blocks.ts`      | BlockPredicate, BlockCheck   | `types/script.ts` |
| `helpers/config/settings.ts`    | BlockPredicate (re-export)   | `types/script.ts` |
| `helpers/toast-queue.ts`        | ShowToastOptions, ToastQueue | `types/toast.ts`  |
| `helpers/save-to-file.ts`       | ToastCallback                | `types/toast.ts`  |
| `helpers/script-config.ts`      | RunScriptConfig              | `types/script.ts` |
| `helpers/show-startup-toast.ts` | ShowStartupToastOptions      | `types/toast.ts`  |
| `helpers/plugin-status.ts`      | PluginStatus                 | `types/plugin.ts` |

---

## Problema

| #   | Problema                             | Impacto                            |
| --- | ------------------------------------ | ---------------------------------- |
| 1   | Nomes genéricos (`config.ts`)        | Difícil identificar conteúdo       |
| 2   | Eventos separados em arquivos grands | Arquivo único com 90+ exports      |
| 3   | Tipos em helpers/                    | Viola clean architecture           |
| 4   | Duplicação (?)                       | BlockPredicate existe em 2 lugares |

---

## Proposed Structure

```
.opencode/plugins/types/
├── index.ts              # Barrel file - re-exports all
├── events.ts            # EventType enum ONLY
├── config.ts           # UserEventsConfig, EventOverride, ToolConfig
├── script.ts           # ScriptResult, BlockPredicate, RunScriptConfig
├── toast.ts           # ShowToastOptions, ToastQueue, ToastCallback
├── plugin.ts         # PluginStatus
├── core.ts           # OpenCodeEventHandler, OpenCodeEventType, ToolNormalized
└── events/          # Event-specific types (optional)
    ├── session.ts   # SessionCreatedProps, etc
    └── tool.ts     # ToolExecuteBeforeProps, etc
```

---

## Migration Plan

| Step | Action                                            | Files           | Risk   |
| ---- | ------------------------------------------------- | --------------- | ------ |
| 1    | Create `types/events.ts` from EventType enum      | NEW             | Low    |
| 2    | Move UserEventsConfig, EventOverride to config.ts | types/config.ts | Medium |
| 3    | Consolidate script types in types/script.ts       | NEW + merge     | Medium |
| 4    | Consolidate toast types in types/toast.ts         | NEW + merge     | Medium |
| 5    | Move PluginStatus to types/plugin.ts              | NEW             | Low    |
| 6    | Move EventHandler to types/events.ts              | NEW             | Low    |
| 7    | Rename opencode-hooks.ts → core.ts                | RENAME          | High   |
| 8    | Create types/index.ts barrel                      | NEW             | Low    |
| 9    | Update ALL imports                                | MULTIPLE        | High   |
| 10   | Update AGENTS.md                                  | docs/AGENTS.md  | Low    |

---

## Breaking Changes

All import paths will change:

- `'../types/config'` → `'../types'`
- `../../types/config` → `../../types`
- Need comprehensive find/replace across all files

---

## Questions

1. Split `opencode-hooks.ts` core into `core.ts` + `events/` subdir?
2. How to handle backward compatibility? Re-export from old paths?
3. Update AGENTS.md to document the new structure?

---

## Execution

| Step | Description             | Status | Timestamp |
| ---- | ----------------------- | ------ | --------- |
| 1    | Analyze current exports | ⏳     | -         |
| 2    | Create new type files   | ⏳     | -         |
| 3    | Migrate exports         | ⏳     | -         |
| 4    | Update imports          | ⏳     | -         |
| 5    | Create barrel file      | ⏳     | -         |
| 6    | Build, lint, test       | ⏳     | -         |
| 7    | Update AGENTS.md        | ⏳     | -         |
