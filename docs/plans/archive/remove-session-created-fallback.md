# Remove Plugin Status Fallback in session.created

## Problem

The plugin status toast shows again in session.created after 15+ seconds when other plugins overwrite it, causing unnecessary delay and noise.

## Solution

Remove the fallback logic in session.created that shows the plugin status toast again when wasOverwritten is true.

## Execution

| Step                                                                | Status | Timestamp           |
| ------------------------------------------------------------------- | ------ | ------------------- |
| 1. Remove fallback logic in session.created event handler           | ✅     | 2026-04-04 13:45:00 |
| 2. Change timeout from 5s to 15s                                    | ✅     | 2026-04-04 13:50:00 |
| 3. Remove overwrite detection (wasOverwritten, checkOverwriteTimer) | ✅     | 2026-04-04 13:50:00 |

## Changes

### .opencode/plugins/opencode-hooks.ts

Remove lines 193-206:

```typescript
if (event.type === 'session.created' && wasOverwritten && !fallbackShown) {
  const props = event.properties as Record<string, unknown>;
  const info = props?.info as Record<string, unknown> | undefined;
  const title = typeof info?.title === 'string' ? info.title : '';

  if (!isSubagentSession(title)) {
    fallbackShown = true;
    await showActivePluginsToast(toastQueue, { duration: 5000 });
  }
}
```

This removes:

- The `wasOverwritten` check
- The `fallbackShown` variable
- The `isSubagentSession` helper (only used here, can verify if still needed)
