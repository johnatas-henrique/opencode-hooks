# Normalize All Events - Show All Keys in Toasts and Logs

**Created:** 2026-04-12  
**Status:** Completed

## Problem

1. `tool.execute.before` shows "unknown" because `args` are in `output`, not `input`
2. Toasts only show specific `props` fields, not ALL keys
3. Logs don't save `output` for tool events
4. Events with handlers are marked as "unknown" in logs (wrong detection)
5. No strong typing for normalized events

## Solution

1. Normalize ALL events consistently
2. Show ALL keys in toasts (with truncation at 1000 chars)
3. Save ALL keys in logs (input + output)
4. Apply masking for sensitive values
5. Create strong Union types for TypeScript

## Event Types Structure

### Tool Events

```typescript
type ToolBeforeNormalized = {
  type: 'tool.before';
  input: ToolExecuteBeforeInput;
  output: ToolExecuteBeforeOutput;
};

type ToolAfterNormalized = {
  type: 'tool.after';
  input: ToolExecuteAfterInput;
  output: ToolExecuteAfterOutput;
};

type ToolNormalized = ToolBeforeNormalized | ToolAfterNormalized;
```

### Properties Events (from SDK)

```typescript
type PropertiesNormalized<T extends Event['type']> = {
  type: 'properties';
  eventType: T;
  properties: Extract<Event, { type: T }>['properties'];
};

type PropertiesNormalizedUnion =
  | PropertiesNormalized<'session.created'>
  | PropertiesNormalized<'session.updated'>
  | PropertiesNormalized<'session.deleted'>
  | PropertiesNormalized<'message.updated'>
  | PropertiesNormalized<'file.edited'>
  | PropertiesNormalized<'permission.ask'>
  | PropertiesNormalized<'permission.updated'>
  | PropertiesNormalized<'shell.env'>
  | PropertiesNormalized<'chat.message'>
  | PropertiesNormalized<'chat.params'>
  | PropertiesNormalized<'chat.headers'>
  | PropertiesNormalized<'command.execute.before'>
  | PropertiesNormalized<'lsp.client.diagnostics'>
  | PropertiesNormalized<'lsp.updated'>
  | PropertiesNormalized<'installation.updated'>
  | PropertiesNormalized<'todo.updated'>
  | PropertiesNormalized<'tui.prompt.append'>
  | PropertiesNormalized<'tui.command.execute'>
  | PropertiesNormalized<'tui.toast.show'>
  | PropertiesNormalized<'experimental.session.compacting'>
  | PropertiesNormalized<'experimental.chat.messages.transform'>
  | PropertiesNormalized<'experimental.chat.system.transform'>
  | PropertiesNormalized<'experimental.text.complete'>
  | PropertiesNormalized<'tool.definition'>
  | PropertiesNormalized<'server.connected'>
  | PropertiesNormalized<'server.instance.disposed'>
  | PropertiesNormalized<'command.executed'>
  | PropertiesNormalized<'file.watcher.updated'>
  | PropertiesNormalized<'vcs.branch.updated'>
  | PropertiesNormalized<'pty.created'>
  | PropertiesNormalized<'pty.updated'>
  | PropertiesNormalized<'pty.exited'>
  | PropertiesNormalized<'pty.deleted'>
  // Unknown events
  | {
      type: 'properties';
      eventType: string;
      properties: Record<string, unknown>;
    };
```

### Final Union Type

```typescript
type NormalizedEvent = ToolNormalized | PropertiesNormalizedUnion;
```

## Handler Hierarchy

```
tool.execute.before (FALLBACK - generic)
  └── tool.execute.before.bash
  └── tool.execute.before.read
  └── ...

tool.execute.after (FALLBACK - generic)
  └── tool.execute.after.bash
  └── tool.execute.after.read
  └── ...

session.created
session.updated
session.deleted
session.error
...
```

## Execution

| Step | Description                                                                            | Status | Timestamp |
| ---- | -------------------------------------------------------------------------------------- | ------ | --------- |
| 1    | Fix unknown event detection - mark as unknown only if no handler AND not in userConfig | ✅     | 18:45     |
| 2    | Create strong Union types in `types/opencode-hooks.ts`                                 | ✅     | 18:45     |
| 3    | Simplify `normalizeInputForHandler` to return typed union                              | ✅     | 18:45     |
| 4    | Update `tool.execute.before/after` handlers to show ALL keys with truncation           | ✅     | 18:45     |
| 5    | Update ALL other handlers to show ALL keys from `properties`                           | ✅     | 18:45     |
| 6    | Apply masking for sensitive values (same as debug)                                     | ✅     | 18:45     |
| 7    | Create handlers for truly unknown events (`session.unknown`, `unknown.event`)          | ✅     | 18:45     |
| 8    | Update `logEventConfig` to save all data                                               | ✅     | 18:45     |
| 9    | Update `opencode-hooks.ts` to pass `output` correctly                                  | ✅     | 18:45     |
| 10   | Update tests                                                                           | ✅     | 18:45     |
| 11   | Build, lint, test                                                                      | ✅     | 18:47     |

## Files to Modify

1. `.opencode/plugins/types/opencode-hooks.ts` - Union types
2. `.opencode/plugins/helpers/events.ts` - normalizeInputForHandler
3. `.opencode/plugins/helpers/default-handlers.ts` - all handlers
4. `.opencode/plugins/helpers/log-event.ts` - save all data
5. `.opencode/plugins/opencode-hooks.ts` - pass output
6. `test/*.test.ts` - update tests

## Toast Message Format

```typescript
const TRUNCATE_LENGTH = 1000;

const buildAllKeysMessage = (event: NormalizedEvent): string => {
  const lines: string[] = [];

  if (event.type === 'tool.before' || event.type === 'tool.after') {
    for (const [key, value] of Object.entries(event.input)) {
      lines.push(`${key}: ${truncate(JSON.stringify(value))}`);
    }
    if (event.output) {
      for (const [key, value] of Object.entries(event.output)) {
        lines.push(`${key}: ${truncate(JSON.stringify(value))}`);
      }
    }
  } else {
    for (const [key, value] of Object.entries(event.properties)) {
      lines.push(`${key}: ${truncate(JSON.stringify(value))}`);
    }
  }

  return lines.join('\n');
};

const truncate = (str: string): string => {
  if (str.length > TRUNCATE_LENGTH) {
    return str.slice(0, TRUNCATE_LENGTH) + '...';
  }
  return str;
};
```

## Masking Pattern

Apply same regex used in debug mode:

```typescript
const maskSensitive = (str: string): string => {
  return str.replace(
    /(api[_-]?key|token|secret|password|credential)[=:]\s*["']?[\w-]+["']?/gi,
    '$1: [REDACTED]'
  );
};
```

## Unknown Events

Currently logged as unknown (but have handlers):

- `session.unknown` (346 occurrences) - needs handler
- `unknown.event` (51 occurrences) - needs handler

Will create generic handlers that show all keys.

## Result

After implementation:

- ✅ ALL events show ALL keys in toasts
- ✅ ALL events save ALL keys in logs
- ✅ Strong TypeScript typing throughout
- ✅ Truncation at 1000 chars
- ✅ Sensitive value masking
- ✅ Correct unknown event detection
