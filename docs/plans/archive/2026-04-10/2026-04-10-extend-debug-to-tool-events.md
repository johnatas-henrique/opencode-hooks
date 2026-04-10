# Extend Debug to Tool Events Plan

**Date**: 2026-04-10
**Status**: Not Completed
**Archived**: 2026-04-10

## Execution

| Step                                                | Status | Timestamp |
| --------------------------------------------------- | ------ | --------- |
| 1. Add debug logging to tool.execute.before handler | ⏳     | -         |
| 2. Add debug logging to tool.execute.after handler  | ⏳     | -         |

## Overview

The current debug feature only works for the `event` handler. Need to extend it to also work for `tool.execute.before` and `tool.execute.after` handlers.

## Implementation Details

### 1. tool.execute.before handler

In opencode-hooks.ts, after line where `resolved` is created (around line 250), add debug check:

```typescript
if (userConfig.debug) {
  const debugMessage = JSON.stringify({ input, resolved }, null, 2);
  toastQueue.add({
    title: 'DEBUG TOOL.BEFORE',
    message: debugMessage,
    variant: 'info',
    duration: 10000,
  });
  await saveToFile({
    content: `[${new Date().toISOString()}] - tool.execute.before - ${input.tool}\n${debugMessage}\n`,
    filename: DEBUG_LOG_FILE,
    showToast: toastQueue.add,
  });
}
```

### 2. tool.execute.after handler

In opencode-hooks.ts, after line where `resolved` is created (around line 276), add similar debug check:

```typescript
if (userConfig.debug) {
  const debugMessage = JSON.stringify({ input, output, resolved }, null, 2);
  toastQueue.add({
    title: 'DEBUG TOOL.AFTER',
    message: debugMessage,
    variant: 'info',
    duration: 10000,
  });
  await saveToFile({
    content: `[${new Date().toISOString()}] - tool.execute.after - ${input.tool}\n${debugMessage}\n`,
    filename: DEBUG_LOG_FILE,
    showToast: toastQueue.add,
  });
}
```

This will allow users to see the full input/output/args for tool events when debug is enabled.
