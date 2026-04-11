## 2026-04-10: Execution

| Step                                                                   | Status |
| ---------------------------------------------------------------------- | ------ |
| 1. Add event name parameter to runScriptAndHandle function             | ✅     |
| 2. Update tool.execute.before handler to pass event type and tool name | ✅     |
| 3. Update tool.execute.after handler to pass event type and tool name  | ✅     |
| 4. Update shell.env handler to pass event type                         | ✅     |
| 5. Add event name to script error toast and log                        | ✅     |
| 6. Increase error toast duration from 5000ms to 15000ms                | ⏳     |
| 7. Verify build and tests pass                                         | ⏳     |

**Status**: Not Completed - Step 6 and 7 not implemented

## Problem

Current SCRIPT ERROR shows:

- Title: "====SCRIPT ERROR===="
- Message: "Script: {scriptName}\nError: {errorMessage}\nCheck user-events.config.ts"

Missing information:

- Event type (e.g., "tool.execute.after", "tool.execute.before", "session.created")
- Tool name for tool events (e.g., "task", "read", "bash")
- Short duration (5000ms) makes it hard to read the error

## Solution

### 1. Update runScriptAndHandle function signature

Current:

```typescript
const runScriptAndHandle = async (
  $: PluginInput['$'],
  script: string,
  arg: string,
  timestamp: string,
  toastQueue: ToastQueue
) => {
```

New:

```typescript
const runScriptAndHandle = async (
  $: PluginInput['$'],
  script: string,
  arg: string,
  timestamp: string,
  toastQueue: ToastQueue,
  eventType: string,
  toolName?: string
) => {
```

### 2. Update error message

Current toast message:

```typescript
title: '====SCRIPT ERROR====',
message: `Script: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
variant: 'error',
duration: 5000,
```

New:

```typescript
title: '====SCRIPT ERROR====',
message: `Event: ${eventType}${toolName ? ` (${toolName})` : ''}\nScript: ${script}\nError: ${errorMessage}\nCheck user-events.config.ts`,
variant: 'error',
duration: 10000,
```

### 3. Update handlers to pass event info

In tool.execute.before:

```typescript
await runScriptAndHandle(
  $,
  script,
  input.tool,
  timestamp,
  toastQueue,
  'tool.execute.before',
  input.tool
);
```

In tool.execute.after:

```typescript
await runScriptAndHandle(
  $,
  script,
  subagentType || input.tool,
  timestamp,
  toastQueue,
  'tool.execute.after',
  input.tool
);
```

In shell.env:

```typescript
await runScriptAndHandle($, script, '', timestamp, toastQueue, 'shell.env');
```

### 4. Update log message

Current:

```typescript
content: `[${timestamp}] - Script error: ${script} - ${errorMessage}\n`,
```

New:

```typescript
content: `[${timestamp}] - Script error: ${eventType}${toolName ? ` (${toolName})` : ''} - ${script} - ${errorMessage}\n`,
```

## Example Output

Toast:

```
====SCRIPT ERROR====
Event: tool.execute.after (task)
Script: log-agent.sh
Error: sh: log-agent.sh: not found
Check user-events.config.ts
```

Log:

```
[2026-04-03T22:50:00.000Z] - Script error: tool.execute.after (task) - log-agent.sh - sh: log-agent.sh: not found
```

Created: 2026-04-03 22:55
