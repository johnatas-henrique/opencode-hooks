# Unify Event Types & Harden Typing

**Date:** 2026-05-03
**Status:** Executed

> All steps completed. See summary below.

## Objetivo

1. Eliminar duplicação de tipos (`OpenCodeEvents` vs `EventType` enum)
2. Eliminar tipos inline em `opencode-hooks.ts` (usar tipos exportados de `core.ts`)
3. Remover `Record<string, unknown>` onde tipos concretos existem
4. Corrigir o bug raiz de `input.args` vs `output.args` em `buildClaudeStdin`
5. Remover re-exports proibidos

---

## Responsabilidade dos Arquivos (Princípio)

| Arquivo             | Responsabilidade                                                                  |
| ------------------- | --------------------------------------------------------------------------------- |
| `core.ts`           | **O QUÊ** — nomes de eventos, tipos de hook IO, props do SDK, outputs, normalized |
| `events.ts`         | **COMO** — resolvers de config, contextos, resultados de resolução                |
| `opencode-hooks.ts` | **EXECUÇÃO** — zero tipos inline, tudo importado                                  |

---

## Passo 1: `core.ts` — Adicionar `ToolArgs` e consolidar IO types

**Arquivo:** `.opencode/plugins/types/core.ts`

### 1.1 Criar interface `ToolArgs` (após `OpenCodeEvents`)

```ts
export interface ToolArgs {
  command?: string;
  filePath?: string;
  path?: string;
  pattern?: string;
  url?: string;
  query?: string;
  name?: string;
  message?: string;
  source?: string;
  destination?: string;
  [key: string]: unknown;
}
```

### 1.2 Atualizar tipos de tool para usar `ToolArgs`

```diff
- args: Record<string, unknown>;
+ args: ToolArgs;
```

Em: `ToolExecuteAfterInput`, `ToolExecuteBeforeOutput`, `ToolExecuteAfterProps`, `ToolExecuteBeforeProps`

### 1.3 Manter tudo que já existe

- `OpenCodeEvents` const ✅
- `OpenCodeEventMap`, `OpenCodeEventType` ✅
- `*Props` (ChatMessageProps, etc.) ✅
- `*Output` (ChatMessageOutput, etc.) ✅
- `*Normalized` ✅

---

## Passo 2: `events.ts` — Remover `EventType` enum e re-exports

**Arquivo:** `.opencode/plugins/types/events.ts`

### 2.1 Remover enum `EventType` (linhas 22-78)

Fundir os eventos ÚNICOS do `EventType` em `OpenCodeEvents`.

**Nota:** Criar tipos `*Props`/`*Output` em `core.ts` para eventos que só existem no `EventType` mas não têm tipos correspondentes:

- `command.execute.before` → já tem `CommandExecuteBeforeProps` ✅
- `chat.message`, `chat.params`, `chat.headers` → já têm tipos ✅
- `experimental.*` → já têm tipos ✅
- `tool.definition` → já tem `ToolDefinitionProps` ✅
- `message.part.delta` → **CRIAR** `MessagePartDeltaProps` em `core.ts` baseado em `EventMessagePartDelta` do SDK (sessionID, messageID, partID, field, delta)

| Evento só em `EventType`                      | Ação                                                   |
| --------------------------------------------- | ------------------------------------------------------ |
| `message.part.delta`                          | Adicionar a `OpenCodeEvents`                           |
| `permission.asked`                            | Já existe em `OpenCodeEvents` ✅                       |
| `permission.ask`                              | **MIGRAR** → `permission.asked` (evento custom errado) |
| `permission.replied`                          | Já existe em `OpenCodeEvents` ✅                       |
| `chat.message`, `chat.params`, `chat.headers` | Adicionar a `OpenCodeEvents`                           |
| `experimental.chat.messages.transform`        | Adicionar a `OpenCodeEvents`                           |
| `experimental.chat.system.transform`          | Adicionar a `OpenCodeEvents`                           |
| `experimental.text.complete`                  | Adicionar a `OpenCodeEvents`                           |
| `experimental.session.compacting`             | Já existe em `OpenCodeEvents` ✅                       |
| `tool.definition`                             | Adicionar a `OpenCodeEvents`                           |
| `session.unknown`                             | Adicionar a `OpenCodeEvents`                           |
| `command.execute.before`                      | Adicionar a `OpenCodeEvents`                           |

### 2.2 Criar `MessagePartDeltaProps` em `core.ts`

Baseado em `EventMessagePartDelta` do SDK:

```ts
export interface MessagePartDeltaProps {
  sessionID: string;
  messageID: string;
  partID: string;
  field: string;
  delta: string;
}
```

### 2.3 Remover re-exports (linha 80)

```diff
- export type { EventOverride, ScriptToastsConfig, EventConfig, ToolConfig };
```

### 2.3 Manter o que é de responsabilidade "COMO"

- `EventHandler` ✅
- `ConfigResolverContext`, `ResolverFactory` ✅
- `EventConfigResolver`, `ToolConfigResolver` ✅
- `BooleanFieldOptions`, `ResolvedToast`, `ResolvedScripts`, `ResolvedSaveToFile` ✅

---

## Passo 3: `persistence.ts` — Remover re-export

**Arquivo:** `.opencode/plugins/types/persistence.ts`

```diff
- export type { ToastCallback };
```

---

## Passo 4: Atualizar `config.ts` — Trocar `EventType` por `OpenCodeEventType`

**Arquivo:** `.opencode/plugins/types/config.ts`

### 4.1 Trocar import

```diff
- import { EventType } from '.opencode/plugins/types/events';
+ import { OpenCodeEvents } from '.opencode/plugins/types/core';
+ import type { OpenCodeEventType } from '.opencode/plugins/types/core';
```

### 4.2 Atualizar referências

```diff
- events: Partial<Record<EventType, EventConfig>>;
+ events: Partial<Record<OpenCodeEventType, EventConfig>>;

- tools: {
-   [EventType.TOOL_EXECUTE_AFTER]: Record<string, ToolConfig>;
-   [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: Record<string, ToolConfig>;
-   [EventType.TOOL_EXECUTE_BEFORE]: Record<string, ToolOverride>;
- };
+ tools: {
+   [OpenCodeEvents.TOOL_EXECUTE_AFTER]: Record<string, ToolConfig>;
+   [OpenCodeEvents.TOOL_EXECUTE_AFTER_SUBAGENT]: Record<string, ToolConfig>;
+   [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: Record<string, ToolOverride>;
+ };
```

---

## Passo 5: Atualizar resolvers — Usar `EventInput` ao invés de `Record<string, unknown>`

### 5.1 Reaproveitar `EventInputRecord` como `EventInput`

`core.ts` já tem `EventInputRecord` (linha 298). Renomear para `EventInput` e adicionar campos extras:

```ts
export interface EventInput {
  sessionID?: string;
  tool?: string;
  callID?: string;
  args?: Record<string, unknown>;
  [key: string]: unknown;
}
```

(Antigo `EventInputRecord` será deletado no Passo 9).

### 5.2 `events.ts` (resolveEventConfig, resolveToolConfig)

```diff
- input?: Record<string, unknown>,
- output?: Record<string, unknown>
+ input?: EventInput,
+ output?: Record<string, unknown>
```

### 5.3 `event-config.resolver.ts`

```diff
- input?: Record<string, unknown>,
- output?: Record<string, unknown>
+ input?: EventInput,
+ output?: Record<string, unknown>
```

### 5.4 `tool-config.resolver.ts`

```diff
- input?: Record<string, unknown>,
- output?: Record<string, unknown>
+ input?: EventInput,
+ output?: Record<string, unknown>
```

### 5.5 `normalize-input.ts`

```diff
- input: Record<string, unknown>,
- output?: Record<string, unknown>
- ): Record<string, unknown>
+ input: EventInput,
+ output?: Record<string, unknown>
+ ): EventInput
```

### 5.6 `build-message.ts`

```diff
- input: Record<string, unknown>,
- output?: Record<string, unknown>
+ input: EventInput,
+ output?: Record<string, unknown>
```

### 5.7 `build-toast-message.ts`

```diff
- input: Record<string, unknown>,
- output?: Record<string, unknown>
+ input: EventInput,
+ output?: Record<string, unknown>
```

### 5.8 `event-config-builder.ts`

```diff
- private input?: Record<string, unknown>,
- private output?: Record<string, unknown>
+ private input?: EventInput,
+ private output?: Record<string, unknown>
```

### 5.9 `audit.ts` — Atualizar tipos de auditoria

Todas as ocorrências de `Record<string, unknown>` em `audit.ts`:

```diff
- input?: Record<string, unknown>;
+ input?: EventInput;

- output?: Record<string, unknown>;
+ output?: EventInput;

- data: Record<string, unknown>
+ data: EventInput;
```

### 5.10 `scripts.ts` — Atualizar tipos de scripts

```diff
- updatedInput?: Record<string, unknown>;
+ updatedInput?: EventInput;
```

---

## Passo 6: `executor.ts` — Corrigir `buildClaudeStdin` bug raiz

**Arquivo:** `.opencode/plugins/features/scripts/executor.ts`

### 6.1 Adicionar `output` parameter a `buildClaudeStdin`

```diff
- export function buildClaudeStdin(
-   eventType: string,
-   toolName: string,
-   input: Record<string, unknown>
- ): Record<string, unknown> {
+ export function buildClaudeStdin(
+   eventType: string,
+   toolName: string,
+   input: Record<string, unknown>,
+   output?: Record<string, unknown>
+ ): Record<string, unknown> {
```

### 6.2 Fix `tool_input` per event type

`tool.execute.before`: `output` may contain modified args (hooks can change input)
`tool.execute.after`: `output` = tool result, NOT args

Em `buildClaudeStdin`:

```diff
- base.tool_input = input.args || {};
+ if (output?.args) {
+   base.tool_input = output.args;
+ } else {
+   base.tool_input = input.args || {};
+ }
```

O mesmo para `buildOpencodeStdin`.

Correção em `executeScript`: passar `output` para `buildClaudeStdin`:

```diff
  if (scriptEntry.source === 'claude') {
-   const stdinData = buildClaudeStdin(eventType, toolName, input);
+   const stdinData = buildClaudeStdin(eventType, toolName, input, output);
  }
```

### 6.3 Tipar `input` e `output` em `executeScript`

```diff
  input: Record<string, unknown>,
- output?: Record<string, unknown>
+ output?: { args: ToolArgs }
```

---

## Passo 7: `opencode-hooks.ts` — Eliminar TODOS os tipos inline

**Arquivo:** `.opencode/plugins/opencode-hooks.ts`

### 7.1 Adicionar imports de `core.ts`

```ts
import type {
  ChatMessageProps,
  ChatParamsProps,
  ChatHeadersProps,
  ShellEnvProps,
  PermissionAskProps,
  CommandExecuteBeforeProps,
  ChatMessageOutput,
  ChatParamsOutput,
  ChatHeadersOutput,
  ShellEnvOutput,
  CommandOutput,
  ExperimentalChatSystemTransformProps,
  ExperimentalSessionCompactingProps,
  ExperimentalTextCompleteProps,
  ToolDefinitionProps,
  ExperimentalSystemTransformOutput,
  ExperimentalCompactingOutput,
  ExperimentalTextCompleteOutput,
  ToolDefinitionOutput,
  ExperimentalMessagesTransformOutput,
  ExperimentalChatMessagesTransformProps,
} from '.opencode/plugins/types/core';
```

### 7.2 Substituir cada hook inline pelo tipo importado

| Linha   | Hook                          | Inline atual → Tipo importado                           |
| ------- | ----------------------------- | ------------------------------------------------------- |
| 464-465 | `shell.env`                   | `input: { cwd, sessionID?, callID? }` → `ShellEnvProps` |
| 465     | `shell.env`                   | `output: { env }` → `ShellEnvOutput`                    |
| 484-491 | `chat.message`                | `input` → `ChatMessageProps`                            |
| 491     | `chat.message`                | `output` → `ChatMessageOutput`                          |
| 509-521 | `chat.params`                 | `input` → `ChatParamsProps` (sem `?`)                   |
| 516-521 | `chat.params`                 | `output` → `ChatParamsOutput`                           |
| 539-546 | `chat.headers`                | `input` → `ChatHeadersProps`                            |
| 546-547 | `chat.headers`                | `output` → `ChatHeadersOutput`                          |
| 564-575 | `permission.asked`            | `input` → `PermissionAskProps`                          |
| 592-593 | `command.execute.before`      | `input` → `CommandExecuteBeforeProps`                   |
| 633     | `exp.chat.messages.transform` | `input` → `ExperimentalChatMessagesTransformProps`      |
| 634     | `exp.chat.messages.transform` | `output` → `ExperimentalMessagesTransformOutput`        |
| 633-634 | `exp.chat.system.transform`   | `input` → `ExperimentalChatSystemTransformProps`        |
| 634-635 | `exp.chat.system.transform`   | `output` → `ExperimentalSystemTransformOutput`          |
| 655-656 | `exp.session.compacting`      | `input` → `ExperimentalSessionCompactingProps`          |
| 656-657 | `exp.session.compacting`      | `output` → `ExperimentalCompactingOutput`               |
| 677-678 | `exp.text.complete`           | `input` → `ExperimentalTextCompleteProps`               |
| 678-679 | `exp.text.complete`           | `output` → `ExperimentalTextCompleteOutput`             |
| 699-700 | `tool.definition`             | `input` → `ToolDefinitionProps`                         |
| 700-701 | `tool.definition`             | `output` → `ToolDefinitionOutput`                       |

### 7.3 Remover `as Record<string, unknown>` casts

```diff
- const eventInput = { ...event, ...event.properties } as Record<string, unknown>;
+ const eventInput = { ...event, ...event.properties };

- input: { ...input, subagentType } as unknown as Record<string, unknown>,
+ input: { ...input, subagentType },
```

---

## Passo 8: Remover `EventType` de `events.ts` — atualizar todos os imports

Buscar e trocar em todos os arquivos que importam `EventType` de `events.ts`:

```diff
- import { EventType } from '.opencode/plugins/types/events';
+ import { OpenCodeEvents } from '.opencode/plugins/types/core';
```

E trocar `EventType.FOO` → `OpenCodeEvents.FOO` em TODO o codebase.

---

## Arquivos afetados (resumo)

| Arquivo                                              | Mudança                                                                                                                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `types/core.ts`                                      | Adicionar `ToolArgs`, renomear `EventInputRecord` → `EventInput`, adicionar eventos faltantes (`command.execute.before`, `message.part.delta`, etc.), alinhar `*Props` com SDK |
| `types/events.ts`                                    | Remover enum `EventType`, remover re-exports                                                                                                                                   |
| `types/persistence.ts`                               | Remover re-export `ToastCallback` (ZERO consumidores — arquivo todo pode ser deletado)                                                                                         |
| `types/config.ts`                                    | Trocar `EventType` → `OpenCodeEvents`                                                                                                                                          |
| `types/executor.ts`                                  | Atualizar imports                                                                                                                                                              |
| `types/audit.ts`                                     | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `types/scripts.ts`                                   | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/events.ts`                          | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/resolvers/event-config.resolver.ts` | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/resolvers/tool-config.resolver.ts`  | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/resolvers/normalize-input.ts`       | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/resolvers/build-message.ts`         | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/resolvers/build-toast-message.ts`   | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/events/resolvers/event-config-builder.ts`  | Trocar `Record<string, unknown>` → `EventInput`                                                                                                                                |
| `features/scripts/executor.ts`                       | Corrigir `buildClaudeStdin` + `buildOpencodeStdin`                                                                                                                             |
| `opencode-hooks.ts`                                  | Zero tipos inline, tudo importado de `core.ts`                                                                                                                                 |

---

## Riscos e Mitigações (Investigados)

### 1. `NormalizedEvent` é muito restrito para resolvers

**Status:** ✅ Investigado — resolvers NÃO usam `NormalizedEvent`, usam `Record<string, unknown>` por design.
**Decisão:** Criar tipo mínimo `EventInput = { sessionID?: string; [key: string]: unknown }` para os resolvers. Não usar `NormalizedEvent` lá — manteria a genericidade sem perder estrutura mínima.

### 2. Casts `as Record<string, unknown>` podem ter razão de existir

**Status:** ✅ Investigado — casts em `opencode-hooks.ts` mascaram incompatibilidade com SDK.
**Decisão:** Usar `EventInput` ao invés de `Record<string, unknown>`. JSON.parse casts são inevitáveis.

### 3. Re-exports em `events.ts:80` têm consumidores ocultos

**Status:** ✅ Investigado — `EventOverride`, `ScriptToastsConfig`, `EventConfig`, `ToolConfig` são importados direto de `config.ts`. `persistence.ts` tem ZERO consumidores.
**Decisão:** Remover re-exports é **seguro**.

### 4. `*Props` vs SDK real — mismatch confirmado

**Status:** ✅ Investigado — `ChatParamsProps.provider` usa `{ providerID, name }` mas SDK usa `ProviderContext`. `PermissionAskProps` usa tipo inline mas SDK tem `PermissionRequest`.
**Decisão:** Recriar `*Props` localmente em `core.ts`, usando campos do SDK como referência (NÃO importar):

- `ChatParamsProps` → recriar local com campos de `ProviderContext`, `Model`, `UserMessage` do SDK
- `ChatHeadersProps` → recriar local com campos de `ProviderContext`, `Model`, `UserMessage` do SDK
- `PermissionAskProps` → recriar local baseado em `PermissionRequest` do SDK (id, sessionID, permission, patterns, tool)
- `ChatParamsOutput` → recriar local (SDK usa `any`, plugin pode ser mais restrito)
- **Manter padrão misto**: importar só tipos CORE do SDK (`Event`, `Message`, `Part`), recriar `*Props`/`*Output` localmente

---

## Passo 9: Audit & delete orphan types

Após todas as migrações, verificar tipos sem consumidores.

### 9.1 Verificar `EventInputRecord` (antigo)

```bash
rtk grep -r "EventInputRecord" --include="*.ts" .
```

Se zero consumidores: deletar de `core.ts`.

### 9.2 Encontrar outros órfãos

Buscar tipos exportados sem imports no codebase.

### 9.3 Deletar órfãos

Remover tipos não usados. Deletar arquivos vazios (ex: `persistence.ts`).
Rodar `npm run build`.

---

## Verificação

1. `npm run build` — sem erros de tipo
2. `npm run lint` — sem erros
3. `npm run test:cov` — todos os testes passam
4. `fallow audit` — sem problemas
