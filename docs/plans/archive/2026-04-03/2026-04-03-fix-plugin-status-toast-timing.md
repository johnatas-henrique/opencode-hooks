# Fix Plugin Status Toast Timing Issue

**Date:** 2026-04-03
**Branch:** feat/active-plugins-toast

## Problem

The Plugin Status toast does not appear during plugin initialization. It only appears via the `session.created` fallback event. Root cause analysis:

1. During initialization, the plugin waits for `waitForToastSilence()` OR a 5-second timeout
2. If other plugins (like TrueMem) are actively showing toasts during this window, the toast queue is already processing
3. By the time our toast enters the queue, the user may have already dismissed or missed it
4. The fallback toast on `session.created` does appear but disappears too quickly to read

## Solution

### 1. Increase initial toast duration

- Change the duration of the startup Plugin Status toast from 8000ms to 15000ms
- This gives users enough time to read the full status

### 2. Add delay before showing startup toast

- After `waitForToastSilence()` resolves or timeout fires, add a 1000ms buffer before showing our toast
- This ensures any pending toasts from other plugins have finished displaying

### 3. Increase fallback toast duration

- The `session.created` fallback toast should also use 15000ms duration
- Currently inherits the default 8000ms from `showActivePluginsToast`

### 4. Add startup indicator toast

- Show an immediate "Loading plugin status..." toast at initialization (before waiting for silence)
- This gives the user immediate feedback that the plugin is working
- Replace it with the actual status toast once ready

## Files to Modify

1. `.opencode/plugins/helpers/show-active-plugins.ts`
   - Accept an optional `duration` parameter
   - Default remains 8000ms, but callers can override

2. `.opencode/plugins/opencode-hooks.ts`
   - Add immediate startup indicator toast
   - Increase startup toast duration to 15000ms
   - Add 1000ms buffer after silence detection before showing status toast
   - Pass custom duration to fallback toast

3. `.opencode/plugins/helpers/toast-queue.ts`
   - No changes needed (already supports custom duration)

## Tests to Add

1. Test that `showActivePluginsToast` accepts custom duration
2. Test startup toast sequence (indicator -> status)
3. Test that buffer delay works correctly

## Execution

| Step                                                           | Status | Timestamp           |
| -------------------------------------------------------------- | ------ | ------------------- |
| 1. Update `showActivePluginsToast` to accept optional duration | ✅     | 2026-04-03 18:47:15 |
| 2. Add startup indicator toast in opencode-hooks.ts            | ✅     | 2026-04-03 18:48:22 |
| 3. Add 1000ms buffer after silence detection                   | ✅     | 2026-04-03 18:48:22 |
| 4. Increase startup and fallback toast durations to 15000ms    | ✅     | 2026-04-03 18:49:08 |
| 5. Add tests for custom duration and startup sequence          | ✅     | 2026-04-03 18:50:30 |
| 6. Run existing tests to ensure no regressions                 | ✅     | 2026-04-03 18:51:00 |
| 7. Build and verify                                            | ✅     | 2026-04-03 18:51:30 |
| 8. Remove --forceExit from Jest scripts                        | ✅     | 2026-04-03 19:05:00 |

## Result ✅

**VERIFIED:** Plugin Status toast now appears correctly after TrueMem toast during TUI initialization.

The implementation successfully solved the timing issue by:

1. Showing immediate "Loading plugin status..." feedback
2. Adding 1000ms buffer after silence detection
3. Increasing toast duration to 15000ms for readability
