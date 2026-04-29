# Plan: Coverage Phase 1 - Reach 97.68% Branches

## Baseline

| Metric       | Current    | Target 97.68% | Gap        |
| ------------ | ---------- | ------------- | ---------- |
| Statements   | 98.94%     | -             | -          |
| **Branches** | **96.64%** | 97.68%        | **-1.04%** |
| Functions    | 98.29%     | -             | -          |
| Lines        | 98.9%      | -             | -          |

---

## Analysis: Live Code vs Dead Code

| File                | Line  | Status    | Observation                          |
| ------------------- | ----- | --------- | ------------------------------------ |
| startup-toast.ts    | 53    | LIVE      | else branch (saveToFile fallback)    |
| toast-queue.ts      | 17-20 | LIVE      | Queue re-entry logic                 |
| toast-queue.ts      | 130   | LIVE      | Queue full branch                    |
| toast-queue.ts      | 161   | LIVE      | Queue pause                          |
| normalize-input.ts  | 27    | LIVE      | properties object branch             |
| block-handler.ts    | 25    | LIVE      | securityRecorder truthy              |
| **audit-logger.ts** | 74    | DEAD CODE | archiveLogFilesWithLock never called |
| run-script.ts       | 48    | LIVE      | Script exit code > 0                 |
| block-system.ts     | 55    | LIVE      | Block error                          |
| debug.ts            | 74    | LIVE      | debugRecorder truthy                 |
| toast.ts            | 31    | LIVE      | enabled ?? true branch               |
| save-to-file.ts     | 37    | LIVE      | Error branch                         |
| opencode-hooks.ts   | 229   | LIVE      | Unknown branch                       |

---

## Execution

### Step 0: Remove Dead Code

| Action                                                | File            |
| ----------------------------------------------------- | --------------- |
| Remove `archiveLogFilesWithLock` from audit-logger.ts | audit-logger.ts |

### Steps 1-7: Add Tests for Live Code

| Step | File               | Line  | What to test                       | Impact |
| ---- | ------------------ | ----- | ---------------------------------- | ------ |
| 1    | startup-toast.ts   | 53    | else branch + errorRecorder truthy | +0.33% |
| 2    | normalize-input.ts | 27    | properties object branch           | +0.12% |
| 3    | block-handler.ts   | 25    | securityRecorder truthy            | +0.07% |
| 4    | toast-queue.ts     | 17-20 | Queue re-entry, full, pause        | +0.17% |
| 5    | run-script.ts      | 48    | Exit code > 0                      | +0.07% |
| 6    | block-system.ts    | 55    | Block error                        | +0.08% |
| 7    | debug.ts           | 74    | debugRecorder truthy               | +0.05% |

---

## Expected Result

- **Branches**: 96.64% + 0.86% = **97.5%** (target ~97.68%)
- **No regression** in other metrics

---

## Rules

1. If test doesn't increase coverage → discard
2. Check lint and build after each test
3. Target: 97.68% branches
