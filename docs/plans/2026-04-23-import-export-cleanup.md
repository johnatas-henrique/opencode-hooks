# Plano: Eliminação completa de re‑exports

**Data**: 2026-04-23  
**Status**: Aprovado, pronto para execução  
**Modo**: Build (após análise completa em PLAN MODE)

## Objetivo

Remover **todas** as re‑exports desnecessárias e fazer consumidores importarem diretamente dos arquivos de origem, mantendo cobertura de testes e qualidade do código.

## Inventário completo (14 arquivos analisados)

| #   | Arquivo                                                   | Tipo         | Re‑exports encontrados                        |
| --- | --------------------------------------------------------- | ------------ | --------------------------------------------- |
| 1   | `.opencode/plugins/index.ts`                              | Principal    | 17 re‑exports (core, config, features, types) |
| 2   | `.opencode/plugins/features/events/index.ts`              | Feature      | 8 re‑exports                                  |
| 3   | `.opencode/plugins/features/events/events.ts`             | Não‑index    | 1 re‑export (`normalizeInputForHandler`)      |
| 4   | `.opencode/plugins/features/scripts/index.ts`             | Feature      | 2 re‑exports                                  |
| 5   | `.opencode/plugins/features/messages/index.ts`            | Feature      | 6 re‑exports                                  |
| 6   | `.opencode/plugins/features/audit/index.ts`               | Feature      | 5 re‑exports                                  |
| 7   | `.opencode/plugins/features/events/resolution/index.ts`   | Feature      | 3 re‑exports                                  |
| 8   | `.opencode/plugins/features/block-system/index.ts`        | Feature      | 1 re‑export                                   |
| 9   | `.opencode/plugins/features/block-system/block-system.ts` | Não‑index    | 1 re‑export (`createBlockSystem`)             |
| 10  | `.opencode/plugins/features/message-formatter/index.ts`   | Feature      | 6 re‑exports                                  |
| 11  | `.opencode/plugins/config/index.ts`                       | Config       | 1 re‑export (`userConfig`)                    |
| 12  | `.opencode/plugins/types/index.ts`                        | Types        | 9× `export * from`                            |
| 13  | `.opencode/plugins/features/events/resolvers/index.ts`    | Feature      | **Vazio** (já limpo)                          |
| 14  | `test/helpers/index.ts`                                   | Test helpers | 3 re‑exports                                  |

## Estratégia de execução

### Fase 1: Atualizar `.opencode/plugins/index.ts` (entrada principal)

- Substituir cada re‑export por importação direta do arquivo de origem
- Exemplo: `export { handlers } from './features/messages'` → `export { handlers } from './features/messages/default-handlers'`
- **Motivo**: Este é o maior consumidor dos barrels de feature

### Fase 2: Limpar barrels de feature

Para cada barrel em `.opencode/plugins/features/*/index.ts`:

- Se só era usado por `plugins/index.ts` → remover arquivo
- Se tem outros consumidores → atualizar consumidores e remover

### Fase 3: Atualizar consumidores restantes

- `test/unit/normalize-input.test.ts` → importar de `normalize-input.ts`
- `test/smoke-test.ts` → importar de `normalize-input.ts`
- `.opencode/plugins/core/toast-queue.ts` → importar de `features/audit/error-recorder`
- **Usar grep para achar todos**

### Fase 4: Tratar casos especiais

- `export type { ... }` → manter nos arquivos de tipos apropriados
- `export * from` em `types/index.ts` → substituir por imports nomeados diretos

### Fase 5: Limpeza e validação

- Remover barrels vazios
- `npm run lint`
- `npm run test:grepped`
- Verificar métricas de cobertura (manter 96.8% branches)

### Fase 6: Commits

- 1 commit por módulo (ex.: `refactor(events): remove barrel re‑exports`)
- Tabela Markdown com arquivos alterados
- Confirmação explícita antes de cada commit

## Ordem de execução sugerida

1. **normalizeInputForHandler** (mais simples, cadeia clara)
2. **features/events** (maior barrel)
3. **features/scripts, messages, audit** (barrels menores)
4. **Main barrel** (`.opencode/plugins/index.ts`)
5. **types/index.ts** (wildcard exports)
6. **test/helpers/index.ts**

## Validação

Após **cada** alteração:

```bash
npm run lint
npm run test:grepped
# Verificar se as 4 métricas não mudaram
# Se mudar → git diff + git apply --reverse
```

## Métricas de cobertura atuais

- Statements: 99.19%
- Branches: 96.8% (817/844)
- Functions: 98.22%
- Lines: 99.25%

## Notas

- O arquivo `.opencode/plugins/features/events/resolvers/index.ts` já foi limpo (vazio).
- O exemplo citado `normalizeInputForHandler` ainda está presente em `.opencode/plugins/features/events/index.ts:1` e `.opencode/plugins/features/events/events.ts`.
- Necessário verificar consumidores deste re‑export e atualizar para importar diretamente de `.opencode/plugins/features/events/resolvers/normalize-input.ts`.
- `test/helpers/index.ts` tem re‑exports que devem ser tratados na Fase 6.
