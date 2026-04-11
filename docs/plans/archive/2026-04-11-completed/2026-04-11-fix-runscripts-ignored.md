# Fix: runScripts Ignored - Scripts Execute Despite false

**Date:** 2026-04-11  
**Timestamp:** 06:05

## Problem

Logs show scripts executing even when `runScripts: false`:

```json
{
  "type": "EVENT_OUTPUT",
  "data": "tool.execute.before",
  "resolvedConfig": {
    "runScripts": false,
    "scripts": ["tool-execute-grep.sh"]  <-- Should be [] when runScripts: false
  }
}
```

Followed by:

```json
{
  "type": "SCRIPT_ERROR",
  "data": "tool-execute-grep.sh",
  "errorMessage": "Failed with exit code 1"
}
```

## Root Cause

Two locations were populating `scripts` array without respecting `runScripts` flag:

### 1. `getDefaultConfig()` (line 391-392 in events.ts)

```typescript
scripts:
  toastEnabled && handler?.defaultScript ? [handler.defaultScript] : [],
```

This uses `toastEnabled` instead of `runScripts`. Scripts were being added even when `runScripts: false`.

### 2. `baseWithToolHandler` construction in `resolveToolConfig()` (line 304-306)

```typescript
scripts: toolHandler?.defaultScript
  ? [toolHandler.defaultScript]
  : eventBase.scripts,
```

This unconditionally adds handler's defaultScript without checking `runScripts`.

## Solution

### Change 1: Fix `getDefaultConfig()`

```typescript
const runScripts = getWithDefault(undefined, defaultCfg, 'runScripts', false);
const scripts =
  runScripts && handler?.defaultScript ? [handler.defaultScript] : [];

return {
  // ... other fields
  scripts,
  runScripts,
  // ...
};
```

### Change 2: Fix `resolveToolConfig()` baseWithToolHandler

Remove the `scripts` field from `baseWithToolHandler`, let it inherit from `eventBase`:

```typescript
const baseWithToolHandler: ResolvedEventConfig = {
  ...eventBase,
  toastTitle: toolHandler?.title ?? eventHandler?.title,
  toastMessage: toolHandler
    ? tryBuildMessage(toolHandler, input ?? {})
    : eventHandler
      ? tryBuildMessage(eventHandler, input ?? {})
      : '',
  toastVariant: toolHandler?.variant ?? eventHandler?.variant,
  toastDuration: toolHandler?.duration ?? eventHandler?.duration,
  // scripts and runScripts come from eventBase (already correctly resolved)
};
```

The `resolveScripts()` function in the final return already properly handles `runScripts` from toolConfig overrides.

## Testing

- Build: `npm run build`
- Lint: `npm run lint`
- Tests: `npm run test:unit`
- Verify logs: Check that `scripts: []` when `runScripts: false`

## Success Criteria

- ✅ `scripts` array is empty when `runScripts: false`
- ✅ Scripts only execute when `runScripts: true` (from config or handler default)
- ✅ No SCRIPT_ERROR entries for disabled scripts
- ✅ Build, lint, tests passing
