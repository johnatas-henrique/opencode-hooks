# Simplify Audit Logs - 2026-05-02

## Problem

- Per-session files (5 files per session) created via `{session}` template
- Complex session tracking (`setAuditSessionId`, `archiveSession`, `getLastKnownSessionId`)
- Debug logs for session tracking are no longer needed

## Solution

- **Single files per type**: `plugin-events.json`, `plugin-scripts.json`, `plugin-errors.json`, `plugin-security.json`, `plugin-debug.json`
- **Remove session-based archiving**: `archiveSession`, `setAuditSessionId`, `getLastKnownSessionId`, `setAuditSessionId`, `archiveAuditSession`
- **Keep size-based archiving**: `archiveFileIfNeeded` → `plugin-archive/`
- **Keep sessionID in JSON**: Each entry already has `session` field → filter via `grep`

## Changes Made

### Types (`.opencode/plugins/types/audit.ts`)

- Removed `sessionId` parameter from `writeLine` signatures
- Removed `archiveSession`, `setSessionId`, `getLastKnownSessionId` from `AuditLogger` interface
- Removed `sessionId` from `EventRecorderDependencies` and `ScriptRecorderDependencies`

### Constants (`.opencode/plugins/types/constants.ts`)

- Changed file names from `plugin-events_{session}.json` → `plugin-events.json`
- Removed `archiveDir` from audit config

### Core Files

- `constants.ts`: Updated defaults
- `settings.ts`: Removed `archiveDir` and `sessionId` from audit config

### Plugin Integration (`.opencode/plugins/features/audit/plugin-integration.ts`)

- Removed: `setAuditSessionId`, `archiveAuditSession`, `getLastKnownSessionId`, debugLog helpers

### Main Hooks (`.opencode/plugins/opencode-hooks.ts`)

- Removed imports: `setAuditSessionId`, `getLastKnownSessionId`, `archiveAuditSession`
- Simplified `getNormalizedSessionId` (no more fallback to last known)
- Removed all session tracking code and debug logs from event handler

### Recorders

- `event-recorder.ts`: Removed `sessionId` from `writeLine` calls
- `script-recorder.ts`: Removed `sessionId` from `writeLine` calls

### Tests Updated

- `create-config.ts`: Updated test configs
- `audit-logger.test.ts`: Removed session-related tests
- `audit-plugin-integration.test.ts`: Removed session-related tests
- `debug-recorder.test.ts`: Simplified mocks
- `security-recorder.test.ts`: Simplified mocks
- `enabled-coverage.test.ts`: Removed session tracking tests

## Result

```
production/session-logs/
├── plugin-events.json    ← all events, each with session field
├── plugin-scripts.json
├── plugin-errors.json
├── plugin-security.json
├── plugin-debug.json
└── plugin-archive/       ← archive by size (>3MB)
    ├── plugin-events-2026-05-02T10-30-00.json
    └── ...
```

Filter by session: `grep "ses_abc123" plugin-events.json`
