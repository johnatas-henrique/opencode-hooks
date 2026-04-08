# Manual Testing Guide - opencode-hooks Plugin

## IMPORTANT: Agent Testing Approach

> **The agent CANNOT see UI toasts.** All verification must be done through **log files**.

When the user performs an action (e.g., creates a session), the agent should:

1. Wait for the action to complete
2. Check the appropriate log file for evidence
3. Report findings to the user

### Log Files Location

```
./production/session-logs/
├── session_events.log           # All hook events (LOG_FILE)
├── session_debug_events.log    # Debug mode output (DEBUG_LOG_FILE)
└── session_unknown_events.log   # Unknown events (UNKNOWN_EVENT_LOG_FILE)
```

---

## Agent Testing Prompt

Copy this file and use the prompt below with the agent:

```markdown
Execute the manual testing checklist in docs/testing/TODO.md.

IMPORTANT: You CANNOT see toasts on screen. Verify ALL tests by checking log files.

For each test:

1. Read the test description
2. The user will perform the action
3. Read the relevant log file to verify
4. Mark [x] if evidence found in logs, or [FAIL] if not
5. Quote the relevant log lines

Example:

- [x] Session created - Found "SESSION CREATED" in session_events.log
- [FAIL] Script not found in log output
```

---

## First Time Setup

### 1. Copy this file for testing

```bash
cp docs/testing/manual-testing-guide.md docs/testing/TODO.md
```

This creates a working copy (`TODO.md`) where the agent can mark completed tests, keeping the original clean for future use.

### 2. Setup Test Configuration

> **YOU (the user) must run these commands manually!** The agent cannot access the filesystem outside the project.

**IMPORTANT: Backup your current config first!**

```bash
# 1. Backup your current config
cp .opencode/plugins/helpers/user-events.config.ts \
   .opencode/plugins/helpers/user-events.config.backup.ts

# 2. Copy test config (overwrites your config)
cp docs/testing/examples/user-events.config.test.ts \
   .opencode/plugins/helpers/user-events.config.ts
```

The test config (`user-events.config.test.ts`) enables:

- All events with `enabled: true`
- `debug: true` for sanitization testing
- `toast: true` for all events
- `runScripts: true` only for `session.created` (to test script execution)
- `appendToSession: true` for `session.created` (to test session append)
- All other events: `runScripts: false` (to avoid side effects)

### 3. Create Logs Directory

```bash
mkdir -p ./production/session-logs

# Clear previous logs
rm -f ./production/session-logs/*.log
```

### 4. Restart opencode

Restart opencode to load the new configuration.

### 5. Verify Config Loaded (CRITICAL)

**Ask the user to confirm:**

> "Did you see a startup toast message when opencode started? If yes, the config is loaded. If not, the plugin might not be running."

**Agent verification:** Check `session_events.log` for startup message:

```bash
grep -i "initialized\|configuration" ./production/session-logs/session_events.log
```

**DO NOT proceed with tests until config is confirmed loaded.**

---

## Testing Order

> **IMPORTANT:** Complete ALL tests BEFORE closing the session.
> The agent is running inside this session!

1. Session Created (start here)
2. Tool Hooks (bash, read, write, etc.)
3. Debug Mode
4. Configuration Tests
5. Handler Factory
6. Log Files
7. Session Closed (LAST - close only after all tests done)

---

## 1. Session Tests

### 1.1 New Session Created

**User action:** Start a **new session** in opencode (already done!)

**Agent verification:** Read `session_events.log` and look for:

- `====SESSION CREATED====`
- `session.created`
- Event arguments with session ID

### 1.2 Script Execution (runScripts)

**Note:** Only `session.created` has `runScripts: true` in test config.

**Agent verification:** Read `session_events.log` and look for:

- Script filename: `session-created.sh`
- Script execution evidence

### 1.3 Append to Session (appendToSession)

**Note:** Only `session.created` has `appendToSession: true` in test config.

**Agent verification:** Read `session_events.log` and look for:

- Session append entry with session data

### 1.4 Startup Config

**Agent verification:** Read `session_events.log` and look for:

- `OpencodeHooks plugin initialized`
- `Configuration loaded`

---

## 2. Tool Hook Tests

### 2.1 tool.execute.before - Bash

**User action:** Execute any command (e.g., `ls`)

**Agent verification:** Read `session_events.log` and look for:

- `tool.execute.before`
- Tool name (e.g., `bash`)

### 2.2 tool.execute.before - File Operations

**User action:** Read a file (e.g., `Read package.json`)

**Agent verification:** Read `session_events.log` and look for:

- `tool.execute.before`
- Tool name (e.g., `filesystem_read_file`)

### 2.3 tool.execute.after (Subagent)

**User action:** Start a **subagent** via `/task explore`

**Agent verification:** Read `session_events.log` and look for:

- `tool.execute.after`
- `subagent_type` field with value
- Toast entry (if enabled)

### 2.4 Test with skill

**User action:** Execute a **skill**

**Agent verification:** Read `session_events.log` and look for:

- `tool.execute.after`
- `subagent_type` with `"skill"`

---

## 3. Debug Mode Tests

### 3.1 Verify Debug Output

**Note:** Debug mode is already enabled in test config (`debug: true`)

**Agent verification:** Read `session_debug_events.log` and look for:

- Debug entries with `[DEBUG]` prefix
- Event data with timestamps

### 3.2 Verify Sanitization

**Agent verification:** Read `session_debug_events.log` and check:

- No sensitive keys appear in raw form
- Fields like `token`, `password`, `apiKey` appear as `[REDACTED]`

**Sanitized fields:**

- password, token, secret, apiKey, api_key
- auth, credentials, authorization
- privateKey, private_key, accessToken, access_token

---

## 4. Configuration Tests

### 4.1 Verify All Events Enabled

**Agent verification:** Read `session_events.log` and count event types:

- Should see multiple different event types logged
- If only a few events, some may still be disabled

### 4.2 Verify Toast Messages

**Agent verification:** Read `session_events.log` and check:

- Each logged event should show the handler title (e.g., `====SESSION CREATED====`)
- Messages should include `Time:` field
- `Session Id:` should appear when applicable

### 4.3 Special Event Handlers

**Agent verification:** Read `session_events.log` and check:

- [ ] `session.error` - error name and message in log
- [ ] `lsp.client.diagnostics` - diagnostics count in log
- [ ] `todo.updated` - count field with fallback `0`

---

## 5. Handler Factory Tests

### 5.1 Consistent Message Format

**Agent verification:** Check that all handler messages follow the pattern:

```
Field1: value1
Field2: value2
Time: <timestamp>
```

### 5.2 Event Type Coverage

**Agent verification:** Look for variety of events in logs:

- Session events
- Tool events
- File events
- Permission events

---

## 6. Log File Tests

### 6.1 session_events.log

- [ ] File created in `./production/session-logs/`
- [ ] Contains event entries with timestamps
- [ ] Contains event type and arguments

### 6.2 session_debug_events.log

- [ ] File created
- [ ] Contains formatted output: `[timestamp] - TITLE\n{data}`
- [ ] Sensitive data is sanitized

### 6.3 session_unknown_events.log

- [ ] File created for unknown events (if any occur)
- [ ] Contains warning format

---

## 7. Session Closed (DO LAST!)

> **IMPORTANT:** This is the LAST test. Do not close the session until all other tests are complete!

### 7.1 Session Closed

**User action:** Close the session

**Agent verification:** Read `session_events.log` and look for:

- `====SERVER INSTANCE DISPOSED====`
- `server.instance.disposed`

---

## Verification Checklist

| Category    | What to Check in Logs                   | Status |
| ----------- | --------------------------------------- | ------ |
| **Session** | `SESSION CREATED` in session_events.log | ☐      |
| **Session** | Script `session-created.sh` executed    | ☐      |
| **Session** | `appendToSession` entry present         | ☐      |
| **Session** | Startup config logged                   | ☐      |
| **Tools**   | `tool.execute.before` in log            | ☐      |
| **Tools**   | `tool.execute.after` with subagent      | ☐      |
| **Tools**   | Skill execution logged                  | ☐      |
| **Debug**   | `session_debug_events.log` created      | ☐      |
| **Debug**   | `[REDACTED]` for sensitive data         | ☐      |
| **Config**  | Multiple event types logged             | ☐      |
| **Config**  | Handler titles in logs                  | ☐      |
| **Logs**    | `session_events.log` format correct     | ☐      |
| **Logs**    | Timestamps and event data present       | ☐      |
| **Close**   | Session closed (LAST)                   | ☐      |

---

## 8. Plugin Status Display Tests

### 8.1 Verify Plugin Status Toast

**Agent verification:** Read `session_events.log` and look for:

- `Plugin Status` title
- Active plugin count

### 8.2 Test pluginStatus.enabled = false

**User action:** Update config to:

```typescript
pluginStatus: {
  enabled: false,
  displayMode: 'user-only',
}
```

**Restart opencode** and verify no "Plugin Status" toast appears.

### 8.3 Test displayMode: 'user-only'

**Config:**

```typescript
pluginStatus: {
  enabled: true,
  displayMode: 'user-only',
}
```

**Expected in logs:** Only user plugins (not built-in)

### 8.4 Test displayMode: 'user-separated'

**Config:**

```typescript
pluginStatus: {
  enabled: true,
  displayMode: 'user-separated',
}
```

**Expected:** Sections "Active (user):" and "Active (built-in):"

### 8.5 Test displayMode: 'all-labeled'

**Config:**

```typescript
pluginStatus: {
  enabled: true,
  displayMode: 'all-labeled',
}
```

**Expected:** Plugins with labels like "(user)" or "(built-in)"

---

## Useful Commands

```bash
# View logs in real time
tail -f ./production/session-logs/session_events.log

# View debug log
cat ./production/session-logs/session_debug_events.log

# Count lines in log
wc -l ./production/session-logs/session_events.log

# Search for specific event
grep "SESSION CREATED" ./production/session-logs/session_events.log

# List all log files
ls -la ./production/session-logs/

# Clear logs for fresh test
rm -f ./production/session-logs/*.log
```

---

## Testing Flow Example

```
1. User: "Start the session tests"
2. Agent: "Copy the guide, setup test config"
3. Agent: "Ask user to confirm config loaded"
4. User: "Yes, I saw the startup toast"
5. Agent: [reads session_events.log for startup message]
6. Agent: [marks tests as verified]

7. User: "Continue to tool tests"
8. User: [executes bash command]
9. Agent: [reads log, marks results]

... continue until all tests done ...

N. User: "All tests done, close session"
N+1. Agent: [verifies session closed log entry]
```
