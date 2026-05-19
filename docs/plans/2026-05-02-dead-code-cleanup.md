# Plano: Limpeza de Dead Code

Usar `npm run build && npm run test:cov` após cada lote.

---

## Lote 1 — Remover exports + tests (seguro, baixo risco)

| #   | O que remover                                                                                     | Arquivo                                           | Teste                                                                   |
| --- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------------------------- |
| 1   | `blockSecrets`, `blockLargeArgs` + testes                                                         | `config/security-rules.ts`                        | apagar `test/unit/config/security-rules.test.ts`                        |
| 2   | `showToastStaggered`, `createToastQueue`, `getGlobalToastQueue`, `resetGlobalToastQueue` + testes | `core/toast-queue.ts`                             | apagar `test/unit/core/toast-queue.test.ts`                             |
| 3   | `createDebugRecorder`, `setDebugRecorder` + testes                                                | `features/audit/debug-recorder.ts`                | apagar `test/unit/features/audit/debug-recorder.test.ts`                |
| 4   | `createSecurityRecorder`, `setSecurityRecorder` + testes                                          | `features/audit/security-recorder.ts`             | apagar `test/unit/features/audit/security-recorder.test.ts`             |
| 5   | `getAuditLogger`, `resetAuditLogging` + testes                                                    | `features/audit/plugin-integration.ts`            | apagar testes específicos                                               |
| 6   | `getHandler`, `getToolHandler` + testes                                                           | `features/events/events.ts`                       | apagar `test/unit/features/events/events.test.ts`                       |
| 7   | `createFactory` + testes                                                                          | `features/events/context.ts`                      | apagar `test/unit/features/events/context.test.ts`                      |
| 8   | `setValueByPath` + testes                                                                         | `features/message-formatter/get-value-by-path.ts` | apagar `test/unit/features/message-formatter/get-value-by-path.test.ts` |
| 9   | `SENSITIVE_PATTERNS` (export) + testes                                                            | `features/message-formatter/mask-sensitive.ts`    | apagar `test/unit/features/message-formatter/mask-sensitive.test.ts`    |
| 10  | `countToastsInLog` + testes                                                                       | `features/messages/toast-silence-detector.ts`     | apagar `test/unit/features/messages/toast-silence-detector.test.ts`     |
| 11  | `createSubagentTracker` + testes                                                                  | `features/scripts/adapters.ts`                    | apagar `test/unit/features/scripts/adapters.test.ts`                    |
| 12  | `parseHookOutput` + testes                                                                        | `features/scripts/executor.ts`                    | apagar `test/unit/features/scripts/executor.test.ts`                    |
| 13  | `resetSubagentTracking` + testes                                                                  | `features/scripts/run-script-handler.ts`          | apagar `test/unit/features/scripts/run-script-handler.test.ts`          |
| 14  | `createScriptRunner` + arquivo inteiro + testes                                                   | `features/scripts/script-runner.ts`               | apagar `test/unit/features/scripts/script-runner.test.ts`               |
| 15  | `createEventHandler` (sem test)                                                                   | `types/core.ts`                                   | —                                                                       |
| 16  | `setGlobalTruncationKB` + `= 10` fallback + testes                                                | `features/audit/event-recorder.ts`                | apagar `test/unit/features/audit/event-recorder.test.ts`                |

---

## Lote 2 — Refatorar `executeScript` pra usar `parseHookOutput`

- `executor.ts`: substituir lógica inline (linhas 279-344) por chamada a `parseHookOutput(stdout, stderr, code)`
- `parseHookOutput` **não é removido** — passa a ser usado de verdade
- Atualizar testes do executor
- Move `parseHookOutput` de Category B pra Category A de fato

---

## Pós-requisitos

- Rodar `npm run build` — não pode quebrar
- Rodar `npm run test:cov` — cobertura ≥ 90%
- Rodar `npm run lint` — sem erros
- Rodar `fallow audit --format json --quiet --explain` — sem bloqueios
