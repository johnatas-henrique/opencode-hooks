## Execution

| Step                                                                    | Status | Timestamp |
| ----------------------------------------------------------------------- | ------ | --------- |
| 1. Update user-events.config.ts to show granular debug per tool example | ✅     | -         |
| 2. Explain how to use granular debug in README or docs                  | ✅     | -         |

## 2026-04-10: Overview

The current implementation already supports granular debug per tool via the `tools` configuration section. This plan documents how to use it and provides examples.

## Background

From the SDK, the `tool` parameter in `ToolExecuteAfterInput` and `ToolExecuteBeforeInput` is a string that can be any available tool in OpenCode. The list is dynamic because:

1. Users can create custom tools
2. MCP servers can add tools
3. OpenCode can add more built-in tools

Tools observed in debug log:

- `read` - File reading tool
- `glob` - File pattern matching tool
- `task` - Subagent calling tool
- `chat` - Chat tool
- `bash` - Terminal commands (inferred from docs)

## Example Configuration

Currently configured in user-events.config.ts:

```typescript
events: {
  [EventType.TOOL_EXECUTE_AFTER]: { debug: true },
  [EventType.TOOL_EXECUTE_BEFORE]: { debug: true },
}
```

To enable debug ONLY for specific tools, use the `tools` section:

```typescript
tools: {
  [EventType.TOOL_EXECUTE_AFTER]: {
    task: { debug: true },
    read: { debug: false },
    glob: { debug: false },
  },
  [EventType.TOOL_EXECUTE_BEFORE]: {
    task: { debug: true },
    read: { debug: false },
    glob: { debug: false },
  },
}
```

The system resolves in this order:

1. Check if tool-specific config exists in `tools` section
2. If not found, fall back to event-level config in `events` section
3. If neither, use global defaults (debug: false)

## Implementation Details

### 1. user-events.config.ts

Update to show both approaches:

- Keep event-level debug as default for all tools
- Add tools section showing granular per-tool configuration
- Add comment explaining the resolution order

### 2. Documentation

Update README.md to explain:

- How debug works per event
- How debug works per tool
- The resolution order (tool-specific → event-level → global)
