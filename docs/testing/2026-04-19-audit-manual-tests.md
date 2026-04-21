# Testes Manuais - Audit System Fixes

> Manual de teste QA para validar as mudanças no sistema de audit.

## Setup Prévio

1. Executar `npm run build` para compilar o plugin
2. Rodar `npm run lint` e `npm run build` para garantir sem erros
3. Carregar o plugin no OpenCode

## Teste 1: Configuração de Audit no Settings

**Objetivo**: Verificar que configuração exposta ao usuário funciona.

### Passos

1. Editar `config/settings.ts`
2. Adicionar/verificar que existe `audit` config:
   ```ts
   audit: {
     enabled: true,
     level: 'debug',
     maxSizeMB: 10,
     maxAgeDays: 7,
     truncationKB: 512,
     files: {
       events: 'plugin-events.jsonl',
       scripts: 'plugin-scripts.jsonl',
       errors: 'plugin-errors.jsonl',
     },
   }
   ```
3. Carregar o plugin no OpenCode
4. Verificar se não há erros no console

### Critérios de Sucesso

- ✅ Plugin carrega sem crashar
- ✅ Configuração é aceita com valores customizados
- ✅ Logs são criados na pasta `~/.opencode/audit/`

---

## Teste 2: Level Filtering

**Objetivo**: Verificar que `level: 'audit'` skip events file.

### Passos

1. Editar `config/settings.ts`:
   ```ts
   audit: {
     enabled: true,
     level: 'audit',  // ← MUDAR AQUI
   }
   ```
2. Recarregar o plugin
3. Abrir OpenCode e fazer 3-5 eventos normais (escrever código, fazer edições)
4. Verificar conteúdo de `~/.opencode/audit/plugin-events.jsonl`

### Critérios de Sucesso

- ✅ `plugin-events.jsonl` **NÃO** possui entradas novas (fica vazio ou só tem conteúdo antigo)
- ✅ `plugin-scripts.jsonl` possui entradas novas (scripts rodados normalmente)
- ✅ `plugin-errors.jsonl` possui entradas se houver erros

### Passo de Controle (Comparação)

1. Voltar `level: 'debug'`
2. Fazer 3-5 eventos novos
3. Verificar que `plugin-events.jsonl` AGORA recebe entradas

---

## Teste 3: Toast Queue → plugin-errors.jsonl

**Objetivo**: Verificar que dropped toasts vão para error recorder, não para `session_events.log`.

### Passos

1. Rodar o plugin com `level: 'debug'`
2. No OpenCode, fazer eventos rapidamente para gerar 20+ toasts em sequência
3. Verificar conteúdo de `~/.opencode/audit/plugin-errors.jsonl`

### Critérios de Sucesso

- ✅ `plugin-errors.jsonl` contém entradas com `eventType: "toast.queue.overflow"`
- ✅ Entradas de dropped toasts possuem `title` e `message` do toast
- ✅ `~/.opencode/audit/session_events.log` (se existir) **NÃO** contém entradas de dropped toasts

### Dica para Gerar Muitos Toasts

- Fazer várias edições em arquivos diferentes rapidamente
- Usar recursos que geram feedback visual
- Each toast que OpenCode mostra é uma oportunidade de gerar toasts

---

## Teste 4: Race Condition Fix

**Objetivo**: Verificar que múltiplos `initAuditLogging` concorrentes não criam múltiplos archives.

Este teste é mais difícil de reprozuzir. Tente simular concorrência.

### Passos

1. Abrir OpenCode
2. Abrir 3+ sessões simultâneas do OpenCode se possível
3. Em cada sessão, disparar comandos rápidos (ex: fazer edições em arquivos separados)
4. Verificar conteúdo de `~/.opencode/audit/archive/`

### Critérios de Sucesso

- ✅ Para cada tipo de arquivo (events, scripts, errors), existe **APENAS UM** arquivo archive com timestamp recente
- ✅ Não existem múltiplos arquivos como `plugin-events-2026-04-19T01:56:06.134Z.jsonl` e `plugin-events-2026-04-19T01:56:06.128Z.jsonl` (timestamps iguais/parecidos)
- ✅ Archive folder não tem muitos arquivos minúsculos

### Ponto de Atenção

Se houver múltiplos arquivos com timestamps muito próximos, **race condition não foi fixada**.

---

## Checklist Final

- [ ] Teste 1: Configuração aceita pelo plugin
- [ ] Teste 2: Level `audit` skip events correctly
- [ ] Teste 3: Dropped toasts vão para `plugin-errors.jsonl`
- [ ] Teste 4: Múltiplos arquivos archive não são criados

---

## Relatório de Bugs

Se encontrar problemas, documentar aqui:

| Teste | Problema | Detalhes |
| ----- | -------- | -------- |
|       |          |          |

---

## Logs de Referência

Paths dos logs:

- Events: `~/.opencode/audit/plugin-events.jsonl`
- Scripts: `~/.opencode/audit/plugin-scripts.jsonl`
- Errors: `~/.opencode/audit/plugin-errors.jsonl`
- Archive: `~/.opencode/audit/archive/`
- Old: `~/.opencode/audit/session_events.log` (provavelmente vazio/sem uso)
