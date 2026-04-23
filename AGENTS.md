# OpenCode Hooks

TypeScript plugin system for OpenCode AI with event-driven hooks.

## Commands

| Command            | Description        |
| ------------------ | ------------------ |
| `npm run build`    | Compile TypeScript |
| `npm run lint`     | Run ESLint         |
| `npm run test:cov` | Run coverage tests |

## Important Files

| File                                    | Purpose                                    |
| --------------------------------------- | ------------------------------------------ |
| `config/settings.ts`                    | **ONLY FILE TO EDIT** - user configuration |
| `config/security-rules.ts`              | Security predicates                        |
| `features/messages/default-handlers.ts` | Event handlers with `allowedFields`        |
| `events-catalog.md`                     | Event types and available fields           |

## Guidelines

- [Code Style](docs/agent-instructions/code-style.md)
- [Testing](docs/agent-instructions/testing.md)
- [Architecture](docs/agent-instructions/architecture.md)
- [Git Workflow](docs/agent-instructions/git-workflow.md)

## Release

Uses Release Please. On push to main → merge auto-created PR.
