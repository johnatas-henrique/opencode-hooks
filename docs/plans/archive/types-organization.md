# TypeScript Types Organization Plan

**Date**: 2026-04-07 16:00
**Status:** Completed

## Execution

| Step | Description                                                                 | Status | Timestamp        |
| ---- | --------------------------------------------------------------------------- | ------ | ---------------- |
| 1    | Analyze all type definitions across the project                             | ✅     | 2026-04-07 16:05 |
| 2    | Rename helpers/event-types.ts → helpers/config.ts                           | ✅     | 2026-04-07 16:10 |
| 3    | Rename helpers/run-script-types.ts → helpers/script-config.ts               | ✅     | 2026-04-07 16:10 |
| 4    | Consolidate types/opencode-hooks.ts + event-properties.ts → types/events.ts | ✅     | 2026-04-07 16:12 |
| 5    | Create types/index.ts barrel export                                         | ✅     | 2026-04-07 16:12 |
| 6    | Update all imports across the project                                       | ✅     | 2026-04-07 16:15 |
| 7    | Run build, lint, and tests                                                  | ✅     | 2026-04-07 16:16 |

---

## Background

Based on Matt Pocock's TypeScript best practices:

- **Colocate**: Types used in one place → same file
- **Shared**: Types used in multiple places → shared location (smallest scope)
- **Global types only in `types/`**: Types truly global → `types/` folder

---

## Expected Final Structure

```
.opencode/plugins/
├── opencode-hooks.ts
├── types/
│   ├── index.ts        # Barrel: re-export all global types
│   └── events.ts       # OpenCode event types (merged)
└── helpers/
    ├── index.ts        # Barrel: re-export all helpers + types
    ├── config.ts       # EventType enum + config interfaces (renamed)
    ├── script-config.ts # RunScriptConfig (renamed)
    └── ...
```
