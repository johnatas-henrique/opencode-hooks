# Extract Debug Logic to Helper Function

## Objetivo

Extrair a lógica de debug que se repete em 3 lugares (`resolved.debug`) para uma função helper reutilizável, evitando duplicação de código.

## Análise dos Locais com Debug

| #   | Local                          | Dados debugados                | Título toast                  |
| --- | ------------------------------ | ------------------------------ | ----------------------------- |
| 1   | event handler (line 126)       | `event`                        | `DEBUG EVENT - ${event.type}` |
| 2   | tool.execute.before (line 209) | `{ input, resolved }`          | `DEBUG TOOL.BEFORE`           |
| 3   | tool.execute.after (line 257)  | `{ input, _output, resolved }` | `DEBUG TOOL.AFTER`            |

### Padrão Comum

```typescript
if (resolved.debug) {
  const debugMessage = JSON.stringify({ data }, null, 2);
  useGlobalToastQueue().add({
    title: 'DEBUG ...',
    message: debugMessage,
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
  });
  await saveToFile({
    content: `[${timestamp}] - ...\n${debugMessage}\n`,
    filename: DEBUG_LOG_FILE,
    showToast: useGlobalToastQueue().add,
  });
}
```

---

## Execution

| Step                                                | Status | Timestamp        |
| --------------------------------------------------- | ------ | ---------------- |
| 1. Create debug helper function in helpers/debug.ts | ✅     | 2026-04-05 19:40 |
| 2. Export from index.ts                             | ✅     | 2026-04-05 19:42 |
| 3. Replace debug code in event handler              | ✅     | 2026-04-05 19:45 |
| 4. Replace debug code in tool.execute.before        | ✅     | 2026-04-05 19:47 |
| 5. Replace debug code in tool.execute.after         | ✅     | 2026-04-05 19:50 |
| 6. Build, lint, test                                | ✅     | 2026-04-05 19:52 |
| 7. Add unit tests for debug.ts                      | ✅     | 2026-04-05 19:55 |
| 8. Archive plan                                     | ✅     | 2026-04-05 19:58 |

---

## Detalhamento

### Step 1: Create debug helper

Criar `.opencode/plugins/helpers/debug.ts`:

```typescript
import { useGlobalToastQueue } from './toast-queue';
import { saveToFile } from './save-to-file';
import { TOAST_DURATION } from './constants';
import { DEBUG_LOG_FILE } from './constants';

export async function handleDebugLog(
  timestamp: string,
  title: string,
  data: unknown
): Promise<void> {
  const debugMessage = JSON.stringify(data, null, 2);

  useGlobalToastQueue().add({
    title,
    message: debugMessage,
    variant: 'info',
    duration: TOAST_DURATION.TEN_SECONDS,
  });

  await saveToFile({
    content: `[${timestamp}] - ${title}\n${debugMessage}\n`,
    filename: DEBUG_LOG_FILE,
    showToast: useGlobalToastQueue().add,
  });
}
```

### Step 2: Export from index.ts

Adicionar exports do novo helper.

### Step 3-5: Replace usages

Substituir o código duplicado em cada local:

**event handler (line 126):**

```typescript
// ANTES
if (resolved.debug) {
  const debugMessage = JSON.stringify(event, null, 2);
  useGlobalToastQueue().add({...});
  await saveToFile({...});
}

// DEPOIS
if (resolved.debug) {
  await handleDebugLog(timestamp, `DEBUG EVENT - ${event.type}`, event);
}
```

**tool.execute.before (line 209):**

```typescript
// ANTES
if (resolved.debug) {
  const debugMessage = JSON.stringify({ input, resolved }, null, 2);
  ...
}

// DEPOIS
if (resolved.debug) {
  await handleDebugLog(timestamp, 'DEBUG TOOL.BEFORE', { input, resolved });
}
```

**tool.execute.after (line 257):**

```typescript
// ANTES
if (resolved.debug) {
  const debugMessage = JSON.stringify({ input, _output, resolved }, null, 2);
  ...
}

// DEPOIS
if (resolved.debug) {
  await handleDebugLog(timestamp, 'DEBUG TOOL.AFTER', { input, _output, resolved });
}
```

### Step 6: Verificar

```bash
npm run build && npm run lint && npm test
```

---

## Resultado Esperado

- ✅ Código DRY (Don't Repeat Yourself)
- ✅ Lógica de debug centralizada em um único lugar
- ✅ Mais fácil de manter e modificar
- ✅ Mesma funcionalidade preservada
