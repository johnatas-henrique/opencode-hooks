# Configuration — OpenCode Hooks

All user configuration lives in a single TypeScript file:

```
.opencode/plugins/config/settings.ts
```

The file exports a `UserEventsConfig` object. The type definition lives at
`.opencode/plugins/types/config.ts`.

## Quick Reference

```typescript
import { DEFAULTS } from '.opencode/plugins/core/constants';
import { OpenCodeEvents } from '.opencode/plugins/types/core';
import type { UserEventsConfig } from '.opencode/plugins/types/config';

export const userConfig: UserEventsConfig = {
  enabled: true,
  logDisabledEvents: false,
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only',
  toastQueue: { staggerMs: 300, maxSize: 50 },
  // ... see sections below
};
```

## Top-Level Fields

| Field                     | Type                      | Default       | Description                              |
| ------------------------- | ------------------------- | ------------- | ---------------------------------------- |
| `enabled`                 | `boolean`                 | `true`        | Master toggle for the entire plugin      |
| `logDisabledEvents`       | `boolean`                 | `false`       | Even disabled events get logged to audit |
| `showPluginStatus`        | `boolean`                 | `true`        | Show plugin status toast at startup      |
| `pluginStatusDisplayMode` | `PluginStatusDisplayMode` | `'user-only'` | How to display plugins in status toast   |

### Plugin Status Display Modes

| Mode               | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `'user-only'`      | Shows only user-configured plugins (default)                 |
| `'user-separated'` | Groups into "Active (user)" and "Active (built-in)" sections |
| `'all-labeled'`    | Shows all plugins with `(user)` or `(built-in)` labels       |

## Toast Queue

```typescript
toastQueue: {
  staggerMs: DEFAULTS.toast.stagger.DEFAULT,  // 300
  maxSize: 50,
},
```

| Field       | Type     | Default | Description                                  |
| ----------- | -------- | ------- | -------------------------------------------- |
| `staggerMs` | `number` | `300`   | Milliseconds between successive toast popups |
| `maxSize`   | `number` | `50`    | Maximum queued toasts before dropping        |

## Claude Hook Settings

Controls whether Claude Code hooks (from `~/.claude/hooks/` and `.claude/hooks/`) are
loaded and mapped to OpenCode events.

```typescript
loadClaudeHookSettings: {
  loadGlobalClaudeHooks: true,
  loadLocalClaudeHooks: true,
},
```

| Field                   | Type      | Default | Description                        |
| ----------------------- | --------- | ------- | ---------------------------------- |
| `loadGlobalClaudeHooks` | `boolean` | `true`  | Load hooks from `~/.claude/hooks/` |
| `loadLocalClaudeHooks`  | `boolean` | `true`  | Load hooks from `.claude/hooks/`   |

## Script Toasts

Controls toast notification behavior for script output and errors.

```typescript
scriptToasts: {
  showOutput: true,
  showError: true,
  outputVariant: 'warning',
  errorVariant: 'error',
  outputDuration: 5000,    // 5 seconds
  errorDuration: 15000,    // 15 seconds
  outputTitle: '- SCRIPTS OUTPUT',
  errorTitle: '- SCRIPT ERROR',
},
```

| Field            | Type           | Default              | Description                                                              |
| ---------------- | -------------- | -------------------- | ------------------------------------------------------------------------ |
| `showOutput`     | `boolean`      | `true`               | Show toast on successful script output                                   |
| `showError`      | `boolean`      | `true`               | Show toast on script errors                                              |
| `outputVariant`  | `EventVariant` | `'warning'`          | Toast variant for output (`'success'`, `'warning'`, `'error'`, `'info'`) |
| `errorVariant`   | `EventVariant` | `'error'`            | Toast variant for errors                                                 |
| `outputDuration` | `number`       | `5000`               | Duration in ms for output toasts                                         |
| `errorDuration`  | `number`       | `15000`              | Duration in ms for error toasts                                          |
| `outputTitle`    | `string`       | `'- SCRIPTS OUTPUT'` | Title for output toasts                                                  |
| `errorTitle`     | `string`       | `'- SCRIPT ERROR'`   | Title for error toasts                                                   |

## Default Overrides

Default values applied to every event unless overridden at the event or tool level.

```typescript
default: {
  toast: false,
  runScripts: false,
  runOnlyOnce: false,
  logToAudit: true,
  appendToSession: false,
},
```

| Field             | Type      | Default | Description                              |
| ----------------- | --------- | ------- | ---------------------------------------- |
| `toast`           | `boolean` | `false` | Show toast notification for this event   |
| `runScripts`      | `boolean` | `false` | Execute scripts for this event           |
| `runOnlyOnce`     | `boolean` | `false` | Run scripts only once per session        |
| `logToAudit`      | `boolean` | `true`  | Log event to audit system                |
| `appendToSession` | `boolean` | `false` | Append script output to OpenCode session |

## Audit Configuration

Controls the audit logging subsystem. See [AUDIT_SYSTEM.md](AUDIT_SYSTEM.md) for details.

```typescript
audit: {
  enabled: true,
  level: 'debug',
  basePath: './production/session-logs',
  maxSizeMB: 1,
  maxAgeDays: 30,
  logTruncationKB: 2,
  maxFieldSize: 1000,
  maxArrayItems: 50,
  largeFields: [
    'patch', 'diff', 'content', 'snapshot',
    'output', 'result', 'text',
  ],
  files: DEFAULTS.audit.files,
},
```

| Field             | Type                   | Default                       | Description                                                               |
| ----------------- | ---------------------- | ----------------------------- | ------------------------------------------------------------------------- |
| `enabled`         | `boolean`              | `true`                        | Enable/disable audit logging                                              |
| `level`           | `'audit'` \| `'debug'` | `'audit'`                     | Log level filter — `'debug'` includes stdin and scriptType in script logs |
| `basePath`        | `string`               | `'./production/session-logs'` | Directory for audit log files                                             |
| `maxSizeMB`       | `number`               | `2`                           | Max file size before archiving                                            |
| `maxAgeDays`      | `number`               | `30`                          | Archive files older than N days                                           |
| `logTruncationKB` | `number`               | `2`                           | Truncation threshold for large log fields                                 |
| `maxFieldSize`    | `number`               | `1000`                        | Max characters per field                                                  |
| `maxArrayItems`   | `number`               | `50`                          | Max items per array field                                                 |
| `largeFields`     | `string[]`             | `[...]`                       | Field names subject to truncation                                         |
| `files`           | object                 | `DEFAULTS.audit.files`        | Audit file name templates                                                 |

## Events Configuration

The `events` field maps event names to per-event overrides. Each key is an event
name from the `OpenCodeEvents` enum.

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

### EventOverride Type

```typescript
interface EventOverride {
  enabled?: boolean; // Disable the event entirely
  toast?: boolean | ToastOverride; // Toggle or customize toast
  scripts?: ScriptEntry[]; // Scripts to run (ScriptEntry, not string)
  runScripts?: boolean; // Enable script execution
  runOnlyOnce?: boolean; // Run scripts once per session
  logToAudit?: boolean; // Log event to audit system
  appendToSession?: boolean; // Append output to OpenCode session
  allowedFields?: string[]; // Fields to include in toast messages
}
```

### ToastOverride Type

```typescript
interface ToastOverride {
  enabled?: boolean;
  title?: string;
  message?: string;
  messageFn?: (
    input: Record<string, unknown>,
    output?: Record<string, unknown>
  ) => string | undefined;
  variant?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}
```

### ScriptEntry Type

```typescript
interface ScriptEntry {
  source: 'native' | 'claude'; // Stdin format to use
  path: string; // Script path (relative to scripts dir)
  matcher?: string; // Event matcher pattern
  async?: boolean; // Run in background (spawn + unref)
  timeout?: number; // Timeout in ms
  passStdin?: boolean; // Pass event data via stdin
  scriptType?: ScriptOrigin; // Auto-set; identifies origin
}
```

### Example

```typescript
events: {
  // Disables — no toast, no scripts, no logs
  [OpenCodeEvents.SESSION_UPDATED]: { enabled: false },

  // Toast-only
  [OpenCodeEvents.SESSION_ERROR]: { toast: true },

  // Custom toast
  [OpenCodeEvents.SESSION_COMPACTED]: {
    toast: {
      title: 'Context Compacted',
      message: 'Session was compacted to free up context',
      variant: 'info',
      duration: 3000,
    },
  },

  // Scripts with native stdin format
  [OpenCodeEvents.SESSION_CREATED]: {
    runScripts: true,
    runOnlyOnce: true,
    appendToSession: true,
    scripts: [
      { source: 'native', path: 'session-created.sh' },
    ],
  },

  // Claude-compatible script
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
    runScripts: true,
    scripts: [
      { source: 'claude', path: 'block-env-write.sh' },
    ],
  },

  // Async script — runs in background, non-blocking
  [OpenCodeEvents.CHAT_MESSAGE]: {
    runScripts: true,
    scripts: [
      { source: 'native', path: 'mempalace-mine.sh', async: true },
    ],
  },
},
```

## Tools Configuration

The `tools` field provides per-tool overrides for tool execution events.
It supports four sub-objects, one per tool event type:

```typescript
tools: {
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]:   Record<string, ToolOverride>;
  [OpenCodeEvents.TOOL_EXECUTE_AFTER]:    Record<string, ToolConfig>;
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE_SUBAGENT]: Record<string, ToolOverride>;
  [OpenCodeEvents.TOOL_EXECUTE_AFTER_SUBAGENT]:  Record<string, ToolConfig>;
}
```

`ToolConfig` is `boolean | ToolOverride`.

### ToolOverride Type

```typescript
interface ToolOverride {
  enabled?: boolean;
  toast?: boolean | ToolOverride; // Toggle or customize toast
  scripts?: ScriptEntry[]; // Scripts to run for this tool
  runScripts?: boolean; // Enable script execution
  runOnlyOnce?: boolean; // Run scripts once per session
  logToAudit?: boolean; // Log to audit system
  appendToSession?: boolean; // Append output to session
  messageFn?: (input: unknown, output?: unknown) => string | undefined;
}
```

### Available Tool Names

Tool names match OpenCode tool identifiers:

`task`, `skill`, `bash`, `write`, `edit`, `chat`, `read`, `glob`, `grep`,
`list`, `patch`, `webfetch`, `websearch`, `codesearch`, `todowrite`,
`todoread`, `question`, `git.commit`, `git.push`, `git.pull`,
`filesystem_read_file`, `filesystem_write_file`, `filesystem_list_directory`,
`filesystem_search_files`, `filesystem_create_directory`,
`filesystem_move_file`, `filesystem_get_file_info`, `gh_grep_searchGitHub`

### Example

```typescript
tools: {
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
    // Only run blocking scripts for bash, write, edit, read
    bash: {
      runScripts: true,
      scripts: [
        { source: 'native', path: 'block-sensitive.sh' },
      ],
    },
    write: {
      runScripts: true,
      scripts: [
        { source: 'claude', path: 'block-env-write.sh' },
        { source: 'native', path: 'block-sensitive.sh' },
      ],
    },
    // No config = uses event-level defaults
    task: {},
    chat: {},
  },

  [OpenCodeEvents.TOOL_EXECUTE_AFTER]: {
    task: {
      logToAudit: true,
      toast: true,
      runScripts: true,
      scripts: [{ source: 'native', path: 'log-skill.sh' }],
    },
    // Empty config = runs with defaults
    bash: {},
    write: {},
  },
}
```

### Resolution Order

When resolving configuration for a tool execution event, the plugin checks in
this order:

1. **Tool-specific** — config in `tools[eventType][toolName]`
2. **Event-level** — config in `events[eventType]`
3. **Global defaults** — `default` section at top level
4. **Hard defaults** — built-in constants (disabled if not configured)

This means you can set a baseline in `events` and override specific tools.

## Script Path Resolution

- **Relative paths** (e.g., `'session-created.sh'`) are resolved relative to
  `.opencode/scripts/` (configurable via `DEFAULTS.scripts.dir`).
- **Absolute paths** (starting with `/`) are used as-is. Used when loading
  scripts from Claude Code settings (`~/.claude/hooks/`).
- **Subdirectory paths** (e.g., `'subdir/script.sh'`) work with relative paths.
- **Backslash** and **path traversal** (`..`) are rejected.
