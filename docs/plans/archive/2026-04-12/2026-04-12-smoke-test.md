# Smoke Test Plan

## Objetivo

Testar manualmente as mudanças no sistema de normalização de eventos sem precisar rodar o OpenCode completo.

## Execução

| Step | Status | Timestamp |
| 1. Criar script de smoke test | ⏳ | - |
| 2. Testar eventos de sessão | ⏳ | - |
| 3. Testar eventos de tools | ⏳ | - |
| 4. Testar eventos com output | ⏳ | - |
| 5. Testar mascaramento de valores sensíveis | ⏳ | - |
| 6. Você testa manualmente | ⏳ | - |

## Script de Smoke Test

O script deve testar:

### 1. Eventos de Sessão

```typescript
// session.created, session.error, session.idle, etc.
const sessionEvent = {
  properties: {
    info: { id: 'test-123', title: 'Test Session' },
    sessionID: 'ses_abc',
  },
};
// Esperado: mostra todas as chaves de properties
```

### 2. Eventos de Tools

```typescript
// tool.execute.before, tool.execute.after
const toolEvent = {
  input: { sessionID: 's1', tool: 'bash', args: { command: 'ls' } },
  output: { result: 'file1\nfile2' },
};
// Esperado: mostra input.* e output.*
```

### 3. Eventos com output

```typescript
// shell.env, permission.ask, etc.
const eventWithOutput = {
  properties: { cwd: '/home/user', sessionID: 's1' },
  output: { env: { PATH: '/usr/bin' } },
};
// Esperado: mostra properties.* e output.*
```

### 4. Mascaramento de Sensíveis

```typescript
// Verificar que valores como api_key, token, password são mascarados
const sensitiveEvent = {
  properties: {
    api_key: 'sk-1234567890abcdef',
    token: 'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    password: 'mySecretPassword123',
  },
};
// Esperado: [REDACTED] no lugar dos valores
```

## Implementação

Criar arquivo `test/smoke-test.ts`:

```typescript
import {
  handlers,
  normalizeInputForHandler,
  buildAllKeysMessage,
  buildAllKeysMessageSimple,
} from '../.opencode/plugins/helpers/default-handlers';
import { formatValue } from '../.opencode/plugins/helpers/default-handlers';

console.log('=== SMOKE TEST ===\n');

// Teste 1: formatValue com mascaramento
console.log('1. MASCARAMENTO DE VALORES SENSÍVEIS');
const sensitive =
  'api_key: "sk-1234567890abcdef", token: "ghp_abcdefghij1234567890"';
console.log(`   Input: ${sensitive}`);
console.log(`   Output: ${formatValue(sensitive)}`);
console.log('');

// Teste 2: normalizeInputForHandler para tools
console.log('2. TOOL EVENTS (normalizeInputForHandler)');
const toolInput = { sessionID: 's1', tool: 'bash', args: { command: 'ls' } };
const normalizedTool = normalizeInputForHandler(
  'tool.execute.after',
  toolInput
);
console.log('   Input:', JSON.stringify(toolInput));
console.log('   Normalized:', JSON.stringify(normalizedTool));
console.log('');

// Teste 3: normalizeInputForHandler para sessions
console.log('3. SESSION EVENTS');
const sessionInput = { sessionID: 's1', info: { id: 'test', title: 'Test' } };
const normalizedSession = normalizeInputForHandler(
  'session.created',
  sessionInput
);
console.log('   Input:', JSON.stringify(sessionInput));
console.log('   Normalized:', JSON.stringify(normalizedSession));
console.log('');

// Teste 4: buildAllKeysMessage para tools
console.log('4. BUILD MESSAGE (TOOL)');
const toolEvent = {
  input: { sessionID: 's1', tool: 'bash', args: { command: 'npm run build' } },
  output: { result: 'Build succeeded' },
};
const toolMsg = buildAllKeysMessage(toolEvent);
console.log(toolMsg);
console.log('');

// Teste 5: buildAllKeysMessageSimple para sessions
console.log('5. BUILD MESSAGE (SESSION)');
const sessionEvent = {
  properties: { info: { id: 'test', title: 'My Session' }, sessionID: 's1' },
};
const sessionMsg = buildAllKeysMessageSimple(sessionEvent);
console.log(sessionMsg);
console.log('');

// Teste 6: buildAllKeysMessage para shell.env
console.log('6. BUILD MESSAGE (SHELL.ENV)');
const shellEvent = {
  properties: { cwd: '/home/user', sessionID: 's1' },
  output: { env: { PATH: '/usr/bin', HOME: '/home/user' } },
};
const shellMsg = buildAllKeysMessage(shellEvent);
console.log(shellMsg);
console.log('');

// Teste 7: Handler para tool específico
console.log('7. HANDLER ESPECÍFICO (tool.execute.before.bash)');
const bashHandler = handlers['tool.execute.before.bash'];
const bashEvent = {
  input: { sessionID: 's1', tool: 'bash', args: { command: 'ls -la' } },
};
const bashMsg = bashHandler.buildMessage(bashEvent);
console.log(bashMsg);
console.log('');

console.log('=== FIM DO SMOKE TEST ===');
```

## Como Rodar

```bash
npx ts-node test/smoke-test.ts
```

## Critérios de Sucesso

1. ✅ Mascaramento funciona: `api_key: [REDACTED]`
2. ✅ Tool events mostram `input.*` e `output.*`
3. ✅ Session events mostram todas as chaves de `properties`
4. ✅ Shell events mostram `properties.*` e `output.*`
5. ✅ Handlers específicos de tools funcionam
6. ✅ Sem erros de TypeScript
