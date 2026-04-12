# 2026-04-11: Script Results Consolidation

## Execution

| Step                                                | Status | Timestamp |
| --------------------------------------------------- | ------ | --------- |
| 1. Add scriptToasts config to UserEventsConfig      | ✅     | 14:00     |
| 2. Modify runScript to return exit code             | ✅     | 14:10     |
| 3. Create immediate error toast for exit code !== 0 | ✅     | 14:15     |
| 4. Create consolidated toast for successful scripts | ✅     | 14:20     |
| 5. Use scriptToasts config values in handlers       | ✅     | 14:25     |
| 6. Add event name to error toast (already done)     | ✅     | 14:00     |
| 7. Update error toast duration (already done)       | ✅     | 14:00     |
| 8. Build, lint and test                             | ✅     | 14:30     |

**Status**: Completed ✅

## Problem

1. **Multiple toasts spam**: Each script fires a separate toast
2. **Script errors hard to diagnose**: No exit code, no event context
3. **Toast types mixed**: Script toasts mixed with info toasts
4. **No user control**: Can't disable specific script toasts

## Solution

### 1. New config object: scriptToasts

```typescript
scriptToasts?: {
  showOutput?: boolean;        // default: true
  showError?: boolean;       // default: true
  outputVariant?: 'success' | 'warning' | 'error' | 'info'; // default: 'info'
  errorVariant?: 'success' | 'warning' | 'error' | 'info';  // default: 'error'
  outputDuration?: number;   // default: 5000
  errorDuration?: number;   // default: 15000
}
```

### 2. Modified runScript return

Current:

```typescript
runScript($, script, args): Promise<string>
```

New:

```typescript
interface ScriptResult {
  output: string;
  error: string | null;
  exitCode: number;
}

runScript($, script, args): Promise<ScriptResult>
```

### 3. Error handling strategy

| Exit Code | Meaning                | Toast Behavior                   |
| --------- | ---------------------- | -------------------------------- |
| 0         | Success                | Batch in single toast            |
| !== 0     | Script execution error | Immediate toast (priority)       |
| -1        | Script not found       | Immediate toast (lower priority) |

### 4. Consolidated toast for successes

```typescript
// After all scripts run:
const successfulResults = results.filter((r) => r.exitCode === 0 && r.output);
const errorResults = results.filter((r) => r.exitCode !== 0);

if (successfulResults.length > 0) {
  const message = successfulResults
    .map((r) => `**${r.script}**:\n${r.output}`)
    .join('\n\n');

  toastQueue.add({
    title: '====SCRIPT OUTPUT====',
    message,
    variant: scriptToasts.outputVariant ?? 'info',
    duration: scriptToasts.outputDuration ?? 5000,
  });
}
```

### 5. Immediate error toast

```typescript
// For each script with exitCode !== 0:
const eventInfo =
  eventType.startsWith('tool.execute.') && toolName ? toolName : eventType;

toastQueue.add({
  title: '====SCRIPT ERROR====',
  message: `Event: ${eventInfo}\nScript: ${script}\nError: ${error}\nExit Code: ${exitCode}\nCheck user-events.config.ts`,
  variant: scriptToasts.errorVariant ?? 'error',
  duration: scriptToasts.errorDuration ?? 15000,
});
```

## Implementation Details

### Files to modify:

- `.opencode/plugins/helpers/config.ts` - Add scriptToasts type
- `.opencode/plugins/helpers/run-script.ts` - Return ScriptResult
- `.opencode/plugins/helpers/run-script-handler.ts` - Use ScriptResult, handle errors
- `.opencode/plugins/helpers/user-events.config.ts` - Add scriptToasts default
- `.opencode/plugins/opencode-hooks.ts` - Use scriptToasts config

### Tests to add/update:

- Test runScript returns exit code
- Test immediate toast for exit code !== 0
- Test consolidated toast for successes
- Test scriptToasts config values used

## Example Output

**Error toast (immediate):**

```
====SCRIPT ERROR====
Event: task
Script: governance-capture.sh
Error: Secret detected in output: AWS_KEY=AKIA...
Exit Code: 1
Check user-events.config.ts
```

**Success toast (batched):**

```
====SCRIPT OUTPUT====

**tool-execute-after-quality-gate.sh**:
✓ All checks passed

**tool-execute-after-governance-capture.sh**:
✓ Governance validated
```

## Merged Plans

This plan replaces:

- `2026-04-10-script-toast-improvements.md` (consolidated)
- `2026-04-10-script-error-improvements.md` (merged)

Created: 2026-04-11
