# OpenCode Hooks

[![Codecov](https://codecov.io/gh/johnatas-henrique/opencode-hooks/branch/main/graph/badge.svg)](https://codecov.io/gh/johnatas-henrique/opencode-hooks)
[![CI](https://github.com/johnatas-henrique/opencode-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/johnatas-henrique/opencode-hooks/actions/workflows/ci.yml)

A TypeScript plugin system for [OpenCode AI](https://opencode.ai) that provides event-driven hooks for session lifecycle, tool execution, file operations, and UI notifications (toasts).

## Features

- **28 OpenCode Events** — Full coverage of all documented OpenCode events: session, message, tool, file, permission, server, command, LSP, installation, todo, shell, TUI, and experimental events
- **Toast Notifications** — Staggered, non-overlapping toasts with configurable title, variant, message, and duration
- **Script Execution** — Run shell scripts on any event with per-event and per-tool configuration
- **File Persistence** — Save script output and event logs to disk
- **Session Context** — Append script output to the active OpenCode session
- **Type-Safe Configuration** — Full TypeScript support with autocomplete and compile-time validation
- **Per-Tool Configuration** — Different behavior for different tools (e.g., `task`, `chat`, `git.commit`)

## Quick Start

### Prerequisites

- [OpenCode AI](https://opencode.ai) installed
- Node.js 18+

### Installation

1. Clone this repository into your project's `.opencode/plugins` directory:

```bash
mkdir -p .opencode/plugins
cd .opencode/plugins
git clone <repository-url> opencode-hooks
cd opencode-hooks
npm install
npm run build
```

2. OpenCode will automatically detect and load the plugin from `.opencode/plugins/opencode-hooks.ts`.

### Configuration

All configuration is done in a single file: `.opencode/plugins/helpers/user-events.config.ts`

```typescript
export const userConfig: UserEventsConfig = {
  // Global toggles
  enabled: true,
  toast: true,
  saveToFile: true,
  appendToSession: true,
  runScripts: true,

  // Per-event configuration
  events: {
    [EventType.SESSION_CREATED]: true,
    [EventType.SESSION_ERROR]: { toast: { duration: 30000 } },
    [EventType.SESSION_IDLE]: false,
    [EventType.SESSION_COMPACTED]: { scripts: ['pre-compact.sh'] },
  },

  // Per-tool configuration
  tools: {
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { toast: true, scripts: ['log-agent.sh'] },
      chat: { toast: false },
    },
  },
};
```

### Event Configuration Options

Each event can be configured in three ways:

| Syntax    | Behavior                                       |
| --------- | ---------------------------------------------- |
| `true`    | Uses all global defaults                       |
| `false`   | Disables the event entirely                    |
| `{ ... }` | Implicitly enabled, overrides specified fields |

#### Override Fields

| Field             | Type                                                   | Description                                      |
| ----------------- | ------------------------------------------------------ | ------------------------------------------------ |
| `debug`           | `boolean`                                              | Enable debug logging to session_debug_events.log |
| `toast`           | `boolean \| { title?, message?, variant?, duration? }` | Toggle or customize toast                        |
| `scripts`         | `string[]`                                             | Custom scripts to run                            |
| `runScripts`      | `boolean`                                              | Enable/disable script execution                  |
| `saveToFile`      | `boolean`                                              | Toggle file persistence                          |
| `appendToSession` | `boolean`                                              | Toggle session appending                         |

#### Script Resolution

| `runScripts` | `scripts` array | Result                   |
| ------------ | --------------- | ------------------------ |
| `false`      | `['a.sh']`      | No scripts run           |
| `true`       | not defined     | Default script runs      |
| not defined  | `['a.sh']`      | `['a.sh']` runs          |
| not defined  | not defined     | Uses global `runScripts` |

### Creating Shell Scripts

Place your shell scripts in `.opencode/scripts/`. Script names follow the pattern `<event-name>.sh`:

```bash
# .opencode/scripts/session-created.sh
#!/bin/bash
echo "New session started at $(date)"
```

```bash
# .opencode/scripts/log-agent.sh
#!/bin/bash
echo "Agent executed: $1"
```

Scripts receive the tool name as the first argument when called from `tool.execute` events.

### Per-Tool Configuration

For `tool.execute.before` and `tool.execute.after` events, you can configure behavior per specific tool. This is useful when you want different handling for different tools (e.g., `task` subagent calls vs `read` file operations).

```typescript
tools: {
  [EventType.TOOL_EXECUTE_AFTER]: {
    task: { debug: true, toast: true, scripts: ['log-agent.sh'] },
    read: { debug: false, toast: false },
    chat: { debug: false },
    glob: { debug: false },
  },
  [EventType.TOOL_EXECUTE_BEFORE]: {
    task: { debug: true },
    read: { debug: false },
  },
}
```

#### Resolution Order

Configuration is resolved in this order:

1. **Tool-specific** - Check if the tool has explicit config in `tools` section
2. **Event-level** - Fall back to config in `events` section
3. **Global defaults** - Use global settings if neither above exists

This means you can set a default for all tool events in `events`, then override specific tools in `tools`.

### Debug Mode

When `debug: true` is set for an event:

- A 10-second toast shows with the complete event object (input, output, resolved config)
- Full event data is saved to `session_debug_events.log` (in `production/session-logs/`)

Debug works at both event-level and tool-level:

```typescript
events: {
  [EventType.TOOL_EXECUTE_AFTER]: { debug: true },  // All tools
},
tools: {
  [EventType.TOOL_EXECUTE_AFTER]: {
    task: { debug: true },   // Only task tool
    read: { debug: false },  // Exclude read
  },
}
```

## Supported Events

### Session Events (8)

| Event               | Default Toast | Default Script         |
| ------------------- | ------------- | ---------------------- |
| `session.created`   | Success       | `session-created.sh`   |
| `session.compacted` | Info          | `session-compacted.sh` |
| `session.deleted`   | Error         | `session-deleted.sh`   |
| `session.error`     | Error (30s)   | `session-error.sh`     |
| `session.diff`      | Warning       | `session-diff.sh`      |
| `session.idle`      | Info          | `session-idle.sh`      |
| `session.status`    | Info          | `session-status.sh`    |
| `session.updated`   | Info          | `session-updated.sh`   |

### Message Events (4)

| Event                  | Default Toast | Default Script            |
| ---------------------- | ------------- | ------------------------- |
| `message.part.removed` | Warning       | `message-part-removed.sh` |
| `message.part.updated` | Info          | `message-part-updated.sh` |
| `message.removed`      | Warning       | `message-removed.sh`      |
| `message.updated`      | Info          | `message-updated.sh`      |

### Tool Events (2)

| Event                 | Default Toast | Default Script           |
| --------------------- | ------------- | ------------------------ |
| `tool.execute.before` | Info          | `tool-execute-before.sh` |
| `tool.execute.after`  | Info          | `tool-execute-after.sh`  |

### File Events (2)

| Event                  | Default Toast | Default Script            |
| ---------------------- | ------------- | ------------------------- |
| `file.edited`          | Info          | `file-edited.sh`          |
| `file.watcher.updated` | Info          | `file-watcher-updated.sh` |

### Permission Events (2)

| Event                | Default Toast | Default Script          |
| -------------------- | ------------- | ----------------------- |
| `permission.asked`   | Warning (5s)  | `permission-asked.sh`   |
| `permission.replied` | Info          | `permission-replied.sh` |

### Server Events (2)

| Event                      | Default Toast | Default Script        |
| -------------------------- | ------------- | --------------------- |
| `server.connected`         | Success       | `server-connected.sh` |
| `server.instance.disposed` | None          | `session-stop.sh`     |

### Other Events (10)

| Event                             | Default Toast | Default Script              |
| --------------------------------- | ------------- | --------------------------- |
| `command.executed`                | Info          | `command-executed.sh`       |
| `lsp.client.diagnostics`          | Warning       | `lsp-client-diagnostics.sh` |
| `lsp.updated`                     | Info          | `lsp-updated.sh`            |
| `installation.updated`            | Success       | `installation-updated.sh`   |
| `todo.updated`                    | Info          | `todo-updated.sh`           |
| `shell.env`                       | None          | `shell-env.sh`              |
| `tui.prompt.append`               | Info          | `tui-prompt-append.sh`      |
| `tui.command.execute`             | Info          | `tui-command-execute.sh`    |
| `tui.toast.show`                  | Info          | `tui-toast-show.sh`         |
| `experimental.session.compacting` | Warning       | `session-compacting.sh`     |

## Development

### Available Scripts

```bash
npm run build          # Compile TypeScript
npm test               # Run unit tests
npm run test:ci        # Run tests with coverage
npm run coverage       # Full coverage report
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run format         # Run Prettier
npm run format:check   # Check formatting
```

### Project Structure

```
.opencode/plugins/
├── opencode-hooks.ts           # Main plugin entry point
├── types/
│   ├── opencode-hooks.ts       # OpenCode event type definitions
│   └── event-properties.ts     # Event property type definitions
└── helpers/
    ├── event-types.ts          # EventType enum and interfaces
    ├── handlers.ts             # Default handlers with message builders
    ├── events.ts               # Config resolution logic
    ├── user-events.config.ts   # User configuration (edit this file)
    ├── toast-queue.ts          # Staggered toast notification queue
    ├── run-script.ts           # Shell script execution
    ├── save-to-file.ts         # File persistence utility
    ├── append-to-session.ts    # Session context appending
    └── constants.ts            # Shared constants
test/                           # Jest test files
```

### Adding a New Event Handler

1. Add the event to `EventType` enum in `event-types.ts`
2. Add a handler entry in `handlers.ts` with title, variant, duration, defaultScript, and buildMessage
3. Add the event to `user-events.config.ts` with desired configuration
4. Write tests in `test/handlers.test.ts` and `test/events.test.ts`

## Architecture

The plugin uses a modular, layered architecture:

1. **User Config** (`user-events.config.ts`) — User edits only this file
2. **Handlers** (`handlers.ts`) — Base defaults for each event
3. **Events** (`events.ts`) — Merges user config with handler defaults
4. **Plugin** (`opencode-hooks.ts`) — Orchestrates toasts, scripts, and file operations

Events not listed in the config use global defaults. Setting an event to `false` disables it entirely.

## License

MIT
