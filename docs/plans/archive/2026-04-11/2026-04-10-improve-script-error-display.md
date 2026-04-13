# 2026-04-10: Improve Script Error Display

## Execution

| Step                                                                   | Status | Timestamp        |
| ---------------------------------------------------------------------- | ------ | ---------------- |
| 1. Update runScriptAndHandle to receive and use eventType and toolName | ✅     | 2026-04-11 14:25 |
| 2. Add event context to error toast                                    | ✅     | 2026-04-11 14:25 |
| 3. Update tests that validate error messages                           | ✅     | 2026-04-11 14:25 |
| 4. Run npm run build && npm run lint && npm run test                   | ✅     | 2026-04-11 14:26 |
| 5. Commit with conventional message                                    | ✅     | 2026-04-11 14:30 |

**Status**: ✅ Completed

## Problem

Current SCRIPT ERROR toast displays:

```
====SCRIPT ERROR====
Script: script-name
Error: error message
Check user-events.config.ts
```

Missing context: does not identify which event triggered the script or which tool was in use, making debugging difficult.

## Solution

Add event context line to error toast:

```
====SCRIPT ERROR====
Event: task
Script: log-agent.sh
Error: sh: log-agent.sh: not found
Check user-events.config.ts
```

For non-tool events (e.g., shell.env), display:

```
Event: shell.env
```

## Implementation Details

### File: .opencode/plugins/helpers/run-script-handler.ts

Changes needed:

1. Extract `eventType` and `toolName` from config (already passed via config)
2. Format eventInfo in error toast:

```typescript
const eventInfo =
  eventType.startsWith('tool.execute.') && toolName ? toolName : eventType;

useGlobalToastQueue().add({
  title: '====SCRIPT ERROR====',
  message: `Event: ${eventInfo}\nScript: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
  variant: 'error',
  duration: TOAST_DURATION.FIVE_SECONDS,
});
```

3. Update SCRIPT_ERROR log to include eventType and toolName:

```typescript
await saveToFile({
  content: JSON.stringify({
    timestamp,
    type: 'SCRIPT_ERROR',
    data: { eventType, toolName, script, errorMessage },
  }),
  showToast: useGlobalToastQueue().add,
});
```

## Tests to Update

- `test/unit/opencode-hooks.test.ts` (~lines 917-933)
- `test/unit/run-script-handler.test.ts` (if exists)
- `test/unit/additional-hooks.test.ts` (~lines 917-933)

Search for:

- `"====SCRIPT ERROR===="`
- `"Script:"`
- `should show error toast for tool.execute.after script failure`

## Verification Commands

```bash
npm run build
npm run lint
npm run test
```

Created: 2026-04-03 23:55
Updated: 2026-04-11
