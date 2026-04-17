# Architecture

## Project Structure

Per [ADR-001](../adr/001-folder-structure-refactor.md):

```
.opencode/plugins/
├── opencode-hooks.ts     # Entry point (MUST NOT rename)
├── config/               # USER-FACING (easy to find)
│   ├── settings.ts       # Main user configuration
│   └── security-rules.ts # Security predicates
├── features/             # INTERNAL (domain-driven)
│   ├── audit/
│   ├── block-system/
│   ├── events/
│   └── messages/
└── types/                # INTERNAL (shared type definitions)
```

## Important Files

| File                       | Purpose                                    |
| -------------------------- | ------------------------------------------ |
| `config/settings.ts`       | **ONLY FILE TO EDIT** - user configuration |
| `config/security-rules.ts` | Security predicates                        |
| `opencode-hooks.ts`        | Plugin entry point                         |

## Key Principles

1. **User config** lives in `config/` at plugin root
2. **Types/interfaces** live in `types/` at plugin root
3. **Feature implementations** live in `features/[feature-name]/`
4. **Each feature** is self-contained with its own `index.ts`
