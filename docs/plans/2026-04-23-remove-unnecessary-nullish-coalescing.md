# Plano de Remoção de `??` Desnecessários

**Objetivo**: Remover operadores `??` desnecessários no código de produção, confiando nos tipos TypeScript e na validação de `settings.ts` como fonte única da verdade.

**Princípio**: Se `settings.ts` garante que uma configuração está presente, o plugin deve quebrar no startup se faltar (fail fast). TypeScript deve impedir compilação, não verificação runtime.

---

## Categorização dos 86 `??` encontrados

| Categoria                            | O que é                                            | Ação                                                          | Qtd |
| ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------- | --- |
| **A. Dependency Injection (testes)** | `deps?.mkdir ?? mkdir`                             | **Manter** — padrão válido para injeção em testes             | 5   |
| **B. Config resolução (resolvers)**  | `handler?.title ?? ''`                             | **Remover** — handlers vêm de `settings.ts` validado          | ~35 |
| **C. Optional chaining fallback**    | `info?.id ?? props?.sessionID`                     | **Analisar** — tipos `undefined` mas semântica exige fallback | ~10 |
| **D. Default parameters**            | `options.duration ?? TOAST_DURATION.EIGHT_SECONDS` | **Analisar** — funções públicas vs internas                   | ~15 |
| **E. SessionID fallback**            | `input.sessionID ?? DEFAULT_SESSION_ID`            | **Remover** — evento SEMPRE tem sessionID                     | 3   |
| **F. Output fallback**               | `result.output ?? ''`                              | **Remover** — tipo garante valor                              | 1   |

---

## Plano Detalhado por Arquivo

### 1. `.opencode/plugins/opencode-hooks.ts` (5 ocorrências)

| Linha         | Código                                  | Categoria | Ação                                                                                  |
| ------------- | --------------------------------------- | --------- | ------------------------------------------------------------------------------------- |
| 212           | `info?.id ?? props?.sessionID`          | C         | Simplificar: `info?.id \|\| props?.sessionID` (ambos opcionais no tipo)               |
| 336           | `input.args['name'] ?? ''`              | D         | Manter — `args` é `Record<string,unknown>` opcional                                   |
| 362, 471, 537 | `input.sessionID ?? DEFAULT_SESSION_ID` | E         | Remover `?? DEFAULT_SESSION_ID` → usar `input.sessionID` diretamente (conferir tipos) |

### 2. `.opencode/plugins/config/security-rules.ts` (2 ocorrências)

| Linha | Código                           | Categoria | Ação                                        |
| ----- | -------------------------------- | --------- | ------------------------------------------- |
| 14    | `cmd?.trim().split(/\s+/) ?? []` | D         | Manter — `cmd` vem de `string \| undefined` |
| 31    | `cmd ?? ''`                      | D         | Manter — `cmd` é parâmetro opcional         |

### 3. `.opencode/plugins/features/audit/audit-logger.ts` (4 ocorrências)

| Linha | Código                                          | Categoria | Ação                                                     |
| ----- | ----------------------------------------------- | --------- | -------------------------------------------------------- |
| 16-18 | `deps?.mkdir ?? mkdir`                          | **A**     | **Manter** — injeção de dependência para testes          |
| 99    | `writeQueue.get(fileType) ?? Promise.resolve()` | F         | Manter — `get()` retorna `undefined` se chave não existe |

### 4. `.opencode/plugins/features/events/resolvers/event-config.resolver.ts` (10 ocorrências)

| Linha             | Código                                              | Categoria | Ação                                                               |
| ----------------- | --------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| 101, 147          | `handler?.title ?? ''`                              | B         | Remover `?? ''` → `handler.title` (handler é obrigatório)          |
| 107, 160, 165     | `input ?? {}`                                       | B         | Manter — `input` pode ser `undefined` no tipo                      |
| 112-113, 168, 172 | `handler?.variant ?? 'info'`                        | B         | Remover `?? 'info'` → definir default no tipo                      |
| 137               | `handler?.defaultScript ?? this.getDefaultScript()` | B         | Simplificar → `handler.defaultScript \|\| this.getDefaultScript()` |

### 5. `.opencode/plugins/features/events/resolvers/tool-config.resolver.ts` (25 ocorrências)

| Linha                                   | Código                                 | Categoria | Ação                                                 |
| --------------------------------------- | -------------------------------------- | --------- | ---------------------------------------------------- |
| 79, 278, 280                            | `handler?.title ?? ''`                 | B         | Remover `?? ''` → `handler.title`                    |
| 84, 155, 163, 225, 289                  | `input ?? {}`                          | B         | Manter — `input` opcional                            |
| 89-90, 143, 145, 215, 228-229, 294, 296 | `handler?.variant/duration ?? default` | B         | Remover `?? default` → definir defaults no tipo      |
| 136                                     | `toolHandler ?? this.getHandler()`     | C         | Simplificar → `toolHandler \|\| this.getHandler()`   |
| 258-259, 262, 267, 273, 299, 305, 311   | `userEventConfig ?? false`             | B         | Remover `?? false` → `userEventConfig` é obrigatório |

### 6. `.opencode/plugins/features/events/resolution/toast.ts` (2 ocorrências)

| Linha | Código                             | Categoria | Ação                                                         |
| ----- | ---------------------------------- | --------- | ------------------------------------------------------------ |
| 32    | `toast.enabled ?? true`            | B         | Remover `?? true` → tipar `enabled: true` no `ToastOverride` |
| 47    | `defaultCfg.toast.enabled ?? true` | B         | Remover `?? true` → garantir tipo                            |

### 7. `.opencode/plugins/features/messages/*` (4 ocorrências)

| Arquivo                   | Linha | Código                                   | Categoria | Ação                    |
| ------------------------- | ----- | ---------------------------------------- | --------- | ----------------------- |
| build-message.ts          | 15    | `toastCfg?.message ?? fallback`          | B         | Remover `?? fallback`   |
| show-active-plugins.ts    | 27    | `options.duration ?? TOAST_DURATION`     | D         | Manter — função pública |
| toast-silence-detector.ts | 10-11 | `options?.pollMs ?? 200`                 | D         | Manter — função pública |
| show-startup-toast.ts     | 12    | `options.getLogFile ?? getLatestLogFile` | D         | Manter — função pública |

### 8. Outros arquivos (15 ocorrências)

| Arquivo               | Linha   | Código                             | Categoria | Ação                                             |
| --------------------- | ------- | ---------------------------------- | --------- | ------------------------------------------------ |
| event-recorder.ts     | 20      | `input.tool ?? 'unknown'`          | B         | Remover `?? 'unknown'` → `input.tool` (já feito) |
| event-recorder.ts     | 329-330 | `data.sessionID ?? ''`             | E         | Remover fallback                                 |
| debug-recorder.ts     | 22      | `input.level ?? 'info'`            | B         | Remover `?? 'info'` → tipar no `AuditConfig`     |
| script-recorder.ts    | 48      | `input.args ?? []`                 | D         | Manter — `args` opcional                         |
| run-script-handler.ts | 76      | `result.output ?? ''`              | F         | Remover `?? ''` (já feito)                       |
| toast-queue.ts        | 60      | `toast.duration ?? TOAST_DURATION` | D         | Manter — função pública                          |
| context.ts            | 28      | `eventHandlers ?? handlers`        | C         | Simplificar → `eventHandlers \|\| handlers`      |

---

## Próximos Passos

1. **Criar tipos corretos**: Garantir que `ToastOverride`, `ResolvedEventConfig` tenham defaults no tipo (não runtime)
2. **Remover `??` das categorias B, E, F**: ~45 ocorrências
3. **Simplificar categorias C**: ~10 ocorrências
4. **Manter A, D**: ~25 ocorrências permanecem
5. **Validar**: `npm run build` deve falhar se `settings.ts` estiver incompleto

**Resultado esperado**: ~40 removidos, ~45 mantidos (necessários). [REDACTED: 1 chars]

---

## Status Atual (Implementação iniciada)

- ✅ `.opencode/plugins/features/scripts/run-script-handler.ts`: removido `?? ''` (linha 76)
- ✅ `.opencode/plugins/features/audit/event-recorder.ts`: removido `?? 'unknown'` (linha 20)
- ⏳ Demais arquivos: pendente

---

## Observações

- A remoção de `??` em `opencode-hooks.ts` (sessionID) requer ajuste nos tipos para garantir que `sessionID` é obrigatório nos eventos onde é usado.
- O build atual pode falhar devido a tipos incompatíveis; necessário ajustar definições de tipos primeiro.
