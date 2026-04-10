# Plan: Cover Conditional Branches and Fix Codecov Config

**Date**: 2026-04-07 16:32
**Status**: Completed
**Archived**: 2026-04-07

## Execution

| Step | Description                                                  | Status | Timestamp        |
| ---- | ------------------------------------------------------------ | ------ | ---------------- |
| 1    | Analyze uncovered branches in opencode-hooks.ts and debug.ts | ✅     | 2026-04-07 16:30 |
| 2    | Add test for skill tool branches                             | ✅     | 2026-04-07 16:35 |
| 3    | Add test for non-task tool branches                          | ✅     | 2026-04-07 16:35 |
| 4    | Add test for runOnlyOnce logic                               | ✅     | 2026-04-07 16:35 |
| 5    | Update codecov.yml: replace threshold with removed           | ✅     | 2026-04-07 16:32 |

---

---

## Background

Codecov reports 12 lines missing coverage in the PR:

- `opencode-hooks.ts`: 11 lines (conditional branches)
- `debug.ts`: 1 line (edge case)

Current coverage: 80% functions (meets 65% threshold)

## Changes

### opencode-hooks.ts Branches

| Line    | Branch                                | Test Needed                                 |
| ------- | ------------------------------------- | ------------------------------------------- |
| 87      | toastMessage fallback to buildMessage | ✅                                          |
| 146     | undefined handler fallback            | ✅                                          |
| 200     | runOnlyOnce check                     | ✅                                          |
| 236     | isTaskTool check                      | ✅                                          |
| 255-262 | isSkillTool with skillName            | ✅                                          |
| 304-451 | experimental hooks                    | Already covered in additional-hooks.test.ts |

### debug.ts

| Line | Edge Case              | Test Needed |
| ---- | ---------------------- | ----------- |
| 37   | Sanitization edge case | ✅          |

### codecov.yml

Replace `threshold: 1%` with `removed: 0%` to only fail on coverage decrease.
