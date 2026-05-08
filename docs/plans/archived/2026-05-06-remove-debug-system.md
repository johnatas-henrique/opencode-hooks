# Plano: Remoção do Sistema de Debug

## Objetivo

Remover completamente o sistema de debug do plugin, incluindo:

1. Flag `debug: false` em `config/settings.ts`
2. Módulo `core/debug.ts` inteiro
3. Todas as funções e chamadas relacionadas a debug

## Detalhamento de Remoção

### 1. `config/settings.ts`

| Linha | Item            | Ação    |
| ----- | --------------- | ------- |
| 29    | `debug: false,` | REMOVER |

### 2. `opencode-hooks.ts`

| Linha   | Item                                                                  | Ação    |
| ------- | --------------------------------------------------------------------- | ------- |
| 26      | `import { handleDebugLog } from '.opencode/plugins/core/debug';`      | REMOVER |
| 50      | `const DEBUG_FILE = '/tmp/claude-hooks-debug.json';`                  | REMOVER |
| 52-58   | `function writeDebug(info: Record<string, unknown>) { ... }`          | REMOVER |
| 60-67   | `function getDebugLogPath(): string { ... }`                          | REMOVER |
| 69-76   | `function debugLog(...args: unknown[]): void { ... }`                 | REMOVER |
| 123-129 | `if (resolved.debug) { await handleDebugLog(timestamp, ...) }`        | REMOVER |
| 179-197 | `writeDebug({ opencode_hooks_180: { eventId, line, resolved... } })`  | REMOVER |
| 199-209 | `writeDebug({ opencode_hooks_210: { eventId, line, results... } })`   | REMOVER |
| 242-254 | `writeDebug({ opencode_hooks_288: { eventId, line, showError... } })` | REMOVER |
| 396-401 | `debugLog('Event handler: event.type =', event.type, ...)`            | REMOVER |

### 3. `core/debug.ts`

| Ação                                                                                                    |
| ------------------------------------------------------------------------------------------------------- |
| DELETAR arquivo inteiro (`sanitizeData`, `handleDebugLog`, `writeDebug`, `debugLog`, `getDebugLogPath`) |

### 4. Testes

| Arquivo                            | Item                                                                            | Ação                   |
| ---------------------------------- | ------------------------------------------------------------------------------- | ---------------------- |
| `test/unit/core/debug.test.ts`     | Arquivo inteiro (testes de `sanitizeData`, `handleDebugLog`)                    | DELETAR                |
| `test/unit/opencode-hooks.test.ts` | ~L352: `it('calls handleDebugLog when resolved config has debug enabled', ...)` | REMOVER bloco de teste |

---

## Resumo

- 1 linha removida de `settings.ts`
- 10 blocos removidos de `opencode-hooks.ts`
- 1 arquivo deletado: `core/debug.ts`
- 1 arquivo deletado: `test/unit/core/debug.test.ts`
- 1 teste removido de `opencode-hooks.test.ts`

## Contexto

O sistema de debug atual:

- `DEBUG_FILE` (`/tmp/claude-hooks-debug.json`) — registros temporários de depuração
- `writeDebug()` — escreve JSON no arquivo de debug
- `getDebugLogPath()` — retorna caminho `audit-debug.log`
- `debugLog()` — log simples via console/file
- `handleDebugLog()` (em `core/debug.ts`) — toast + `debugRecorder`, guardado por `resolved.debug`
- `sanitizeData()` (em `core/debug.ts`) — remove campos sensíveis de logs

O flag `debug` em `default` controla `handleDebugLog`. Com `debug: false`, o módulo `core/debug.ts` fica morto.

### Diferenças Importantes

| debug flag                | audit.level                 |
| ------------------------- | --------------------------- |
| Controla `handleDebugLog` | Controla se eventos         |
| (toast + debugRecorder)   | são escritos nos audit logs |
| `debug: false` → morto    | `level: 'debug'` → todos    |
|                           | eventos são registrados     |

Audit logging continua funcionando independentemente (controlado por `audit.level`).

## Riscos

- Nenhum risco direto — sistema atual está desabilitado por padrão (`debug: false`)
- Audit logging não é afetado

## Resultado Esperado

- Código mais limpo sem dead code
- Menos complexidade
- Mesmo comportamento de audit

## Status

COMPLETED — all changes implemented and validated.
