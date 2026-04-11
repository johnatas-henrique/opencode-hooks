# Plan: Fix Handler Selection, runScripts, and toastMessage

**Created**: 2026-04-10 22:45
**Status**: Draft

## Problems Identified

### 1. Handler Selection Logic Bug

**Location**: `opencode-hooks.ts:84`
**Root Cause**: Condition `!handler?.buildMessage` is always FALSE because all handlers have `buildMessage`

```typescript
// CURRENT (BUGGY):
if (toolName && !handler?.buildMessage) {  // always false!
```

### 2. Inconsistent Handler Definitions

Two patterns exist:

- `createHandler({ props: {...} })` - generates `buildMessage` from props
- Object literal with custom `buildMessage`

### 3. runScripts and toastMessage Missing from Log

**Root Cause**: Neither field is in `ResolvedEventConfig`

### 4. Scripts Executing When Shouldn't

Scripts run when `toast: true` because `defaultScript` auto-included without checking `runScripts`.

---

## Execution Table

| Step | Description                                             | Status | Timestamp |
| ---- | ------------------------------------------------------- | ------ | --------- |
| 1    | Modify createHandler to accept optional buildMessage    | ⏳     | -         |
| 2    | Migrate 4 custom buildMessage handlers to createHandler | ⏳     | -         |
| 3    | Add runScripts and toastMessage to ResolvedEventConfig  | ⏳     | -         |
| 4    | Fix handler selection logic in opencode-hooks.ts        | ⏳     | -         |
| 5    | Add runScripts to resolved config in events.ts          | ⏳     | -         |
| 6    | Add runScripts and toastMessage to log output           | ⏳     | -         |
| 7    | Update tests                                            | ⏳     | -         |
| 8    | Run tests and verify                                    | ⏳     | -         |

---

## Code Changes

### Step 1: Modify createHandler (default-handlers.ts)

**HandlerConfig interface**:

```typescript
interface HandlerConfig {
  title: string;
  variant: EventHandler['variant'];
  duration: number;
  defaultScript: string;
  props?: Record<string, string>; // NOW OPTIONAL
  buildMessage?: (event) => string; // NOW ALLOWED
}
```

**createHandler function**:

```typescript
const createHandler = (config: HandlerConfig): EventHandler => ({
  title: config.title,
  variant: config.variant,
  duration: config.duration,
  defaultScript: config.defaultScript,
  buildMessage:
    config.buildMessage ??
    ((event) => {
      const lines = Object.entries(config.props ?? {})
        .map(([label, path]) => `${label}: ${toStr(getProp(event, path))}`)
        .join('\n');
      return `${lines}\nTime: ${formatTime()}`;
    }),
});
```

### Step 2: Migrate Custom Handlers (4 handlers)

**session.error**, **session.status**, **lsp.client.diagnostics**, **todo.updated**:
Convert from object literal to `createHandler({ buildMessage: ... })`

### Step 3: Add fields to ResolvedEventConfig (config.ts)

```typescript
export interface ResolvedEventConfig {
  // ... existing fields ...
  toastMessage: string; // NOT optional
  runScripts: boolean; // NEW
}
```

### Step 4: Fix Handler Selection (opencode-hooks.ts)

```typescript
// BEFORE:
if (toolName && !handler?.buildMessage) { ... }

// AFTER:
if (toolName) { ... }
```

### Step 5: Add runScripts to resolved config (events.ts)

Compute `runScripts`:

- Use `toolConfig.runScripts` if defined
- Otherwise use `userConfig.default.runScripts`
- Default to `false`

### Step 6: Log output (log-event.ts)

Include `runScripts` and `toastMessage` in logged `resolvedConfig`.

---

## Files to Modify

1. `.opencode/plugins/helpers/default-handlers.ts` - 6 changes
2. `.opencode/plugins/helpers/config.ts` - 2 changes
3. `.opencode/plugins/opencode-hooks.ts` - 1 change
4. `.opencode/plugins/helpers/events.ts` - add runScripts
5. `.opencode/plugins/helpers/log-event.ts` - add to log

---

## Verification

1. Logs show `runScripts` and `toastMessage` fields
2. Toast messages show tool-specific content
3. Scripts only run when `runScripts: true` or explicit `scripts`
4. All tests pass
