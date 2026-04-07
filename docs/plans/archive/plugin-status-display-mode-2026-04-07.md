# Plugin Status Display Mode Plan

**Created:** 2026-04-07 15:40  
**Updated:** 2026-04-07 16:06  
**Status:** Completed ✅  
**Feature:** Add user-configurable display mode for plugin status toast with required config

## Context

The plugin shows plugin status at startup (one-shot toast). Currently it displays all 11 plugins (both built-in/bundled and user-configured). User wants to control which plugins are shown via configuration.

## Proposed Configuration

```typescript
// In user-events.config.ts - required object
pluginStatus: {
  enabled: true,           // required
  displayMode: 'user-only' | 'user-separated' | 'all-labeled'  // required
}
```

### Display Modes

1. **user-only** - Shows only user-configured plugins (recommended)
2. **user-separated** - Groups built-in and user plugins
3. **all-labeled** - All plugins with label suffix

## Detection Logic

From logs, distinguish built-in vs user:

- Built-in: `name=PluginName` + message contains `"loading internal plugin"`
- User: `path=...` + message contains `"loading plugin"`

## Execution

| Step                                                  | Status | Timestamp |
| ----------------------------------------------------- | ------ | --------- |
| 1. Add pluginStatus config interface in config.ts     | ✅     | 15:30     |
| 2. Update user-events.config.ts with new config       | ✅     | 15:35     |
| 3. Modify plugin-status.ts to detect built-in vs user | ✅     | 15:45     |
| 4. Update formatPluginStatus() to support 3 modes     | ✅     | 15:50     |
| 5. Wire config to showActivePluginsToast              | ✅     | 15:55     |
| 6. Update tests and ensure coverage                   | ✅     | 16:00     |
| 7. Make pluginStatus fields required                  | ✅     | 16:05     |
| 8. Simplify show-active-plugins.ts (remove fallback)  | ✅     | 16:05     |
| 9. Run build, lint, and tests                         | ✅     | 16:06     |

## Files Modified

1. `.opencode/plugins/helpers/config.ts` - Add `PluginStatusConfig` interface (required fields)
2. `.opencode/plugins/helpers/user-events.config.ts` - Add default config
3. `.opencode/plugins/helpers/plugin-status.ts` - Add detection and format logic
4. `.opencode/plugins/helpers/show-active-plugins.ts` - Pass config to formatter (simplified)

## Default Values

- `enabled`: `true` (show plugin status by default)
- `displayMode`: `'user-only'` (recommended, cleaner for users)
