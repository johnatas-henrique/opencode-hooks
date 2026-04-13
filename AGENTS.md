# OpenCode Hooks

TypeScript plugin system for OpenCode AI with event-driven hooks.

## Commands

| Command             | Description             |
| ------------------- | ----------------------- |
| `npm run build`     | Compile TypeScript      |
| `npm run lint`      | Run ESLint              |
| `npm run test:unit` | Run unit tests          |
| `npm run test:ci`   | Run tests with coverage |

## Project Structure

```
.opencode/plugins/
├── opencode-hooks.ts       # Main plugin entry point
├── helpers/
│   ├── index.ts            # Barrel exports
│   ├── constants.ts        # Shared constants
│   ├── events.ts           # Event resolution logic
│   ├── event-types.ts      # Type definitions
│   ├── user-events.config.ts  # User configuration (ONLY FILE TO EDIT)
│   ├── default-handlers.ts # Default event handlers
│   └── toast-queue.ts      # Toast queue management
test/                      # Jest tests
```

## Guidelines

- [Code Style](docs/agent-instructions/code-style.md)
- [Testing Guidelines](docs/agent-instructions/testing.md)
- [Architecture](docs/agent-instructions/architecture.md)
- [Git Workflow](docs/agent-instructions/git-workflow.md)

## Plan Mode

1. Research and construct the plan in conversation
2. Delegate to `general` subagent to write to `docs/plans/`
3. Plans must be in English with execution table
4. Run `npm run build && npm run lint && npm run test` before committing

## Git Workflow

- **ALWAYS ask for permission before git commit or push**
- Use atomic commits with conventional commits format

## Agent Rules

- **External changes**: If you detect modifications made by tools other than yourself (e.g., package.json, package-lock.json, generated files), **NEVER delete or revert them**. Either ask the user what to do or ignore them.
- **Commit validation**: **NEVER bypass linters or validation hooks** when committing. If a commit fails due to lint/typecheck/test errors, report the issue to the user and request guidance instead of using `--no-verify` or disabling checks.

## Release

Uses Release Please (not semantic-release). Workflow runs on push to main.

- Config: `release-please-config.json`
- Workflow: `.github/workflows/release-please.yml`
- Version scheme: 0.x.x (features bump patch, breaking changes bump minor)
- To release: push with conventional commit messages → merge the auto-created PR

## Architecture

- Plugin entry: `.opencode/plugins/opencode-hooks.ts`
- User config: `.opencode/plugins/helpers/user-events.config.ts` (ONLY FILE TO EDIT)
- Tests: `test/` with Jest
