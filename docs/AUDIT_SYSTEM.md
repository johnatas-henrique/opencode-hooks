# Audit System - OpenCode Hooks

Reference guide for the audit logging system in OpenCode Hooks.

## Overview

The audit system provides structured logging for:

- **Events** — Session lifecycle events
- **Scripts** — Script execution with exit codes
- **Errors** — Configuration and code errors
- **Security** — Security blocks and access controls
- **Debug** — Debug logs (optional)

## Configuration

All audit configuration is in `settings.ts`:

```typescript
audit: {
  enabled: true,
  level: 'audit',
  basePath: './production/session-logs',
  maxSizeMB: 2,
  maxAgeDays: 30,
  truncationKB: 0.5,
  maxFieldSize: 1000,
  maxArrayItems: 50,
  largeFields: ['patch', 'diff', 'content', 'snapshot', 'output', 'result', 'text'],
}
```

### Config Fields

| Field           | Type               | Default                     | Description                     |
| --------------- | ------------------ | --------------------------- | ------------------------------- |
| `enabled`       | boolean            | true                        | Enable/disable audit            |
| `level`         | 'debug' \| 'audit' | 'audit'                     | Log level filter                |
| `basePath`      | string             | './production/session-logs' | Directory for audit files       |
| `maxSizeMB`     | number             | 2                           | Max file size before archive    |
| `maxAgeDays`    | number             | 30                          | Archive files older than N days |
| `truncationKB`  | number             | 0.5                         | Truncate large fields at N KB   |
| `maxFieldSize`  | number             | 1000                        | Max characters per field        |
| `maxArrayItems` | number             | 50                          | Max items per array             |
| `largeFields`   | string[]           | [...]                       | Fields to truncate              |

## Audit Files

| File                   | Purpose  | Content                          |
| ---------------------- | -------- | -------------------------------- |
| `plugin-events.json`   | Events   | Session lifecycle events         |
| `plugin-scripts.json`  | Scripts  | Script execution with exit codes |
| `plugin-errors.json`   | Errors   | Config and code errors           |
| `plugin-security.json` | Security | Security blocks                  |
| `plugin-debug.json`    | Debug    | Debug logs                       |
| `audit-archive/`       | Archive  | Archived files                   |

## Event Types

### Events (plugin-events.json)

```json
{
  "ts": "2026-04-23T10:00:00.000Z",
  "event": "SESSION_CREATED",
  "session": "ses_123",
  "tool": "task",
  "input": { ... },
  "output": { ... },
  "context": "OpencodeHooks plugin initialized"
}
```

### Scripts (plugin-scripts.json)

```json
{
  "ts": "2026-04-23T10:00:00.000Z",
  "script": "session-created.sh",
  "args": ["task"],
  "exit": 0,
  "duration": 150,
  "output": "Script output here"
}
```

### Errors (plugin-errors.json)

```json
{
  "ts": "2026-04-23T10:00:00.000Z",
  "type": "code",
  "error": "Error: something failed",
  "stack": "Error: at Function...",
  "eventType": "tool.execute.before",
  "toolName": "bash",
  "context": "showStartupToast"
}
```

### Security (plugin-security.json)

```json
{
  "ts": "2026-04-23T10:00:00.000Z",
  "event": "block.security",
  "session": "ses_123",
  "toolName": "read",
  "rule": "blockEnvFiles",
  "reason": "Cannot read .env files",
  "input": { ... }
}
```

### Debug (plugin-debug.json)

```json
{
  "ts": "2026-04-23T10:00:00.000Z",
  "event": "debug",
  "message": "DEBUG TOOL_EXECUTE_BEFORE",
  "level": "info",
  "data": { ... }
}
```

## Sanitization

Sensitive fields are redacted:

- Keys: `password`, `token`, `secret`, `apiKey`, `auth`, `credential`, `key`, `privateKey`, `cookie`, `content`, `env`, `messages`, `parts`
- Format: `[REDACTED: N chars]`
- Shows length, hides content

Large fields are truncated:

- Truncation at `truncationKB` (default 0.5 KB)
- Arrays limited to `maxArrayItems` (default 50)
- Show as `"...[X more items]"` or `[REDACTED: N chars]`

## Archiving

Archive happens when:

1. File size ≥ `maxSizeMB` (default 2 MB)
2. On graceful shutdown

Archived files go to `audit-archive/` with timestamp suffix.

## Migration from Legacy

The audit system replaces legacy logging:

| Old File                     | New File                                |
| ---------------------------- | --------------------------------------- |
| `session_events.log`         | `plugin-events.json`                    |
| `session_unknown_events.log` | (consolidated into events with context) |
| `blocked-events.log`         | `plugin-security.json`                  |
| `debug.log`                  | `plugin-debug.json`                     |
| `script-output.log`          | `plugin-scripts.json`                   |

## Usage in Code

```typescript
import {
  getEventRecorder,
  getScriptRecorder,
  getErrorRecorder,
} from './features/audit';

// Log an event
const eventRecorder = getEventRecorder();
if (eventRecorder) {
  await eventRecorder.logEvent('SESSION_CREATED', { sessionID: 'ses_123' });
}

// Log script execution (with exit code)
const scriptRecorder = getScriptRecorder();
if (scriptRecorder) {
  await scriptRecorder.logScript(
    { script: 'test.sh', args: [] },
    { output: '', error: null, exitCode: 0 }
  );
}

// Log an error
const errorRecorder = getErrorRecorder();
if (errorRecorder) {
  await errorRecorder.logError({
    error: new Error('failed'),
    context: 'myFunction',
  });
}
```

## Testing

Tests are in `test/unit/` following the pattern `[feature].[module].test.ts`.

Run tests:

```bash
npm run test:cov   # With coverage
npm run test:unit  # Unit only
```
