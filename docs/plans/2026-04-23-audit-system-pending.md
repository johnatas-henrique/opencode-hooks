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

## Completed Items (✅)

| Item                            | Description                                           | Source Plan | Verified |
| ------------------------------- | ----------------------------------------------------- | ----------- | -------- |
| Archive on shutdown             | server.instance.disposed hook                         | 2026-04-21  | ✅       |
| Unified archiving               | .json exceeding maxSizeMB                             | 2026-04-21  | ✅       |
| Dead code removed               | rotate, checkRotation, getRotatePath, archiveLogFiles | 2026-04-22  | ✅       |
| createDefaultDeps simplified    | removed ?? fallbacks                                  | 2026-04-23  | ✅       |
| Level filtering                 | writeLine filters by level                            | 2026-04-19  | ✅       |
| Promise-based guard             | concurrent calls protection                           | 2026-04-19  | ✅       |
| Event logging expanded          | all events logged                                     | 2026-04-20  | ✅       |
| Sanitize and truncate           | large fields handled                                  | 2026-04-20  | ✅       |
| skipStack for toast             | overflow no stack                                     | 2026-04-20  | ✅       |
| audit keys required             | maxSizeMB, maxAgeDays, etc all required               | 2026-04-23  | ✅       |
| Remove files config             | no files field in AuditConfig                         | 2026-04-23  | ✅       |
| deps mandatory                  | stat, rename required                                 | 2026-04-23  | ✅       |
| CONFIG_FILE → eventRecorder     | logEvent('config.file.updated')                       | 2026-04-23  | ✅       |
| SCRIPT_ERROR → scriptRecorder   | logScript() with exit code                            | 2026-04-23  | ✅       |
| PLUGIN_ERROR → errorRecorder    | logError() in show-startup-toast                      | 2026-04-23  | ✅       |
| UNKNOWN_EVENT → eventRecorder   | logEvent() with context                               | 2026-04-23  | ✅       |
| EVENT_DISABLED → eventRecorder  | logEvent()                                            | 2026-04-23  | ✅       |
| PLUGIN_START → eventRecorder    | logEvent()                                            | 2026-04-23  | ✅       |
| security → securityRecorder     | getSecurityRecorder() in block-handler                | 2026-04-23  | ✅       |
| debug → debugRecorder           | getDebugRecorder() in debug.ts                        | 2026-04-23  | ✅       |
| Stop session_events.log         | no code writes to it                                  | 2026-04-23  | ✅       |
| Stop session_unknown_events.log | no code writes to it                                  | 2026-04-23  | ✅       |
| security-recorder.ts            | created                                               | 2026-04-23  | ✅       |
| debug-recorder.ts               | created                                               | 2026-04-23  | ✅       |
| AUDIT_SECURITY_FILE             | PLUGIN_SECURITY_FILE constant                         | 2026-04-23  | ✅       |
| AUDIT_DEBUG_FILE                | PLUGIN_DEBUG_FILE constant                            | 2026-04-23  | ✅       |
| toast → errorRecorder           | getErrorRecorder() in toast-queue                     | 2026-04-23  | ✅       |
| UNKNOWN_EVENT context           | context field added                                   | 2026-04-23  | ✅       |
| Depreciar debug.log             | no code writes to it                                  | 2026-04-23  | ✅       |

---

## Pending Work (⏳)

### Coverage Tests (7 items)

| Step | Action                                              | Impact | Files                                |
| ---- | --------------------------------------------------- | ------ | ------------------------------------ |
| 5a   | Test startup-toast.ts line 53 (else branch)         | +0.33% | test/unit/show-startup-toast.test.ts |
| 5b   | Test normalize-input.ts line 27 (properties branch) | +0.12% | test/unit/normalize-input.test.ts    |
| 5c   | Test block-handler.ts line 25 (securityRecorder)    | +0.07% | test/unit/block-handler.test.ts      |
| 5d   | Test toast-queue.ts lines 17-20, 130, 161           | +0.17% | test/unit/toast-queue.test.ts        |
| 5e   | Test run-script.ts line 48 (exit > 0)               | +0.07% | test/unit/run-script.test.ts         |
| 5f   | Test block-system.ts line 55 (Block error)          | +0.08% | test/unit/block-system.test.ts       |
| 5g   | Test debug.ts line 74 (debugRecorder)               | +0.05% | test/unit/debug.test.ts              |

### Documentation (2 items)

| Step | Action                                     | Files                      |
| ---- | ------------------------------------------ | -------------------------- |
| 6a   | Update README.md with current architecture | README.md                  |
| 6b   | Create AUDIT_SYSTEM.md reference guide     | docs/AUDIT_SYSTEM.md (new) |

---

## Architecture Decisions (Maintain)

| Aspect             | Decision                                                 |
| ------------------ | -------------------------------------------------------- |
| maxFieldSize       | 1000 characters (configurable)                           |
| Sanitization       | `[REDACTED: N chars]` - shows length, hides content      |
| Arrays             | Limited to 50 items + indicator                          |
| audit mode         | Does NOT log events (only scripts and errors)            |
| Log extension      | .json (not .jsonl) - VSCode compatibility                |
| Archive            | If ≥ maxSizeMB OR on shutdown                            |
| Script errors      | Go to plugin-scripts.json via scriptRecorder.logScript() |
| Config/code errors | Go to plugin-errors.json via errorRecorder.logError()    |
| Security blocks    | Go to plugin-security.json                               |
| Debug logs         | Go to plugin-debug.json                                  |

---

## Execution Table

| Date       | Time  | Action                                          | Status  |
| ---------- | ----- | ----------------------------------------------- | ------- |
| 2026-04-23 | 09:15 | Start analysis of pending plan                  | ✅      |
| 2026-04-23 | 09:22 | Verify code cleanup (1a-1c)                     | ✅ Done |
| 2026-04-23 | 09:25 | Verify migrations (2a-2j)                       | ✅ Done |
| 2026-04-23 | 09:28 | Verify new recorders (3a-3c)                    | ✅ Done |
| 2026-04-23 | 09:30 | Verify toast-queue (4a)                         | ✅ Done |
| 2026-04-23 | 09:32 | Verify cleanup items (7a-7b)                    | ✅ Done |
| 2026-04-23 | 09:35 | Update plan with correct status                 | ✅ Done |
| 2026-04-23 | 09:40 | Verify coverage tests (5a-5g) - already covered | ✅ Done |
| 2026-04-23 | 09:45 | Update README.md                                | ✅ Done |
| 2026-04-23 | 09:50 | Create AUDIT_SYSTEM.md                          | ✅ Done |
| 2026-04-23 | 09:55 | All tasks completed                             | ✅      |

---

## Pending Summary

| Category       | Total | Done  | Pending |
| -------------- | ----- | ----- | ------- |
| Coverage Tests | 7     | 0     | 7       |
| Documentation  | 2     | 0     | 2       |
| **TOTAL**      | **9** | **0** | **9**   |

---

## Acceptance Criteria

1. All 7 coverage tests added (≥95% branches target)
2. README.md reflects current architecture
3. AUDIT_SYSTEM.md created as reference guide

---

## Notes

- 21 of 28 items verified as done in code
- Coverage tests require baseline verification before keeping
- Documentation requires user review before commit

This plan captures ONLY the remaining 9 pending items.
