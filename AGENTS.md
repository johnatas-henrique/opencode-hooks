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
- [Architecture](docs/agent-instructions/architecture.md)
- [Git Workflow](docs/agent-instructions/git-workflow.md)

## Regras do Projeto

1. Eu não quero ver re-exports no código que criarmos, e qualquer re-export existente deve ser apagado, se você encontrar um re-export, apague-o, vá nos arquivos que os usavam antes e faça o import direto.
2. Não quero ver nenhum any nesse projeto, any não são permitidos nem no código e NEM nos testes.
3. Não quero ver interfaces ou types em locais que não sejam a pasta types, AINDA que um type ou interface seja usado em um único arquivo, ele deve vir da pasta types.

## Release

Uses Release Please. On push to main → merge auto-created PR.
