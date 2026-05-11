# Scripts — OpenCode Hooks

This guide covers how to write, configure, and run shell scripts with the
OpenCode Hooks plugin.

## Table of Contents

- [Script Types](#script-types)
- [Where Scripts Live](#where-scripts-live)
- [When Each Source Is Used](#when-each-source-is-used)
- [Stdin Formats](#stdin-formats)
  - [Claude-Compatible Stdin](#claude-compatible-stdin)
  - [Native OpenCode Stdin](#native-opencode-stdin)
- [Exit Codes and Blocking](#exit-codes-and-blocking)
  - [How to Block a Tool](#how-to-block-a-tool)
  - [JSON Responses on Stdout](#json-responses-on-stdout)
- [Async Scripts](#async-scripts)
- [Run Only Once](#run-only-once)
- [Append to Session](#append-to-session)
- [Debug Mode](#debug-mode)
- [Complete Blocking Script Example](#complete-blocking-script-example)
- [Creating Claude-Compatible Scripts](#creating-claude-compatible-scripts)
- [Importing Existing Claude Code Scripts](#importing-existing-claude-code-scripts)

## Script Types

Every script has a `source` field that determines the stdin format:

| Source     | Stdin Format                | Intended For                           |
| ---------- | --------------------------- | -------------------------------------- |
| `'native'` | OpenCode-specific JSON      | Scripts written for this plugin        |
| `'claude'` | Claude Code-compatible JSON | Scripts from the Claude Code ecosystem |

```typescript
// Example entries
[
  { source: 'native', path: 'session-created.sh' },
  { source: 'claude', path: 'block-env-write.sh' },
];
```

### ScriptEntry Type

```typescript
interface ScriptEntry {
  source: 'native' | 'claude'; // Stdin format
  path: string; // Script path (relative or absolute)
  matcher?: string; // Event matcher pattern
  async?: boolean; // Run in background without waiting
  timeout?: number; // Timeout in milliseconds
  passStdin?: boolean; // Pass event data via stdin (native only, default: true)
  scriptType?: ScriptOrigin; // Auto-set; identifies origin (settings-native, settings-claude, local-claude, global-claude)
}
```

## Where Scripts Live

| Location             | Description                     | Loaded When                   |
| -------------------- | ------------------------------- | ----------------------------- |
| `.opencode/scripts/` | Project-specific native scripts | Always                        |
| `~/.claude/hooks/`   | Global Claude Code hooks        | `loadGlobalClaudeHooks: true` |
| `.claude/hooks/`     | Local Claude Code hooks         | `loadLocalClaudeHooks: true`  |

Relative script paths (e.g., `'session-created.sh'`) are resolved inside
`.opencode/scripts/`. Absolute paths are used as-is.

> **Note:** Claude Code settings (`claude.json` / `claude.local.json`) are
> parsed and their hook entries are mapped to OpenCode events using the
> `EVENT_NAME_MAP`. Those hooks use `source: 'claude'` automatically.

## When Each Source Is Used

- **`source: 'claude'`** — The script receives Claude Code-format JSON on stdin.
  Use this for scripts written for the Claude Code hook ecosystem. The plugin
  maps OpenCode event names to Claude Code hook names (e.g., `tool.execute.before`
  → `PreToolUse`).

- **`source: 'native'`** — The script receives OpenCode-format JSON on stdin.
  Use this for scripts written specifically for this plugin. The `passStdin`
  option (default `true`) controls whether stdin is sent at all.

## Stdin Formats

### Claude-Compatible Stdin

Built by `buildClaudeStdin()` in `.opencode/plugins/features/scripts/executor.ts`.

```json
{
  "hook_event_name": "PreToolUse",
  "session_id": "ses_abc123",
  "transcript_path": "",
  "cwd": "/home/user/project",
  "permission_mode": "default",
  "tool_name": "Write",
  "tool_input": {
    "filePath": "/home/user/project/src/main.ts",
    "content": "..."
  },
  "tool_use_id": "call_xyz"
}
```

**Common fields** (sent for all events):

| Field             | Description                                              | Always Present |
| ----------------- | -------------------------------------------------------- | :------------: |
| `hook_event_name` | Claude Code hook event name (mapped from OpenCode event) |       ✅       |
| `session_id`      | OpenCode session identifier                              |       ✅       |
| `cwd`             | Current working directory                                |       ✅       |
| `permission_mode` | Always `'default'`                                       |       ✅       |
| `transcript_path` | Empty string (`''`) — OpenCode SDK does not expose this  |       ✅       |

**Tool event fields** (sent for `tool.execute.before` / `tool.execute.after`):

| Field         | Description                                      | Always Present |
| ------------- | ------------------------------------------------ | :------------: |
| `tool_name`   | Tool name, capitalized (`Write`, `Bash`, `Read`) |       ✅       |
| `tool_input`  | Tool arguments from the event                    |       ✅       |
| `tool_use_id` | Unique call identifier                           |       ✅       |

**Subagent event fields** (sent for subagent events):

| Field         | Description                                              |
| ------------- | -------------------------------------------------------- |
| `agent_type`  | Subagent type (e.g., `'explore'`, `'general'`)           |
| `agent_id`    | Call ID used as agent identifier                         |
| `description` | Task description (from `args.description`)               |
| `model`       | Model ID (from subagent response metadata, if available) |

**File change fields** (sent for `file.watcher.updated`):

| Field       | Description              |
| ----------- | ------------------------ |
| `file_path` | Path of the changed file |

#### Event Name Mapping

| OpenCode Event                    | Claude Hook Name    |
| --------------------------------- | ------------------- |
| `tool.execute.before`             | `PreToolUse`        |
| `tool.execute.after`              | `PostToolUse`       |
| `tool.execute.before.subagent`    | `SubagentStart`     |
| `tool.execute.after.subagent`     | `SubagentStop`      |
| `session.created`                 | `SessionStart`      |
| `session.deleted`                 | `SessionEnd`        |
| `session.idle`                    | `Stop`              |
| `chat.message`                    | `UserPromptSubmit`  |
| `permission.asked`                | `PermissionRequest` |
| `experimental.session.compacting` | `PreCompact`        |
| `file.watcher.updated`            | `FileChanged`       |

### Native OpenCode Stdin

Built by `buildOpencodeStdin()` in `.opencode/plugins/features/scripts/executor.ts`.

```json
{
  "event_type": "tool.execute.before",
  "session_id": "ses_abc123",
  "cwd": "/home/user/project",
  "tool_name": "write",
  "tool_input": {
    "filePath": "/home/user/project/src/main.ts",
    "content": "..."
  },
  "call_id": "call_xyz"
}
```

**Common fields** (sent for all events):

| Field         | Description                              | Always Present |
| ------------- | ---------------------------------------- | :------------: |
| `event_type`  | OpenCode event name                      |       ✅       |
| `session_id`  | Session identifier                       |       ✅       |
| `cwd`         | Current working directory                |       ✅       |
| `tool_result` | Tool output object (if output available) |  when present  |

**Tool event fields:**

| Field        | Description                                    |
| ------------ | ---------------------------------------------- |
| `tool_name`  | Tool name (lowercase: `write`, `bash`, `read`) |
| `tool_input` | Tool arguments                                 |
| `call_id`    | Unique call identifier                         |

**Subagent fields:**

| Field         | Description                       |
| ------------- | --------------------------------- |
| `agent_type`  | Subagent type                     |
| `agent_id`    | Call ID                           |
| `description` | Task description                  |
| `model`       | Model ID (from response metadata) |

**File change fields:**

| Field       | Description              |
| ----------- | ------------------------ |
| `file_path` | Path of the changed file |

## Exit Codes and Blocking

|        Exit Code        | Meaning         | Behavior                            |
| :---------------------: | --------------- | ----------------------------------- |
|           `0`           | Success / Allow | Tool execution continues normally   |
|           `2`           | Block           | Tool execution is blocked           |
| `1` (or other non-zero) | Error           | Treated as an error, does NOT block |

### How to Block a Tool

There are two ways to block a tool:

**1. Exit code 2** — The script exits with code 2. The block reason is taken
from stderr if available, otherwise stdout, otherwise a default message.

```bash
#!/bin/bash
echo "Cannot write to .env files" >&2
exit 2
```

**2. JSON response on stdout** — Return a JSON object on stdout with a block
decision. This allows returning a more specific reason.

```bash
#!/bin/bash
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.filePath // empty')

if echo "$FILE_PATH" | grep -qE '(^|/)\.env($|/)'; then
  jq -n --arg r "Blocked: cannot write to $FILE_PATH" '{
    "decision": "block",
    "reason": $r
  }'
  exit 0  # Must exit 0 when using JSON response
fi

exit 0
```

### JSON Responses on Stdout

The `parseHookOutput()` function in `.opencode/plugins/features/scripts/executor.ts`
handles these JSON response formats:

#### Block the Tool

```json
{ "decision": "block", "reason": "Cannot write to .env files" }
```

```json
{ "continue": false, "stopReason": "Save checkpoint needed" }
```

#### Deny via Permission

```json
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked by security policy",
    "updatedInput": { ... }
  }
}
```

#### Return an Error

```json
{ "ok": false, "reason": "Script failed to process input" }
```

#### Allow (any unrecognized JSON or non-JSON output)

```json
{ "action": "allow" }
```

Non-JSON stdout when exit code is 0 is treated as `allow`.

## Async Scripts

Scripts with `async: true` are spawned in the background using
`spawn(...).unref()`. The plugin does not wait for the script to finish.

```typescript
{
  source: 'native',
  path: 'mempalace-mine.sh',
  async: true,
}
```

Use async for fire-and-forget tasks like mining conversation data, logging, or
triggering external processes. Async scripts:

- Do **not** receive stdin (stdio is `'ignore'`)
- Do **not** block event processing
- Do **not** produce toasts or audit entries from their output
- Receive `CLAUDE_PLUGIN_ROOT` environment variable set to `process.cwd()`

## Run Only Once

The `runOnlyOnce: true` flag ensures a script runs only once per session.
After the first execution, the script is skipped for subsequent events of the
same type.

Common use case: running initialization scripts on `session.created` that
should not repeat.

```typescript
[OpenCodeEvents.SESSION_CREATED]: {
  runScripts: true,
  runOnlyOnce: true,
  scripts: [
    { source: 'native', path: 'mempalace-wake.sh' },
  ],
},
```

## Append to Session

The `appendToSession: true` flag causes script stdout to be appended to the
active OpenCode conversation as a message. This makes script output visible
to the AI model.

```typescript
[OpenCodeEvents.SESSION_CREATED]: {
  runScripts: true,
  appendToSession: true,
  scripts: [
    { source: 'native', path: 'session-created.sh' },
  ],
},
```

## Debug Mode

Set `audit.level: 'debug'` in the audit config to enable detailed logging.

When debug mode is active, the audit log includes additional fields for script
executions:

- `stdin` — The complete stdin JSON sent to the script
- `scriptType` — Origin of the script (`settings-native`, `settings-claude`,
  `local-claude`, `global-claude`)

```typescript
audit: {
  enabled: true,
  level: 'debug',  // Enables stdin/scriptType in script logs
  // ...
},
```

## Complete Blocking Script Example

This is a native script that blocks sensitive file operations. It reads the
OpenCode stdin format and returns a JSON deny response.

```bash
#!/bin/bash
# block-sensitive.sh
# TOOL_EXECUTE_BEFORE handler for bash/write/read/edit tools.
# Uses source: "native" — reads OpenCode-format stdin.

# Helper function: print JSON deny response
deny() {
  jq -n --arg r "$1" '{
    "hookSpecificOutput": {
      "permissionDecision": "deny",
      "permissionDecisionReason": $r
    }
  }'
  exit 0
}

# Read stdin JSON
INPUT=$(cat)

# Extract fields from OpenCode stdin
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.filePath // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block --no-verify on git commits
if echo "$COMMAND" | grep -qE '\s(-(-)?no-verify)\b'; then
  deny "Blocked --no-verify flag. Use 'git commit' without --no-verify."
fi

# Block push to protected branches
if echo "$COMMAND" | grep -qE '\bgit\s+push\b' && \
   echo "$COMMAND" | grep -qE '\b(main|master|develop)\b'; then
  deny "Blocked push to protected branch. Create a PR instead."
fi

# Block .env writes
if [ "$TOOL_NAME" = "write" ] || [ "$TOOL_NAME" = "filesystem_write_file" ]; then
  if [ -n "$FILE_PATH" ] && echo "$FILE_PATH" | grep -qE '(^|/)\.env($|/)'; then
    deny "Blocked .env file write by agent."
  fi
fi

# Block reading sensitive files
if [ "$TOOL_NAME" = "read" ] || [ "$TOOL_NAME" = "filesystem_read_file" ]; then
  if [ -n "$FILE_PATH" ]; then
    if echo "$FILE_PATH" | grep -qE '(\.env|credentials\.json|/secrets/|\.ssh/)'; then
      deny "Blocked access to sensitive file: $FILE_PATH"
    fi
  fi
fi

exit 0
```

## Creating Claude-Compatible Scripts

A Claude-compatible script reads stdin in the Claude Code JSON format and
outputs a response to stdout. See [CLAUDE-COMPATIBILITY.md](CLAUDE-COMPATIBILITY.md)
for the full field comparison.

```bash
#!/bin/bash
# claude-hook-example.sh
# Works with source: "claude" — reads Claude-format stdin.
#
# Stdin fields available (varies by event):
#   hook_event_name  — e.g., "PreToolUse", "PostToolUse"
#   session_id       — session identifier
#   cwd              — working directory
#   tool_name        — tool name (capitalized)
#   tool_input       — tool arguments
#   tool_use_id      — call identifier
#   transcript_path  — always empty (not available in OpenCode SDK)
#   permission_mode  — always "default"

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
EVENT_NAME=$(echo "$INPUT" | jq -r '.hook_event_name // empty')

echo "{\"event\": \"$EVENT_NAME\", \"tool\": \"$TOOL_NAME\", \"status\": \"ok\"}"
exit 0
```

## Importing Existing Claude Code Scripts

Scripts written for Claude Code hooks can be reused with this plugin.

### Step 1: Place the `.sh` file

Put the script in `.opencode/scripts/` (or reference it via absolute path).

### Step 2: Reference it in `settings.ts` with `source: 'claude'`

```typescript
events: {
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
    runScripts: true,
    scripts: [
      { source: 'claude', path: 'block-env-write.sh' },
    ],
  },
  [OpenCodeEvents.SESSION_IDLE]: {
    runScripts: true,
    scripts: [
      { source: 'claude', path: 'mempal_save_hook.sh' },
    ],
  },
},
```

### Step 3: Understand limitations

See [CLAUDE-COMPATIBILITY.md](CLAUDE-COMPATIBILITY.md) for the full checklist.
Key limitations:

- `transcript_path` is NOT available (OpenCode SDK doesn't expose it)
- `last_assistant_message` is NOT available
- `duration_ms` is NOT available
- `model` is available only on chat events, not tool events
- `source` (startup/resume) is NOT available for `SessionStart`
