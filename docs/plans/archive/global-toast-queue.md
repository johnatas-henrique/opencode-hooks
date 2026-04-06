# Global Toast Queue Acessível de Qualquer Lugar

## Objetivo

Migrar todos os usos de `toastQueue` para usar `useGlobalToastQueue()` diretamente, eliminando a necessidade de passar a queue como parâmetro entre funções.

## Execution

| Step                                                                  | Status | Timestamp        |
| --------------------------------------------------------------------- | ------ | ---------------- |
| 1. Criar initGlobalToastQueue e useGlobalToastQueue no toast-queue.ts | ✅     | 2026-04-05 18:17 |
| 2. Exportar novas funções no index.ts                                 | ✅     | 2026-04-05 18:19 |
| 3. Atualizar opencode-hooks.ts para usar initGlobalToastQueue         | ✅     | 2026-04-05 18:22 |
| 4. Migrar opencode-hooks.ts para usar useGlobalToastQueue()           | ✅     | 2026-04-05 18:25 |
| 5. Migrar log-event.ts para usar useGlobalToastQueue()                | ✅     | 2026-04-05 18:28 |
| 6. Migrar show-startup-toast.ts para usar useGlobalToastQueue()       | ✅     | 2026-04-05 18:30 |
| 7. Build e lint                                                       | ✅     | 2026-04-05 18:32 |
| 8. Adicionar validação para.throw se não inicializado                 | ✅     | 2026-04-05 18:40 |
| 9. Criar teste manual de validação                                    | ✅     | 2026-04-05 18:45 |
| 10. Ajustar opencode-hooks.test.ts                                    | ✅     | 2026-04-05 18:50 |
| 11. Ajustar session-plugins.test.ts                                   | ✅     | 2026-04-05 18:52 |
| 12. Ajustar show-startup-toast.test.ts                                | ✅     | 2026-04-05 18:55 |
| 13. Ajustar log-event.test.ts                                         | ✅     | 2026-04-05 18:58 |
| 14. Run todos os testes                                               | ✅     | 2026-04-05 19:00 |
| 15. Ajustar testes show-startup-toast (timers)                        | ✅     | 2026-04-05 19:10 |
| 16. Remover skip dos testes                                           | ✅     | 2026-04-05 19:15 |
| 17. Adicionar testes para 100% coverage toast-queue.ts                | ✅     | 2026-04-05 19:25 |

---

## Testes que Precisam de Ajuste

Devido à remoção do parâmetro `toastQueue`, os seguintes testes precisam ser atualizados:

### opencode-hooks.test.ts

- Mock do toast-queue já ajustado
- Verificar se os handlers funcionam corretamente

### session-plugins.test.ts

- Mock do toast-queue já ajustado
- Verificar se os handlers funcionam corretamente

### show-startup-toast.test.ts

- Remover parâmetro `toastQueue` das chamadas: `await showStartupToast()` em vez de `await showStartupToast(mockQueue)`

### log-event.test.ts

- Remover parâmetro `mockQueue` das chamadas:
  - `logEventConfig(timestamp, eventType, resolved)` - remover mockQueue
  - `logScriptOutput(timestamp, output)` - remover mockQueue

---

## Detalhamento por arquivo (implementação)

### Step 1: toast-queue.ts

```typescript
export function initGlobalToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>
): ToastQueue {
  globalToastQueue = createToastQueue(showFn, {
    staggerMs: STAGGER_MS.DEFAULT,
  });
  return globalToastQueue;
}

export function useGlobalToastQueue(): ToastQueue {
  if (!globalToastQueue) {
    throw new Error('ToastQueue not initialized. Call initGlobalToastQueue first.');
  }
  return globalToastQueue;
}

export function getGlobalToastQueue(showFn?: ...): ToastQueue {
  if (!globalToastQueue && showFn) {
    return initGlobalToastQueue(showFn);
  }
  return useGlobalToastQueue();
}
```

### Step 2: index.ts

Adicionar exports das novas funções + getGlobalToastQueue para backward compat.

### Step 3-6: opencode-hooks.ts, log-event.ts, show-startup-toast.ts

Usar `useGlobalToastQueue()` diretamente, sem passar como parâmetro.
