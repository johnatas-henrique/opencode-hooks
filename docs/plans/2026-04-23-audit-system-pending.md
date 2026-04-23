# Plan: Consolidated Audit System - Pending Work

**Date**: 2026-04-23
**Status**: Active
**Priority**: High

---

## Overview

This plan consolidates all pending work from the previous 5 archived plans:

- 2026-04-19-audit-system-fixes.md
- 2026-04-20-event-logging-improvements.md
- 2026-04-21-audit-archiving-unified.md
- 2026-04-21-coverage-phase-1.md
- 2026-04-22-audit-cleanup-required-keys.md

## Already Implemented (✅)

| Item                                                                                               | Source Plan |
| -------------------------------------------------------------------------------------------------- | ----------- |
| Archive on shutdown via `server.instance.disposed` hook                                            | 2026-04-21  |
| Unified archiving system (any .json exceeding maxSizeMB)                                           | 2026-04-21  |
| Dead code removed (rotate, checkRotation, getRotatePath, archiveLogFiles, archiveLogFilesWithLock) | 2026-04-22  |
| createDefaultDeps simplified (removed ?? fallbacks)                                                | 2026-04-23  |
| Level filtering in writeLine                                                                       | 2026-04-19  |
| Promise-based guard for concurrent calls                                                           | 2026-04-19  |
| Event logging expanded to all events                                                               | 2026-04-20  |
| Sanitize and truncate fields                                                                       | 2026-04-20  |
| skipStack for toast overflow                                                                       | 2026-04-20  |

---

## Pending Work

### Category 1: Code Cleanup (from 2026-04-22)

| Step | Action                                                                                                                     | Status     | Files                       |
| ---- | -------------------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------- |
| 1a   | Make audit keys required in settings.ts (maxSizeMB, maxAgeDays, truncationKB, maxFieldSize, maxArrayItems, level, enabled) | ⏳ Pending | settings.ts                 |
| 1b   | Remove `files` from audit config                                                                                           | ⏳ Pending | settings.ts, types/audit.ts |
| 1c   | Make deps.stat and deps.rename mandatory in types                                                                          | ⏳ Pending | types/audit.ts              |

### Category 2: Migration from saveToFile (from 2026-04-20, 2026-04-21)

| Step | Action                                             | Status     | Files                    |
| ---- | -------------------------------------------------- | ---------- | ------------------------ |
| 2a   | Migrate CONFIG_FILE to eventRecorder.logEvent()    | ⏳ Pending | opencode-hooks.ts        |
| 2b   | Migrate SCRIPT_ERROR to errorRecorder.logError()   | ⏳ Pending | run-script-handler.ts    |
| 2c   | Migrate PLUGIN_ERROR to errorRecorder.logError()   | ⏳ Pending | show-startup-toast.ts    |
| 2d   | Migrate UNKNOWN_EVENT to eventRecorder.logEvent()  | ⏳ Pending | event-config.resolver.ts |
| 2e   | Migrate EVENT_DISABLED to eventRecorder.logEvent() | ⏳ Pending | opencode-hooks.ts        |
| 2f   | Migrate PLUGIN_START to eventRecorder.logEvent()   | ⏳ Pending | opencode-hooks.ts        |
| 2g   | Migrate security blocks to securityRecorder        | ⏳ Pending | block-handler.ts         |
| 2h   | Migrate debug to debugRecorder                     | ⏳ Pending | debug.ts                 |
| 2i   | Stop writing to session_events.log                 | ⏳ Pending | -                        |
| 2j   | Stop writing to session_unknown_events.log         | ⏳ Pending | -                        |

### Category 3: New Recorders (from 2026-04-20)

| Step | Action                                                   | Status     | Files                               |
| ---- | -------------------------------------------------------- | ---------- | ----------------------------------- |
| 3a   | Create security-recorder.ts                              | ⏳ Pending | features/audit/security-recorder.ts |
| 3b   | Create debug-recorder.ts                                 | ⏳ Pending | features/audit/debug-recorder.ts    |
| 3c   | Add PLUGIN_SECURITY_FILE and PLUGIN_DEBUG_FILE constants | ⏳ Pending | core/constants.ts                   |

### Category 4: Toast Queue (from 2026-04-19)

| Step | Action                                                        | Status     | Files          |
| ---- | ------------------------------------------------------------- | ---------- | -------------- |
| 4a   | Route dropped toasts to errorRecorder (instead of saveToFile) | ⏳ Pending | toast-queue.ts |

### Category 5: Coverage (from 2026-04-21)

| Step | Action                                                                  | Impact | Status     |
| ---- | ----------------------------------------------------------------------- | ------ | ---------- |
| 5a   | Test startup-toast.ts line 53 (else branch + errorRecorder truthy)      | +0.33% | ⏳ Pending |
| 5b   | Test normalize-input.ts line 27 (properties object branch)              | +0.12% | ⏳ Pending |
| 5c   | Test block-handler.ts line 25 (securityRecorder truthy)                 | +0.07% | ⏳ Pending |
| 5d   | Test toast-queue.ts lines 17-20, 130, 161 (Queue re-entry, full, pause) | +0.17% | ⏳ Pending |
| 5e   | Test run-script.ts line 48 (Exit code > 0)                              | +0.07% | ⏳ Pending |
| 5f   | Test block-system.ts line 55 (Block error)                              | +0.08% | ⏳ Pending |
| 5g   | Test debug.ts line 74 (debugRecorder truthy)                            | +0.05% | ⏳ Pending |

### Category 6: Documentation (from 2026-04-19)

| Step | Action                                     | Status     |
| ---- | ------------------------------------------ | ---------- |
| 6a   | Update README.md with current architecture | ⏳ Pending |
| 6b   | Create AUDIT_SYSTEM.md reference guide     | ⏳ Pending |

### Category 7: Cleanup (from 2026-04-20)

| Step | Action                                      | Status     |
| ---- | ------------------------------------------- | ---------- |
| 7a   | Consolidar UNKNOWN_EVENT with context field | ⏳ Pending |
| 7b   | Depreciar debug.log (mark as deprecated)    | ⏳ Pending |

---

## Decisões Já Tomadas (Manter)

| Aspect        | Decision                                                 |
| ------------- | -------------------------------------------------------- |
| maxFieldSize  | 1000 caracteres (configurável)                           |
| Sanitização   | `[REDACTED: N chars]` - mostra tamanho, esconde conteúdo |
| Arrays        | Limitados a 50 itens + indicador                         |
| Modo audit    | NÃO loga eventos (só scripts e errors)                   |
| Log extension | .json (não .jsonl) - compatibilidade VSCode              |
| Archive       | Se ≥ maxSizeMB OU shutdown                               |

---

## Pending Items Summary

| Category               | Pending Count |
| ---------------------- | ------------- |
| Code Cleanup           | 3             |
| Migration (saveToFile) | 10            |
| New Recorders          | 3             |
| Toast Queue            | 1             |
| Coverage Tests         | 7             |
| Documentation          | 2             |
| Cleanup                | 2             |
| **TOTAL**              | **28 items**  |

---

## Files to Modify

- `.opencode/plugins/config/settings.ts`
- `.opencode/plugins/types/audit.ts`
- `.opencode/plugins/core/constants.ts`
- `.opencode/plugins/features/audit/security-recorder.ts` (new)
- `.opencode/plugins/features/audit/debug-recorder.ts` (new)
- `.opencode/plugins/core/toast-queue.ts`
- `.opencode/plugins/features/scripts/block-handler.ts`
- `.opencode/plugins/features/scripts/run-script-handler.ts`
- `.opencode/plugins/core/debug.ts`
- `.opencode/plugins/features/audit/event-config.resolver.ts`
- `.opencode/plugins/opencode-hooks.ts`
- `README.md` (update)
- `docs/AUDIT_SYSTEM.md` (new)

---

## Acceptance Criteria

1. All `saveToFile` calls migrated to audit system
2. All 7 coverage tests added
3. README.md reflects current architecture
4. AUDIT_SYSTEM.md created as reference guide
5. No writes to legacy files (session_events.log, session_unknown_events.log)
6. security.json and debug.json working
7. All audit config keys are required (not optional)

---

## Notes

- Archive on shutdown: ✅ IMPLEMENTED
- Archive by size: ✅ IMPLEMENTED
- Dead code removed: ✅ IMPLEMENTED
- createDefaultDeps simplified: ✅ IMPLEMENTED
- Event logging expanded: ✅ IMPLEMENTED

This plan captures ONLY the remaining work.
