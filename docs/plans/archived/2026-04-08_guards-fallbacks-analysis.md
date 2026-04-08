# Guard/Fallback Analysis Plan

**Date**: 2026-04-08
**Status**: Completed
**Archived**: 2026-04-08

---

## Execution

| Step                                          | Status | Timestamp |
| --------------------------------------------- | ------ | --------- |
| 1. Analyze sessionID in hook input types      | ✅     | 12:15:00  |
| 2. Create removal plan for unnecessary guards | ✅     | 12:18:00  |
| 3. Implement changes                          | ✅     | 12:20:00  |
| 4. Build and test                             | ✅     | 12:50:00  |

---

## Guard/Fallback Analysis

### sessionID ?? DEFAULT_SESSION_ID (17 occurrences in opencode-hooks.ts)

Based on type analysis of hook input types:

#### Hooks where sessionID is REQUIRED (no fallback needed):

| Line     | Hook                               | Type               | Status | Action                                             |
| -------- | ---------------------------------- | ------------------ | ------ | -------------------------------------------------- |
| 200      | tool.execute.before                | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 232, 258 | tool.execute.after                 | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 300      | chat.message                       | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 327      | chat.params                        | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 349      | chat.headers                       | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 365      | permission.ask                     | sessionID?: string | KEEP   | Optional - needs fallback                          |
| 381      | command.execute.before             | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 417      | experimental.chat.system.transform | sessionID?: string | KEEP   | Optional - needs fallback                          |
| 435      | experimental.session.compacting    | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 451      | experimental.text_complete         | sessionID: string  | REMOVE | Remove `?? DEFAULT_SESSION_ID`                     |
| 467      | tool.definition                    | sessionID: string  | REMOVE | Already uses DEFAULT_SESSION_ID directly (correct) |

#### Hooks where sessionID is OPTIONAL (fallback needed):

| Line | Hook                                | Type               | Status   | Action                           |
| ---- | ----------------------------------- | ------------------ | -------- | -------------------------------- |
| 268  | shell.env                           | sessionID?: string | KEEP     | Needs fallback                   |
| 277  | shell.env (executed in executeHook) | -                  | REFACTOR | Already has fallback at line 277 |

### event hook (lines 178-179):

```typescript
const rawId = info?.id ?? props?.sessionID;
const sessionId = typeof rawId === 'string' ? rawId : DEFAULT_SESSION_ID;
```

- **KEEP** - Generic event type, sessionID is optional in properties

---

## REMOVER (9 guards sessionID)

| Linha | Hook                            | Código Atual                            | Porquê                           |
| ----- | ------------------------------- | --------------------------------------- | -------------------------------- |
| 200   | tool.execute.before             | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 232   | tool.execute.after (subagent)   | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 258   | tool.execute.after              | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 300   | chat.message                    | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 327   | chat.params                     | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 349   | chat.headers                    | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 381   | command.execute.before          | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 435   | experimental.session.compacting | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |
| 451   | experimental.text_complete      | `input.sessionID ?? DEFAULT_SESSION_ID` | sessionID é `string` obrigatória |

---

## MANTER (7 guards sessionID)

| Linha   | Hook                               | Código                         | Porquê                             |
| ------- | ---------------------------------- | ------------------------------ | ---------------------------------- |
| 178-179 | event (genérico)                   | `info?.id ?? props?.sessionID` | properties.sessionID é opcional    |
| 268     | shell.env                          | `sessionID?: string`           | **Opcional** - precisa do fallback |
| 365     | permission.ask                     | `sessionID?: string`           | **Opcional** - precisa do fallback |
| 417     | experimental.chat.system.transform | `sessionID?: string`           | **Opcional** - precisa do fallback |

---

## Other guards/fallbacks

### REMOVER

| Linha | Código                    | Porquê                                                                       |
| ----- | ------------------------- | ---------------------------------------------------------------------------- |
| 146   | `toast.variant ?? 'info'` | **REMOVER** - resolved.toastVariant já tem default ('info') em events.ts:167 |

### MANTER (Necessários)

| Linha    | Código                                 | Porquê                                                                                             |
| -------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 85       | `resolved.toastMessage ??`             | Se usuário não configurar toast.message, vem undefined - precisa fallback pro handler.buildMessage |
| 87       | `(input ?? {})`                        | Segurança defensiva                                                                                |
| 167, 198 | `handler?.variant \|\| 'info'`         | Handler pode não existir (eventos unknown ainda executam)                                          |
| 168      | `handler?.duration ?? 2000`            | Handler pode não existir                                                                           |
| 196-199  | Cascata: toastCfg → handler → defaults | Priority config resolution                                                                         |
| 239, 262 | `subagentType \|\| input.tool`         | subagentType pode ser vazio                                                                        |
| 251      | `input.args['name'] ?? ''`             | name pode ser undefined                                                                            |

---

## Changes to implement

1. Lines 200, 232, 258, 300, 327, 349, 381, 435, 451 - change `sessionID ?? DEFAULT_SESSION_ID` to `sessionID`
2. Line 467 - change `DEFAULT_SESSION_ID` to `sessionID`
3. Line 146 - change `toast.variant ?? 'info'` to `toast.variant`

---

## Summary

- **9 REMOVALS** - sessionID obrigatórios → usar direto
- **1 REMOVAL** - toast.variant redundante
- **Mantidos necessários** - opcionais da SDK, handlers unknown, toast config cascata
