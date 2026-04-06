# Plan: Refactor and Implement All Hooks (COMPLETED)

## Execution

| Step                                                     | Status      | Timestamp        |
| -------------------------------------------------------- | ----------- | ---------------- |
| 1. Add handlers for new hooks in default-handlers.ts     | ✅          | 2026-04-06 16:37 |
| 2. Create executeHook generic method                     | ✅          | 2026-04-06 16:38 |
| 3. Refactor event hook to use executeHook                | ✅          | 2026-04-06 16:38 |
| 4. Refactor tool.execute.before/after to use executeHook | ✅          | 2026-04-06 16:38 |
| 5. Refactor shell.env to use executeHook                 | ✅          | 2026-04-06 16:38 |
| 6. Add chat.message, chat.params, chat.headers hooks     | ✅          | 2026-04-06 16:38 |
| 7. Add permission.ask hook                               | ✅          | 2026-04-06 16:38 |
| 8. Add command.execute.before hook                       | ✅          | 2026-04-06 16:38 |
| 9. Add experimental.\* hooks                             | ✅          | 2026-04-06 16:38 |
| 10. Add tool.definition hook                             | ✅          | 2026-04-06 16:38 |
| 11. Add config, auth, tool hooks (logging only)          | ✅          | 2026-04-06 16:38 |
| 12. Run build, lint, tests                               | ✅          | 2026-04-06 16:38 |
| 13. Add unit tests for new handlers                      | ✅          | 2026-04-06 16:42 |
| 14. Add integration tests for executeHook                | ✅          | 2026-04-06 16:42 |
| 15. Add tests for showToast parameter                    | ✅          | 2026-04-06 16:42 |
| 16. Verify 100% coverage                                 | ✅ (98.78%) | 2026-04-06 16:42 |

---

## Overview

Refactor the plugin to use a unified handler method and implement all hooks from the `Hooks` interface.

## Current Issues

- `tool.execute.before` and `tool.execute.after` have ~70 lines each with duplicated logic
- Not all hooks from the interface are implemented
- No centralized error handling

## Architecture

### executeHook Generic Method

```typescript
interface ExecuteHookParams {
  ctx: PluginInput;
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
  input?: {
    tool?: string;
    subagentType?: string;
    event?: Event;
    [key: string]: unknown;
  };
  customMessage?: string;
}
```

The method derives internally:

- `toolName` = `input?.tool`
- `scriptArg` = `input?.subagentType ?? input?.tool`

### SessionID Resolution

| Hook                        | Source                                  |
| --------------------------- | --------------------------------------- |
| Events (event handler)      | `info?.id ?? props?.sessionID`          |
| tool.execute.before/after   | `input.sessionID`                       |
| shell.env                   | `input.sessionID ?? DEFAULT_SESSION_ID` |
| chat.message/params/headers | `input.sessionID`                       |
| command.execute.before      | `input.sessionID`                       |
| permission.ask              | `input.sessionID ?? DEFAULT_SESSION_ID` |
| experimental.\*             | `input.sessionID ?? DEFAULT_SESSION_ID` |
| tool.definition             | `DEFAULT_SESSION_ID`                    |

### Tool 'task' Special Case

For `tool.execute.after` when tool is 'task', extract `subagentType` from `input.args.subagent_type` instead of using `input.tool`.

## New Handlers to Add (default-handlers.ts)

All with same name as event/hook:

```typescript
'chat.message': { title, variant, duration, defaultScript, buildMessage }
'chat.params': { ... }
'chat.headers': { ... }
'permission.ask': { ... }
'command.execute.before': { ... }
'experimental.chat.messages.transform': { ... }
'experimental.chat.system.transform': { ... }
'experimental.session.compacting': { ... }
'experimental.text.complete': { ... }
'tool.definition': { ... }
```

## Hooks Implementation Summary

| Hook                     | Handler Type                      | Notes                        |
| ------------------------ | --------------------------------- | ---------------------------- |
| `event`                  | Full (toast, scripts, saveToFile) | Uses resolveEventConfig      |
| `tool.execute.before`    | Full                              | Uses resolveToolConfig       |
| `tool.execute.after`     | Full                              | Special case for tool 'task' |
| `shell.env`              | Full                              | Uses resolveEventConfig      |
| `chat.message`           | Full                              | Uses resolveEventConfig      |
| `chat.params`            | Full                              | Uses resolveEventConfig      |
| `chat.headers`           | Full                              | Uses resolveEventConfig      |
| `permission.ask`         | Full                              | Uses resolveEventConfig      |
| `command.execute.before` | Full                              | Uses resolveEventConfig      |
| `experimental.*`         | Full                              | Uses resolveEventConfig      |
| `tool.definition`        | Full                              | Uses resolveEventConfig      |
| `config`                 | Logging only                      | No toast/scripts             |
| `auth`                   | Logging only                      | No toast/scripts             |
| `tool`                   | Logging only                      | No toast/scripts             |

## Changes

### File: `.opencode/plugins/helpers/default-handlers.ts`

- Add handlers for all new hooks

### File: `.opencode/plugins/opencode-hooks.ts`

- Add `executeHook` generic method
- Refactor all existing hooks to use executeHook
- Add all missing hooks from Hooks interface

---

## Verification

After changes run:

- `npm run build`
- `npm run lint`
- `npm run test`
