# Plano: Mineração MemPalace via opencode-hooks

## Objetivo

Resolver o problema de auto-mineração de conversas do MemPalace no OpenCode usando o plugin opencode-hooks (em vez do plugin `@devtheops/opencode-plugin-mempalace` que está quebrado).

## Problema Atual

O plugin `@devtheops/opencode-plugin-mempalace` tem um bug na função `exportSessionTranscript()` que usa a API `client.session.messages()`. O erro é:

```
error=messages.map is not a function
```

Isso acontece porque a API do OpenCode mudou o formato de resposta.

## Solução

Usar o **opencode-hooks** para rodar scripts shell que chamam a **CLI do MemPalace** diretamente, contornando a API problemática.

## Como Funciona o MemPalace

### Auto-Inicialização

O MemPalace **NÃO se auto-inicializa automaticamente** em novos diretórios. Você precisa rodar manualmente:

```bash
# Primeira vez em um projeto
mempalace init ~/caminho/do/projeto

# Depois mine os arquivos
mempalace mine ~/caminho/do/projeto
```

Para o seu caso (`~/.config/opencode`):

- ✅ `mempalace init` já foi rodado (arquivo `mempalace.yaml` existe)
- ✅ `mempalace mine` já foi rodado (1510 drawers no palace)

### Comandos úteis:

| Comando                              | Descrição                                  |
| ------------------------------------ | ------------------------------------------ |
| `mempalace init <dir>`               | Cria `mempalace.yaml` com rooms detectadas |
| `mempalace mine <dir>`               | Mine arquivos do projeto                   |
| `mempalace mine <dir> --mode convos` | Mine conversas                             |
| `mempalace wake-up`                  | Output L0 + L1 para injeção no system      |
| `mempalace wake-up --wing <nome>`    | Wake-up para wing específica               |
| `mempalace status`                   | Mostra drawers/rooms/wings                 |

## Arquitetura da Solução

**Local dos scripts:** `~/.config/opencode/.opencode/plugins/scripts/`

```
~/.config/opencode/
└── .opencode/
    └── plugins/
        ├── scripts/
        │   ├── mempalace-wake.sh     → Injeta L0/L1 no system prompt
        │   └── mempalace-mine.sh    → Incrementa contador + mining
        └── config/
            └── settings.ts          → Configuração de eventos
```

### Eventos do OpenCode usados:

| Evento            | Script              | Ação                            |
| ----------------- | ------------------- | ------------------------------- |
| `SESSION_CREATED` | `mempalace-wake.sh` | Injeta L0 na inicialização      |
| `CHAT_MESSAGE`    | `mempalace-mine.sh` | Contador + mining a cada X msgs |

## Scripts

### Script: `mempalace-mine.sh` (contador + mining)

**Local:** `~/.config/opencode/.opencode/plugins/scripts/mempalace-mine.sh`

```bash
#!/bin/bash
# Mineração automática a cada X mensagens
# Evento: chat.message (disparado a cada mensagem)

MINE_EVERY=5              # mining a cada 5 mensagens
SESSION_DIR="$HOME/.local/share/opencode/sessions"

# Obtém diretório atual do OpenCode (onde o projeto está aberto)
PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

# Session ID vem do argumento ($1) ou usa PROJECT_NAME como fallback
SESSION_ID="${1:-$PROJECT_NAME}"
COUNTER_FILE="/tmp/mempalace_count_$SESSION_ID"

# Incrementa contador
COUNT=$(cat "$COUNTER_FILE" 2>/dev/null || echo 0)
COUNT=$((COUNT + 1))
echo "$COUNT" > "$COUNTER_FILE"

echo "[MemPalace] Message $COUNT of session $SESSION_ID (project: $PROJECT_NAME)"

# Verifica threshold (múltiplo de MINE_EVERY)
if [ $((COUNT % MINE_EVERY)) -eq 0 ]; then
  echo "=== MINING (every $MINE_EVERY messages) ==="

  # Mine conversas da sessão usando o diretório do projeto como wing
  if [ -d "$SESSION_DIR" ]; then
    mempalace mine "$SESSION_DIR" --mode convos --wing "$PROJECT_NAME" 2>/dev/null
  else
    echo "Sessions directory not found: $SESSION_DIR"
  fi

  echo "============================================="
fi
```

**Como funciona:**

1. `pwd` → obtém diretório atual do OpenCode (diretório do projeto aberto)
2. `basename "$PROJECT_DIR"` → extrai nome do projeto (ex: "meu-projeto")
3. Usa esse nome como **wing** no MemPalace
4. Contador persiste em `/tmp/mempalace_count_<SESSION_ID>`

### Script: `mempalace-wake.sh` (L0 injection)

**Local:** `~/.config/opencode/.opencode/plugins/scripts/mempalace-wake.sh`

```bash
#!/bin/bash
# Injeta L0 + L1 via wake-up
# Evento: session.created (disparado ao iniciar sessão)

# Obtém diretório atual do OpenCode
PROJECT_DIR="$(pwd)"
PROJECT_NAME="$(basename "$PROJECT_DIR")"

OUTPUT=$(mempalace wake-up --wing "$PROJECT_NAME" 2>/dev/null)

if [ -n "$OUTPUT" ]; then
  echo "=== MEMPALACE L0 (wing: $PROJECT_NAME) ==="
  echo "$OUTPUT"
  echo "============================================"
fi
```

## Configuração em `settings.ts`

Editar `~/.config/opencode/.opencode/plugins/config/settings.ts`:

```typescript
events: {
  [EventType.SESSION_CREATED]: {
    toast: true,
    runScripts: true,
    runOnlyOnce: true,
    appendToSession: true,
    scripts: ['mempalace-wake.sh']
  },
  [EventType.CHAT_MESSAGE]: {
    enabled: true,
    runScripts: true,
    scripts: ['mempalace-mine.sh']
  },
}
```

**Nota:** O evento `CHAT_MESSAGE` precisa ser habilitado (por padrão está `enabled: false`).

## Fluxo de Execução

```
1. OpenCode inicia sessão
   → SESSION_CREATED → mempalace-wake.sh → Injeta L0 do MemPalace

2. Usuário envia mensagens
   → CHAT_MESSAGE → mempalace-mine.sh → Incrementa contador
   → A cada 5 mensagens → mempalace mine --mode convos --wing <project_name>
```

## Teste

1. Abrir OpenCode em um projeto (ex: ~/projects/meu-app)
2. O `PROJECT_NAME` será "meu-app"
3. Enviar 5 mensagens
4. Verificar se mining ocorreu: `mempalace status --wing meu-app`

## Pré-requisitos

1. Cada projeto precisa ter sido inicializado com `mempalace init <dir>`
2. O MemPalace precisa reconhecer o nome do projeto como wing válida

## Referências

- opencode-hooks: `~/projects/opencode-hooks/`
- MemPalace CLI: `mempalace --help`
