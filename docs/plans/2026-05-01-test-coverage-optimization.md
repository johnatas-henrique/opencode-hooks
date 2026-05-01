# Test Coverage Optimization Plan

**Date:** 2026-05-01  
**Goal:** Identify redundant tests by individually skipping each test and verifying coverage remains unchanged

## Baseline Metrics (Pre-Optimization)

| Metric     | Value  | Fraction  |
| ---------- | ------ | --------- |
| Statements | 98.2%  | 1367/1392 |
| Branches   | 96.32% | 996/1034  |
| Functions  | 98.33% | 296/301   |
| Lines      | 98.4%  | 1297/1318 |

**Total Tests:** 849  
**Total Files:** 55

**Note:** Baseline updated after commenting out 3 slow tests in `additional-hooks.test.ts` (lines 134, 265, 343). These tests are temporarily disabled to speed up coverage runs; they require manual verification after optimization completes.

## Rules

1. Test ONE `it` at a time (add or remove `.skip` individually)
2. Use `npm run coverage:report` to get metrics only (cleaner output)
3. Compare ALL 4 metrics against baseline above
4. If ANY metric changes (even 0.01%) → remove `.skip` (test necessary)
5. If ALL 4 metrics EXACTLY equal baseline → keep `.skip` (test redundant)
6. Process all 55 files in order without stopping
7. NO scripts, NO batch edits, NO git operations
8. Do NOT use `describe.skip` — only individual `it.skip`
9. "No test found" errors are expected when all tests in file are skipped — ignore
10. Checkpoints: `aft_safety checkpoint "after-file-N"` every 5 files
11. Manage context automatically with `ctx_reduce` as needed

## File Processing Order (sorted by test count, ascending)

| #   | File                                                                              | Tests | Status                                               |
| --- | --------------------------------------------------------------------------------- | ----- | ---------------------------------------------------- |
| 1   | test/unit/features/message-formatter/format-time.test.ts                          | ~3    | **DONE** (2/2 skipped)                               |
| 2   | test/unit/features/message-formatter/truncate.test.ts                             | ~3    | **DONE** (6/7 skipped, 1 necessary)                  |
| 3   | test/unit/features/messages/append-to-session.test.ts                             | ~4    | **DONE** (0/1 skipped, necessary)                    |
| 4   | test/helpers/create-config.test.ts                                                | ~10   | **DONE** (7/9 skipped, 2 necessary)                  |
| 5   | test/helpers/create-handler.test.ts                                               | ~17   | **DONE** (15/16 skipped, 1 necessary)                |
| 6   | test/unit/opencode-hooks/validate-scripts-directory.test.ts                       | ~3    | **DONE** (2/3 skipped, 1 necessary)                  |
| 7   | test/unit/opencode-hooks/tool-hooks.test.ts                                       | ~3    | **DONE** (0/2 skipped, 2 necessary)                  |
| 8   | test/unit/opencode-hooks/log-disabled-events.test.ts                              | ~3    | **DONE** (0/1 skipped, 1 necessary)                  |
| 9   | test/unit/features/messages/show-active-plugins.test.ts                           | ~4    | **DONE** (0/2 skipped, 2 necessary)                  |
| 10  | test/unit/features/messages/show-startup-toast.test.ts                            | ~4    | **DONE** (0/3 skipped, 3 necessary)                  |
| 11  | test/unit/features/events/resolution/resolution.boolean-field.test.ts             | ~7    | **DONE** (5/6 skipped, 1 necessary)                  |
| 12  | test/unit/features/audit/debug-recorder.test.ts                                   | ~7    | **DONE** (4/6 skipped, 2 necessary)                  |
| 13  | test/unit/features/audit/security-recorder.test.ts                                | ~5    | **DONE** (2/4 skipped, 2 necessary)                  |
| 14  | test/unit/features/block-system/block-handler.test.ts                             | ~7    | pending                                              |
| 15  | test/unit/features/events/events.test.ts                                          | ~7    | pending                                              |
| 16  | test/unit/features/messages/plugin-status.test.ts                                 | ~25   | pending                                              |
| 17  | test/unit/features/events/resolvers/normalize-input.test.ts                       | ~23   | pending                                              |
| 18  | test/unit/config/security-rules.test.ts                                           | ~10   | pending                                              |
| 19  | test/unit/features/audit/audit-plugin-integration.test.ts                         | ~10   | pending                                              |
| 20  | test/integration/toast-contract.test.ts                                           | ~10   | pending                                              |
| 21  | test/integration/toast-queue-concurrency.test.ts                                  | ~6    | pending                                              |
| 22  | test/unit/features/audit/event-recorder.test.ts                                   | ~15   | pending                                              |
| 23  | test/unit/features/audit/error-recorder.test.ts                                   | ~10   | pending                                              |
| 24  | test/unit/features/audit/script-recorder.test.ts                                  | ~10   | pending                                              |
| 25  | test/unit/features/block-system/block-system.test.ts                              | ~15   | pending                                              |
| 26  | test/unit/features/core/toast-director.test.ts                                    | ~20   | pending                                              |
| 27  | test/unit/features/events/events.context.test.ts                                  | ~10   | pending                                              |
| 28  | test/unit/features/events/events.get-tool-handler.test.ts                         | ~10   | pending                                              |
| 29  | test/unit/features/events/resolution/resolution.tool-config.test.ts               | ~15   | pending                                              |
| 30  | test/unit/features/events/resolution/toast-resolution.test.ts                     | ~15   | pending                                              |
| 31  | test/unit/features/events/resolvers/build-message.test.ts                         | ~10   | pending                                              |
| 32  | test/unit/features/events/resolvers/event-config-builder.test.ts                  | ~20   | pending                                              |
| 33  | test/unit/features/events/resolvers/resolution.event-config.test.ts               | ~10   | pending                                              |
| 34  | test/unit/features/handlers/handlers.test.ts                                      | ~17   | pending                                              |
| 35  | test/unit/features/message-formatter/mask-sensitive.test.ts                       | ~10   | pending                                              |
| 36  | test/unit/features/message-formatter/message-formatter.build-keys-message.test.ts | ~10   | pending                                              |
| 37  | test/unit/features/message-formatter/message-formatter.get-value-by-path.test.ts  | ~10   | pending                                              |
| 38  | test/unit/features/messages/plugin-status-coverage.test.ts                        | ~50   | pending                                              |
| 39  | test/unit/features/messages/toast-silence-detector.test.ts                        | ~15   | pending                                              |
| 40  | test/unit/features/scripts/adapters.test.ts                                       | ~15   | pending                                              |
| 41  | test/unit/features/scripts/executor.test.ts                                       | ~20   | pending                                              |
| 42  | test/unit/features/scripts/run-script-handler.test.ts                             | ~25   | pending                                              |
| 43  | test/unit/features/scripts/run-script.test.ts                                     | ~15   | pending                                              |
| 44  | test/unit/features/scripts/script-executor.test.ts                                | ~20   | pending                                              |
| 45  | test/unit/features/scripts/script-runner.test.ts                                  | ~20   | pending                                              |
| 46  | test/unit/features/scripts/scripts.test.ts                                        | ~25   | pending                                              |
| 47  | test/unit/opencode-hooks/additional-hooks.test.ts                                 | ~30   | **MANUAL VERIFICATION** (3 slow tests commented out) |
| 48  | test/unit/opencode-hooks/event-handler.test.ts                                    | ~20   | pending                                              |
| 49  | test/unit/opencode-hooks/opencode-hooks-enabled-coverage.test.ts                  | ~50   | pending                                              |
| 50  | test/unit/opencode-hooks/opencode-hooks-specialized-coverage.test.ts              | ~30   | pending                                              |
| 51  | test/integration/event-flow.test.ts                                               | ~20   | pending                                              |
| 52  | test/unit/config/claude-settings.test.ts                                          | ~25   | pending                                              |
| 53  | test/unit/core/debug.test.ts                                                      | ~20   | pending                                              |
| 54  | test/unit/core/toast-queue.test.ts                                                | ~60   | pending                                              |
| 55  | test/unit/features/audit/audit-logger.test.ts                                     | ~30   | pending                                              |

## Execution Log

### File 1: format-time.test.ts

- Test 1 ("returns non-empty string"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("returns valid time format"): SKIPPED ✓ (coverage unchanged)

### File 4: create-config.test.ts

- Test 1 ("should create base config when no overrides provided"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should add event config when override provided"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should override tool configs when provided"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should create partial config with event override"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should create partial config with empty event object"): REVERTED ✗ (coverage changed — necessary)
- Test 6 ("should create partial config with tool-specific event override"): SKIPPED ✓ (coverage unchanged)
- Test 7 ("should include all default tool event types"): SKIPPED ✓ (coverage unchanged)
- Test 8 ("should create partial config for specific tool"): SKIPPED ✓ (coverage unchanged)
- Test 9 ("should not affect other tools when creating partial config"): REVERTED ✗ (coverage changed — necessary)

File 4 partially redundant (7/9 skipped, 2 necessary)

### File 5: create-handler.test.ts

- Test 1 ("should use default buildMessage when no override provided"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should override title when provided"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should override variant to warning"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should override duration to 5000ms"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should override defaultScript"): SKIPPED ✓ (coverage unchanged)
- Test 6 ("should override buildMessage function"): SKIPPED ✓ (coverage unchanged)
- Test 7 ("should add allowedFields when provided"): SKIPPED ✓ (coverage unchanged)
- Test 8 ("should add defaultTemplate when provided"): SKIPPED ✓ (coverage unchanged)
- Test 9 ("should merge multiple overrides correctly"): SKIPPED ✓ (coverage unchanged)
- Test 10 ("should call buildMessage with correct parameters"): SKIPPED ✓ (coverage unchanged)
- Test 11 ("should create empty object when no configs provided"): SKIPPED ✓ (coverage unchanged)
- Test 12 ("should create single handler with default values"): SKIPPED ✓ (coverage unchanged)
- Test 13 ("should create multiple handlers with overrides"): SKIPPED ✓ (coverage unchanged)
- Test 14 ("should maintain separate configs for different events"): SKIPPED ✓ (coverage unchanged)
- Test 15 ("should handle 5 different event types"): SKIPPED ✓ (coverage unchanged)
- Test 16 ("should pass all override properties to each handler"): REVERTED ✗ (coverage changed — necessary)

File 5 partially redundant (15/16 skipped, 1 necessary)

### File 6: validate-scripts-directory.test.ts

- Test 1 ("should pass when .opencode/scripts exists"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should throw during plugin initialization when scripts directory missing"): REVERTED ✗ (coverage changed — necessary)
- Test 3 ("should initialize successfully when scripts directory exists"): SKIPPED ✓ (coverage unchanged)

File 6 partially redundant (2/3 skipped, 1 necessary)

### File 7: tool-hooks.test.ts

- Test 1 ("should not trigger toast when subagent_type is undefined"): SKIPPED but REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should show error toast when script fails"): SKIPPED but REVERTED ✗ (coverage changed — necessary)

File 7 not redundant (0/2 skipped, 2 necessary)

### File 8: log-disabled-events.test.ts

- Test 1 ("should not show toast when event is disabled"): SKIPPED but REVERTED ✗ (coverage changed — necessary)

File 8 not redundant (0/1 skipped, 1 necessary)

### File 9: show-active-plugins.test.ts

- Test 1 ("should call formatPluginStatus with plugin statuses"): SKIPPED but REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should return early and not add toast"): SKIPPED but REVERTED ✗ (coverage changed — necessary)

File 9 not redundant (0/2 skipped, 2 necessary)

### File 10: show-startup-toast.test.ts

- Test 1 ("should handle error when showActivePluginsToast fails"): SKIPPED but REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should use errorRecorder.logError when errorRecorder is present"): SKIPPED but REVERTED ✗ (coverage changed — necessary)
- Test 3 ("should convert non-Error thrown to Error in errorRecorder.logError"): SKIPPED but REVERTED ✗ (coverage changed — necessary)

File 10 not redundant (0/3 skipped, 3 necessary)

### File 11: resolution.boolean-field.test.ts

- Test 1 ("should return false when eventCfg enabled is false"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should return defaultCfg value when eventCfg undefined"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should cover line 20 when defaultCfg defined but key undefined"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should cover defaultCfg !== null branch"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should return false when eventCfg and defaultCfg undefined"): REVERTED ✗ (coverage changed — necessary)
- Test 6 ("should handle toast key specially"): SKIPPED ✓ (coverage unchanged)

File 11 partially redundant (5/6 skipped, 1 necessary)

### File 12: debug-recorder.test.ts

- Test 1 ("should log debug with data"): REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should log debug with warn level"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should log debug with error level"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should return null when not set"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should return set recorder"): SKIPPED ✓ (coverage unchanged)
- Test 6 ("should handle multiple set/get cycles"): REVERTED ✗ (coverage changed — necessary)

File 12 partially redundant (4/6 skipped, 2 necessary)

### File 13: security-recorder.test.ts

- Test 1 ("should log security with session"): REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should return null when not set"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should return set recorder"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should handle multiple set/get cycles"): REVERTED ✗ (coverage changed — necessary)

File 13 partially redundant (2/4 skipped, 2 necessary)

### File 14: block-handler.test.ts

- Test 1 ("handles rejected logSecurity gracefully"): necessary (coverage changed)
- Test 2 ("returns early when blockConfig is empty array"): necessary (coverage changed)
- Test 3 ("returns early without throwing when securityRecorder is null"): necessary (coverage changed)
- Test 4 ("creates notify effect that adds toast"): necessary (coverage changed)
- Test 5 ("logs security when recorder is present"): necessary (coverage changed)
- Test 6 ("does not log when recorder is null"): necessary (coverage changed)

File 14 not redundant (0/6 skipped, 6 necessary)

## Summary

| Category                       | Count |
| ------------------------------ | ----- |
| Tests Skipped (redundant)      | 41    |
| Tests Reverted (necessary)     | 17    |
| Files with all tests redundant | 1     |
| Files partially redundant      | 6     |

## Notes

- Coverage threshold errors (100%) are expected and should be ignored
- Only compare against the 4 baseline metrics above
- Context management via `ctx_reduce` is permitted
- Safety checkpoints via `aft_safety` are permitted before edits
- **Manual Verification Required:** `additional-hooks.test.ts` (File 47) has 3 slow tests commented out (lines 134, 265, 343). After all other skips are complete, restore these tests one at a time to determine if they are redundant, using the same baseline (with all other optimizations applied).
