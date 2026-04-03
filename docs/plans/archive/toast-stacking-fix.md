# Plan: Prevent Toast Overlap in Opencode

## Problem

When `tui.toast.show` is called twice in sequence, the second toast appears on top of the first one.

## Objective

Make subsequent toasts appear below the previous ones **and wait for the previous one to close** before displaying the next one.

---

## Execution

| Step                                          | Status | Timestamp        |
| --------------------------------------------- | ------ | ---------------- |
| 1. Locate toast code in Opencode              | ✅     | 2026-04-01 22:30 |
| 2. Examine current implementation             | ✅     | 2026-04-01 22:35 |
| 3. Implement stack/queue system               | ✅     | 2026-04-02 03:40 |
| 4. Verify with lint/typecheck                 | ✅     | 2026-04-02 03:40 |
| 5. Adjust to wait for previous toast to close | ✅     | 2026-04-02 04:05 |

---

## Current Timeline (example with 3 toasts at T=0)

| Time     | Action                                                 |
| -------- | ------------------------------------------------------ |
| T=0ms    | Toast1, Toast2, Toast3 added to queue                  |
| T=400ms  | **Toast1 displayed** (duration=2s starts)              |
| T=2400ms | Toast1 disappears + **Toast2 displayed** (400ms after) |
| T=4400ms | Toast2 disappears + **Toast3 displayed**               |
| T=6400ms | Toast3 disappears                                      |

Now each toast waits for the previous one to finish (`duration`) before being displayed.

---

## Result ✅

This plan was completed in the previous session. The toast queue system was implemented and is working correctly.
