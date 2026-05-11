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

### Next Steps

- See [Configuration](docs/CONFIGURATION.md) to set up events, tools, scripts, and audit
- See [Scripts](docs/SCRIPTS.md) to learn how to write blocking scripts, async scripts, and Claude-compatible hooks
- See [Events](docs/EVENTS.md) for the full event catalog with available fields

## Documentation

| Document                                                  | Description                                                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [Configuration](docs/CONFIGURATION.md)                    | Full reference for `settings.ts` — all config fields, types, events, tools, audit, and toasts                     |
| [Scripts](docs/SCRIPTS.md)                                | How to write and run shell scripts — stdin formats, blocking, async, exit codes, Claude Code compatibility        |
| [Events](docs/EVENTS.md)                                  | Event catalog with available fields, descriptions, and recommended toast fields                                   |
| [Claude Code Compatibility](docs/CLAUDE-COMPATIBILITY.md) | How Claude Code `.sh` hooks map to OpenCode events — stdin field comparison, limitations, and migration checklist |
| [Audit System](docs/AUDIT_SYSTEM.md)                      | Audit logging reference — log files, sanitization, archiving, and migration                                       |

## Development

### Available Scripts

```bash
npm run build          # Compile TypeScript
npm run test:unit      # Run unit tests
npm run test:cov       # Run tests with coverage
npm run test:integration  # Run integration tests
npm run test:e2e       # Run E2E tests
npm run test:all       # Run all tests (unit + integration + e2e)
npm run coverage:report # Full coverage report (HTML)
npm run lint           # Run ESLint
npm run lint:fix       # Fix ESLint errors
npm run format         # Run Prettier
npm run format:check   # Check formatting
```

### Test Coverage

Current coverage: **99%+ statements, 99%+ branches, 99%+ functions, 99%+ lines**

```bash
npm run test:cov       # Terminal coverage summary
npm run coverage:report # HTML report in coverage/lcov-report/index.html
```

## License

MIT
