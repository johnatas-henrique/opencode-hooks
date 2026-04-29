# Plan: Audit Cleanup - Remove Dead Code and Make Keys Required

## Status

- **Type**: Implementation
- **Created**: 2026-04-22
- **Priority**: High

## Problems Identified

### 1. Dead Code in audit-logger.ts

- `checkRotation()` (~12 lines) - only works for events, not errors/scripts
- `rotate()` (~15 lines) - legacy code, creates .json.gz
- `getRotatePath()` (~8 lines) - only for events
- Total: ~35 lines of dead code

### 2. Unnecessary Guards

```typescript
// Current:
const maxSizeMB = config.maxSizeMB ?? 2; // ?? is unnecessary
const fileStat = await deps.stat?.(filePath); // ?. is unnecessary
```

### 3. Optional Keys in settings.ts

- `maxSizeMB` - should be required
- `maxAgeDays` - should be required
- `truncationKB` - should be required
- `maxFieldSize` - should be required
- `maxArrayItems` - should be required
- `level` - should be required
- `enabled` - should be required
- `files` - should be REMOVED (not needed - auto-detects .json files)

### 4. Type Issues

- `deps.stat` - optional in interface, should be required
- `deps.rename` - optional in interface, should be required

## Rule Established

> Any `.json` file in production/session-logs/ that exceeds maxSizeMB should be archived automatically. On shutdown, all are archived.

Files follow pattern `plugin-*.json`:

- plugin-events.json
- plugin-errors.json
- plugin-scripts.json
- plugin-security.json
- plugin-debug.json

No need for `files` config - auto-detect works.

## Implementation Steps

| Step | Action                                            | Scope                        |
| ---- | ------------------------------------------------- | ---------------------------- |
| 1    | Remove `checkRotation`, `rotate`, `getRotatePath` | audit-logger.ts              |
| 2    | Make audit keys required in settings.ts           | settings.ts                  |
| 3    | Remove `files` from audit config                  | settings.ts + types/audit.ts |
| 4    | Fix types: make deps.stat, deps.rename mandatory  | types/audit.ts               |
| 5    | Manual QA: verify archiving works for all files   | -                            |

## Expected Result

| Metric          | Before  | After       |
| --------------- | ------- | ----------- |
| Dead code lines | ~35     | 0           |
| Optional keys   | 7       | 0           |
| `files` config  | exists  | **REMOVED** |
| Testable        | partial | better      |

## Files to Modify

- `.opencode/plugins/features/audit/audit-logger.ts`
- `.opencode/plugins/config/settings.ts`
- `.opencode/plugins/types/audit.ts`
