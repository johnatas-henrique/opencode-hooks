# OpenCode Hooks

TypeScript plugin system for OpenCode AI with event-driven hooks.

## Commands

| Command            | Description        |
| ------------------ | ------------------ |
| `npm run build`    | Compile TypeScript |
| `npm run lint`     | Run ESLint         |
| `npm run test:cov` | Run coverage tests |

## Important Files

| File                                    | Purpose                             |
| --------------------------------------- | ----------------------------------- |
| `config/settings.ts`                    | User configuration                  |
| `config/security-rules.ts`              | Security predicates                 |
| `features/messages/default-handlers.ts` | Event handlers with `allowedFields` |
| `docs/EVENTS.md`                        | Event types and available fields    |

## Guidelines

- [Code Style](docs/agent-instructions/code-style.md)
- [Architecture](docs/agent-instructions/architecture.md)
- [Git Workflow](docs/agent-instructions/git-workflow.md)
- [Testing Guide](docs/agent-instructions/testing-guide.md)

## Regras do Projeto

1. Eu não quero ver re-exports no código que criarmos, e qualquer re-export existente deve ser apagado, se você encontrar um re-export, apague-o, vá nos arquivos que os usavam antes e faça o import direto.
2. Não quero ver nenhum any nesse projeto, any não são permitidos nem no código e NEM nos testes.
3. Não quero ver interfaces ou types em locais que não sejam a pasta types, AINDA que um type ou interface seja usado em um único arquivo, ele deve vir da pasta types.

## Release

Uses Release Please. On push to main → merge auto-created PR.

## Fallow local gate

Before any `git commit` or `git push`, run `fallow audit --format json --quiet --explain`. If the verdict is `fail`, fix the reported findings before retrying. Treat JSON runtime errors like `{ "error": true, ... }` as non-blocking.

Audit defaults to `gate=new-only`: only findings introduced by the current changeset affect the verdict. Inherited findings on touched files are reported under `attribution` and annotated with `introduced: false`, but do not block the commit. Set `[audit] gate = "all"` in `fallow.toml` to gate every finding in changed files.

## Agent skills

### Issue tracker

Issues live as local markdown files under `.scratch/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical roles using default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. See `docs/agents/domain.md`.
