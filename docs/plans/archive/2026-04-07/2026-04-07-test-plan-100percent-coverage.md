# Plano de Testes: 100% Coverage + Integração + E2E

## Execução

| Step | Description                                                                                   | Status | Timestamp        |
| ---- | --------------------------------------------------------------------------------------------- | ------ | ---------------- |
| 1    | Analisar coverage atual e identificar gaps (linhas 167, 255, 57, 102, 37, 19, 43, 110, 19-47) | ✅     | 2026-04-07 01:30 |
| 2    | Criar estrutura de diretórios para testes (unit, integration, e2e)                            | ✅     | 2026-04-07 01:45 |
| 3    | Adicionar testes unitários para 100% coverage                                                 | ✅     | 2026-04-07 15:10 |
| 4    | Criar testes de integração entre módulos                                                      | ⏳     | -                |
| 5    | Expandir testes E2E para cover todos os workflows                                             | ⏳     | -                |
| 6    | Configurar npm scripts para rodar cada tipo de teste                                          | ✅     | 2026-04-07 01:50 |
| 7    | Adicionar CI/CD para testes automáticos                                                       | ⏳     | -                |

---

## Step 1: Análise de Coverage Atual

**Cobertura atual: 97.65% Statements, 85.92% Branches, 79.28% Functions**

**Linhas não cobertas por arquivo:**

| Arquivo                     | Linhas       | Função/Bloco                                 |
| --------------------------- | ------------ | -------------------------------------------- |
| `opencode-hooks.ts`         | 167, 255     | event handler, hook trigger                  |
| `events.ts`                 | 57, 102      | getWithDefault fallback, tool config resolve |
| `debug.ts`                  | 37           | edge case no debug log                       |
| `save-to-file.ts`           | 19, 43       | edge cases file write                        |
| `toast-queue.ts`            | 110          | edge case queue flush                        |
| `toast-silence-detector.ts` | 19-27, 36-47 | edge cases detector                          |
| `run-script-handler.ts`     | 57           | edge case no script runner                   |
| `plugin-status.ts`          | 37           | edge case status                             |

---

## Step 2: Estrutura de Diretórios

```
test/
├── unit/                    # Testes unitários existentes (não alterar)
│   ├── *.test.ts
│   └── __mocks__/
├── integration/            # NOV: testes de integração
│   ├── event-flow.test.ts       # Fluxo completo de eventos
│   ├── config-resolution.test.ts # Resolução de config
│   ├── script-execution.test.ts # Execução de scripts
│   └── toast-queue-integration.test.ts # Integração toast + queue
└── e2e/                    # Testes E2E existentes + expandidos
    ├── session-lifecycle.sh     # (já existe)
    ├── tool-execution.sh       # NOVO: testes de ferramentas
    └── manual-testing-guide.md # NOVO: guia de testes manuais
```

---

## Step 3: Testes Unitários para 100% Coverage

### 3.1 `events.ts` (linhas 57, 102)

- getWithDefault com valores undefined/null
- resolveToolConfig com toolConfig === false
- resolveToolConfig com toolConfig vazio {}

### 3.2 `debug.ts` (linha 37)

- handleDebugLog com resolved.debug = false

### 3.3 `save-to-file.ts` (linhas 19, 43)

- saveToFile com filename customizado
- saveToFile com showToast undefined

### 3.4 `toast-queue.ts` (linha 110)

- flush quando queue está vazio

### 3.5 `toast-silence-detector.ts` (linhas 19-47)

- waitForToastSilence timeout
- countToastsInLog arquivo não existe
- edge cases de timing

### 3.6 `run-script-handler.ts` (linha 57)

- runScriptAndHandle com runOnlyOnce = true mas não é sessão primária

### 3.7 `plugin-status.ts` (linha 37)

- getLatestLogFile quando diretório não existe

---

## Step 4: Testes de Integração

### 4.1 `event-flow.test.ts`

- Fluxo completo: evento → resolveConfig → executeHook → saveToFile → toast
- Múltiplos eventos em sequência
- Ordenamento de execução

### 4.2 `config-resolution.test.ts`

- Resolução de config com tool específico
- Merging de configs (event base + tool override)
- Fallback chain completa

### 4.3 `script-execution.test.ts`

- Script com argumentos
- Script com saída vazia
- Script com erro

### 4.4 `toast-queue-integration.test.ts`

- Integração showToastStaggered + toast queue
- Ordenamento de toasts
- Flush automático

---

## Step 5: Testes E2E Expandidos

### 5.1 `tool-execution.sh`

- tool.execute.before (read, write, edit)
- tool.execute.after (task, skill, read, write)
- Verificar logs gerados
- Verificar toasts aparecem

### 5.2 `session-events.sh`

- session.created → log criado
- session.compacted → log atualizado
- session.error → erro logado
- session.deleted → cleanup

### 5.3 `manual-testing-guide.md`

- Steps detalhados para cada tipo de tool
- Steps detalhados para cada tipo de evento
- Verificação de toasts
- Verificação de logs

---

## Step 6: NPM Scripts

```json
{
  "test:unit": "jest test/unit --passWithNoTests",
  "test:integration": "jest test/integration --passWithNoTests",
  "test:e2e": "bash test/e2e/session-lifecycle.sh && bash test/e2e/tool-execution.sh",
  "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e"
}
```

---

## Step 7: CI/CD

Adicionar ao `.github/workflows/`:

- `test.yml`: roda unit + integration em PRs
- `e2e.yml`: roda E2E apenas em merge para main
