# Replace console.warn in events.ts

## Problem

`console.warn` at line 145 in events.ts pollutes the TUI with warnings about unconfigured events.

## Solution

Replace console.warn with a Toast message via queue or save to log file. Since this is called during plugin initialization, we need to use the toast queue that's passed to the event handler, or save to the log file directly.

## Execution

| Step                                         | Status | Timestamp           |
| -------------------------------------------- | ------ | ------------------- |
| 1. Replace console.warn with saveToFile call | ✅     | 2026-04-04 13:58:00 |

## Changes

### .opencode/plugins/helpers/events.ts

Replace lines 145-147:

```typescript
console.warn(
  `[opencode-hooks] Event '${eventType}' not configured. Add it to events config or set to false to disable.`
);
```

With:

```typescript
await saveToFile({
  content: `[WARN] Event '${eventType}' not configured. Add it to events config or set to false to disable.\n`,
});
```

Note: Import saveToFile if not already imported.
