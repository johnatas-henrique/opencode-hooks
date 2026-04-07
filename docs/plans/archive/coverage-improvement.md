# Coverage Improvement Plan

**Status:** Completed

## Execution

| Step                                                     | Status | Timestamp        |
| -------------------------------------------------------- | ------ | ---------------- |
| 1. Remove getProp from index.ts exports                  | ✅     | 2026-04-07 15:08 |
| 2. Add tests for error handling branches in save-to-file | ✅     | 2026-04-07 15:09 |
| 3. Add test for resetRunOnceTracker function             | ✅     | 2026-04-07 15:09 |
| 4. Run coverage to verify improvement                    | ✅     | 2026-04-07 15:10 |

---

## Background

During coverage analysis we identified:

- `index.ts`: 50% functions (unused `getProp` export)
- `run-script-handler.ts`: 66.66% functions (unused `resetRunOnceTracker`)
- `save-to-file.ts`: 96.42% statements, branches not fully covered

## Details

### Step 1: Remove getProp from index.ts exports

- File: `.opencode/plugins/helpers/index.ts`
- Line 15 and 58
- `getProp` is used internally in `default-handlers.ts` but never called externally

### Step 2: Add tests for error handling branches in save-to-file

- File: `.opencode/plugins/helpers/save-to-file.ts`
- Line 19: character code validation
- Line 43: mkdir error handling

### Step 3: Add test for resetRunOnceTracker

- File: `.opencode/plugins/helpers/run-script-handler.ts`
- Line 74: function useful for testing, needs test coverage
