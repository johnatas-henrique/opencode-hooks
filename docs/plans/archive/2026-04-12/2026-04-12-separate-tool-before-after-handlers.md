# Separate tool:before and tool:after handlers

## Problem

Currently, tool-specific handlers (like `tool:skill`, `tool:bash`, etc.) do not distinguish between `before` and `after` phases. This creates two issues:

1. **Toast titles don't show phase**: Users cannot tell if a toast is for `tool.execute.before` or `tool.execute.after`
2. **Cannot block in before**: Without separate handlers, it's harder to configure blocking scripts for before phase

## Goal

1. Create separate handlers for each tool's `before` and `after` phases
2. Toast titles should show the phase: `====SKILL BEFORE====` vs `====SKILL AFTER====`
3. Allow users to configure blocking scripts in `tool.execute.before` phase
4. Unified naming: handlers use `tool.execute.{phase}.{toolName}` format

## Naming Convention

| Old Format          | New Format                  |
| ------------------- | --------------------------- |
| `tool:skill`        | REMOVED                     |
| `tool:skill:before` | `tool.execute.before.skill` |
| `tool:skill:after`  | `tool.execute.after.skill`  |

This aligns handler names with user-events.config.ts keys - same name, intuitive connection.

## User Configuration

```typescript
tools: {
  [EventType.TOOL_EXECUTE_BEFORE]: {
    skill: { enabled: true, scripts: ['validate-skill.sh'] },
  },
  [EventType.TOOL_EXECUTE_AFTER]: {
    skill: { enabled: true, scripts: ['log-skill.sh'] },
  }
}
```

## Solution

Modify `getToolHandler` to detect phase from `toolEventType` and use new handler naming.

## Execution

| Step | Description                                                                                         | Status |
| ---- | --------------------------------------------------------------------------------------------------- | ------ |
| 1    | Analyze `getToolHandler` in events.ts                                                               | ⏳     |
| 2    | Modify `getToolHandler` to accept `toolEventType` param                                             | ⏳     |
| 3    | Update call site in `resolveToolConfig`                                                             | ⏳     |
| 4    | Create handlers `tool.execute.before.{name}` and `tool.execute.after.{name}` in default-handlers.ts | ⏳     |
| 5    | Remove old handlers (`tool:skill`, `tool:bash`, etc.)                                               | ⏳     |
| 6    | Test build and lint                                                                                 | ⏳     |

## Changes

### 1. events.ts - getToolHandler (line ~162)

```typescript
// Before
export function getToolHandler(toolName: string): EventHandler | undefined {
  return handlers[`tool:${toolName}`];
}

// After
export function getToolHandler(
  toolName: string,
  toolEventType?: string
): EventHandler | undefined {
  if (toolEventType?.includes('.before')) {
    return handlers[`tool.execute.before.${toolName}`];
  }
  if (toolEventType?.includes('.after')) {
    return handlers[`tool.execute.after.${toolName}`];
  }
  return undefined; // No fallback - old format no longer exists
}
```

### 2. events.ts - resolveToolConfig call (line ~403)

```typescript
// Before
const toolHandler = getToolHandler(toolName);

// After
const toolHandler = getToolHandler(toolName, toolEventType);
```

### 3. default-handlers.ts - new handlers (REPLACE old handlers)

Title format: `===={TOOL_NAME} {PHASE}====` (uppercase, spaces around phase)

Example: `====SKILL BEFORE====`, `====BASH AFTER====`

Create for main tools: skill, bash, task, write, edit, glob, grep, read, list, patch, webfetch, websearch, codesearch, todowrite, todoread, question, git-commit, filesystem.\*

```typescript
'tool.execute.before.skill': createHandler({
  title: '====SKILL BEFORE====',
  variant: 'warning',
  duration: TOAST_DURATION.TEN_SECONDS,
  defaultScript: 'tool-execute-before-skill.sh',
}),

'tool.execute.after.skill': createHandler({
  title: '====SKILL AFTER====',
  variant: 'success',
  duration: TOAST_DURATION.TEN_SECONDS,
  defaultScript: 'tool-execute-after-skill.sh',
}),

'tool.execute.before.bash': createHandler({
  title: '====BASH BEFORE====',
  variant: 'warning',
  duration: TOAST_DURATION.FIVE_SECONDS,
  defaultScript: 'tool-execute-before-bash.sh',
}),

'tool.execute.after.bash': createHandler({
  title: '====BASH AFTER====',
  variant: 'info',
  duration: TOAST_DURATION.FIVE_SECONDS,
  defaultScript: 'tool-execute-after-bash.sh',
}),

// ... continue for other tools
```

### 4. Remove old handlers

Delete these from default-handlers.ts (no longer used):

- `tool:skill`
- `tool:bash`
- `tool:task`
- `tool:write`
- `tool:edit`
- And all other `tool:*` entries

## Backward Compatibility

NONE - this is a breaking change. Old format `tool:skill` no longer exists.

## User Configuration

User already has separated config in user-events.config.ts:

```typescript
[EventType.TOOL_EXECUTE_BEFORE]: {
  skill: {
    enabled: true,
    scripts: ['validate-skill.sh'],  // blocking script
  },
}

[EventType.TOOL_EXECUTE_AFTER]: {
  skill: {
    enabled: true,
    scripts: ['log-skill.sh'],
  },
}
```

No user config changes needed - the tool lookup logic in events.ts handles the mapping.
