# Verification Plan: toastMessage and Scripts Population

**Created**: 2026-04-11  
**Status**: ⏳ Pending

## Execution

| Step                                              | Status | Timestamp |
| ------------------------------------------------- | ------ | --------- |
| 1. Analyze root causes                            | ⏳     | -         |
| 2. Create test for toastMessage handler selection | ⏳     | -         |
| 3. Fix toastMessage in opencode-hooks.ts          | ⏳     | -         |
| 4. Fix getDefaultConfig to include defaultScript  | ⏳     | -         |
| 5. Add test for scripts population                | ⏳     | -         |
| 6. Run all tests                                  | ⏳     | -         |
| 7. Verify with integration smoke test             | ⏳     | -         |

---

## Analysis Summary

### Issue 1: toastMessage Not Showing for Tool Events

**Root Cause**:  
In `opencode-hooks.ts:82-88`, when `resolved.toast` is true, the code selects the handler for `buildMessage` using `handlers[eventType]`:

```typescript
const handler = handlers[eventType];
const message =
  resolved.toastMessage ?? (handler ? handler.buildMessage(input) : eventType);
```

For tool events (e.g., `tool.execute.before`, `tool.execute.after`), the correct handler should be the tool-specific one (`tool:read`, `tool:write`, etc.) stored in `handlers['tool:${toolName}']`. The current code uses the generic event handler (`tool.execute.before`), which produces generic messages (e.g., "Session Id: ...\nTool: ...") instead of tool-specific ones (e.g., "File: path").

**Expected Behavior**:  
When executing a tool event hook with `toolName` provided, use `getToolHandler(toolName)` to get the tool-specific handler for `buildMessage`, falling back to the event handler if tool handler is not available.

### Issue 2: Scripts Not Populated When No Explicit Config

**Root Cause**:  
In `events.ts:337-353`, `getDefaultConfig` is called when there is no user config for a tool event type. This function returns a `ResolvedEventConfig` with `scripts: []` and does NOT incorporate the handler's `defaultScript`:

```typescript
function getDefaultConfig(toolEventType: string): ResolvedEventConfig {
  const handler = handlers[toolEventType];
  // ...
  return {
    // ...
    scripts: [], // ❌ Empty, should include handler?.defaultScript when toast is true
  };
}
```

When `resolveToolConfig` falls back to this function, the resulting `baseWithToolHandler.scripts` remains empty if the eventBase has empty scripts and there's no further override that provides a script.

**Expected Behavior**:  
`getDefaultConfig` should respect the same logic as `resolveEventConfig` when `toast` defaults to true: include the handler's `defaultScript` in the `scripts` array.

---

## Files to Modify

1. `.opencode/plugins/opencode-hooks.ts` — Fix handler selection for toastMessage
2. `.opencode/plugins/helpers/events.ts` — Fix `getDefaultConfig` to include `defaultScript`

---

## Code Changes

### Change 1: opencode-hooks.ts (lines 82-96)

**Current Code**:

```typescript
if (resolved.toast) {
  const handler = handlers[eventType];
  const message =
    resolved.toastMessage ??
    (handler
      ? handler.buildMessage((input ?? {}) as Record<string, unknown>)
      : eventType);

  useGlobalToastQueue().add({
    title: resolved.toastTitle,
    message: message.trim().replace(/^\s+/gm, ''),
    variant: resolved.toastVariant,
    duration: resolved.toastDuration,
  });
}
```

**Proposed Fix**:

```typescript
if (resolved.toast) {
  // For tool events, use tool-specific handler if available
  let handler = handlers[eventType];
  if (toolName && !handlers[eventType]?.buildMessage) {
    const toolHandler = handlers[`tool:${toolName}`];
    if (toolHandler) {
      handler = toolHandler;
    }
  }

  const message =
    resolved.toastMessage ??
    (handler
      ? handler.buildMessage((input ?? {}) as Record<string, unknown>)
      : eventType);

  useGlobalToastQueue().add({
    title: resolved.toastTitle,
    message: message.trim().replace(/^\s+/gm, ''),
    variant: resolved.toastVariant,
    duration: resolved.toastDuration,
  });
}
```

**Rationale**:

- If `toolName` is provided and the event handler doesn't have a custom `buildMessage` (or is undefined), try the tool-specific handler.
- This preserves backward compatibility: if a tool-specific handler exists, it's used; otherwise fall back to event handler.

### Change 2: events.ts — getDefaultConfig (lines 337-353)

**Current Code**:

```typescript
function getDefaultConfig(toolEventType: string): ResolvedEventConfig {
  const handler = handlers[toolEventType];
  const defaultCfg = userConfig.default;

  return {
    enabled: true,
    debug: getWithDefault(true, defaultCfg, 'debug', false),
    toast: getWithDefault(true, defaultCfg, 'toast', false),
    toastTitle: handler?.title ?? '',
    toastMessage: undefined,
    toastVariant: handler?.variant ?? 'info',
    toastDuration: handler?.duration ?? 2000,
    scripts: [], // ← Problem: should include defaultScript if toast is true
    saveToFile: getWithDefault(true, defaultCfg, 'saveToFile', false),
    appendToSession: getWithDefault(true, defaultCfg, 'appendToSession', false),
    runOnlyOnce: false,
  };
}
```

**Proposed Fix**:

```typescript
function getDefaultConfig(toolEventType: string): ResolvedEventConfig {
  const handler = handlers[toolEventType];
  const defaultCfg = userConfig.default;
  const toastEnabled = getWithDefault(true, defaultCfg, 'toast', false);
  const shouldRunScripts = toastEnabled && !!handler?.defaultScript;

  return {
    enabled: true,
    debug: getWithDefault(true, defaultCfg, 'debug', false),
    toast: toastEnabled,
    toastTitle: handler?.title ?? '',
    toastMessage: undefined,
    toastVariant: handler?.variant ?? 'info',
    toastDuration: handler?.duration ?? 2000,
    scripts:
      shouldRunScripts && handler?.defaultScript ? [handler.defaultScript] : [],
    saveToFile: getWithDefault(true, defaultCfg, 'saveToFile', false),
    appendToSession: getWithDefault(true, defaultCfg, 'appendToSession', false),
    runOnlyOnce: false,
  };
}
```

**Alternative**: Consider calling `resolveEventConfig` from `getDefaultConfig` to share logic, but careful: `resolveEventConfig` uses `userConfig.events` which is undefined for the tool event type. Could instead refactor to reuse script resolution. For now, minimal fix.

**Rationale**:

- When `toast` is enabled (default from global config) and a handler has a `defaultScript`, include that script in the `scripts` array.
- This ensures `runScripts` effectively runs (since `scripts` non-empty and `enabled: true`).

---

## Test Scenarios

### New Test: toastMessage Handler Selection for Tools

**File**: `test/unit/toast-message-handler-selection.test.ts`

```typescript
describe('toastMessage handler selection for tool events', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should use tool-specific handler buildMessage for tool.execute.after when toolName is provided', () => {
    // Mock handlers
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: 'GENERIC TOOL AFTER',
          variant: 'info',
          duration: 2000,
          defaultScript: 'generic.sh',
          buildMessage: (input) => `generic: ${input.tool}`,
        },
        'tool:read': {
          title: 'FILE READ',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-read.sh',
          buildMessage: (input) => `File: ${input.path}`,
        },
      },
    }));

    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true },
        events: {},
        tools: {},
      },
    }));

    const { executeHook } = require('../../.opencode/plugins/opencode-hooks');
    const {
      resolveToolConfig,
    } = require('../../.opencode/plugins/helpers/events');

    // Simulate tool:read configuration (no explicit toastMessage)
    const resolved = resolveToolConfig('tool.execute.after', 'read');
    resolved.toast = true; // ensure toast is enabled

    // Mock toast queue to capture message
    const mockAdd = jest.fn();
    const {
      useGlobalToastQueue,
    } = require('../../.opencode/plugins/helpers/toast-queue');
    useGlobalToastQueue.mockImplementation(() => ({ add: mockAdd }));

    // Call executeHook with toolName='read' and input containing path
    await executeHook({
      ctx: { client: { tui: { showToast: jest.fn() } }, $: jest.fn() },
      eventType: 'tool.execute.after',
      resolved,
      sessionId: 'test-session',
      input: { tool: 'read', path: '/home/user/file.txt' },
      toolName: 'read',
    });

    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'FILE READ',
        message: 'File: /home/user/file.txt',
      })
    );
  });

  it('should fall back to event handler when tool-specific handler missing', () => {
    // Similar setup but without tool:read handler
    // Expect message from tool.execute.after handler
  });
});
```

### New Test: Scripts Population in getDefaultConfig

**File**: `test/unit/default-config-scripts.test.ts`

```typescript
describe('getDefaultConfig scripts population', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should include handler defaultScript in scripts when toast is enabled', () => {
    jest.doMock('../../.opencode/plugins/helpers/default-handlers', () => ({
      handlers: {
        'tool.execute.after': {
          title: 'TOOL AFTER',
          variant: 'info',
          duration: 2000,
          defaultScript: 'tool-execute-after.sh',
          buildMessage: () => 'test',
        },
      },
    }));

    jest.doMock('../../.opencode/plugins/helpers/user-events.config', () => ({
      userConfig: {
        enabled: true,
        default: { toast: true }, // toast enabled by default
        events: {},
        tools: {},
      },
    }));

    const {
      getDefaultConfig,
    } = require('../../.opencode/plugins/helpers/events');
    const config = getDefaultConfig('tool.execute.after');

    expect(config.scripts).toContain('tool-execute-after.sh');
    expect(config.scripts.length).toBe(1);
  });

  it('should return empty scripts when toast is disabled', () => {
    // Mock with default toast: false
    // Expect scripts = []
  });

  it('should return empty scripts when handler has no defaultScript', () => {
    // Mock handler without defaultScript
    // Expect scripts = []
  });
});
```

### Existing Tests to Update/Verify

The existing `tool-handlers-precedence.test.ts` tests already verify titles and durations. Add assertions to check `scripts` field:

```typescript
it('should use tool handler defaultScript when tool config is empty', () => {
  // ... existing setup
  const config = rtc('tool.execute.after', 'read');
  expect(config.scripts).toContain('tool-execute-after-read.sh');
});
```

---

## Backward Compatibility Considerations

- **toastMessage change**: For tool events that previously showed generic messages (because tool-specific handler existed but wasn't being used for `buildMessage`), this fix changes the message content to be tool-specific. This is a **behavioral improvement**, not a breaking change. Users who relied on the generic message might see different toasts; however, the generic case was effectively a bug.
- **scripts change**: Adding `defaultScript` to `getDefaultConfig` makes `runScripts` run by default (when toast is enabled). If users previously worked around this by explicitly setting scripts, no change. If they relied on scripts NOT running by default for tool events without explicit config, this could be a change. However, the design intent is that handlers define defaultScripts to be executed, so this aligns with expectations.

Both changes are **non-breaking** in the sense that they enable expected behavior that was previously broken. They should not break existing configurations that explicitly set scripts/disable toast.

---

## Step-by-Step Execution Plan

1. **2026-04-11 10:00** — Write failing tests for both issues
   - Create `test/unit/toast-message-handler-selection.test.ts`
   - Create `test/unit/default-config-scripts.test.ts`
   - Run tests and confirm they fail

2. **2026-04-11 10:30** — Fix toastMessage handler selection
   - Edit `opencode-hooks.ts` to use tool-specific handler for `buildMessage`
   - Verify toastMessage test now passes

3. **2026-04-11 11:00** — Fix getDefaultConfig scripts population
   - Edit `events.ts` `getDefaultConfig` to include `handler?.defaultScript` when appropriate
   - Verify scripts population test passes

4. **2026-04-11 11:30** — Update existing tests
   - Add script assertions to `tool-handlers-precedence.test.ts`
   - Ensure all existing tests still pass

5. **2026-04-11 12:00** — Run full test suite
   - `npm run test:unit`
   - `npm run test:ci` if coverage required
   - Verify no regressions

6. **2026-04-11 12:30** — Integration verification
   - Run `test/integration/smoke-tool-handlers.ts` manually or ensure CI covers it
   - Check logs to confirm toast messages appear and scripts run

7. **2026-04-11 13:00** — Final review and ready for commit
   - `npm run build && npm run lint`
   - Ensure code follows project conventions (no unnecessary comments)
   - Document changes in plan completion

---

## Success Criteria

- ✅ Toast messages for tool events show tool-specific details (e.g., file path for `read` tool)
- ✅ When no explicit config exists for a tool event, the defaultScript from the tool handler is included in `resolved.scripts`
- ✅ All existing tests pass
- ✅ New tests validate both behaviors
- ✅ `npm run lint` passes with no errors
