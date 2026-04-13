# Plano: Priorizar toasts de erro no topo da fila

## Objetivo

Fazer com que toasts de erro (`variant: 'error'`) sejam exibidas imediatamente, pasando na frente das outras toasts na fila.

## Motivação

Erros são importantes e devem ser见的 rapidamente pelo usuário. Currently, todas as toasts são adicionadas ao final da fila (FIFO), então erros podem demorar para aparecer se houver muitas toasts na frente.

## Solução

Modificar o método `add` na `toast-queue.ts` para:

- Se `toast.variant === 'error'`, usar `queue.unshift(toast)` (adicionar no início)
- Senão, usar `queue.push(toast)` (adicionar no final, comportamento atual)

## Arquivo

`.opencode/plugins/helpers/toast-queue.ts`

## Alteração

Linha 102: Mudar de:

```typescript
queue.push(toast);
```

Para:

```typescript
if (toast.variant === 'error') {
  queue.unshift(toast);
} else {
  queue.push(toast);
}
```

## Execution

| Step | Description                            | Status | Timestamp        |
| ---- | -------------------------------------- | ------ | ---------------- |
| 1    | Modificar método add em toast-queue.ts | ✅     | 2026-04-12 23:50 |
| 2    | Rodar build e lint                     | ✅     | 2026-04-12 23:50 |
| 3    | Testar com toast de erro               | ✅     | 2026-04-12 23:52 |
