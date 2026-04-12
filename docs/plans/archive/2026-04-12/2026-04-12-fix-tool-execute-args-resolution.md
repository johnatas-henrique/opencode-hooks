# Debug: Show all tool event keys in toasts and logs

**Created:** 2026-04-12 18:20

## Problem

Need to see ALL keys from tool.execute.before/after events in toasts and logs to understand the structure before implementing event blocking.

## Current State

After the normalization refactor, tool events return:

- `before`: `{ tool, sessionID, callID, args, ...toolSpecificFields }` (4+ keys)
- `after`: `{ tool, sessionID, callID, args, output, metadata, ...toolSpecificFields }` (6+ keys)

But:

- Toasts only show specific `props` fields defined per handler
- Logs only log `input`, not `output`

## Solution

Show ALL keys from `properties` in both toasts and logs.

## Execution

| Step | Description                                                                        | Status | Timestamp |
| ---- | ---------------------------------------------------------------------------------- | ------ | --------- |
| 1    | Update `normalizeInputForHandler` to also return `output` in the normalized object | ⏳     | -         |
| 2    | Update `logEventConfig` to accept and log both `input` and `output`                | ⏳     | -         |
| 3    | Update `opencode-hooks.ts` to pass `output` to `logEventConfig`                    | ⏳     | -         |
| 4    | Update `tool.execute.before` handler to show ALL keys via `JSON.stringify`         | ⏳     | -         |
| 5    | Update `tool.execute.after` handler to show ALL keys via `JSON.stringify`          | ⏳     | -         |
| 6    | Run build, lint, test                                                              | ⏳     | -         |
| 7    | Test manually - verify toasts show all keys                                        | ⏳     | -         |
| 8    | Test manually - verify logs contain all keys                                       | ⏳     | -         |

## Files to Modify

1. `.opencode/plugins/helpers/events.ts` - add output to normalized object
2. `.opencode/plugins/helpers/log-event.ts` - accept and log output
3. `.opencode/plugins/opencode-hooks.ts` - pass output to logEventConfig
4. `.opencode/plugins/helpers/default-handlers.ts` - update tool.execute.before/after handlers

## Expected Output

### Toast Example (tool.execute.before for bash)

```
sessionID: "ses_abc123"
tool: "bash"
callID: "call_xyz"
args: {"command":"npm run build","timeout":60000}
command: "npm run build"
Time: 14:30:00
```

### Log Example

```json
{
  "timestamp": "2026-04-12T14:30:00.000Z",
  "type": "EVENT_OUTPUT",
  "data": {
    "eventType": "tool.execute.before",
    "input": { "tool": "bash", "sessionID": "ses_abc", "callID": "call_xyz" },
    "output": { "args": { "command": "npm run build" } },
    "normalized": {
      "properties": {
        "sessionID": "ses_abc",
        "tool": "bash",
        "callID": "call_xyz",
        "args": { "command": "npm run build" },
        "command": "npm run build"
      }
    }
  }
}
```

## Notes

- This is a DEBUG step - after understanding the structure, we'll implement event blocking
- Handlers will be reverted to selective props after debugging
