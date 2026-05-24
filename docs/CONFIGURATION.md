# Configuration — OpenCode Hooks

Configuration lives in a JSONC file (JSON with comments). On first startup the
plugin auto-creates `.opencode/opencode-hooks.jsonc` with sensible defaults.

## Config File Locations

| Priority | Path                                        |
| -------- | ------------------------------------------- |
| 1        | `<project>/.opencode/opencode-hooks.jsonc`  |
| 2        | `~/.config/opencode/opencode-hooks.jsonc`   |
| 3        | Built-in defaults (bundled with the plugin) |

Project config overrides global, global overrides built-in defaults. All keys
are optional — only set what you want to change.

### $schema for IDE Autocomplete

Start your config with the `$schema` key for intellisense:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/johnatas-henrique/opencode-hooks/main/assets/opencode-hooks.schema.json",
}
```

> The schema is also shipped with the npm package under `assets/`.

## Quick Reference

```jsonc
{
  "$schema": "...",
  "enabled": true,
  "logDisabledEvents": false,
  "showPluginStatus": true,
  "pluginStatusDisplayMode": "user-only",
  "toastQueue": { "staggerMs": 300, "maxSize": 50 },
  "loadClaudeHookSettings": {
    "loadGlobalClaudeHooks": true,
    "loadLocalClaudeHooks": true
  },
  "scriptToasts": {
    "showOutput": true,
    "showError": true,
    "outputVariant": "warning",
    "errorVariant": "error",
    "outputDuration": 5000,
    "errorDuration": 15000,
    "outputTitle": "- SCRIPTS OUTPUT",
    "errorTitle": "- SCRIPT ERROR"
  },
  "default": {
    "toast": false,
    "runScripts": false,
    "runOnlyOnce": false,
    "logToAudit": true,
    "appendToSession": false
  },
  "audit": { ... },
  "events": { ... },
  "tools": { ... }
}
```

## Top-Level Fields

| Field                     | Type      | Default       | Description                              |
| ------------------------- | --------- | ------------- | ---------------------------------------- |
| `enabled`                 | `boolean` | `true`        | Master toggle for the entire plugin      |
| `logDisabledEvents`       | `boolean` | `false`       | Even disabled events get logged to audit |
| `showPluginStatus`        | `boolean` | `true`        | Show plugin status toast at startup      |
| `pluginStatusDisplayMode` | `string`  | `'user-only'` | How to display plugins in status toast   |

### Plugin Status Display Modes

| Mode             | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| `user-only`      | Shows only user-configured plugins (default)                 |
| `user-separated` | Groups into "Active (user)" and "Active (built-in)" sections |
| `all-labeled`    | Shows all plugins with `(user)` or `(built-in)` labels       |

## Toast Queue

```jsonc
"toastQueue": {
  "staggerMs": 300,
  "maxSize": 50
}
```

| Field       | Type     | Default | Description                                  |
| ----------- | -------- | ------- | -------------------------------------------- |
| `staggerMs` | `number` | `300`   | Milliseconds between successive toast popups |
| `maxSize`   | `number` | `50`    | Maximum queued toasts before dropping        |

## Claude Hook Settings

Controls whether Claude Code hooks (from `~/.claude/hooks/` and `.claude/hooks/`)
are loaded and mapped to OpenCode events.

```jsonc
"loadClaudeHookSettings": {
  "loadGlobalClaudeHooks": true,
  "loadLocalClaudeHooks": true
}
```

| Field                   | Type      | Default | Description                        |
| ----------------------- | --------- | ------- | ---------------------------------- |
| `loadGlobalClaudeHooks` | `boolean` | `true`  | Load hooks from `~/.claude/hooks/` |
| `loadLocalClaudeHooks`  | `boolean` | `true`  | Load hooks from `.claude/hooks/`   |

## Script Toasts

```jsonc
"scriptToasts": {
  "showOutput": true,
  "showError": true,
  "outputVariant": "warning",
  "errorVariant": "error",
  "outputDuration": 5000,
  "errorDuration": 15000,
  "outputTitle": "- SCRIPTS OUTPUT",
  "errorTitle": "- SCRIPT ERROR"
}
```

| Field            | Type      | Default              | Description                                           |
| ---------------- | --------- | -------------------- | ----------------------------------------------------- |
| `showOutput`     | `boolean` | `true`               | Show toast on successful script output                |
| `showError`      | `boolean` | `true`               | Show toast on script errors                           |
| `outputVariant`  | `string`  | `'warning'`          | Toast variant (`success`, `warning`, `error`, `info`) |
| `errorVariant`   | `string`  | `'error'`            | Toast variant for errors                              |
| `outputDuration` | `number`  | `5000`               | Duration in ms for output toasts                      |
| `errorDuration`  | `number`  | `15000`              | Duration in ms for error toasts                       |
| `outputTitle`    | `string`  | `'- SCRIPTS OUTPUT'` | Title for output toasts                               |
| `errorTitle`     | `string`  | `'- SCRIPT ERROR'`   | Title for error toasts                                |

## Default Overrides

Default values applied to every event unless overridden at the event or tool
level.

```jsonc
"default": {
  "toast": false,
  "runScripts": false,
  "runOnlyOnce": false,
  "logToAudit": true,
  "appendToSession": false
}
```

| Field             | Type      | Default | Description                              |
| ----------------- | --------- | ------- | ---------------------------------------- |
| `toast`           | `boolean` | `false` | Show toast notification for this event   |
| `runScripts`      | `boolean` | `false` | Execute scripts for this event           |
| `runOnlyOnce`     | `boolean` | `false` | Run scripts only once per session        |
| `logToAudit`      | `boolean` | `true`  | Log event to audit system                |
| `appendToSession` | `boolean` | `false` | Append script output to OpenCode session |

## Audit Configuration

Controls the audit logging subsystem. See [AUDIT_SYSTEM.md](AUDIT_SYSTEM.md)
for details.

```jsonc
"audit": {
  "enabled": true,
  "level": "debug",
  "basePath": "./opencode-hooks/logs",
  "maxSizeMB": 1,
  "maxAgeDays": 30,
  "logTruncationKB": 2,
  "maxFieldSize": 1000,
  "maxArrayItems": 50,
  "largeFields": [
    "patch", "diff", "content", "snapshot",
    "output", "result", "text"
  ]
}
```

| Field             | Type                   | Default                   | Description                                                        |
| ----------------- | ---------------------- | ------------------------- | ------------------------------------------------------------------ |
| `enabled`         | `boolean`              | `true`                    | Enable/disable audit logging                                       |
| `level`           | `'audit'` or `'debug'` | `'debug'`                 | Log level — `'debug'` includes stdin and scriptType in script logs |
| `basePath`        | `string`               | `'./opencode-hooks/logs'` | Directory for audit log files                                      |
| `maxSizeMB`       | `number`               | `1`                       | Max file size before archiving                                     |
| `maxAgeDays`      | `number`               | `30`                      | Archive files older than N days                                    |
| `logTruncationKB` | `number`               | `2`                       | Truncation threshold for large log fields                          |
| `maxFieldSize`    | `number`               | `1000`                    | Max characters per field                                           |
| `maxArrayItems`   | `number`               | `50`                      | Max items per array field                                          |
| `largeFields`     | `string[]`             | `[...]`                   | Field names subject to truncation                                  |

## Events Configuration

The `events` field maps event names to per-event overrides. Each key is an event
name string (see [EVENTS.md](docs/EVENTS.md) for the full list).

### Event Types

| Category         | Events                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Session**      | `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated`, `session.unknown` |
| **Message**      | `message.part.delta`, `message.part.removed`, `message.part.updated`, `message.removed`, `message.updated`                                                         |
| **Tool**         | `tool.execute.before`, `tool.execute.after`, `tool.execute.before.subagent`, `tool.execute.after.subagent`                                                         |
| **File**         | `file.edited`, `file.watcher.updated`                                                                                                                              |
| **Permission**   | `permission.asked`, `permission.replied`                                                                                                                           |
| **Server**       | `server.connected`, `server.instance.disposed`                                                                                                                     |
| **Chat**         | `chat.message`, `chat.params`, `chat.headers`, `experimental.chat.messages.transform`, `experimental.chat.system.transform`                                        |
| **LSP**          | `lsp.client.diagnostics`, `lsp.updated`                                                                                                                            |
| **Installation** | `installation.updated`                                                                                                                                             |
| **TODO**         | `todo.updated`                                                                                                                                                     |
| **Shell**        | `shell.env`                                                                                                                                                        |
| **TUI**          | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show`                                                                                                       |
| **Experimental** | `experimental.session.compacting`, `experimental.text.complete`                                                                                                    |
| **Other**        | `command.executed`, `tool.definition`                                                                                                                              |

### Event Config Values

Each event accepts one of:

| Value                 | Behavior                                      |
| --------------------- | --------------------------------------------- |
| `undefined` / omitted | Uses `default` settings at top level          |
| `false`               | Disables the event entirely                   |
| `{}` (empty object)   | Implicitly enabled, uses all defaults         |
| `{ ...overrides }`    | Implicitly enabled, overrides specific fields |

### Event Override Shape

```jsonc
{
  "enabled": false, // Disable the event entirely
  "toast": true, // boolean or object
  "toast": {
    // object for custom toast
    "title": "...",
    "message": "...",
    "variant": "info",
    "duration": 3000,
  },
  "runScripts": true,
  "runOnlyOnce": true,
  "logToAudit": true,
  "appendToSession": true,
  "allowedFields": ["patch", "diff"],
  "scripts": [{ "source": "native", "path": "session-created.sh" }],
}
```

### Script Entry Shape

```jsonc
{
  "source": "native", // "native" or "claude" (stdin format)
  "path": "script.sh", // relative to .opencode/scripts/
  "matcher": "...", // event matcher pattern (optional)
  "async": false, // run in background
  "timeout": 30000, // timeout in ms
  "passStdin": true, // pass event data via stdin
}
```

### Script Path Resolution

- **Relative paths** (`session-created.sh`) resolve to `.opencode/scripts/`.
- **Absolute paths** (`/home/...`) are used as-is.
- **Subdirectory paths** (`subdir/script.sh`) work with relative paths.
- **Backslash** and **path traversal** (`..`) are rejected.

### Example

```jsonc
"events": {
  "session.updated": { "enabled": false },
  "session.error": { "toast": true },
  "session.compacted": {
    "toast": {
      "title": "Context Compacted",
      "message": "Session was compacted to free up context",
      "variant": "info",
      "duration": 3000
    }
  },
  "session.created": {
    "runScripts": true,
    "runOnlyOnce": true,
    "appendToSession": true,
    "scripts": [
      { "source": "native", "path": "session-created.sh" }
    ]
  },
  "tool.execute.before": {
    "runScripts": true,
    "scripts": [
      { "source": "claude", "path": "block-env-write.sh" }
    ]
  },
  "chat.message": {
    "runScripts": true,
    "scripts": [
      { "source": "native", "path": "mempalace-mine.sh", "async": true }
    ]
  }
}
```

## Tools Configuration

The `tools` field provides per-tool overrides for tool execution events. Four
sub-sections:

```jsonc
"tools": {
  "tool.execute.before":     { ... },
  "tool.execute.after":      { ... },
  "tool.execute.before.subagent": { ... },
  "tool.execute.after.subagent":  { ... }
}
```

Each sub-section maps tool names to overrides:

```jsonc
"tool.execute.before": {
  "bash": {
    "runScripts": true,
    "scripts": [
      { "source": "native", "path": "block-sensitive.sh" }
    ]
  },
  "write": {
    "runScripts": true,
    "scripts": [
      { "source": "claude", "path": "block-env-write.sh" }
    ]
  },
  "task": {},
  "chat": {}
}
```

### Tool Override Shape

```jsonc
{
  "enabled": false,
  "toast": true,
  "runScripts": true,
  "runOnlyOnce": false,
  "logToAudit": true,
  "appendToSession": false,
  "scripts": [],
}
```

You can also set a tool override to `false` to disable it entirely, or `true`
to enable with defaults (same as `{}`).

### Available Tool Names

`task`, `skill`, `bash`, `write`, `edit`, `chat`, `read`, `glob`, `grep`,
`list`, `patch`, `webfetch`, `websearch`, `codesearch`, `todowrite`,
`todoread`, `question`, `git.commit`, `git.push`, `git.pull`,
`filesystem_read_file`, `filesystem_write_file`, `filesystem_list_directory`,
`filesystem_search_files`, `filesystem_create_directory`,
`filesystem_move_file`, `filesystem_get_file_info`, `gh_grep_searchGitHub`

### Resolution Order

When resolving configuration for a tool execution event, the plugin checks in
this order:

1. **Tool-specific** — config in `tools[eventType][toolName]`
2. **Event-level** — config in `events[eventType]`
3. **Global defaults** — `default` section at top level
4. **Hard defaults** — built-in constants (event disabled by default)
