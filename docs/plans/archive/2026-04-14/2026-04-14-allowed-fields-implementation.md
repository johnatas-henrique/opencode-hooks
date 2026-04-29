# allowedFields Implementation Plan

**Date:** 2026-04-14 14:45  
**Goal:** Implement `allowedFields` to filter which fields appear in event toasts

## Execution

| Step | Description                                                   | Status | Timestamp |
| ---- | ------------------------------------------------------------- | ------ | --------- |
| 1    | Rename `buildAllKeysMessage` → `buildKeysMessage`             | ✅     | 01:25     |
| 2    | Rename `buildAllKeysMessageSimple` → `buildKeysMessageSimple` | ✅     | 01:25     |
| 3    | Add `allowedFields` parameter to both functions               | ✅     | 01:28     |
| 4    | Add `allowedFields` field to `EventHandler` interface         | ✅     | 01:30     |
| 5    | Define `allowedFields` defaults in `default-handlers.ts`      | ✅     | 01:32     |
| 6    | Apply `allowedFields` when resolving config and showing toast | ✅     | 01:35     |
| 7    | Update tests                                                  | ✅     | 01:38     |
| 8    | Build, lint, test                                             | ✅     | 01:40     |

---

## Step 1-2: Rename Functions

**File:** `.opencode/plugins/helpers/default-handlers.ts`

```typescript
// Before
export const buildAllKeysMessage = ...
export const buildAllKeysMessageSimple = ...

// After
export const buildKeysMessage = ...
export const buildKeysMessageSimple = ...
```

---

## Step 3: Add `allowedFields` Logic

### `buildKeysMessage`

```typescript
export const buildKeysMessage = (
  event: Record<string, unknown>,
  allowedFields?: string[]
): string => {
  const lines: string[] = [];

  // Helper to extract value by path
  const getValue = (obj: unknown, path: string): unknown => {
    return path
      .split('.')
      .reduce((o, k) => (o as Record<string, unknown>)?.[k], obj);
  };

  if (!allowedFields || allowedFields.length === 0) {
    // Show ALL fields (current behavior)
    // ... existing logic
  } else {
    // Show only allowed fields
    for (const field of allowedFields) {
      const value = getValue(event, field);
      if (value !== undefined) {
        lines.push(`${field}: ${formatValue(value)}`);
      }
    }
  }

  lines.push(`Time: ${formatTime()}`);
  return lines.join('\n');
};
```

### `buildKeysMessageSimple`

Same pattern for `properties` structure.

---

## Step 4: Update `EventHandler` Interface

**File:** `.opencode/plugins/helpers/default-handlers.ts`

```typescript
export interface EventHandler {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
  allowedFields?: string[]; // NEW
}
```

---

## Step 5: Define Defaults in Handlers

**File:** `.opencode/plugins/helpers/default-handlers.ts`

```typescript
export const handlers: Record<string, EventHandler> = {
  'session.created': createHandler({
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-created.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['info.id', 'info.title', 'info.directory', 'info.parentID'], // NEW
  }),

  'session.compacted': createHandler({
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
    defaultScript: 'session-compacted.sh',
    buildMessage: buildKeysMessageSimple,
    allowedFields: ['sessionID', 'contextSize'],
  }),

  // ... other handlers with appropriate fields from events-catalog.md
};
```

### Default fields per event type:

| Event Type                  | allowedFields (default)                                 |
| --------------------------- | ------------------------------------------------------- |
| session.created             | info.id, info.title, info.directory, info.parentID      |
| session.error               | sessionID, error.name, error.data.message               |
| tool.execute.before         | tool, args.command, args.filePath, args.description     |
| tool.execute.after          | tool, output.title, metadata.exit, metadata.description |
| tool.execute.after.subagent | tool, subagentType, output.title                        |
| permission.ask              | tool, type, pattern, title                              |
| ...                         | (from events-catalog.md recommendations)                |

---

## Step 6: Apply `allowedFields` When Showing Toast

**File:** `.opencode/plugins/helpers/toast-queue.ts`

```typescript
// In the function that shows toast (around line 100-150)
const handler = getHandler(eventType);

// Build message with allowedFields from handler or config override
const message = handler.buildMessage(
  event,
  resolved.allowedFields // from resolved config
);

// If no allowedFields in config, use handler's default
if (!resolved.allowedFields && handler.allowedFields) {
  resolved.allowedFields = handler.allowedFields;
}
```

**File:** `.opencode/plugins/helpers/types/config.ts`

```typescript
export interface ResolvedEventConfig {
  // ... existing fields
  allowedFields?: string[]; // NEW
}
```

---

## Step 7: Update Tests

**Files:** `test/unit/*.test.ts`

- Add tests for `buildKeysMessage` with `allowedFields`
- Add tests for `buildKeysMessageSimple` with `allowedFields`
- Update existing tests that reference `buildAllKeysMessage` → `buildKeysMessage`

---

## Step 8: Verify

```bash
npm run build && npm run lint && npm run test:unit
```

---

## Files to Modify

| File                                            | Changes                                                    |
| ----------------------------------------------- | ---------------------------------------------------------- |
| `.opencode/plugins/helpers/default-handlers.ts` | Rename functions, add allowedFields logic, define defaults |
| `.opencode/plugins/helpers/types/config.ts`     | Add allowedFields to ResolvedEventConfig                   |
| `.opencode/plugins/helpers/toast-queue.ts`      | Pass allowedFields when building message                   |
| `.opencode/plugins/helpers/events.ts`           | Resolve allowedFields from config/handler                  |
| `test/unit/*.test.ts`                           | Update tests                                               |

---

## Notes

- `allowedFields` only affects **toast messages** from handlers (event fields)
- **Script output toasts** are NOT affected (scripts show their own output)
- If `allowedFields` is empty or undefined → show all fields (current behavior)
- User can override defaults in `settings.ts`
