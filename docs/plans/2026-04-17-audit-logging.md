# Plan: Plugin Audit Logging System

> Source PRD: `docs/prds/2026-04-16-audit-logging-system.md`

## Architectural Decisions

Durable decisions that apply across all phases:

- **Format**: JSONL (one JSON object per line, grep-friendly)
- **Files**:
  - `plugin-events.jsonl` - All plugin events (tool.execute, session events)
  - `plugin-scripts.jsonl` - Script execution outputs with exit codes
  - `plugin-errors.jsonl` - Errors categorized as config vs code
- **Truncation**: Script output truncated from beginning, last 10KB kept
- **Rotation**: Gzip + new file when maxSizeMB reached
  - Format: `plugin-events-YYYY-MM-DD-001.jsonl.gz` (counter for same day)
- **Retention**: Files older than maxAgeDays deleted (on-demand cleanup)

---

## Phase 1: Core Audit Logger Infrastructure

**User stories**: 5, 10 (small files, forward-compatible format)

### What to build

Create the base `audit-logger.ts` module with:

- JSONL line writer (append to file)
- File rotation (gzip + new file)
- Retention cleanup (age-based deletion)
- Configuration loading

### Acceptance criteria

- [ ] Can write valid JSONL lines to file
- [ ] Each line is parseable with `JSON.parse()`
- [ ] File rotation triggers when maxSizeMB exceeded
- [ ] Rotated files are gzip compressed
- [ ] Old files deleted after maxAgeDays

### Tests

**What**: Unit tests for `audit-logger.ts` (DI-based)

**How**: Create mock file system, verify writes and rotations

**Criteria**:

- [ ] `writeLine()` appends valid JSON to file
- [ ] `rotate()` creates gzip and starts new file
- [ ] `cleanup()` deletes files older than maxAgeDays
- [ ] Multiple concurrent writes handled safely

---

## Phase 2: Event Recorder

**User stories**: 1, 3, 9 (find by type, timestamp, debug/audit levels)

### What to build

Create `event-recorder.ts` that replaces current `EVENT_OUTPUT` logging:

- Log `tool.execute.before` with tool name, session
- Log `tool.execute.after` with tool name, session, status, duration, error
- Log `session.*` events with session ID, directory
- Respects log level (debug = all, audit = none)

Event fields:

- `tool.execute.before`: ts, event, tool, session
- `tool.execute.after`: ts, event, tool, session, status, duration, error
- `session.*`: ts, event, session, directory

### Acceptance criteria

- [ ] `tool.execute.before` logged with correct fields
- [ ] `tool.execute.after` logged with correct fields
- [ ] `session.*` events logged correctly
- [ ] Audit level disables event logging
- [ ] No `scriptToasts` in logged data

### Tests

**What**: Unit tests for `event-recorder.ts` (DI-based)

**How**: Create test event inputs, verify logged JSON structure

**Criteria**:

- [ ] `tool.execute.before` output has ts, event, tool, session
- [ ] `tool.execute.after` output has ts, event, tool, session, status, duration
- [ ] session.\* events have ts, event, session, directory
- [ ] `scriptToasts` not present in output
- [ ] Audit level produces no output for events

---

## Phase 3: Script Recorder

**User stories**: 2, 6, 7, 8 (script output, exit codes, truncation)

### What to build

Create `script-recorder.ts` that:

- Logs script name, args, exit code, duration, output
- Truncates output from beginning, keeps last 10KB
- Works with both success and failure

Script fields:

- ts, script, args, exit, duration, output (truncated)

### Acceptance criteria

- [ ] Successful script executions logged with exit: 0
- [ ] Failed script executions logged with exit: 1 and error output
- [ ] Output > 10KB truncated, last 10KB kept
- [ ] All scripts logged regardless of log level

### Tests

**What**: Unit tests for `script-recorder.ts` (DI-based)

**How**: Create mock script results, verify logged JSON and truncation

**Criteria**:

- [ ] exit: 0 for successful scripts
- [ ] exit: 1 for failed scripts
- [ ] Output truncation keeps last 10KB
- [ ] Duration field present
- [ ] Works regardless of audit level

---

## Phase 4: Error Recorder

**User stories**: 4, 6 (errors only, config vs code)

### What to build

Create `error-recorder.ts` that:

- Logs errors to `plugin-errors.jsonl`
- Classifies errors as `config` or `code`
- Includes stack trace for code errors
- Includes context for config errors (script path, event type, etc.)

Error sources:
| Source | Type |
|--------|------|
| Script validation (path, permission) | config |
| Script exit code != 0 | config |
| save-to-file failure | config |
| tryBuildMessage catch | code |

### Acceptance criteria

- [ ] Script validation errors logged as config
- [ ] Script failures logged as config
- [ ] save-to-file failures logged as config
- [ ] tryBuildMessage errors logged as code with stack

### Tests

**What**: Unit tests for `error-recorder.ts` (DI-based)

**How**: Mock different error sources, verify classification and output

**Criteria**:

- [ ] Script path not found → type: "config"
- [ ] Script permission denied → type: "config"
- [ ] Script exit code != 0 → type: "config"
- [ ] save-to-file failure → type: "config"
- [ ] tryBuildMessage exception → type: "code" with stack
- [ ] All errors have ts, event, error, type fields

---

## Phase 5: Configuration & Settings

**User stories**: 9 (debug/audit levels)

### What to build

Add `audit` configuration section to `settings.ts` (nested in `userConfig`):

```typescript
audit: {
  enabled: boolean;
  level: 'debug' | 'audit';
  maxSizeMB: number;
  maxAgeDays: number;
  truncationKB: number;
  files: {
    events: string;
    scripts: string;
    errors: string;
  }
}
```

Defaults:

- `enabled`: true
- `level`: 'debug'
- `maxSizeMB`: 10
- `maxAgeDays`: 30
- `truncationKB`: 10

### Acceptance criteria

- [ ] All settings configurable
- [ ] Default values sensible
- [ ] Invalid values trigger warning and use defaults
- [ ] Settings documented in `docs/config/settings.md`

### Tests

**What**: Unit tests for settings loading and validation

**How**: Test settings parsing with valid/invalid configs

**Criteria**:

- [ ] Default values applied when not specified
- [ ] Invalid values rejected with clear errors
- [ ] All fields accessible programmatically

---

## Phase 6: Archive Old Files & Integration

**User stories**: 5 (small files)

### What to build

- Archive current log files (move to `archive/`) before enabling new format
- Integrate recorders into `opencode-hooks.ts`
- Remove `log-event.ts` completely
- Keep `blocked-events.log` as-is

### Acceptance criteria

- [ ] Old files moved to archive with timestamp
- [ ] New logging active in plugin
- [ ] No breaking changes to existing functionality
- [ ] Tests pass with new logging

### Tests

**What**: Integration tests (end-to-end)

**How**: Run plugin, verify log files created correctly

**Criteria**:

- [ ] Old logs moved to `archive/` with timestamp
- [ ] `plugin-events.jsonl` created with events
- [ ] `plugin-scripts.jsonl` created with script outputs
- [ ] `plugin-errors.jsonl` created with errors
- [ ] Each JSONL line is valid and parseable
- [ ] Existing functionality (toasts, etc) still works

---

## Execution Log

| Phase | Status    | Completed  |
| ----- | --------- | ---------- |
| 1     | Completed | 2026-04-16 |
| 2     | Completed | 2026-04-17 |
| 3     | Completed | 2026-04-17 |
| 4     | Completed | 2026-04-17 |
| 5     | Completed | 2026-04-17 |
| 6     | Completed | 2026-04-17 |
