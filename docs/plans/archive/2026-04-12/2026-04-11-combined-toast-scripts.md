# Plan: Combined Toast for Multiple Script Executions

**Date:** 2026-04-11  
**Time:** [AUTO]  
**Archived:** 2026-04-12  
**Goal:** Show a single combined toast for successful scripts (instead of individual toasts), while errors continue showing individual error toasts.

---

## Execution

| Step                                                                                 | Status | Timestamp        |
| ------------------------------------------------------------------------------------ | ------ | ---------------- |
| 1. Write tests for `runScriptAndHandle` new return type (`string \| undefined`)      | ✅     | 2026-04-12 12:00 |
| 2. Write tests for combined toast logic in `opencode-hooks.ts`                       | ✅     | 2026-04-12 12:00 |
| 3. Update `run-script-handler.ts`: remove `defaultScriptToasts` and unnecessary `??` | ✅     | 2026-04-12 12:00 |
| 4. Update `runScriptAndHandle` return type to `Promise<string \| undefined>`         | ✅     | 2026-04-12 12:00 |
| 5. Update `opencode-hooks.ts`: use `Promise.all()` and show combined toast           | ✅     | 2026-04-12 12:00 |
| 6. Run tests and fix failures                                                        | ✅     | 2026-04-12 12:00 |
| 7. Run lint and typecheck                                                            | ✅     | 2026-04-12 12:00 |

---

## Details

### Problem

Currently each script shows its own toast. With multiple scripts, this creates many toasts. Desired: one toast for all successful scripts (showing their outputs), and individual error toasts for failures.

### Solution

- Change `runScriptAndHandle` to return `output` string on success, `undefined` on error.
- In `opencode-hooks.ts`, collect all results with `Promise.all()`.
- Filter successful scripts with non-empty output.
- Show single combined toast with all successful outputs.
- Errors continue to show individual toasts (handled inside `runScriptAndHandle`).

### Files to Modify

- `.opencode/plugins/helpers/run-script-handler.ts`
- `.opencode/plugins/opencode-hooks.ts`
- `test/unit/run-script-handler.test.ts` (add/update tests)
- `test/unit/opencode-hooks.test.ts` (if exists, add combined toast tests)

### Test Scenarios

1. `runScriptAndHandle` success → returns `output`
2. `runScriptAndHandle` error → returns `undefined` (but shows error toast)
3. Multiple scripts: 2 success + 1 error → 2 error toasts + 1 combined toast (with 2 outputs)
4. Empty output scripts → filtered out (no line in combined toast)
5. All scripts fail → only error toasts (no combined toast)
