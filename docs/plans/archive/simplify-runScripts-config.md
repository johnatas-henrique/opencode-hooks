## Execution

| Step                                                                      | Status | Timestamp        |
| ------------------------------------------------------------------------- | ------ | ---------------- |
| 1. Remove runScripts from UserEventsConfig interface in event-types.ts    | ✅     | 2026-04-03 22:45 |
| 2. Remove runScripts from global config in user-events.config.ts          | ✅     | 2026-04-03 22:46 |
| 3. Fix events.ts to use eventBase.runScripts instead of global.runScripts | ✅     | 2026-04-03 22:47 |
| 4. Run lint, build, and tests                                             | ✅     | 2026-04-03 22:48 |

## Problem

Current configuration has unnecessary complexity:

- Global layer: `userConfig.runScripts = true`
- Events layer: `events[EventType].runScripts = false`
- Tools layer: `tools[EventType].tool.runScripts = true`

This causes bugs (found earlier) where global overrides the event-level config.

## Solution

Simplify by removing the global layer:

1. **Remove `runScripts` from UserEventsConfig interface** (event-types.ts)
   - Remove from top-level config interface
   - Keep in EventOverride and ToolOverride (for events and tools)

2. **Remove `runScripts` from global config** (user-events.config.ts)
   - Remove line: `runScripts: true,`
   - Users will set runScripts explicitly in events or tools

3. **Fix resolveToolConfig** (events.ts line ~181)
   - Change from: `global.runScripts`
   - Change to: `eventBase.runScripts`

4. **Verify** - Run lint, build, and tests

## Result

| Before                      | After                           |
| --------------------------- | ------------------------------- |
| Global + Events + Tools     | Events + Tools only             |
| runScripts in 3 places      | runScripts only in events/tools |
| Bug: global overrides event | No more extra layer             |

Created: 2026-04-04 00:20
