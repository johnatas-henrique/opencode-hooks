# OpenCode Hooks

TypeScript plugin system for OpenCode AI providing event-driven hooks for 28 documented events.

## Quick Reference

| Command             | Description          |
| ------------------- | -------------------- |
| `npm run build`     | Compile TypeScript   |
| `npm run lint`      | Run ESLint           |
| `npm run test`      | Run all tests        |
| `npm run test:unit` | Run unit tests       |
| `npm run coverage`  | Full coverage report |

### Single Test

```bash
NODE_OPTIONS='--experimental-vm-modules' npx jest test/events.test.ts
NODE_OPTIONS='--experimental-vm-modules' npx jest -t "session.created"
```

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
