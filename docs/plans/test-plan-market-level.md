# Plano de Testes: Nível de Mercado

## Execução

| Step | Description                                                          | Status |
| ---- | -------------------------------------------------------------------- | ------ |
| 1    | Adicionar edge case tests para 100% coverage (functions: 79% → 100%) | ⏳     |
| 2    | Configurar property-based testing com fast-check                     | ⏳     |
| 3    | Configurar mutation testing                                          | ⏳     |
| 4    | Adicionar benchmark tests para funções críticas                      | ⏳     |
| 5    | Configurar coverage em PR automático (GitHub Actions)                | ⏳     |
| 6    | Adicionar coverage trend tracking                                    | ⏳     |
| 7    | Categorizar testes (slow/fast)                                       | ⏳     |
| 8    | Adicionar security scanning (npm audit, Snyk)                        | ⏳     |

---

## Step 1: Edge Case Tests (100% Coverage)

### 1.1 Análise de gaps

**Functions: 79.28% → 100%**

| Arquivo                     | Linha        | Função/Motivo                             |
| --------------------------- | ------------ | ----------------------------------------- |
| `debug.ts`                  | 37           | handleDebugLog com resolved.debug=false   |
| `events.ts`                 | 57           | getWithDefault fallback edge case         |
| `events.ts`                 | 102          | resolveToolConfig toolConfig=false        |
| `save-to-file.ts`           | 19,43        | showToast undefined, filename customizado |
| `toast-queue.ts`            | 110          | flush com queue vazio                     |
| `toast-silence-detector.ts` | 19-27, 36-47 | timeout, arquivo não existe               |
| `run-script-handler.ts`     | 57           | runOnlyOnce + não é sessão primária       |
| `plugin-status.ts`          | 37           | diretório não existe                      |

### 1.2 Testes a adicionar (8 testes)

```typescript
// debug.test.ts - 1 teste
it('should return early when debug is false', () => { ... })

// events.test.ts - 2 testes
it('getWithDefault should handle undefined/null values', () => { ... })
it('resolveToolConfig should handle toolConfig=false', () => { ... })

// save-to-file.test.ts - 2 testes
it('should handle showToast undefined', () => { ... })
it('should handle custom filename', () => { ... })

// toast-queue.test.ts - 1 teste
it('should handle flush when queue is empty', () => { ... })

// toast-silence-detector.test.ts - 3 testes
it('should handle timeout', () => { ... })
it('should return 0 when file does not exist', () => { ... })
it('should handle edge case timing', () => { ... })

// run-script-handler.test.ts - 1 teste
it('should skip runOnlyOnce when not primary session', () => { ... })

// plugin-status.test.ts - 1 teste
it('should return null when directory does not exist', () => { ... })
```

---

## Step 2: Property-Based Testing (fast-check)

### 2.1 Instalação

```bash
npm install --save-dev fast-check
```

### 2.2 Propriedades a testar

| Módulo            | Propriedade                            |
| ----------------- | -------------------------------------- |
| `events.ts`       | resolveEventConfig idempotente         |
| `events.ts`       | resolveToolConfig produz objeto válido |
| `session.ts`      | isPrimarySession consistente           |
| `save-to-file.ts` | output contém timestamp                |

### 2.3 Testes (4 arquivos novos)

```
test/
├── property/
│   ├── events.property.ts
│   ├── session.property.ts
│   └── save-to-file.property.ts
```

---

## Step 3: Mutation Testing

### 3.1 Instalação

```bash
npm install --save-dev @stryker-mutator/jest-runner-stryker
# ou
npm install --save-dev mutmut
```

### 3.2 Configuração

```javascript
// jest.config.js - adicionar
{
  runner: 'stryker';
}
```

### 3.3 Threshold

- Aceitar: >60% mutations killed
- Meta: >80% mutations killed

---

## Step 4: Benchmark Tests

### 4.1 Instalação

```bash
npm install --save-dev benchmark
```

### 4.2 Funções críticas para benchmark

| Função             | Meta de performance     |
| ------------------ | ----------------------- |
| resolveEventConfig | < 1ms para 100 chamadas |
| resolveToolConfig  | < 1ms para 100 chamadas |
| saveToFile         | < 5ms por chamada       |
| handleDebugLog     | < 2ms (sem I/O)         |

### 4.3 Arquivo

```
test/benchmark/
├── config-resolution.bench.ts
├── file-operations.bench.ts
```

---

## Step 5: Coverage em PR (GitHub Actions)

### 5.1 Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:cov
      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/coverage-final.json
          fail_ci_if_error: true
          threshold: 95%
```

### 5.2 Threshold

- Statements: 95%
- Branches: 85%
- Functions: 95%
- Lines: 95%

---

## Step 6: Coverage Trend Tracking

### 6.1 Configurar Codecov

```yaml
# Adicionar ao workflow
- uses: codecov/codecov-action@v4
  with:
    files: ./coverage/coverage-final.json
    flags: unittests
    comment: true
```

### 6.2 Badge no README

```markdown
[![Coverage](https://codecov.io/gh/johnatas-henrique/opencode-hooks/branch/main/graph/badge.svg)](https://codecov.io/gh/johnatas-henrique/opencode-hooks)
```

---

## Step 7: Test Categorization

### 7.1 Slow tests

```typescript
// Marcar testes lentos
describe('slow: E2E Flow', () => {
  it.todo('full session lifecycle'); // > 5s
});
```

### 7.2 NPM scripts

```json
{
  "test:fast": "jest --testPathIgnorePatterns=slow",
  "test:slow": "jest --testPathPattern=slow"
}
```

---

## Step 8: Security Scanning

### 8.1 npm audit

```yaml
# Adicionar ao workflow
- run: npm audit --audit-level=high
```

### 8.2 Snyk (opcional)

```yaml
- uses: snyk/actions/node@master
```

---

## Arquivos a criar/modificar

| Arquivo                                    | Ação      |
| ------------------------------------------ | --------- |
| `test/unit/debug.test.ts`                  | Modificar |
| `test/unit/events.test.ts`                 | Modificar |
| `test/unit/save-to-file.test.ts`           | Modificar |
| `test/unit/toast-queue.test.ts`            | Modificar |
| `test/unit/toast-silence-detector.test.ts` | Modificar |
| `test/unit/run-script-handler.test.ts`     | Modificar |
| `test/unit/plugin-status.test.ts`          | Modificar |
| `test/property/events.property.ts`         | Novo      |
| `test/property/session.property.ts`        | Novo      |
| `test/property/save-to-file.property.ts`   | Novo      |
| `test/benchmark/config.bench.ts`           | Novo      |
| `.github/workflows/test.yml`               | Novo      |
| `package.json`                             | Modificar |
| `README.md`                                | Modificar |

---

## Priorização

| Fase | Itens                                    | Esforço |
| ---- | ---------------------------------------- | ------- |
| 1    | Step 1: Edge case tests (8 testes)       | 1 dia   |
| 2    | Step 5: Coverage em PR                   | 1 dia   |
| 3    | Step 6: Trend tracking                   | 1 dia   |
| 4    | Step 2: Property-based testing           | 2 dias  |
| 5    | Step 3: Mutation testing                 | 1 dia   |
| 6    | Step 4: Benchmark tests                  | 1 dia   |
| 7    | Step 7: Categorização + Step 8: Security | 1 dia   |

**Total estimado: 8 dias de implementação**
