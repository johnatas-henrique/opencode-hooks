# Debug Feature Plan

Created: 2026-04-03 19:25

## Execution

| Step | Status | Timestamp |
| ---- | ------ | --------- |
| 1. Add `debug?: boolean` to EventOverride and ToolOverride in event-types.ts | ⏳ | - |
| 2. Remove top-level `debug` from UserEventsConfig | ⏳ | - |
| 3. Add granular debug config to user-events.config.ts for tool.execute.before/after | ⏳ | - |
| 4. Update events.ts to resolve debug per event | ⏳ | - |
| 5. Update opencode-hooks.ts to use resolved debug config | ⏳ | - |

## Overview

Add a `debug` configuration option that works **granularly** for each event, following the same pattern as `toast`, `scripts`, `runOnce`, etc.

- Shows a 10-second toast with the complete event object
- Saves the full event object to a separate file: `session_debug_events.log`
- Can be enabled per-event or per-tool (like other config options)
- Works for ALL events (including tool.execute.after, tool.execute.before, file.*, etc.)

## Example Configuration

```typescript
events: {
  [EventType.TOOL_EXECUTE_AFTER]: { debug: true },
  [EventType.TOOL_EXECUTE_BEFORE]: { debug: true },
  [EventType.SESSION_CREATED]: false,
  [EventType.FILE_EDITED]: { debug: true },
}

tools: {
  [EventType.TOOL_EXECUTE_AFTER]: {
    task: { debug: true },
    chat: { debug: false },
  }
}
```

## Implementation Details

### 1. event-types.ts

- Add `debug?: boolean` to `EventOverride` interface
- Add `debug?: boolean` to `ToolOverride` interface
- Remove `debug: boolean` from top-level `UserEventsConfig`

### 2. user-events.config.ts

Add granular debug config per event:

```typescript
events: {
  [EventType.TOOL_EXECUTE_AFTER]: { debug: true },
  [EventType.TOOL_EXECUTE_BEFORE]: { debug: true },
},
tools: {
  [EventType.TOOL_EXECUTE_AFTER]: {
    task: { debug: true },
  },
}
```

### 3. events.ts

Add `debug: boolean` to `ResolvedEventConfig` interface. Update `resolveEventConfig()` and `resolveToolConfig()` to include debug in resolved config.

### 4. opencode-hooks.ts

In each handler, check `resolved.debug` instead of `userConfig.debug`. If true, show toast and save to debug log.