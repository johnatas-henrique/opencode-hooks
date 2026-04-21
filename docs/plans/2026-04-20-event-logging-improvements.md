# Plano de Correção: Logging de Eventos, Campos de Debug e Estabilidade

**Data**: 2026-04-20

**Problemas Identificados**:

- #4: Logging Incompleto (só tool.execute.before)
- #5: Campos Insuficientes (sem input/output)
- #6: Stack Trace Desnecessário em toast overflow
- #7: Race Condition em archive (múltiplas janelas)
- #8: CONFIG_FILE routing (sistema antigo)
- #9: SCRIPT_ERROR routing (sistema antigo)
- #10: Outros 7 saves de saveToFile (block-handler, debug, etc)
- #11: security.json e debug.json precisam ser criados
- #12: Dois UNKNOWN_EVENT duplicados

**Status**: ✅ APROVADO - Pronto para implementação

---

## Decisões Finais

| Aspecto             | Decisão                                                            |
| ------------------- | ------------------------------------------------------------------ |
| **maxFieldSize**    | 1000 caracteres (configurável via settings)                        |
| **Sanitização**     | `[REDACTED: N chars]` - mostra tamanho, esconde conteúdo           |
| **Eventos logados** | TODOS em modo debug (não só tool.execute.before + session.created) |
| **Arrays**          | Limitados a 50 itens + indicador de "X more items"                 |
| **Modo audit**      | NÃO loga eventos (só scripts e errors)                             |
| **security.json**   | Criar novo arquivo para blocks de segurança                        |
| **debug.json**      | Migrar de debug.log para arquivo audit                             |
| **UNKNOWN_EVENT**   | Consolidar com campo `context`                                     |
| **Log extension**   | .json (não .jsonl) - compatibilidade VSCode                        |

---

## Decisões de Destino (Migração de saveToFile)

| Origem                   | Tipo           | Destino Novo         | Status |
| ------------------------ | -------------- | -------------------- | ------ |
| block-handler.ts         | Security block | plugin-security.json | ⏳     |
| run-script-handler.ts    | SCRIPT_ERROR   | plugin-errors.json   | ⏳     |
| show-startup-toast.ts    | PLUGIN_ERROR   | plugin-errors.json   | ⏳     |
| event-config.resolver.ts | UNKNOWN_EVENT  | plugin-events.json   | ⏳     |
| opencode-hooks.ts:79     | EVENT_DISABLED | plugin-events.json   | ⏳     |
| opencode-hooks.ts:194    | PLUGIN_START   | plugin-events.json   | ⏳     |
| opencode-hooks.ts:221    | UNKNOWN_EVENT  | plugin-events.json   | ⏳     |
| debug.ts                 | DEBUG          | plugin-debug.json    | ⏳     |
| constants.ts (debug.log) | DEBUG LEGACY   | Depreciar            | ⏳     |

---

## Problema 4: Logging Incompleto

### Causa Raiz

Em `opencode-hooks.ts` (linhas 90-104), o sistema de audit logging só captura:

- ✅ `tool.execute.before` (se tiver `toolName`)
- ✅ `session.created`

**Eventos NÃO sendo logados**:

- ❌ `tool.execute.after` (e todas suas variantes: .subagent, .skill, .bash, .write, etc.)
- ❌ `session.idle`, `session.updated`, `session.diff`, `session.status`
- ❌ `session.compacted`, `session.deleted`, `session.error`
- ❌ `message.part.updated`, `message.part.delta`, `message.removed`
- ❌ `file.edited`, `file.watcher.updated`
- ❌ `permission.ask`, `permission.updated`, `permission.replied`
- ❌ `server.connected`, `server.instance.disposed`
- ❌ `lsp.client.diagnostics`, `lsp.updated`
- ❌ `shell.env`, `chat.message`, `chat.params`, `chat.headers`
- ❌ `command.execute.before`, `command.executed`
- ❌ `todo.updated`, `installation.updated`
- ❌ `tui.*` events
- ❌ `experimental.*` events

### Impacto

- Audit trail incompleto
- Dificuldade para debugar fluxos complexos
- Perda de informação sobre lifecycle de sessões e tools

---

## Problema 5: Campos Insuficientes nos Logs

### Causa Raiz

`event-recorder.ts` cria records minimalistas:

```typescript
// Atual (muito limitado)
{
  ts: "2026-04-20T03:05:29.382Z",
  event: "tool.execute.before",
  tool: "read",
  session: "ses_xxx"
}
```

**Campos FALTANDO**:

- ❌ `args` - argumentos da tool (ex: `filePath`, `pattern`)
- ❌ `input` completo - dados brutos do evento
- ❌ `output` - resultado da execução
- ❌ `metadata` - tempo de execução, exit codes
- ❌ `error` detalhado - stack traces completos

### Impacto

- Impossível reconstruir o que aconteceu durante debug
- Logs "cegos" - sabemos QUE algo aconteceu, mas não COMO
- Time de suporte precisa adivinhar o contexto

---

## Problema 6: Stack Trace Desnecessário em Toast Queue Overflow

### Causa Raiz

`toast-queue.ts:logDroppedToast()` cria um `new Error()` para logging:

```typescript
errorRecorder.logError({
  error: new Error(`Toast queue overflow: dropped toast "${toast.title}"`),
});
```

A stack trace gerada (2000+ chars) é inútil para este evento de monitoramento. Cada entrada de overflow ocupa ~3KB no `plugin-errors.jsonl` vs ~80 chars necessários.

### Impacto

- Logs inchados desnecessariamente
- Dificulta análise de logs (gigantesco)
- Consumo desproporcional de storage

---

## Problema 7: Race Condition em archiveLogFiles (Múltiplas Janelas)

### Causa Raiz

`initAuditLogging()` usa promise guard `initPromise` que funciona **dentro de um processo**. Quando múltiplas janelas OpenCode são abertas (processos separados), cada uma tem seu `initPromise` independente.

Cada processo, ao iniciar:

1. Verifica `if (initPromise)` → null (só no seu processo)
2. Cria promise e executa `archiveLogFiles()`
3. Move os arquivos `.jsonl` atuais para `audit-archive/` com timestamp

**Evidência nos logs**:

```
plugin-events-2026-04-20T03-38-17-884Z.jsonl
plugin-events-2026-04-20T03-38-17-914Z.jsonl (30ms depois)
plugin-events-2026-04-20T03-38-17-925Z.jsonl (11ms depois)
```

Múltiplos arquivos com timestamps de milissegundos de diferença = múltiplos processos arquivando concorrentemente.

### Impacto

- Logs divididos em arquivos minúsculos (98B - 1.4K)
- Dificulta análise (precisa juntar vários arquivos)
- Perda de continuidade do audit trail
- Aumento desnecessário de arquivos

---

## Solução Implementada (Problemas 4 e 5)

### Passo 1: Expandir Logging para Todos os Eventos

**Arquivo**: `.opencode/plugins/opencode-hooks.ts`

**Mudança**: Logging genérico que captura TODOS os eventos que passam por `executeHook`.

**Implementação**:

```typescript
if (params.eventRecorder) {
  // Log ALL events passing through executeHook
  await params.eventRecorder.logEvent(eventType, {
    sessionID: sessionId,
    input: input,
    output: output,
    tool: toolName,
  });
}
```

### Passo 2: Criar Novo Método `logEvent` Genérico

**Arquivo**: `.opencode/plugins/features/audit/event-recorder.ts`

**Nova função**:

```typescript
export function createGenericEventRecord(
  eventType: string,
  input: Record<string, unknown>,
  output: Record<string, unknown> | undefined,
  shouldLogResult: boolean,
  maxFieldSize: number = 1000
): AuditRecord | null {
  if (!shouldLogResult) return null;

  const record: AuditRecord = {
    ts: new Date().toISOString(),
    event: eventType,
    session: extractSession(input),
  };

  // Add sanitized input
  if (input && Object.keys(input).length > 0) {
    record.input = sanitizeAndTruncate(input, maxFieldSize);
  }

  // Add sanitized output
  if (output && Object.keys(output).length > 0) {
    record.output = sanitizeAndTruncate(output, maxFieldSize);
  }

  // Add tool name if applicable
  if (input?.tool || toolName) {
    record.tool = String(input?.tool || toolName);
  }

  return record;
}
```

### Passo 3: Função de Sanitização e Truncamento

**Formato de sanitização**: `[REDACTED: N chars]`

**Arquivo**: `.opencode/plugins/features/audit/event-recorder.ts`

```typescript
function sanitizeAndTruncate(
  data: Record<string, unknown>,
  maxSize: number
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Redact sensitive fields (shows size for debug context)
    if (isSensitiveField(key) && typeof value === 'string') {
      result[key] = `[REDACTED: ${value.length} chars]`;
      continue;
    }

    // Truncate large strings
    if (typeof value === 'string' && value.length > maxSize) {
      result[key] = value.substring(0, maxSize) + '... [truncated]';
      continue;
    }

    // Handle nested objects (deep sanitization)
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeAndTruncate(
        value as Record<string, unknown>,
        maxSize
      );
      continue;
    }

    // Handle arrays (limit to 50 items + sanitize)
    if (Array.isArray(value)) {
      const sanitized = value
        .slice(0, 50)
        .map((item) =>
          typeof item === 'object' && item !== null
            ? sanitizeAndTruncate(item as Record<string, unknown>, maxSize)
            : item
        );
      if (value.length > 50) {
        sanitized.push(`... [${value.length - 50} more items]`);
      }
      result[key] = sanitized;
      continue;
    }

    result[key] = value;
  }

  return result;
}

function isSensitiveField(key: string): boolean {
  const sensitive = [
    'password',
    'token',
    'secret',
    'apiKey',
    'authorization',
    'auth',
    'credential',
    'key',
    'privateKey',
    'cookie',
    'content',
    'env',
    'messages',
    'parts',
  ];
  return sensitive.some((s) => key.toLowerCase().includes(s.toLowerCase()));
}
```

### Passo 4: Configuração

**Arquivo**: `.opencode/plugins/config/settings.ts`

Configuração adicionada:

```typescript
audit: {
  enabled: true,
  level: 'debug', // 'debug' logs events, 'audit' skips events
  maxFieldSize: 1000, // caracteres por campo
  maxArrayItems: 50, // itens por array
}
```

---

## Correções Adicionais (Problemas 6 e 7)

### Passo 5: Remover Stack Trace de Toast Queue Overflow (Problema 6)

**Arquivos**: `types/audit.ts`, `.opencode/plugins/features/audit/error-recorder.ts`, `.opencode/plugins/core/toast-queue.ts`

#### 5a. Atualizar tipos

```typescript
// types/audit.ts
interface CodeErrorContext {
  error: Error;
  context?: string;
  skipStack?: boolean; // NEW: opt-out de stack trace
}
```

#### 5b. Modificar `createErrorRecord`

```typescript
// error-recorder.ts
if (errorType === 'code') {
  const codeContext = context as CodeErrorContext;
  const record: ErrorRecord = {
    ...base,
    error: codeContext.error.message,
    context: codeContext.context,
  };
  // Only include stack if not explicitly skipped
  if (!codeContext.skipStack) {
    record.stack = codeContext.error.stack;
  }
  return record;
}
```

#### 5c. Atualizar `logDroppedToast`

```typescript
// toast-queue.ts
const logDroppedToast = (toast: TuiToast) => {
  const errorRecorder = getErrorRecorder();
  if (errorRecorder) {
    errorRecorder.logError({
      error: new Error(
        `Toast queue overflow: dropped toast "${toast.title || DEFAULT_SESSION_ID}"`
      ),
      skipStack: true, // Don't log stack for this expected condition
    });
  }
};
```

**Benefício**: Log de overflow vai de ~3KB para ~80 chars.

---

### Passo 6: Lock de Filesystem para archiveLogFiles (Problema 7)

**Arquivo**: `.opencode/plugins/features/audit/audit-logger.ts`

**Problema**: Múltiplas instâncias do OpenCode (janelas separadas) chamam `archiveLogFiles()` simultaneamente, criando múltiplos arquivos archive.

**Solução**: Lock file no filesystem garantindo que apenas um processo por vez execute o archive.

#### Implementação:

```typescript
import fs from 'fs';
import path from 'path';

const ARCHIVE_LOCK_TIMEOUT_MS = 30000; // 30 seconds max wait

async function archiveLogFilesWithLock(
  sourceDir: string,
  targetDir: string,
  files: { events: string; scripts: string; errors: string }
): Promise<void> {
  const lockFilePath = path.join(sourceDir, '.audit-archive.lock');
  const instanceId =
    Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);

  let lockAcquired = false;
  let lockFileFd: number | null = null;

  try {
    // Try to acquire lock (exclusive create)
    try {
      lockFileFd = fs.openSync(lockFilePath, 'wx');
      fs.writeSync(lockFileFd, instanceId);
      lockAcquired = true;
    } catch (err: any) {
      if (err.code === 'EEXIST') {
        // Lock exists - check if it's stale
        const lockContent = fs.readFileSync(lockFilePath, 'utf-8');
        const lockTime = parseInt(lockContent.split('-')[0], 10);
        const now = Date.now();

        if (now - lockTime > ARCHIVE_LOCK_TIMEOUT_MS) {
          // Stale lock - remove and retry
          fs.unlinkSync(lockFilePath);
          lockFileFd = fs.openSync(lockFilePath, 'wx');
          fs.writeSync(lockFileFd, instanceId);
          lockAcquired = true;
        } else {
          // Another valid process is archiving - skip this run
          return;
        }
      } else {
        throw err;
      }
    }

    // Execute archive
    await archiveLogFiles(sourceDir, targetDir, files);
  } finally {
    // Release lock if we acquired it
    if (lockAcquired && lockFileFd !== null) {
      try {
        fs.closeSync(lockFileFd);
      } catch (e) {
        // Ignore close errors
      }
      try {
        fs.unlinkSync(lockFilePath);
      } catch (e) {
        // Ignore unlink errors (maybe already deleted)
      }
    }
  }
}

// In initAuditLogging, replace:
// await archiveLogFiles(...)
// With:
// await archiveLogFilesWithLock(...)
```

**Comportamento esperado**:

- Primeiro processo adquire lock → executa archive
- Processos concorrentes veem lock → skipam archive (não duplicam)
- Lock expira após 30s se processo morrer abruptamente
- Logs ficam organizados em um único archive por sessão

---

### Passo 7: Rotear CONFIG_FILE para Audit System (Problema 8)

**Arquivo**: `.opencode/plugins/opencode-hooks.ts`

**Problema**: Eventos `CONFIG_FILE` ainda usam `saveToFile()` (sistema monolítico antigo), indo para `session_events.log` em vez de `plugin-events.jsonl`.

**Localização**: Linha 616-626 em `opencode-hooks.ts`:

```typescript
config: async (input: Record<string, unknown>) => {
  const { agent, command, ...rest } = input;

  await saveToFile({
    content: JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'CONFIG_FILE',
      data: rest,
    }),
  });
},
```

**Solução**: Usar `eventRecorder.logEvent()` em vez de `saveToFile()`:

```typescript
config: async (input: Record<string, unknown>) => {
  const { agent, command, ...rest } = input;

  const eventRecorder = getEventRecorder();
  if (eventRecorder) {
    await eventRecorder.logEvent('config.updated', {
      sessionID: rest.sessionID || 'default',
      input: rest,
    });
  }
  // Fallback para saveToFile se audit system não estiver disponível
  await saveToFile({
    content: JSON.stringify({
      timestamp: new Date().toISOString(),
      type: 'CONFIG_FILE',
      data: rest,
    }),
  });
},
```

**Alternativa**: Remover completamente o `saveToFile` após confirmar que o audit system está sempre disponível.

---

## Arquivos Modificados (Completo)

| Arquivo                 | Mudança                                     | Problema |
| ----------------------- | ------------------------------------------- | -------- |
| `opencode-hooks.ts`     | Expandir logging para todos eventos         | #4       |
| `event-recorder.ts`     | Novo `logEvent` + sanitize/truncate         | #4, #5   |
| `settings.ts`           | Config `maxFieldSize` e `maxArrayItems`     | #4, #5   |
| `types/audit.ts`        | Tipos AuditRecord + `skipStack`             | #4, #6   |
| `error-recorder.ts`     | Stack condicional baseada em `skipStack`    | #6       |
| `toast-queue.ts`        | `skipStack: true` nos overflows             | #6       |
| `audit-logger.ts`       | `archiveLogFilesWithLock` (filesystem lock) | #7       |
| `plugin-integration.ts` | Usar função com lock                        | #7       |

---

## Testes Necessários

1. **Cobertura de Eventos**: Verificar se todos os 60+ tipos de eventos geram logs
2. **Truncamento**: Enviar campo de 5000 chars, verificar se vira 1000 + "... [truncated]"
3. **Sanitização**: Verificar se campos sensíveis viram `[REDACTED: N chars]`
4. **Arrays**: Array de 100 itens deve virar 50 + "... [50 more items]"
5. **Performance**: Logar 1000 eventos rapidamente, medir overhead

---

## Exemplo de Log Resultante

```json
{
  "ts": "2026-04-20T15:30:45.123Z",
  "event": "tool.execute.before",
  "session": "ses_abc123",
  "tool": "read",
  "input": {
    "tool": "read",
    "sessionID": "ses_abc123",
    "args": {
      "filePath": "/home/user/project/config.ts",
      "content": "[REDACTED: 245 chars]",
      "someLargeField": "Lorem ipsum dolor sit amet... [truncated]"
    }
  },
  "output": {
    "content": "import { config } from './config';... [truncated]",
    "lines": 42
  }
}
```

---

## Campos Sensíveis Sanitizados

| Campo           | Motivo                                                          |
| --------------- | --------------------------------------------------------------- |
| `password`      | Credencial sensível                                             |
| `token`         | Auth token                                                      |
| `secret`        | API secrets                                                     |
| `apiKey`        | API keys                                                        |
| `authorization` | Headers de auth                                                 |
| `auth`          | Campos de autenticação                                          |
| `credential`    | Credenciais                                                     |
| `key`           | Chaves criptográficas                                           |
| `privateKey`    | Chaves privadas                                                 |
| `cookie`        | Session cookies                                                 |
| `content`       | Conteúdo de mensagens/arquivos (potencialmente grande/sensível) |
| `env`           | Variáveis de ambiente (podem conter secrets)                    |
| `messages`      | Histórico de chat (grande + potencialmente sensível)            |
| `parts`         | Partes de mensagens (conteúdo bruto)                            |

---

## Checklist de Implementação

- [ ] Atualizar tipos em `types/audit.ts`
- [ ] Implementar `logEvent` genérico em `event-recorder.ts`
- [ ] Implementar funções de sanitização e truncamento
- [ ] Modificar `opencode-hooks.ts` para usar novo método
- [ ] Adicionar configurações em `settings.ts`
- [ ] Escrever testes unitários
- [ ] Validar com testes manuais
- [ ] Verificar cobertura não regrediu

---

## Riscos Mitigados

| Risco                       | Mitigação                                                                |
| --------------------------- | ------------------------------------------------------------------------ |
| Logs muito grandes          | Truncamento a 1000 chars + limitação de arrays                           |
| Performance impact          | Sanitização lazy (só processa se necessário)                             |
| Exposure de dados sensíveis | Lista abrangente de campos sensíveis + formato `[REDACTED: N]`           |
| Breaking change no formato  | Novo método `logEvent`, métodos antigos preservados para compatibilidade |

---

## Notas de Implementação

1. **Preservar métodos antigos**: `logToolExecuteBefore`, `logToolExecuteAfter`, `logSessionEvent` devem continuar existindo para backward compatibility
2. **Lazy sanitization**: Só sanitiza campos se eles existirem e forem strings
3. **Deep sanitization**: Sanitização recursiva em objetos aninhados
4. **Array limit**: Arrays além de 50 itens são truncados com indicador de quantos restantes
5. **Config global**: `maxFieldSize` pode ser ajustado via settings.ts para todo o sistema

---

## Validação Pós-Implementação

Após implementar, verificar em `production/session-logs/plugin-events.json`:

- [ ] Eventos como `session.idle`, `tool.execute.after` aparecem
- [ ] Campos `input` e `output` estão presentes
- [ ] Campos sensíveis aparecem como `[REDACTED: N chars]`
- [ ] Campos grandes (>1000 chars) aparecem truncados
- [ ] Arrays grandes (>50 itens) aparecem limitados

---

## Novos Passos de Implementação (Problemas 9-12)

### Passo 8: Criar security.json e debug.json Recorders

**Arquivos novos needed**:

- `features/audit/security-recorder.ts` - para blocks de segurança
- `features/audit/debug-recorder.ts` - para debug info

**Constants para adicionar**:

```typescript
// constants.ts
export const PLUGIN_SECURITY_FILE = 'plugin-security';
export const PLUGIN_DEBUG_FILE = 'plugin-debug';
```

### Passo 9: Atualizar block-handler.ts

Mudar de `saveToFile` para `securityRecorder.logSecurity()`.

### Passo 10: Atualizar run-script-handler.ts

Mudar SCRIPT_ERROR para `errorRecorder.logError()`.

### Passo 11: Atualizar debug.ts

Mudar de `saveToFile` para `debugRecorder.logDebug()`.

### Passo 12: Consolidar UNKNOWN_EVENT

Unificar `UNKNOWN_EVENT` e `UNKNOWN_EVENT_IN_RESOLVE` em um só com campo `context`.

### Passo 13: Atualizar EVENT_DISABLED e PLUGIN_START

Usar `eventRecorder.logEvent()` em vez de `saveToFile()`.

### Passo 14: Depreciar debug.log

Após migração completa, marcar `debug.log` como deprecated no código.

---

## Checklist de Implementação (Completo)

- [ ] Criar security-recorder.ts
- [ ] Criar debug-recorder.ts
- [ ] Atualizar constants.ts
- [ ] Atualizar block-handler.ts
- [ ] Atualizar run-script-handler.ts
- [ ] Atualizar show-startup-toast.ts
- [ ] Atualizar event-config.resolver.ts
- [ ] Consolidar UNKNOWN_EVENT
- [ ] Atualizar opencode-hooks.ts hooks
- [ ] Atualizar debug.ts
- [ ] Testar todos os novos arquivos
- [ ] Validar cobertura
