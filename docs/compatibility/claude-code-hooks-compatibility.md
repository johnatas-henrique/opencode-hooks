# Compatibilidade: Scripts Claude Code no OpenCode Hooks

## Como usar este documento

Leia esta documentação antes de adicionar um script `.sh` do Claude Code
no OpenCode Hooks. Ela explica quais campos do stdin são enviados, quais
não são, e se o script vai funcionar.

---

## 1. Stdin — Campos Comuns (Todos os Eventos)

| Campo             | Claude Code | Nosso Plugin | Status                    |
| ----------------- | ----------- | ------------ | ------------------------- |
| `session_id`      | ✅ envia    | ✅ envia     | Ok                        |
| `cwd`             | ✅ envia    | ✅ envia     | Ok                        |
| `hook_event_name` | ✅ envia    | ✅ envia     | Ok                        |
| `permission_mode` | ✅ envia    | ✅ envia     | Ok                        |
| `transcript_path` | ✅ envia    | ❌ não envia | **Não disponível no SDK** |

### `transcript_path` — Por que não temos?

O OpenCode SDK não expõe o caminho do arquivo de transcript para plugins.
O Claude Code envia esse campo porque ele mesmo gerencia o arquivo JSONL
da conversa. O mesmo ocorre no plugin do Romain (`romain325/opencode-hooks-plugin`).

Scripts que dependem de `transcript_path` (como `mempal_save_hook.sh`)
NÃO funcionarão completamente via nosso plugin. Eles não conseguirão
minerar o arquivo de transcript.

**Workaround:** O script ainda pode ser usado como trigger para salvar
no mempalace via diary entries (o modelo escreve baseado no reason
retornado), mas a mineração automática do transcript não acontece.

---

## 2. Stdin — Campos por Evento

### `Stop` (mapeado de `session.idle`)

| Campo                    | CC  | Plugin | Como preenchemos                    |
| ------------------------ | --- | ------ | ----------------------------------- |
| `session_id`             | ✅  | ✅     | `event.properties.sessionID`        |
| `cwd`                    | ✅  | ✅     | `process.cwd()`                     |
| `hook_event_name`        | ✅  | ✅     | `"Stop"` via `EVENT_NAME_MAP`       |
| `permission_mode`        | ✅  | ✅     | `"default"`                         |
| `transcript_path`        | ✅  | ❌     | Não disponível                      |
| `stop_hook_active`       | ✅  | ✅     | Estado local (arquivo por sessão)   |
| `last_assistant_message` | ✅  | ❌     | Não existe no evento `session.idle` |

### `PreToolUse` (mapeado de `tool.execute.before`)

| Campo             | CC  | Plugin | Como preenchemos  |
| ----------------- | --- | ------ | ----------------- |
| `session_id`      | ✅  | ✅     | `input.sessionID` |
| `cwd`             | ✅  | ✅     | `process.cwd()`   |
| `hook_event_name` | ✅  | ✅     | `"PreToolUse"`    |
| `permission_mode` | ✅  | ✅     | `"default"`       |
| `transcript_path` | ✅  | ❌     | Não disponível    |
| `tool_name`       | ✅  | ✅     | `input.tool`      |
| `tool_input`      | ✅  | ✅     | `input.args`      |
| `tool_use_id`     | ✅  | ✅     | `input.callID`    |

### `PostToolUse` (mapeado de `tool.execute.after`)

| Campo           | CC  | Plugin | Como preenchemos         |
| --------------- | --- | ------ | ------------------------ |
| (campos comuns) | ✅  | ✅     | mesmos que PreToolUse    |
| `tool_name`     | ✅  | ✅     | `input.tool`             |
| `tool_input`    | ✅  | ✅     | `input.args`             |
| `tool_use_id`   | ✅  | ✅     | `input.callID`           |
| `tool_response` | ✅  | ⚠️     | `output.output` (string) |
| `duration_ms`   | ✅  | ❌     | Não existe               |

### `SubagentStop` (mapeado de `tool.execute.after.subagent`)

| Campo                    | CC  | Plugin | Como preenchemos                          |
| ------------------------ | --- | ------ | ----------------------------------------- |
| (campos comuns)          | ✅  | ✅     |                                           |
| `stop_hook_active`       | ✅  | ✅     | Estado local                              |
| `agent_type`             | ✅  | ✅     | `input.subagentType`                      |
| `agent_id`               | ✅  | ⚠️     | `input.sessionID` (usamos o ID da sessão) |
| `last_assistant_message` | ✅  | ❌     | Não existe                                |

### `SessionStart` (mapeado de `session.created`)

| Campo                     | CC  | Plugin | Observação                      |
| ------------------------- | --- | ------ | ------------------------------- |
| (campos comuns)           | ✅  | ✅     |                                 |
| `source` (startup/resume) | ✅  | ❌     | Não existe no `session.created` |
| `model`                   | ✅  | ❌     | Não existe no `session.created` |

### `FileChanged` (mapeado de `file.watcher.updated`)

| Campo           | CC  | Plugin | Como preenchemos        |
| --------------- | --- | ------ | ----------------------- |
| (campos comuns) | ✅  | ✅     |                         |
| `file_path`     | ✅  | ✅     | `event.properties.file` |

---

## 3. Stdin OpenCode (Scripts Nativos)

Os mesmos campos também são enviados no formato OpenCode via
`buildOpencodeStdin()` para scripts com `source: 'native'`:

| Campo no Claude Stdin | Campo no OpenCode Stdin |
| --------------------- | ----------------------- |
| `session_id`          | `session_id`            |
| `cwd`                 | `cwd`                   |
| `hook_event_name`     | `event_type`            |
| `tool_name`           | `tool_name`             |
| `tool_input`          | `tool_input`            |
| `tool_result`         | `tool_result`           |
| `tool_use_id`         | `call_id`               |
| `stop_hook_active`    | `stop_hook_active`      |
| `agent_type`          | `agent_type`            |
| `file_path`           | `file_path`             |

---

## 4. Eventos Claude × OpenCode — Mapeamento

| Evento Claude         | Evento OpenCode                   | Status                |
| --------------------- | --------------------------------- | --------------------- |
| `PreToolUse`          | `tool.execute.before`             | ✅ mapeado            |
| `PostToolUse`         | `tool.execute.after`              | ✅ mapeado            |
| `PostToolUseFailure`  | `tool.execute.after`              | ⚠️ sem detecção falha |
| `Stop`                | `session.idle`                    | ✅ mapeado            |
| `SubagentStop`        | `tool.execute.after.subagent`     | ✅ mapeado            |
| `SessionStart`        | `session.created`                 | ✅ mapeado            |
| `SessionEnd`          | `session.deleted`                 | ✅ mapeado            |
| `UserPromptSubmit`    | `chat.message`                    | ✅ mapeado            |
| `PermissionRequest`   | `permission.asked`                | ✅ mapeado            |
| `PreCompact`          | `experimental.session.compacting` | ✅ mapeado            |
| `FileChanged`         | `file.watcher.updated`            | ✅ mapeado            |
| `Notification`        | ❌ sem equivalente em OpenCode    | ⚠️ unsupported        |
| `ConfigChange`        | ❌ sem equivalente em OpenCode    | ⚠️ unsupported        |
| `CwdChanged`          | ❌ sem equivalente em OpenCode    | ⚠️ unsupported        |
| `PostToolBatch`       | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `Setup`               | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `PermissionDenied`    | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `UserPromptExpansion` | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `SubagentStart`       | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `TaskCreated`         | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `TaskCompleted`       | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `TeammateIdle`        | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `WorktreeCreate`      | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `WorktreeRemove`      | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `InstructionsLoaded`  | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `Elicitation`         | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `ElicitationResult`   | ❌ não existe no OpenCode         | ⚠️ unsupported        |
| `StopFailure`         | ❌ não existe no OpenCode         | ⚠️ unsupported        |

---

## 5. Comparação com Romain (`romain325/opencode-hooks-plugin`)

Nossa implementação e a do Romain compartilham a mesma arquitetura geral.
Abaixo, as diferenças:

### O que Romain tem e NÓS NÃO temos (pendências)

| Funcionalidade     | Descrição                                    | Prioridade |
| ------------------ | -------------------------------------------- | ---------- |
| HTTP hooks         | `type: "http"` — POST pra URL                | 🟡 Média   |
| Prompt hooks       | `type: "prompt"` — LLM decide                | 🟢 Baixa   |
| Agent hooks        | `type: "agent"` — subagente decide           | 🟢 Baixa   |
| Env vars em hooks  | `OPENCODE_PROJECT_DIR`, `SESSION_ID`, etc    | 🟡 Média   |
| PostToolUseFailure | Detecta falha e mapeia evento certo          | 🟡 Média   |
| Slash commands     | `/hook-prompt` etc p/ eventos sem mapeamento | 🟢 Baixa   |

### O que NÓS temos e Romain NÃO tem

| Funcionalidade             | Descrição                                |
| -------------------------- | ---------------------------------------- |
| `permission_mode` no stdin | Enviamos, ele não                        |
| `buildOpencodeStdin`       | Scripts nativos (`source: 'native'`)     |
| Block system               | `block-handler.ts` com predicates        |
| Audit logging              | Log de eventos e scripts em JSON         |
| Toast notifications        | Notificações visuais no TUI              |
| Debug logging              | Log detalhado em arquivo                 |
| Subagent detection         | Detecta sessões filhas                   |
| Tool-specific config       | Configuração por tool (Bash, Write, etc) |
| File watcher events        | `file.watcher.updated` mapeado           |
| Permission events          | `permission.asked` mapeado               |
| Shell env events           | `shell.env` mapeado                      |
| LSP events                 | `lsp.client.diagnostics` etc             |

---

## 6. Checklist: Meu script do Claude Code vai funcionar?

### ✅ VAI FUNCIONAR se:

- O script usa apenas `session_id`, `cwd`, `hook_event_name`, `permission_mode`
- O script usa `tool_name` e `tool_input` (tool events)
- O script é do tipo `PreToolUse`, `PostToolUse`, `Stop`, `SessionStart`, `SessionEnd`

### ⚠️ PODE FUNCIONAR PARCIALMENTE se:

- Usa `tool_use_id` → ✅ adicionamos
- Usa `stop_hook_active` → ✅ adicionamos (estado local)
- Usa `file_path` → ✅ adicionamos (FileChanged)
- Usa `agent_type` → ✅ adicionamos (SubagentStop)

### ❌ NÃO VAI FUNCIONAR se:

- Depende de `transcript_path` (ex: `mempal_save_hook.sh` mineração automática)
- Depende de `last_assistant_message`
- Depende de `source` (startup/resume) do SessionStart
- Depende de `model` do SessionStart
- Depende de `duration_ms`
- É um evento não mapeado (ver seção 4)
- Usa `type: "http"`, `type: "prompt"`, ou `type: "agent"` (não implementado)

---

## 7. Exemplo: `mempal_save_hook.sh`

| O que o script faz                                | Funciona?                    |
| ------------------------------------------------- | ---------------------------- |
| Contar mensagens no transcript (`EXCHANGE_COUNT`) | ❌ sem `transcript_path`     |
| Minerar o transcript (`mempalace mine`)           | ❌ sem `transcript_path`     |
| Bloquear e pedir save com `stop_hook_active`      | ✅ com `stop_hook_active`    |
| Retornar JSON `{ decision: "block", reason }`     | ✅ `parseHookOutput` suporta |

**Resultado:** O script vai disparar o trigger de save, e o reason vai
aparecer pro modelo, que pode escrever diary entries. Mas a mineração
automática do JSONL não acontece.
