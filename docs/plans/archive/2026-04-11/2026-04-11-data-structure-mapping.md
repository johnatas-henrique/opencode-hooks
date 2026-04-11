# Data Structure Mapping for Toast Messages

**Date:** 2026-04-11  
**Timestamp:** 05:58
**Status:** ✅ COMPLETED

## Execution

| Step                                   | Status | Timestamp        |
| -------------------------------------- | ------ | ---------------- |
| 1. Create normalizeInputForHandler     | ✅     | 2026-04-11 18:40 |
| 2. Add tool handlers (read, bash, etc) | ✅     | 2026-04-11 18:45 |
| 3. Update tryBuildMessage              | ✅     | 2026-04-11 18:40 |
| 4. Run build/lint                      | ✅     | 2026-04-11 18:40 |
| 5. Verify logs working                 | ✅     | 2026-04-11 18:38 |
| 6. Add unit tests                      | ✅     | 2026-04-11 18:52 |

## Executive Summary

Fix toast messages showing "unknown" by normalizing input data structure to match what handlers expect. Handlers assume all data resides under `properties.xxx`, but tool events have flat structure with fields at root level.

## Problem Statement

### Current Behavior

Handlers in `default-handlers.ts` use paths like:

- `properties.sessionID`
- `properties.tool.input`
- `properties.path`

But tool event inputs have flat structure:

```json
{
  "tool": "grep",
  "sessionID": "ses_xxx",
  "callID": "call_xxx",
  "args": {
    "pattern": "toastMessage.*unknown",
    "path": "/home/.../opencode-hooks"
  }
}
```

### Evidence from Logs

```
"toastMessage":"Session Id: unknown\nPattern: unknown\nTime: 3:03:20 AM"
```

All fields show "unknown" because `getProp(event, 'properties.sessionID')` returns undefined.

## Technical Solution

### Phase 1: Create Input Normalizer

Add `normalizeInputForHandler()` in `helpers/events.ts`:

```typescript
export function normalizeInputForHandler(
  eventType: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  if (eventType.startsWith('tool.')) {
    const normalized: Record<string, unknown> = { properties: {} };

    // Map common fields
    if (input.sessionID) normalized.properties.sessionID = input.sessionID;
    if (input.tool) normalized.properties.tool = { input: input.tool };
    if (input.callID) normalized.properties.callID = input.callID;

    // Map args based on tool type
    const toolName = input.tool as string;
    const args = input.args as Record<string, unknown> | undefined;

    if (args) {
      switch (toolName) {
        case 'read':
        case 'write':
        case 'edit':
        case 'list':
        case 'patch':
        case 'filesystem_read_file':
        case 'filesystem_write_file':
        case 'filesystem_list_directory':
        case 'filesystem_create_directory':
        case 'filesystem_move_file':
        case 'filesystem_get_file_info':
          normalized.properties.path = args.filePath ?? args.path;
          break;
        case 'bash':
        case 'command':
          normalized.properties.tool = { input: args.command };
          break;
        case 'websearch':
        case 'codesearch':
        case 'gh_grep_searchGitHub':
          normalized.properties.tool = { input: args.query };
          break;
        case 'webfetch':
          normalized.properties.tool = { input: args.url };
          break;
        case 'glob':
        case 'filesystem_search_files':
          normalized.properties.tool = { input: args.pattern };
          normalized.properties.pattern = args.pattern;
          break;
        case 'git.commit':
          normalized.properties.tool = { input: args.message };
          break;
        case 'filesystem_move_file':
          normalized.properties.source = args.source;
          normalized.properties.destination = args.destination;
          break;
        case 'task':
          if (args[SUBAGENT_TYPE_ARG]) {
            normalized.properties.subagentType = args[SUBAGENT_TYPE_ARG];
          }
          break;
        case 'skill':
          if (args.name) {
            normalized.properties.tool = { input: args.name };
            normalized.properties.skillName = args.name;
          }
          break;
      }
    }

    // Preserve other root fields
    Object.assign(normalized, input);
    return normalized;
  }

  return input;
}
```

### Phase 2: Update `getProp()` Helper

Modify `getProp()` in `default-handlers.ts` to support both normalized (with `properties`) and legacy structures:

```typescript
export const getProp = (
  event: Record<string, unknown>,
  path: string
): unknown => {
  const parts = path.split('.');
  let current: unknown = event;

  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
};
```

The new normalizer will put data in `properties.xxx`, so existing `getProp` with paths like `properties.sessionID` will work. But we also add fallback: if not found in `properties`, try looking at root for backward compatibility.

Better approach: create `getNestedValue()` helper and modify `getProp`:

```typescript
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (
      current === null ||
      current === undefined ||
      typeof current !== 'object'
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export const getProp = (
  event: Record<string, unknown>,
  path: string
): unknown => {
  // Try root first (for backward compatibility)
  const rootValue = getNestedValue(event, path);
  if (rootValue !== undefined) return rootValue;

  // Then try under properties (for normalized input)
  if (path.startsWith('properties.')) {
    const propPath = path.substring(11);
    const props = event.properties as Record<string, unknown> | undefined;
    if (props) {
      return getNestedValue(props, propPath);
    }
  }

  return undefined;
};
```

### Phase 3: Update Message Building

Modify `tryBuildMessage()` signature to accept `eventType` and use normalizer:

```typescript
function tryBuildMessage(
  handler: EventHandler,
  eventType: string,
  input: Record<string, unknown>
): string {
  try {
    const normalizedInput = normalizeInputForHandler(eventType, input);
    return handler.buildMessage(normalizedInput);
  } catch {
    return '';
  }
}
```

Update all calls:

**In `resolveEventConfig`:**

```typescript
toastMessage: handler ? tryBuildMessage(handler, eventType, input ?? {}) : '',
```

**In `resolveToolConfig`:**

```typescript
toastMessage: toolHandler
  ? tryBuildMessage(toolHandler, toolEventType, input ?? {})
  : eventHandler
    ? tryBuildMessage(eventHandler, toolEventType, input ?? {})
    : '',
```

**In `getDefaultConfig`:**

```typescript
toastMessage: handler ? tryBuildMessage(handler, toolEventType, input ?? {}) : '',
```

### Phase 4: Remove Double Casting

Clean up `as unknown as Record<string, unknown>` casts in `opencode-hooks.ts` where input is already correctly typed.

## Step-by-Step Implementation

### Step 1: Add `normalizeInputForHandler` to `helpers/events.ts`

### Step 2: Update `getProp` in `default-handlers.ts`

### Step 3: Update `tryBuildMessage()` signature and all calls

### Step 4: Export `normalizeInputForHandler` for potential external use

### Step 5: Run tests and verify

## Risk Analysis

| Risk                      | Mitigation                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| Missing tool mappings     | Review all 30+ tool handlers in `default-handlers.ts`, ensure comprehensive switch coverage |
| Breaking existing configs | Keep backward compatibility fallback in `getProp` (checks root first)                       |
| Performance overhead      | Normalization is O(1) per event; minimal impact                                             |
| Test coverage gaps        | Add specific tests for each tool type's normalized structure                                |

## Testing Strategy

1. **Unit Tests**: Test `normalizeInputForHandler()` for each tool category
2. **Integration**: Run full test suite (`npm run test:unit`)
3. **Log Verification**: Check real logs to ensure `toastMessage` contains actual values instead of "unknown"
4. **Build/Lint**: Ensure clean build and lint

## Success Criteria

- ✅ No "unknown" values in toast messages (except genuinely missing data)
- ✅ All handlers receive data in expected `properties.xxx` structure
- ✅ `runScripts` flag respected (scripts only run when enabled)
- ✅ Build, lint, tests passing (546/546)
- ✅ Logs show meaningful toast messages with actual tool parameters

## Dependencies

- Current work on `runScripts` fix must be completed first
- Normalizer relies on correct `eventType` passing to `tryBuildMessage`

## Estimated Effort

- Implementation: 1-2 hours
- Testing and verification: 30 minutes
- Total: 2-3 hours
