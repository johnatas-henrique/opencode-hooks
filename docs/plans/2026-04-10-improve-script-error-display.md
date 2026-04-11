## 2026-04-10: Execution

| Step                                                               | Status |
| ------------------------------------------------------------------ | ------ |
| 1. Update runScriptAndHandle to show only toolName for tool events | ⏳     |
| 2. Test build and lint pass                                        | ⏳     |

**Status**: Not Completed - Steps not implemented

## Problem

Current SCRIPT ERROR display shows redundant event type for tool events:

**Currently:**

- `Event: tool.execute.after (task)` - redundant "tool.execute.after"
- `Event: tool.execute.before (bash)` - redundant "tool.execute.before"

**Expected:**

- `Event: task` - just the tool name
- `Event: bash` - just the tool name
- `Event: shell.env` - keep original for non-tool events

## Solution

Update the runScriptAndHandle function in opencode-hooks.ts to format the event display differently based on event type.

Current logic:

```typescript
const eventInfo = `${eventType}${toolName ? ` (${toolName})` : ''}`;
```

New logic:

```typescript
const formatEventInfo = (eventType: string, toolName?: string): string => {
  // For tool events (tool.execute.before, tool.execute.after), show only the tool name
  if (eventType.startsWith('tool.execute.') && toolName) {
    return toolName;
  }
  // For all other events, show the full event type
  return eventType;
};

const eventInfo = formatEventInfo(eventType, toolName);
```

This pattern can support future sub-events if they are added to OpenCode (e.g., message._, permission._, pty.\*).

## Example Output

| Event Type          | Tool Name | Display                  |
| ------------------- | --------- | ------------------------ |
| tool.execute.after  | task      | `Event: task`            |
| tool.execute.before | bash      | `Event: bash`            |
| tool.execute.after  | read      | `Event: read`            |
| shell.env           | -         | `Event: shell.env`       |
| session.created     | -         | `Event: session.created` |

Created: 2026-04-03 23:55
