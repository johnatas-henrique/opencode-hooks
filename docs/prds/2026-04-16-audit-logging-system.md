# PRD: Plugin Audit Logging System

**Status**: Draft  
**Priority**: High  
**Date**: 2026-04-16  
**Author**: Johnatas Henrique

---

## Summary

Replace the current monolithic `session_events.log` with a structured, searchable JSONL-based audit system. Reduce file sizes from 9MB-230MB to manageable sizes while enabling fast searches by event type, timestamp, tool name, and error status.

---

## Problem Statement

### Current Issues

| Issue                      | Evidence                               | Impact                              |
| -------------------------- | -------------------------------------- | ----------------------------------- |
| **Files too large**        | session_events.log: 9MB-230MB          | Impossible to open in editor        |
| **Can't find information** | All events in one file                 | Search returns thousands of results |
| **Redundant data**         | `scriptToasts` repeated in every event | Wastes 80%+ of file size            |
| **Full objects logged**    | `output.content[0].text` can be MBs    | File grows to hundreds of MBs       |
| **Unstructured format**    | Valid JSON but not searchable          | Can't grep efficiently              |

### User Goals

1. Find all events of a specific type quickly
2. Search by timestamp range
3. Audit script outputs to debug user script issues
4. Distinguish config errors from code errors
5. Have debug-level logging now, audit-level in the future

---

## Solution

### File Structure

| File                   | Purpose                  | Format |
| ---------------------- | ------------------------ | ------ |
| `plugin-events.jsonl`  | All plugin events        | JSONL  |
| `plugin-scripts.jsonl` | Script execution outputs | JSONL  |
| `plugin-errors.jsonl`  | Errors and exceptions    | JSONL  |

### JSONL Format Explained

**JSONL (JSON Lines)**: Each line is a complete, valid JSON object. Benefits:

- Line-oriented grep/search works
- Easy to parse with `jq`
- No brackets to manage
- Stream-friendly for large files

### Event Schemas

#### plugin-events.jsonl

```json
{"ts":"2026-04-16T18:30:33.300Z","event":"tool.execute.after","tool":"bash","session":"ses_abc123","status":"success","duration":284,"error":null}
{"ts":"2026-04-16T18:30:35.100Z","event":"session.error","session":"ses_abc123","status":"error","duration":0,"error":"ECONNREFUSED","directory":"/home/user/project"}
```

| Field       | Type                 | Description                                              |
| ----------- | -------------------- | -------------------------------------------------------- |
| `ts`        | ISO8601              | Timestamp                                                |
| `event`     | string               | Event type (e.g., `tool.execute.after`, `session.error`) |
| `tool`      | string?              | Tool name (for tool events)                              |
| `session`   | string?              | Session ID                                               |
| `status`    | `success` \| `error` | Execution status                                         |
| `duration`  | number               | Duration in milliseconds                                 |
| `error`     | string?              | Error message if status is error                         |
| `directory` | string?              | Working directory (for session events)                   |

#### plugin-scripts.jsonl

```json
{"ts":"2026-04-16T18:30:40.000Z","script":"log-agent.sh","args":["--event","session.created"],"exit":0,"output":"[INFO] Session created successfully\n","duration":45}
{"ts":"2026-04-16T18:30:50.000Z","script":"notify-failure.sh","args":["--error","ECONNREFUSED"],"exit":1,"output":"[ERROR] Failed to connect: ECONNREFUSED\n","duration":120}
```

| Field      | Type     | Description                              |
| ---------- | -------- | ---------------------------------------- |
| `ts`       | ISO8601  | Timestamp                                |
| `script`   | string   | Script filename                          |
| `args`     | string[] | Script arguments                         |
| `exit`     | number   | Exit code (0 = success, >0 = error)      |
| `output`   | string   | Script stdout/stderr (truncated to 10KB) |
| `duration` | number   | Duration in milliseconds                 |

#### plugin-errors.jsonl

```json
{"ts":"2026-04-16T18:30:33.300Z","type":"config","event":"script.parse","error":"ENOENT: script not found","script":"/path/to/missing.sh","stack":null}
{"ts":"2026-04-16T18:30:35.100Z","type":"code","event":"tool.execute","error":"TypeError: Cannot read property 'map' of undefined","stack":"at resolver.resolve (event-config.resolver.ts:45)\n    at..."}
```

| Field    | Type               | Description                     |
| -------- | ------------------ | ------------------------------- |
| `ts`     | ISO8601            | Timestamp                       |
| `type`   | `config` \| `code` | Error category                  |
| `event`  | string             | Event where error occurred      |
| `error`  | string             | Error message                   |
| `script` | string?            | Script path (for config errors) |
| `stack`  | string?            | Stack trace (for code errors)   |

### Error Type Definitions

| Type     | Description           | Examples                                          |
| -------- | --------------------- | ------------------------------------------------- |
| `config` | User misconfiguration | Missing script, invalid path, permission denied   |
| `code`   | Plugin bug            | TypeError, unhandled rejection, assertion failure |

---

## User Stories

### Core Functionality

1. As a user, I want to search for all events of type `tool.execute.after` so I can audit what tools were called
2. As a user, I want to see script outputs so I can debug if issues are caused by user scripts or the plugin
3. As a user, I want to filter by timestamp so I can focus on a specific time window
4. As a user, I want to see only errors so I can investigate failures quickly
5. As a user, I want small log files so I can open and analyze them without tools

### Audit Capabilities

6. As a user, I want to distinguish config errors from code errors so I know who is responsible for failures
7. As a user, I want script exit codes so I can see which scripts failed
8. As a user, I want truncated script output so files stay manageable but I still see what happened

### Future-Proofing

9. As a user, I want a verbose mode for debug logging and a quiet mode for audit logging
10. As a developer, I want to add new fields without breaking existing parsers (JSONL is forward-compatible)

---

## Search Examples

### Find all bash commands

```bash
grep '"tool":"bash"' plugin-events.jsonl | jq -r '.args.code'
```

### Find all failed scripts

```bash
grep '"exit":1' plugin-scripts.jsonl | jq .
```

### Find all errors in a time range

```bash
grep '"status":"error"' plugin-events.jsonl | jq 'select(.ts > "2026-04-16T18:00:00" and .ts < "2026-04-16T19:00:00")'
```

### Session timeline

```bash
grep '"session":"ses_abc123"' plugin-events.jsonl | jq -c '{ts: .ts, event: .event, status: .status}'
```

### Error summary by type

```bash
cat plugin-errors.jsonl | jq -s 'group_by(.type) | map({type: .[0].type, count: length})'
```

---

## Implementation Decisions

### 1. Modules to Create/Modify

| Module                  | Action | Responsibility                              |
| ----------------------- | ------ | ------------------------------------------- |
| `audit-logger.ts`       | Create | Central logger with structured output       |
| `event-recorder.ts`     | Create | Record plugin events                        |
| `script-recorder.ts`    | Create | Record script executions                    |
| `error-recorder.ts`     | Create | Record errors by type                       |
| `save-to-file.ts`       | Modify | Log errors when write fails                 |
| `log-event.ts`          | Modify | Use new recorders instead of current append |
| `run-script.ts`         | Modify | Log script errors                           |
| `run-script-handler.ts` | Modify | Log script execution results                |

### 2. Error Classification (Hybrid Approach)

| Error Source                | Type   | When to Log                          |
| --------------------------- | ------ | ------------------------------------ |
| Script not found/permission | config | Always (run-script validation)       |
| Script exit code != 0       | config | Always (run-script result)           |
| save-to-file failure        | config | When append fails                    |
| tryBuildMessage catch       | code   | Log as code (defensive, rarely hits) |

**Note:** `tryBuildMessage` catch exists defensively but likely never triggers. If it does, log as `code` type for debugging.

### 3. Log Levels

| Level | plugin-events.jsonl | plugin-scripts.jsonl | plugin-errors.jsonl |
| ----- | ------------------- | -------------------- | ------------------- |
| debug | ✅ All events       | ✅ All scripts       | ✅ All errors       |
| audit | ❌ Disabled         | ✅ All scripts       | ✅ All errors       |

**Rationale:** A script that runs wrong workflow is not an error but needs auditing.

### 4. Event Recording

Log **both** `tool.execute.before` and `tool.execute.after`:

- `before`: useful for tracking tool loading/blocking attempts
- `after`: has result/exit status

### 5. Output Truncation

For script output:

- **Truncate from beginning, keep end** (errors usually at end of output)
- Default max: 10KB
- Truncated output: last 10KB of output

### 6. File Rotation & Retention

When file reaches size limit:

1. Compress file with gzip
2. Start new file with same name

Configuration options:

```typescript
audit: {
  retention: {
    maxAgeDays: 30,     // Delete files older than 30 days
    maxSizeMB: 10,      // Compress + start new when reaching 10MB
  }
}
```

### 7. Archive Current Logs

Before enabling new format:

- Move `session_events.log` → `archive/session_events-YYYY-MM-DD.json`
- Move `blocked-events.log` → `archive/blocked-events-YYYY-MM-DD.log`
- Move `session_unknown_events.log` → `archive/session_unknown_events-YYYY-MM-DD.log`

### 8. Configuration

In `settings.ts`:

```typescript
audit: {
  enabled: true,
  path: 'production/session-logs',
  files: {
    events: 'plugin-events.jsonl',
    scripts: 'plugin-scripts.jsonl',
    errors: 'plugin-errors.jsonl',
  },
  truncation: {
    scriptOutput: 10240, // 10KB, keep end
  },
  levels: ['debug', 'audit'],
  level: 'debug', // switch to 'audit' in production
  retention: {
    maxAgeDays: 30,
    maxSizeMB: 10,
  }
}
```

### 9. Integration with Existing Logs

- Same directory: `production/session-logs/`
- Same naming convention: `plugin-*`
- Archive old files before enabling new format

---

## Testing Decisions

### What to Test

1. **AuditLogger**: Verify correct file format and field names
2. **EventRecorder**: Verify event filtering by type
3. **ScriptRecorder**: Verify output truncation
4. **ErrorRecorder**: Verify error type classification

### Test Approach

- Unit tests with DI pattern (no file system mocking)
- Use temporary files for integration tests
- Verify JSONL line format with `JSON.parse()`

---

## Out of Scope

- Remote log shipping
- Log analysis dashboards

---

## Further Notes

### Why JSONL and not CSV?

CSV would be smaller but:

- Escaping is painful (commas in output break parsing)
- No nested objects
- Harder to add new fields

### Why not a database?

- Overkill for text files
- Requires external dependencies
- Harder to ship with plugin

### Relationship to Existing Logs

The current `logEvent()` function logs full event objects. This will be replaced with structured logging that:

- Keeps `timestamp` and `eventType`
- Extracts useful fields (tool name, exit code)
- Drops redundant data (scriptToasts, full output)
