# Plano de Correções - opencode-hooks

**Data:** 2026-04-02 14:45  
**Objetivo:** Aplicar coding standards mantendo compatibilidade total com testes existentes

---

## Execution

| Step | Status | Timestamp |
| ---- | ------ | --------- |
| 1. Corrigir timestamp nos event handlers | ✅ | 2026-04-02 15:30 |
| 2. Adicionar type guards para eventos | ✅ | 2026-04-02 16:00 |
| 3. Adicionar error handling + logging em run-script.ts | ✅ | 2026-04-02 15:15 |
| 4. Extrair magic numbers para constantes | ✅ | 2026-04-02 15:20 |
| 5. Criar helper para toasts repetidos | ✅ | 2026-04-02 15:30 |
| 6. Melhorar error handling em events-config | ✅ | 2026-04-02 15:35 |
| 7. Adicionar validação de input em save-to-file | ✅ | 2026-04-02 16:05 |
| 8. Remover log-parser.ts (não utilizado) | ✅ | 2026-04-02 16:10 |
| 9. Adicionar limite de tamanho em appendToSession | ✅ | 2026-04-02 15:40 |
| 10. Corrigir global state em toast-queue | ✅ | 2026-04-02 15:20 |
| 11. Rodar testes para validar | ✅ | 2026-04-02 16:15 |

---

## Detalhamento

### Step 1: Corrigir timestamp nos event handlers
**Arquivo:** `opencode-hooks.ts:28`  
**Problema:** Timestamp criado uma vez mas usado para todos os eventos  
**Solução:** Mover criação do timestamp para dentro de cada event handler

### Step 2: Adicionar type guards para eventos
**Arquivo:** `opencode-hooks.ts:42`  
**Problema:** Type assertion sem verificação  
**Solução:** Criar type guard function para validar o tipo do evento

### Step 3: Adicionar error handling + logging em run-script.ts
**Arquivo:** `helpers/run-script.ts`  
**Problema:** Sem tratamento de erros  
**Solução:** Adicionar try/catch com logging para session_events.log

### Step 4: Extrair magic numbers para constantes
**Arquivos:** `opencode-hooks.ts`, `toast-queue.ts`  
**Problema:** Magic numbers sem explicação  
**Solução:** Criar arquivo de constantes

### Step 5: Criar helper para toasts repetidos
**Arquivo:** `opencode-hooks.ts`  
**Problema:** Código DRY violado  
**Solução:** Extrair função `createEventToast()`

### Step 6: Melhorar error handling em events-config
**Arquivo:** `helpers/events-config.ts:43`  
**Problema:** Erro ignorado silenciosamente  
**Solução:** Logar o erro original

### Step 7: Adicionar validação de input em save-to-file
**Arquivo:** `helpers/save-to-file.ts`  
**Problema:** Caminho relativo problemático + sem validação  
**Solução:** Validar filename

### Step 8: Remover log-parser.ts
**Arquivo:** `helpers/log-parser.ts`  
**Problema:** Função não utilizada  
**Solução:** Remover arquivo e imports relacionados

### Step 9: Adicionar limite em appendToSession
**Arquivo:** `helpers/append-to-session.ts`  
**Problema:** Sem validação de tamanho  
**Solução:** Adicionar MAX_PROMPT_LENGTH

### Step 10: Corrigir global state em toast-queue
**Arquivo:** `helpers/toast-queue.ts`  
**Problema:** Singleton global dificulta testes  
**Solução:** Manter compatibilidade, adicionar reset para testes

### Step 11: Rodar testes
**Objetivo:** Garantir que todos os testes passam

---

## Regra de Compatibilidade

- Manter API pública exatamente igual
- Não quebrar testes existentes
- TODOS os testes devem passar ao final