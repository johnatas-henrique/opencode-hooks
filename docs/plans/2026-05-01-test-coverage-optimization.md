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

**Note:** Baseline ORIGINAL (98.2%, 96.32%, 98.33%, 98.4%) — valores FIXOS, NÃO recalculados. File 47 (additional-hooks.test.ts) será **PULADO COMPLETAMENTE** — não processado, não verificado.

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
11. Processamento: apenas `.skip` em `it`, NUNCA em `describe`
12. Ferramentas permitidas: READ, EDIT, ctx_reduce, aft_safety, npm run coverage:report (NENHUMA outra ferramenta)
13. File 47 (additional-hooks.test.ts): PULO COMPLETO (não processado, não verificado)

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
| 14  | test/unit/features/block-system/block-handler.test.ts                             | ~7    | **DONE** (0/6 skipped, 6 necessary)                  |
| 15  | test/unit/features/events/events.test.ts                                          | ~7    | **DONE** (2/6 skipped, 4 necessary)                  |
| 16  | test/unit/features/messages/plugin-status.test.ts                                 | ~25   | **DONE** (2/24 skipped, 22 necessary)                |
| 17  | test/unit/features/events/resolvers/normalize-input.test.ts                       | ~23   | **DONE** (17/22 skipped, 5 necessary)                |
| 18  | test/unit/config/security-rules.test.ts                                           | ~19   | **DONE** (7/19 skipped, 12 necessary)                |
| 19  | test/unit/features/audit/audit-plugin-integration.test.ts                         | ~10   | pending                                              |
| 20  | test/integration/toast-contract.test.ts                                           | ~10   | **DONE** (6/7 skipped, 1 necessary)                  |
| 21  | test/integration/toast-queue-concurrency.test.ts                                  | ~6    | **DONE** (4/5 skipped, 1 necessary)                  |
| 22  | test/unit/features/audit/event-recorder.test.ts                                   | ~35   | **DONE** (17 skipped, 18 necessary)                  |
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

### File 15: events.test.ts

- Test 1 ("should return toast: false when default toast is object with enabled: false"): necessary (coverage changed)
- Test 2 ("should return enabled: false when global enabled is false"): necessary (coverage changed)
- Test 3 ("should return enabled: false for event config boolean false"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should return empty string when buildMessage throws"): necessary (coverage changed)
- Test 5 ("getToolHandler should return undefined for invalid toolEventType"): necessary (coverage changed)
- Test 6 ("getHandler should return handler for valid event type"): SKIPPED ✓ (coverage unchanged)

File 15 partially redundant (2/6 skipped, 4 necessary)

### File 16: plugin-status.test.ts

- Test 1 ("should return null when no .log files after filter"): REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should override active status with failed when both exist"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should skip non-plugin log entries"): REVERTED ✗ (coverage changed — necessary)
- Test 4 ("should handle malformed log lines gracefully"): REVERTED ✗ (coverage changed — necessary)
- Test 5 ("should return empty array when file read fails"): REVERTED ✗ (coverage changed — necessary)
- Test 6 ("should use DEFAULT_SESSION_ID when no name path or pkg"): REVERTED ✗ (coverage changed — necessary)
- Test 7 ("should use entry.message when error tag is not present"): REVERTED ✗ (coverage changed — necessary)
- Test 8 ("should not overwrite existing plugin status with same name"): REVERTED ✗ (coverage changed — necessary)
- Test 9 ("should handle warn level without incompatible message"): REVERTED ✗ (coverage changed — necessary)
- Test 10 ("should sort files with dev.log and timestamped files"): REVERTED ✗ (coverage changed — necessary)
- Test 11 ("should return message when no plugins detected"): REVERTED ✗ (coverage changed — necessary)
- Test 12 ("should format mixed statuses"): REVERTED ✗ (coverage changed — necessary)
- Test 13 ("should show failed plugin without error message"): REVERTED ✗ (coverage changed — necessary)
- Test 14 ("should show total count including built-in"): REVERTED ✗ (coverage changed — necessary)
- Test 15 ("should show failed section when failed plugins exist"): REVERTED ✗ (coverage changed — necessary)
- Test 16 ("should show incompatible section when incompatible plugins exist"): REVERTED ✗ (coverage changed — necessary)
- Test 17 ("should show failed plugin without error"): REVERTED ✗ (coverage changed — necessary)
- Test 18 ("should show total count including all plugins"): REVERTED ✗ (coverage changed — necessary)
- Test 19 ("should show failed section with labels when failed plugins exist"): SKIPPED ✓ (coverage unchanged)
- Test 20 ("should show incompatible section with labels when incompatible plugins exist"): REVERTED ✗ (coverage changed — necessary)
- Test 21 ("should show failed plugin without error in all-labeled mode"): REVERTED ✗ (coverage changed — necessary)
- Test 22 ("should use built-in label for failed in all-labeled mode"): REVERTED ✗ (coverage changed — necessary)
- Test 23 ("should use user label when source is undefined in all-labeled mode"): REVERTED ✗ (coverage changed — necessary)
- Test 24 ("should default to user-only when no mode specified"): REVERTED ✗ (coverage changed — necessary)

File 16 partially redundant (2/24 skipped, 22 necessary)

### File 17: normalize-input.test.ts

- Test 1 ("should wrap shell.env input in properties"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should cover line 10 when eventType exactly equals shell.env"): REVERTED ✗ (coverage changed — necessary)
- Test 3 ("should cover line 22 when eventType exactly equals command.execute.before"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should wrap permission input in properties"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should wrap command input in properties"): REVERTED ✗ (coverage changed — necessary)
- Test 6 ("should wrap tool.definition input in properties"): SKIPPED ✓ (coverage unchanged)
- Test 7 ("should wrap experimental input in properties"): SKIPPED ✓ (coverage unchanged)
- Test 8 ("should handle chat.message event"): SKIPPED ✓ (coverage unchanged)
- Test 9 ("should handle chat.conversation event"): SKIPPED ✓ (coverage unchanged)
- Test 10 ("should handle chat.update event"): SKIPPED ✓ (coverage unchanged)
- Test 11 ("should handle experimental.text.complete"): SKIPPED ✓ (coverage unchanged)
- Test 12 ("should handle experimental.audio.start"): REVERTED ✗ (coverage changed — necessary)
- Test 13 ("should handle permission.check"): REVERTED ✗ (coverage changed — necessary)
- Test 14 ("should handle permission-response"): SKIPPED ✓ (coverage unchanged)
- Test 15 ("should return input/output for tool.execute.before"): SKIPPED ✓ (coverage unchanged)
- Test 16 ("should return input/output for tool.execute.after"): SKIPPED ✓ (coverage unchanged)
- Test 17 ("should preserve input for tool events"): SKIPPED ✓ (coverage unchanged)
- Test 18 ("should return properties when eventType is custom with properties object"): SKIPPED ✓ (coverage unchanged)
- Test 19 ("should cover typeof branch when properties is truthy non-object (line 27)"): SKIPPED ✓ (coverage unchanged)
- Test 20 ("should extract nested properties object for unknown events"): SKIPPED ✓ (coverage unchanged)
- Test 21 ("should handle input without properties (fallback to line 30)"): SKIPPED ✓ (coverage unchanged)
- Test 22 ("should handle input with empty properties object"): REVERTED ✗ (coverage changed — necessary)

File 17 partially redundant (17/22 skipped, 5 necessary)

### File 18: security-rules.test.ts

- Test 1 ("should handle null filePath"): REVERTED ✗ (coverage changed — necessary)
- Test 2 ("should not block normal git commands"): REVERTED ✗ (coverage changed — necessary)
- Test 3 ("should not block when command is undefined"): REVERTED ✗ (coverage changed — necessary)
- Test 4 ("should not block when all scripts succeed"): REVERTED ✗ (coverage changed — necessary)
- Test 5 ("should not block when filePath is undefined"): REVERTED ✗ (coverage changed — necessary)
- Test 6 ("should not block when command is undefined"): REVERTED ✗ (coverage changed — necessary)
- Test 7 ("should not block push to feature branch"): SKIPPED ✓ (coverage unchanged)
- Test 8 ("should not block when command is undefined"): SKIPPED ✓ (coverage unchanged)
- Test 9 ("should block push to main"): SKIPPED ✓ (coverage unchanged)
- Test 10 ("should block push to master"): SKIPPED ✓ (coverage unchanged)
- Test 11 ("should block push to develop"): SKIPPED ✓ (coverage unchanged)
- Test 12 ("should not block non-git commands"): SKIPPED ✓ (coverage unchanged)
- Test 13 ("should not block git commands that are not push"): REVERTED ✗ (coverage changed — necessary)
- Test 14 ("should block main in any position"): REVERTED ✗ (coverage changed — necessary)
- Test 15 ("should be case insensitive"): SKIPPED ✓ (coverage unchanged)
- Test 16 ("should detect secrets in nested objects"): REVERTED ✗ (coverage changed — necessary)
- Test 17 ("should handle nested objects without secrets"): REVERTED ✗ (coverage changed — necessary)
- Test 18 ("should return false for non-secret values"): SKIPPED ✓ (coverage unchanged)
- Test 19 ("should handle exactly 100KB"): REVERTED ✗ (coverage changed — necessary)

File 18 partially redundant (7/19 skipped, 12 necessary)

### File 20: toast-contract.test.ts

- Test 1 ("should find handler for session.error"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should return undefined for nonexistent event"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should return shouldShow: true when enabled and toast true"): SKIPPED ✓ (coverage unchanged)
- Test 4 ("should return shouldShow: false when event is disabled"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should return shouldShow: false when handler not found"): SKIPPED ✓ (coverage unchanged)
- Test 6 ("should use handler variant when config variant not set"): SKIPPED ✓ (coverage unchanged)
- Test 7 ("should use handler duration when config duration not set"): REVERTED ✗ (coverage changed — necessary)

File 20 partially redundant (6/7 skipped, 1 necessary)

### File 21: toast-queue-concurrency.test.ts

- Test 1 ("should return early if queue becomes empty during lock wait"): SKIPPED ✓ (coverage unchanged)
- Test 2 ("should log dropped toast when queue exceeds maxSize"): SKIPPED ✓ (coverage unchanged)
- Test 3 ("should use default session ID for dropped toast with no title"): REVERTED ✗ (coverage changed — necessary)
- Test 4 ("should clean up active timers during toast processing"): SKIPPED ✓ (coverage unchanged)
- Test 5 ("should handle adding multiple toasts at once"): SKIPPED ✓ (coverage unchanged)

File 21 partially redundant (4/5 skipped, 1 necessary)

### File 22: event-recorder.test.ts

- `extractTool "should return unknown when tool is undefined"`: active (NECESSARY — never tested as baseline default)
- `extractSession "should return unknown when no session identifier"`: active (NECESSARY)
- `createToolExecuteAfterRecord "should create record with error status for non-zero exit"`: active (NECESSARY)
- `createSessionEventRecord "should create record with correct fields"`: REVERTED ✗ (necessary)
- `createSessionEventRecord "should use sessionID directly when provided"`: REVERTED ✗ (necessary)
- `createSessionEventRecord "should return null when shouldLogResult is false"`: SKIPPED ✓ (redundant)
- `extractDirectory "should return unknown when directory is not available"`: SKIPPED ✓ (redundant)
- `createToolExecuteBeforeRecord "should return null when shouldLogResult is false"`: SKIPPED ✓ (redundant)
- `createToolExecuteBeforeRecord "should return record when shouldLogResult is true"`: SKIPPED ✓ (redundant)
- `logEvent "should log generic event with input and output"`: SKIPPED ✓ (redundant)
- `logEvent "should not log when level is audit"`: SKIPPED ✓ (redundant)
- `logEvent "should include tool name when provided"`: SKIPPED ✓ (redundant)
- `logEvent "should add context field when provided"`: SKIPPED ✓ (redundant)
- `logEvent "should handle null record gracefully"`: REVERTED ✗ (necessary)
- `logEvent "should handle undefined input and pass sessionID"`: SKIPPED ✓ (redundant)
- `logToolExecuteBefore "should not log when level is audit"`: REVERTED ✗ (necessary)
- `logToolExecuteBefore "should log when record is not null"`: REVERTED ✗ (necessary)
- `logToolExecuteAfter "should log tool.execute.after with correct fields"`: REVERTED ✗ (necessary)
- `logToolExecuteAfter "should not log when level is audit"` (top-level): REVERTED ✗ (necessary)
- `logSessionEvent "should not log when disabled"`: REVERTED ✗ (necessary)
- `logSessionEvent "should log when record is not null"`: REVERTED ✗ (necessary)
- `createGenericEventRecord "should create record with sanitized input and output"`: SKIPPED ✓ (redundant)
- `createGenericEventRecord "should extract session from info.id when sessionID not present"`: REVERTED ✗ (necessary)
- `createGenericEventRecord "should return null when shouldLogResult is false"`: SKIPPED ✓ (redundant)
- `createGenericEventRecord "should truncate large string fields"`: SKIPPED ✓ (redundant)
- `createGenericEventRecord "should redact sensitive fields"`: SKIPPED ✓ (redundant)
- `createGenericEventRecord "should limit array items"`: REVERTED ✗ (necessary)
- `createGenericEventRecord "should sanitize nested objects"`: REVERTED ✗ (necessary)
- `createGenericEventRecord "should handle arrays with primitive values"`: REVERTED ✗ (necessary)
- `createGenericEventRecord "should handle empty input and output"`: REVERTED ✗ (necessary)
- `setGlobalTruncationKB "should set global truncation KB value"`: SKIPPED ✓ (redundant)
- `LARGE_FIELDS "should truncate patch field when larger than truncationKB"`: SKIPPED ✓ (redundant)
- `LARGE_FIELDS "should truncate diff field"`: SKIPPED ✓ (redundant)
- `LARGE_FIELDS "should truncate diff field inside properties"`: SKIPPED ✓ (redundant)
- `LARGE_FIELDS "should truncate content field when it is LARGE_FIELD"`: REVERTED ✗ (necessary)

File 22 partially redundant (17 skipped, 18 necessary)

## Summary

| Category                       | Count |
| ------------------------------ | ----- |
| Tests Skipped (redundant)      | 94    |
| Tests Reverted (necessary)     | 76    |
| Files with all tests redundant | 1     |
| Files partially redundant      | 14    |

## Notes

- **Coverage 100% errors:** ignorar (esperados)
- **Comparação:** TODAS as 4 métricas (Statements 98.2%, Branches 96.32%, Functions 98.33%, Lines 98.4%) — sempre verificar as 4
- **Skips permanentes:** `.skip` aplicado e mantido no arquivo (não temporário)
- **Ferramentas permitidas:** apenas READ, EDIT, ctx_reduce, aft_safety, npm run coverage:report
- **Apenas `it.skip`:** NUNCA usar `describe.skip`
- **File 47:** PULO COMPLETO (não processado, não verificado)
- **Checkpoints:** `aft_safety checkpoint "after-file-N"` a cada 5 arquivos completos
- **Contexto:** `ctx_reduce` permitido para gerenciar contexto
