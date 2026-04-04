## Execution

| Step                                                                          | Status | Timestamp |
| ----------------------------------------------------------------------------- | ------ | --------- |
| 1. Update resolveToolConfig in events.ts to merge event base with tool config | ⏳     | -         |
| 2. Test that partial tool configs inherit missing fields from event base      | ⏳     | -         |
| 3. Verify build and tests pass                                                | ⏳     | -         |

## Problem

Current user-events.config.ts structure:

```typescript
events: {
  [EventType.TOOL_EXECUTE_AFTER]: { debug: true, runScripts: false },  // BASE
}
tools: {
  [EventType.TOOL_EXECUTE_AFTER]: {
    task: {},  // empty - should inherit from BASE
    read: {},  // empty - should inherit from BASE
  }
}
```

But current logic treats `{}` as explicit config, not inheriting from event base. This causes:

- Debug stops working
- Script errors appear (runScripts defaults to global: true)

## Solution

Update `resolveToolConfig` in events.ts to:

1. Get event base config: `const eventBase = resolveEventConfig(toolEventType)`
2. Merge with tool config: tool config fields override event base fields
3. This way fields NOT defined in tool config inherit from event base

Implementation:

```typescript
const eventBase = resolveEventConfig(toolEventType);

if (toolConfig === false) {
  return DISABLED_CONFIG;
}

if (!toolConfig || isEmptyObject(toolConfig)) {
  return eventBase; // inherits everything from event base
}

// For partial configs, merge event base with tool overrides
const handler = handlers[toolEventType];
const global = userConfig;

// Resolve scripts (uses eventBase.scripts as fallback if tool has runScripts: true but no scripts)
const scripts = resolveScripts(
  toolConfig,
  eventBase.scripts[0] ?? getDefaultScript(toolEventType),
  global.runScripts
);
const toastCfg = resolveToastOverride(toolConfig);

return {
  ...eventBase, // inherit all from event base
  ...toolConfig, // override with explicit tool values
  toast: resolveToast(toolConfig, global.toast),
  toastTitle: toastCfg?.title ?? handler?.title ?? '',
  toastMessage: toastCfg?.message,
  toastVariant: toastCfg?.variant ?? handler?.variant ?? 'info',
  toastDuration: toastCfg?.duration ?? handler?.duration ?? 2000,
  scripts,
};
```

## Behavior Examples

Given event base: `{ debug: true, runScripts: false }`

| Tool Config                                     | Result                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| `task: {}`                                      | inherits all: `debug: true, runScripts: false`                     |
| `task: { runScripts: true, scripts: ['x.sh'] }` | `debug: true` (inherited), `runScripts: true`, `scripts: ['x.sh']` |
| `task: false`                                   | completely disabled                                                |

## Key Points

- Empty object `{}` → inherits from event base
- Partial config (e.g., `{ runScripts: true }`) → inherits undefined fields from event base, overrides explicit ones
- `false` → disables completely (existing behavior, not affected)

Created: 2026-04-03 14:32
Updated: 2026-04-03 22:50
