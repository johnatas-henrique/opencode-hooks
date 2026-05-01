# Test Coverage Optimization Plan

**Date:** 2026-05-01  
**Goal:** Identify redundant tests by individually skipping each test and verifying coverage remains unchanged

## Baseline Metrics (Pre-Optimization)

| Metric     | Value  | Fraction  |
| ---------- | ------ | --------- |
| Statements | 99.06% | 1379/1392 |
| Branches   | 97.09% | 1004/1034 |
| Functions  | 99.33% | 299/301   |
| Lines      | 99.31% | 1309/1318 |

**Total Tests:** 849  
**Total Files:** 55

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

| #   | File                                                                              | Tests | Status  |
| --- | --------------------------------------------------------------------------------- | ----- | ------- |
| 1   | test/unit/features/message-formatter/format-time.test.ts                          | ~3    | pending |
| 2   | test/unit/features/message-formatter/truncate.test.ts                             | ~3    | pending |
| 3   | test/unit/features/messages/append-to-session.test.ts                             | ~4    | pending |
| 4   | test/helpers/create-config.test.ts                                                | ~10   | pending |
| 5   | test/helpers/create-handler.test.ts                                               | ~17   | pending |
| 6   | test/unit/opencode-hooks/validate-scripts-directory.test.ts                       | ~3    | pending |
| 7   | test/unit/opencode-hooks/tool-hooks.test.ts                                       | ~3    | pending |
| 8   | test/unit/opencode-hooks/log-disabled-events.test.ts                              | ~3    | pending |
| 9   | test/unit/features/messages/show-active-plugins.test.ts                           | ~4    | pending |
| 10  | test/unit/features/messages/show-startup-toast.test.ts                            | ~4    | pending |
| 11  | test/unit/features/events/resolution/resolution.boolean-field.test.ts             | ~7    | pending |
| 12  | test/unit/features/audit/debug-recorder.test.ts                                   | ~7    | pending |
| 13  | test/unit/features/audit/security-recorder.test.ts                                | ~5    | pending |
| 14  | test/unit/features/block-system/block-handler.test.ts                             | ~7    | pending |
| 15  | test/unit/features/events/events.test.ts                                          | ~7    | pending |
| 16  | test/unit/features/messages/plugin-status.test.ts                                 | ~25   | pending |
| 17  | test/unit/features/events/resolvers/normalize-input.test.ts                       | ~23   | pending |
| 18  | test/unit/config/security-rules.test.ts                                           | ~10   | pending |
| 19  | test/unit/features/audit/audit-plugin-integration.test.ts                         | ~10   | pending |
| 20  | test/integration/toast-contract.test.ts                                           | ~10   | pending |
| 21  | test/integration/toast-queue-concurrency.test.ts                                  | ~6    | pending |
| 22  | test/unit/features/audit/event-recorder.test.ts                                   | ~15   | pending |
| 23  | test/unit/features/audit/error-recorder.test.ts                                   | ~10   | pending |
| 24  | test/unit/features/audit/script-recorder.test.ts                                  | ~10   | pending |
| 25  | test/unit/features/block-system/block-system.test.ts                              | ~15   | pending |
| 26  | test/unit/features/core/toast-director.test.ts                                    | ~20   | pending |
| 27  | test/unit/features/events/events.context.test.ts                                  | ~10   | pending |
| 28  | test/unit/features/events/events.get-tool-handler.test.ts                         | ~10   | pending |
| 29  | test/unit/features/events/resolution/resolution.tool-config.test.ts               | ~15   | pending |
| 30  | test/unit/features/events/resolution/toast-resolution.test.ts                     | ~15   | pending |
| 31  | test/unit/features/events/resolvers/build-message.test.ts                         | ~10   | pending |
| 32  | test/unit/features/events/resolvers/event-config-builder.test.ts                  | ~20   | pending |
| 33  | test/unit/features/events/resolvers/resolution.event-config.test.ts               | ~10   | pending |
| 34  | test/unit/features/handlers/handlers.test.ts                                      | ~17   | pending |
| 35  | test/unit/features/message-formatter/mask-sensitive.test.ts                       | ~10   | pending |
| 36  | test/unit/features/message-formatter/message-formatter.build-keys-message.test.ts | ~10   | pending |
| 37  | test/unit/features/message-formatter/message-formatter.get-value-by-path.test.ts  | ~10   | pending |
| 38  | test/unit/features/messages/plugin-status-coverage.test.ts                        | ~50   | pending |
| 39  | test/unit/features/messages/toast-silence-detector.test.ts                        | ~15   | pending |
| 40  | test/unit/features/scripts/adapters.test.ts                                       | ~15   | pending |
| 41  | test/unit/features/scripts/executor.test.ts                                       | ~20   | pending |
| 42  | test/unit/features/scripts/run-script-handler.test.ts                             | ~25   | pending |
| 43  | test/unit/features/scripts/run-script.test.ts                                     | ~15   | pending |
| 44  | test/unit/features/scripts/script-executor.test.ts                                | ~20   | pending |
| 45  | test/unit/features/scripts/script-runner.test.ts                                  | ~20   | pending |
| 46  | test/unit/features/scripts/scripts.test.ts                                        | ~25   | pending |
| 47  | test/unit/opencode-hooks/additional-hooks.test.ts                                 | ~30   | pending |
| 48  | test/unit/opencode-hooks/event-handler.test.ts                                    | ~20   | pending |
| 49  | test/unit/opencode-hooks/opencode-hooks-enabled-coverage.test.ts                  | ~50   | pending |
| 50  | test/unit/opencode-hooks/opencode-hooks-specialized-coverage.test.ts              | ~30   | pending |
| 51  | test/integration/event-flow.test.ts                                               | ~20   | pending |
| 52  | test/unit/config/claude-settings.test.ts                                          | ~25   | pending |
| 53  | test/unit/core/debug.test.ts                                                      | ~20   | pending |
| 54  | test/unit/core/toast-queue.test.ts                                                | ~60   | pending |
| 55  | test/unit/features/audit/audit-logger.test.ts                                     | ~30   | pending |

## Execution Log

### File 1: format-time.test.ts

- [pending]

### File 2: truncate.test.ts

- [pending]

## Summary

| Category                       | Count |
| ------------------------------ | ----- |
| Tests Skipped (redundant)      | 0     |
| Tests Reverted (necessary)     | 0     |
| Files with all tests redundant | 0     |
| Files partially redundant      | 0     |

## Notes

- Coverage threshold errors (100%) are expected and should be ignored
- Only compare against the 4 baseline metrics above
- Context management via `ctx_reduce` is permitted
- Safety checkpoints via `aft_safety` are permitted before edits
