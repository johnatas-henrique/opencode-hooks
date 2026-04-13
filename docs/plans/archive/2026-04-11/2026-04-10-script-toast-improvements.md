# 2026-04-10: Melhorias no Sistema de Scripts e Toasts

## Execution

| Step                                                   | Status | Timestamp |
| ------------------------------------------------------ | ------ | --------- |
| 1. Modificar `runScriptAndHandle` para retornar output | ✅     | -         |
| 2. Criar função `runAllScriptsAndCollect`              | ⏳     | -         |
| 3. Agrupar outputs dos scripts em array                | ⏳     | -         |
| 4. Disparar toast único com todos os outputs           | ⏳     | -         |
| 5. Capturar e expor erro completo do script            | ⏳     | -         |
| 6. Testar com scripts em erro                          | ⏳     | -         |

**Status**: ⚠️ NOT IMPLEMENTED - Superseded by types work

## Problemas Atuais

### 1. Múltiplos Toasts

**Problema:** Cada script dispara um toast separado, gerando "spam" de notificações.

**Solução:** Coletar outputs de todos os scripts e disparar 1 toast consolidado.

### 2. Erros de Script Difíceis de Diagnosticar

**Problema:** Quando script falha, erro genérico chega ao usuário.

**Solução:** Capturar stderr + stdout + exit code do script e mostrar no toast de erro.

## Implementação

### Step 1: Modificar `runScriptAndHandle` para retornar output

**Arquivo:** `.opencode/plugins/helpers/run-script-handler.ts`

**Mudança:** Função deve retornar:

```typescript
interface ScriptResult {
  script: string;
  output: string;
  error: string | null;
  exitCode: number;
}
```

### Step 2: Criar função para rodar todos os scripts e coletar resultados

**Arquivo:** `.opencode/plugins/helpers/run-script-handler.ts` (nova função)

```typescript
export async function runAllScriptsAndCollect(
  config: RunScriptConfig
): Promise<ScriptResult[]> {
  const results: ScriptResult[] = [];

  for (const script of resolved.scripts) {
    const result = await runScriptAndHandle({ ...config, script });
    results.push(result);
  }

  return results;
}
```

### Step 3: Agrupar outputs em `executeHook`

**Arquivo:** `.opencode/plugins/opencode-hooks.ts`

**Mudança:** No loop de scripts:

```typescript
const scriptResults = await runAllScriptsAndCollect({...});
const successfulOutputs = scriptResults
  .filter(r => r.exitCode === 0 && r.output)
  .map(r => `**${r.script}**:\n${r.output}`);
const errors = scriptResults
  .filter(r => r.exitCode !== 0)
  .map(r => `**${r.script}**:\n${r.error}`);
```

### Step 4: Disparar toast único consolidado

**Arquivo:** `.opencode/plugins/opencode-hooks.ts`

**Lógica:**

```typescript
if (resolved.toast) {
  const handler = handlers[eventType];
  const baseMessage =
    resolved.toastMessage ??
    (handler ? handler.buildMessage(input) : eventType);

  let consolidatedMessage = baseMessage;

  if (successfulOutputs.length > 0) {
    consolidatedMessage +=
      '\n\n--- Script Outputs ---\n' + successfulOutputs.join('\n\n');
  }

  if (errors.length > 0) {
    consolidatedMessage += '\n\n--- Script Errors ---\n' + errors.join('\n\n');
  }

  useGlobalToastQueue().add({
    title: resolved.toastTitle,
    message: consolidatedMessage.trim(),
    variant: errors.length > 0 ? 'error' : resolved.toastVariant,
    duration: resolved.toastDuration,
  });
}
```

### Step 5: Capturar erro completo do script

**Arquivo:** `.opencode/plugins/helpers/run-script.ts`

**Mudança:** Capturar stderr e exit code:

```typescript
export const runScript = async (
  $: PluginInput['$'],
  scriptPath: string,
  ...args: string[]
): Promise<ScriptResult> => {
  try {
    const result =
      await $`./${SCRIPTS_DIR}/${scriptPath} ${sanitizedArgs}`.quiet();
    return {
      output: result.text(),
      error: null,
      exitCode: result.exitCode,
    };
  } catch (err) {
    return {
      output: '',
      error: err instanceof Error ? err.message : String(err),
      exitCode: -1,
    };
  }
};
```

## Benefícios

1. **Menos spam de toasts** - 1 toast por evento ao invés de N toasts
2. **Visibilidade completa** - Usuário vê output de todos os scripts de uma vez
3. **Debug mais fácil** - Erros de script mostram stderr completo + exit code
4. **Performance** - Menos operações de UI (toast queue)

## Trade-offs

1. **Toast pode ficar grande** - Se muitos scripts com output longo
   - **Mitigação:** Truncar output após N caracteres com "..."
2. **Perde stagger visual** - Scripts não aparecem um por um
   - **Mitigação:** Opcional `toastPerScript: true` na config

## Próximos Passos

1. Implementar Steps 1-5
2. Rodar `npm run build && npm run lint`
3. Testar manualmente no OpenCode
4. Commitar mudanças
