# Unit Coverage Plan: 70% → 90%

## Regras

- `vi.mock()` **apenas** para `fs` e `shell` (child_process)
- **Nenhum outro mock** permitido
- Preferir funções puras e DI (Dependency Injection)
- Testes que não podem ser puros ou DI → mover pra integração

---

## 1. Refatorações na Source (DI)

| Arquivo                     | Mudança                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `features/events/events.ts` | `getToolHandler(handlers?)` — parâmetro opcional `handlers`    |
| `toast-silence-detector.ts` | `waitForToastSilence` e `countToastsInLog` recebem `readFile?` |

---

## 2. Limpeza: remover `vi.mock` desnecessário

| Arquivo atual                                      | Ação                                                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `config/claude-settings.test.ts`                   | Manter só `mapClaudeHookToOpenCode` (pura). Apagar `loadClaudeSettings` com `vi.mock(fs)` |
| `features/audit/audit-logger.test.ts`              | Já usa DI via `deps`. Só apagar `vi.mock('fs/promises')`                                  |
| `features/events/get-tool-handler.test.ts`         | Apagar `vi.mock(handlers)`. Usar novo parâmetro DI                                        |
| `features/messages/toast-silence-detector.test.ts` | Apagar `vi.mock('fs/promises')`. Usar DI `readFile` + `vi.useFakeTimers()`                |
| `features/scripts/executor.test.ts`                | Apagar `vi.mock('child_process')`. Manter funções puras. `executeScript` → integração     |

---

## 3. Novos Testes Unitários (pure + DI)

| #   | Funções                                                                  | Arquivo de teste                                    | Stmts |
| --- | ------------------------------------------------------------------------ | --------------------------------------------------- | ----- |
| 1   | `sanitizeData()`                                                         | `core/debug.test.ts`                                | ~35   |
| 2   | `shouldLogScripts`, `truncateOutput`, `createScriptRecord`               | `features/audit/script-recorder.test.ts` (expandir) | ~15   |
| 3   | `getHandler`, `getToolHandler` (DI)                                      | `features/events/events.test.ts`                    | ~6    |
| 4   | `isSubagent`, `addSubagentSession`, `resetSubagentTracking`              | `features/scripts/run-script-handler.test.ts`       | ~6    |
| 5   | `getEventRecorder` etc, `resetAuditLogging`                              | `features/audit/plugin-integration.test.ts`         | ~8    |
| 6   | `getSecurityRecorder`, `setSecurityRecorder`                             | `features/audit/security-recorder.test.ts`          | ~6    |
| 7   | `createToastQueue`, `initGlobalToastQueue`, `resetGlobalToastQueue` (DI) | `core/toast-queue.test.ts`                          | ~70   |
| 8   | `ToastDirectorImpl` — `maxSize=0`, `clear`, error ordering (DI)          | `features/core/toast-director.test.ts` (expandir)   | ~3    |
| 9   | `ScriptExecutor.execute()` — caminhos não cobertos (DI)                  | `features/scripts/executor.test.ts` (expandir)      | ~16   |

**Total estimado: ~165 novos stmts → ~82% cobertura**

---

## 4. Reservado para Integração Depois

| Módulo                                | Motivo                     |
| ------------------------------------- | -------------------------- |
| `loadClaudeSettings()`                | Lê `fs` real               |
| `executeScript()` + `spawn`           | Executa shell real         |
| `getPluginStatus`, `getLatestLogFile` | Já em `integration/`       |
| `showActivePluginsToast()`            | Orquestração entre módulos |
| `showStartupToast()`                  | Orquestração entre módulos |
| `opencode-hooks.ts`                   | Ciclo de vida completo     |
| `executeBlocking()`                   | Toast + security recorder  |
| `runScriptAndHandle()`                | Orquestração completa      |
