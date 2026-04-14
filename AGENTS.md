# OpenCode Hooks

TypeScript plugin system for OpenCode AI with event-driven hooks.

## Commands

| Command             | Description        |
| ------------------- | ------------------ |
| `npm run build`     | Compile TypeScript |
| `npm run lint`      | Run ESLint         |
| `npm run test:unit` | Run unit tests     |

## Important Files

| File                          | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `helpers/config/settings.ts`  | **ONLY FILE TO EDIT** - user configuration |
| `helpers/config/blocks.ts`    | Security predicates                        |
| `helpers/default-handlers.ts` | Event handlers with `allowedFields`        |
| `events-catalog.md`           | Event types and available fields           |

## Guidelines

- [Code Style](docs/agent-instructions/code-style.md)
- [Testing](docs/agent-instructions/testing.md)
- [Architecture](docs/agent-instructions/architecture.md)
- [Git Workflow](docs/agent-instructions/git-workflow.md)

## Plan Mode

1. Research in conversation
2. Save to `docs/plans/YYYY-MM-DD-name.md`
3. Create plans in English with execution table
4. Mark old plans as "DISCONTINUED" when superseded

## Rules

- **Ask before commit** - Never commit without user permission
- **Real timestamps** - Use actual time when updating plans
- **Never bypass validation** - If commit fails, report and ask for guidance
- **External changes** - If you detect modifications made by tools other than yourself (e.g., package.json, package-lock.json, generated files), **NEVER delete or revert them**. Either ask the user what to do or ignore them.
- **Timestamps** - Always use real timestamps when updating plans, based on conversation time.

## Release

Uses Release Please. On push to main → merge auto-created PR.
