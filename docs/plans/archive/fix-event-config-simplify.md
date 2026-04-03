# Plan: Simplify Event Config Structure

## Problem

- 2 flags for saving to file (`logToFile` + `saveToFile`) that do similar things
- `defaultToastDuration` unnecessary (OpenCode defaults to 2000ms)
- DEFAULT_CONFIG has unnecessary explicit `true` values
- Confusing structure with multiple objects

---

## Execution

| Step                                                       | Status | Timestamp        |
| ---------------------------------------------------------- | ------ | ---------------- |
| 1. Simplify events-config.ts - remove duplicates           | ✅     | 2026-04-02 05:30 |
| 2. Update events-config.json with new structure            | ✅     | 2026-04-02 05:35 |
| 3. Update session-plugins.ts to use single saveToFile flag | ✅     | 2026-04-02 05:40 |
| 4. Update tests                                            | ✅     | 2026-04-02 05:45 |
| 5. Run build and tests                                     | ✅     | 2026-04-02 05:50 |

---

## Proposed JSON Structure

```json
{
  "version": "1.0.0",
  "description": "Event toggle config - all default to ON, override what you want OFF",

  "enabled": true,
  "toast": true,
  "script": true,
  "saveToFile": true,
  "appendToSession": true,

  "events": {
    // === EXAMPLES (uncomment and modify as needed) ===

    // Disable entire event:
    // "session.status": false,

---

## Result ✅

This plan was completed. The event config structure was simplified.
    // "session.updated": false,

    // Disable specific feature for event:
    // "session.diff": { "toast": false },
    // "server.instance.disposed": { "script": false },
    // "session.created": { "saveToFile": false }
  }
}
```

### Flags (all default to `true`):

| Flag              | What it controls                     |
| ----------------- | ------------------------------------ |
| `enabled`         | Plugin active or not                 |
| `toast`           | Display toast notification           |
| `script`          | Execute shell script                 |
| `saveToFile`      | Save to file (event + script output) |
| `appendToSession` | Add output to TUI session            |

### Priority:

```
1. events."event.name".toast/script/saveToFile/appendToSession
2. toast/script/saveToFile/appendToSession (global defaults)
3. true (system fallback)
```

---

## Implementation Notes

### events-config.ts changes:

- Remove `global.logToFile` (merged into `saveToFile`)
- Remove `global.defaultToastDuration` (not needed)
- Simplify DEFAULT_CONFIG - only put `false` values (exceptions)
- Default flags at root level: `toast`, `script`, `saveToFile`, `appendToSession`

### session-plugins.ts changes:

- Replace `config.global.logToFile` with `config.saveToFile`
- Replace `eventConfig.script && output` check with `config.saveToFile && output`

### Example before/after:

**Before:**

```typescript
if (config.global.logToFile) {
  await saveToFile({ content: `[${timestamp}] ${message}\n` });
}
if (eventConfig.script && output) {
  await saveToFile({ content: `[${timestamp}] ${output}\n` });
}
```

**After:**

```typescript
// Event log
if (config.saveToFile) {
  await saveToFile({ content: `[${timestamp}] ${message}\n` });
}

// Script output
if (config.saveToFile && output) {
  await saveToFile({ content: `[${timestamp}] ${output}\n` });
}
```

---

## Files to Modify

| File                                         | Action                              |
| -------------------------------------------- | ----------------------------------- |
| `.opencode/plugins/events-config.json`       | REWRITE - new structure             |
| `.opencode/plugins/helpers/events-config.ts` | REWRITE - simplify                  |
| `.opencode/plugins/session-plugins.ts`       | MODIFY - use single saveToFile flag |
| `test/session-plugins.test.ts`               | MODIFY - if needed                  |

---

## Verification

After implementation:

- ✅ Build passes
- ✅ ESLint passes
- ✅ All tests pass
- ✅ User can disable any feature via JSON
