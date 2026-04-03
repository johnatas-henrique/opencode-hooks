# OpenCode Hooks

TypeScript plugin system for OpenCode AI providing event-driven hooks for 28 documented events.

## Quick Reference

- **Build:** `npm run build`
- **Test:** `npm run test`
- **Lint:** `npm run lint`
- **Single test:** `NODE_OPTIONS='--experimental-vm-modules' npx jest test/events.test.ts`

## Guidelines

- [Code Style & Conventions](docs/agent-instructions/code-style.md)
- [Testing Guidelines](docs/agent-instructions/testing.md)
- [Git Workflow & Release](docs/agent-instructions/git-workflow.md)
- [Architecture](docs/agent-instructions/architecture.md)

## Plan Mode Workflow

When creating an implementation plan:

1. Research and construct the plan in the conversation
2. Once the plan is ready, delegate to the `general` subagent to write it to `plans/`
3. Never attempt file writes directly — always use the `general` subagent for persistence
4. Plans must be written in English with descriptive filenames (e.g., `plans/feature-name.md`)
5. Include an execution table with status tracking in every plan
