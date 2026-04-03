## What's Changed

### ✨ Features

- Add modular event system with 28 OpenCode events
- Support all documented event types: session, message, tool, file, permission, server, command, LSP, installation, todo, shell, TUI, and experimental
- Type-safe TypeScript configuration replacing JSON-based config
- Per-event and per-tool configuration with toast, scripts, saveToFile, appendToSession
- Add `tool.execute.before` and `shell.env` hook support
- Toast queue with backpressure and staggered display

### 🐛 Fixes

- Resolve type safety issues with `as ResolvedEventConfig` casts
- Add safe sessionId validation with typeof check
- Handle non-task tools in `tool.execute.after` (scripts now run for all configured tools)
- Fix `session-closed.sh` failure when repository has no commits
- Fix `session-created.sh` failure when repository has no commits
- Remove double error logging in script execution
- Replace console.warn/error with saveToFile logging to prevent TUI impact
- Fix LOG_FILE path normalization

### 📚 Documentation

- Add comprehensive README.md with features, quick start, and configuration guide
- Add AGENTS.md with project conventions and commands
- Document all 28 supported events with default toasts and scripts

### ♻️ Refactoring

- Replace monolithic switch-based handlers with data-driven factory pattern
- Eliminate all `any` types in production code
- Extract duplicated script error handling to `runScriptAndHandle` helper
- Remove orphaned `create-toast.ts` utility
- Clean up helper utilities and improve error handling

### 🧪 Tests

- 207 tests passing at 97% statement coverage
- Add comprehensive tests for modular event system
- Add edge case tests for config resolution, filename validation, and toast queue backpressure

**Full Changelog**: https://github.com/johnatas-henrique/opencode-hooks/compare/v0.0.0-dev-01...v0.1.0
