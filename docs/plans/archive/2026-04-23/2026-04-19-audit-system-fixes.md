# Plan: Audit System Fixes & Documentation

**Date**: 2026-04-19
**Status**: Superseded (see archive/2026-04-23)

---

> ⚠️ **This plan has been superseded by newer plans archived on 2026-04-23**
>
> The audit system has been significantly refactored:
>
> - Archive on shutdown implemented via `server.instance.disposed` hook
> - Unified archiving system (any .json file exceeding maxSizeMB)
> - Dead code removed (archiveLogFiles, rotate, etc.)
> - createDefaultDeps simplified

---

## Original Execution

| Step | Commit                                                          | Description                                    | Status         |
| ---- | --------------------------------------------------------------- | ---------------------------------------------- | -------------- |
| 1    | `fix(audit): race condition in initAuditLogging`                | Promise-based guard for concurrent calls       | ✅ Implemented |
| 2    | `fix(toast-queue): route dropped toasts to plugin-errors.jsonl` | Use errorRecorder instead of saveToFile        | ❌ Pending     |
| 3    | `feat(audit): implement level filtering in writeLine`           | debug=all files, audit=scripts+errors only     | ✅ Implemented |
| 4    | `feat(settings): add audit configuration to userConfig`         | Expose audit settings in settings.ts           | ✅ Implemented |
| 5    | `docs: update README.md with current architecture`              | Reflect actual file structure and audit system | ❌ Pending     |
| 6    | `docs: create AUDIT_SYSTEM.md reference guide`                  | Detailed documentation of audit logging system | ❌ Pending     |

---

## Step 1: Fix Race Condition in `initAuditLogging`

**File**: `.opencode/plugins/features/audit/plugin-integration.ts`

**Problem**: `initialized` boolean flag set AFTER `await archiveLogFiles()`, allowing concurrent calls to each create archive files.

**Fix**: Replace boolean guard with promise-based guard:

```typescript
let initPromise: Promise<void> | null = null;

export function initAuditLogging(config?: AuditConfig): Promise<void> {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const auditConfig = config ?? DEFAULT_AUDIT_CONFIG;

    auditLogger = createAuditLogger({
      basePath: LOG_DIR,
      config: auditConfig,
    });

    eventRecorder = createEventRecorder(auditConfig, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    scriptRecorder = createScriptRecorder(auditConfig, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    errorRecorder = createErrorRecorder(auditConfig, {
      writeLine: auditLogger.writeLine.bind(auditLogger),
    });

    await archiveLogFiles(LOG_DIR, LOG_DIR + '/' + AUDIT_ARCHIVE_DIR, {
      events: AUDIT_EVENTS_FILE,
      scripts: AUDIT_SCRIPTS_FILE,
      errors: AUDIT_ERRORS_FILE,
    });
  })();

  return initPromise;
}
```

**Tests**: Add test for concurrent calls → only one archive created.

---

## Step 2: Route Toast Queue Errors to `plugin-errors.jsonl`

**File**: `.opencode/plugins/core/toast-queue.ts`

**Problem**: `logDroppedToast` uses `saveToFile` (old monolithic `session_events.log`) instead of `errorRecorder` (new audit system).

**Fix**: Import `getErrorRecorder` and use it:

```typescript
import { getErrorRecorder } from '../features/audit';

const logDroppedToast = (toast: TuiToast) => {
  const errorRecorder = getErrorRecorder();
  if (errorRecorder) {
    errorRecorder.logError({
      message: `Toast queue overflow: dropped toast "${toast.title || DEFAULT_SESSION_ID}"`,
      eventType: 'toast.queue.overflow',
      toolName: 'toast-queue',
      context: JSON.stringify({
        title: toast.title || DEFAULT_SESSION_ID,
        message: toast.message?.substring(0, 100),
        variant: toast.variant,
      }),
    });
  } else {
    // Fallback for when audit system not initialized
    saveToFile({
      content: JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'QUEUE_ERROR',
        data: {
          title: toast.title || DEFAULT_SESSION_ID,
          message: toast.message?.substring(0, 100),
          variant: toast.variant,
        },
      }),
    });
  }
};
```

**Note**: `logDroppedToast` receives the full `TuiToast` object now (was just `title: string`). Update call sites in `add()` and `addMultiple()`.

**Tests**: Add test verifying dropped toasts route to errorRecorder.

---

## Step 3: Implement Level Filtering in `writeLine`

**File**: `.opencode/plugins/features/audit/audit-logger.ts`

**Problem**: `config.level` exists in `AuditConfig` but is never checked in `writeLine`. PRD specifies:

- `debug` → write to all 3 files (events, scripts, errors)
- `audit` → skip events file, write scripts + errors only

**Fix**: Add level check in `writeLine`:

```typescript
async function writeLine(
  fileType: AuditFileType,
  data: Record<string, unknown>
): Promise<void> {
  if (!config.enabled) return;

  // Level filtering: audit mode skips events file
  if (config.level === 'audit' && fileType === 'events') {
    return;
  }

  const jsonLine = JSON.stringify(data) + '\n';
  // ... rest of existing code
}
```

**Tests**: Add tests for level filtering behavior.

---

## Step 4: Add Audit Configuration to `settings.ts`

**File**: `.opencode/plugins/config/settings.ts`

**Add** `audit` configuration object to `userConfig`:

```typescript
import { DEFAULT_AUDIT_CONFIG } from '../types/audit';

export const userConfig: UserEventsConfig = {
  // ... existing config ...

  audit: {
    enabled: true,
    level: 'debug', // 'debug' = all files, 'audit' = scripts+errors only
    maxSizeMB: 10,
    maxAgeDays: 30,
    truncationKB: 10,
    files: DEFAULT_AUDIT_CONFIG.files,
  },
};
```

**Note**: Need to verify `UserEventsConfig` type includes `audit` field. If not, update type definition.

---

## Step 5: Update README.md

**File**: `README.md`

**Changes**:

1. Update project structure to reflect current layout (`features/`, `core/`, `config/` instead of `helpers/`)
2. Add Audit Logging System section with the 3 JSONL files
3. Update configuration examples to include `audit` object
4. Fix outdated references (file paths, directory names)
5. Update test coverage numbers to current baseline

**New sections to add**:

- Audit Logging System overview
- `audit` configuration options
- JSONL file format explanation
- Search examples (grep, jq)

---

## Step 6: Create `AUDIT_SYSTEM.md`

**File**: `docs/AUDIT_SYSTEM.md`

**Content**:

1. Overview of the 3 JSONL files and their purposes
2. Schema definitions for each file type
3. Configuration options (`audit` object in settings.ts)
4. Level filtering explanation (debug vs audit)
5. File rotation and retention
6. Search examples (grep, jq, awk)
7. Error classification (config vs code)
8. Migration from old `session_events.log` format
9. Troubleshooting common issues

---

## Dependencies

- Step 1 has no dependencies
- Step 2 depends on Step 1 (errorRecorder must be initialized before toast-queue can use it)
- Step 3 has no dependencies
- Step 4 depends on Step 3 (audit config uses level field)
- Step 5 depends on Steps 1-4 (documentation reflects implemented features)
- Step 6 depends on Steps 1-5 (comprehensive guide requires all features working)

## Risk Assessment

| Risk                                     | Impact | Mitigation                            |
| ---------------------------------------- | ------ | ------------------------------------- |
| Toast queue errors before audit init     | Low    | Fallback to saveToFile                |
| Concurrent archive calls                 | High   | Promise-based guard (Step 1)          |
| Level filtering breaks existing behavior | Medium | Default to 'debug' (current behavior) |
| README outdated references               | Low    | Review all file paths before commit   |
