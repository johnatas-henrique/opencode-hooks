# 2026-04-11: Global Flags for Logging and Plugin Status

## Execution

| Step                                                   | Status | Timestamp        |
| ------------------------------------------------------ | ------ | ---------------- |
| 1. Add logDisabledEvents?: boolean to UserEventsConfig | ✅     | 2026-04-11 14:35 |
| 2. Add showPluginStatus?: boolean to UserEventsConfig  | ✅     | 2026-04-11 14:35 |
| 3. Add pluginStatusDisplayMode?: to UserEventsConfig   | ✅     | 2026-04-11 14:35 |
| 4. Remove PluginStatusConfig interface from config.ts  | ✅     | 2026-04-11 14:35 |
| 5. Modify executeHook to use logDisabledEvents         | ✅     | 2026-04-11 14:36 |
| 6. Modify show-active-plugins.ts to use new flat keys  | ✅     | 2026-04-11 14:36 |
| 7. Update user-events.config.ts with new values        | ✅     | 2026-04-11 14:36 |
| 8. Add unit tests for logDisabledEvents                | ✅     | 2026-04-11 14:37 |
| 9. Update tests for removed PluginStatusConfig         | ✅     | 2026-04-11 14:37 |
| 10. Build, lint and test                               | ✅     | 2026-04-11 14:37 |

**Status**: ✅ Completed

## Problem

1. **EVENT_DISABLED logging**: When an event is disabled, the code still calls `saveToFile` with `EVENT_DISABLED`, polluting logs with events that are not interesting in most cases during debug.

2. **pluginStatus object**: The `pluginStatus` object is nested (e.g., `{ enabled: true, displayMode: 'user-only' }`), but it could be flattened for simplicity.

## Solution

### 1. New flat flags in UserEventsConfig (config.ts)

```typescript
export interface UserEventsConfig {
  enabled: boolean;
  logDisabledEvents?: boolean; // NEW: don't save EVENT_DISABLED
  showPluginStatus?: boolean; // NEW: flatten pluginStatus.enabled
  pluginStatusDisplayMode?: PluginStatusDisplayMode; // NEW: flatten pluginStatus.displayMode
  default?: EventOverride;
  // events and tools...
  // REMOVE: pluginStatus: PluginStatusConfig
}

// REMOVE: PluginStatusConfig interface (or keep but unused)
```

### 2. executeHook modification (opencode-hooks.ts)

```typescript
if (!resolved.enabled) {
  if (!userConfig.logDisabledEvents) {
    return; // Don't save EVENT_DISABLED to log
  }
  await saveToFile({
    content: JSON.stringify({
      timestamp,
      type: 'EVENT_DISABLED',
      data: eventType,
    }),
    showToast: useGlobalToastQueue().add,
  });
  return;
}
```

### 3. show-active-plugins.ts modification

```typescript
const showStatus = userConfig.showPluginStatus ?? true;
const displayMode = userConfig.pluginStatusDisplayMode ?? 'user-only';

if (!showStatus) {
  return;
}
// ... use displayMode
```

### 4. user-events.config.ts update

```typescript
export const userConfig: UserEventsConfig = {
  enabled: true,
  logDisabledEvents: false, // default: don't save
  showPluginStatus: true, // maintain current behavior
  pluginStatusDisplayMode: 'user-only',
  // ...
};
```

## Tests to Add/Update

### New tests:

- `test/unit/config.test.ts` or `test/unit/events.test.ts`:
  - Test that `EVENT_DISABLED` is NOT saved when `logDisabledEvents: false`
  - Test that `EVENT_DISABLED` IS saved when `logDisabledEvents: true`

### Tests to update:

- Tests referencing `pluginStatus` object structure
- Tests referencing `PluginStatusConfig` interface

## Verification Commands

```bash
npm run build
npm run lint
npm run test
```

Created: 2026-04-11
