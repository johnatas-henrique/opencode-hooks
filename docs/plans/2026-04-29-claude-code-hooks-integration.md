# Plano: Integração de Scripts Claude Code no OpenCode Hooks

## Objetivo

Adicionar suporte a scripts do Claude Code (`.sh`) no plugin opencode-hooks, mantendo compatibilidade com scripts nativos.

---

## 1. Novos Tipos (types/config.ts)

```typescript
export interface ScriptEntry {
  source: 'native' | 'claude';
  path: string;
  matcher?: string; // regex para filtrar tool (ex: "Bash|Write")
  async?: boolean; // executar em background
  timeout?: number; // timeout em ms
}

export interface ClaudeHookSettings {
  enabled: boolean; // ler .claude/settings.json?
}

export interface UserEventsConfig {
  // ... campos existentes
  loadClaudeHookSettings: ClaudeHookSettings;
  events: Record<string, EventOverride & { scripts?: ScriptEntry[] }>;
}
```

---

## 2. Parser Universal de Output (executor.ts)

Suporte a **todos** os formatos documentados:

```typescript
interface HookResult {
  action: 'allow' | 'block' | 'error';
  reason?: string;
  updatedInput?: Record<string, unknown>;
  additionalContext?: string;
  systemMessage?: string;
}

function parseHookOutput(
  stdout: string,
  stderr: string,
  exitCode: number
): HookResult {
  // Exit 2 = block imediato
  if (exitCode === 2) {
    return { action: 'block', reason: stderr || 'Blocked by exit code 2' };
  }

  // Exit não-zero e não-2 = erro não-bloqueante
  if (exitCode !== 0) {
    return { action: 'error', reason: `Exit code ${exitCode}: ${stderr}` };
  }

  // Parse JSON do stdout
  let output: Record<string, unknown> = {};
  try {
    output = JSON.parse(stdout.trim());
  } catch {
    return { action: 'allow' }; // stdout vazio ou inválido
  }

  // PreToolUse: permissionDecision === "deny"
  const hookSpecific = output.hookSpecificOutput as
    | Record<string, unknown>
    | undefined;
  if (hookSpecific?.permissionDecision === 'deny') {
    return {
      action: 'block',
      reason: hookSpecific.permissionDecisionReason as string,
      updatedInput: hookSpecific.updatedInput as Record<string, unknown>,
    };
  }

  // Stop/SubagentStop/ConfigChange: decision === "block"
  if (output.decision === 'block') {
    return {
      action: 'block',
      reason: output.reason as string,
    };
  }

  // Universal: continue === false
  if (output.continue === false) {
    return {
      action: 'block',
      reason: output.stopReason as string,
    };
  }

  // Universal: ok === false (prompt/agent hooks)
  if (output.ok === false) {
    return {
      action: 'block',
      reason: output.reason as string,
    };
  }

  // Allow com contexto extra
  return {
    action: 'allow',
    updatedInput: hookSpecific?.updatedInput as Record<string, unknown>,
    additionalContext: (hookSpecific?.additionalContext ||
      output.additionalContext) as string,
    systemMessage: output.systemMessage as string,
  };
}
```

---

## 3. Formatador de Stdin (executor.ts)

Criar JSON no formato Claude Code para scripts com `source: 'claude'`:

```typescript
function buildClaudeStdin(
  eventType: string,
  toolName: string,
  input: Record<string, unknown>
): Record<string, unknown> {
  const base = {
    hook_event_name: eventType,
    session_id: input.sessionID,
    cwd: process.cwd(),
    permission_mode: 'default', // ou ler do contexto
  };

  // Adicionar campos específicos do tool
  if (toolName) {
    base.tool_name = toolName;
    base.tool_input = input.args || {};
  }

  return base;
}
```

---

## 4. Executor Atualizado (executor.ts)

```typescript
async function executeScript(
  scriptEntry: ScriptEntry,
  eventType: string,
  toolName: string,
  input: Record<string, unknown>,
  output?: Record<string, unknown>
): Promise<HookResult> {
  const scriptPath = resolveScriptPath(scriptEntry.path);

  // Preparar stdin se for claude source
  let stdin: string | undefined;
  if (scriptEntry.source === 'claude') {
    const stdinData = buildClaudeStdin(eventType, toolName, input);
    stdin = JSON.stringify(stdinData);
  }

  // Preparar args se for native source
  const args =
    scriptEntry.source === 'native' ? buildNativeArgs(input, output) : [];

  // Executar
  const proc = spawn(scriptPath, args, {
    stdio: stdin ? ['pipe', 'pipe', 'pipe'] : 'inherit',
    env: { ...process.env, CLAUDE_PLUGIN_ROOT: getPluginRoot() },
  });

  if (stdin) {
    proc.stdin.write(stdin);
    proc.stdin.end();
  }

  // Coletar stdout/stderr
  const chunks: Buffer[] = [];
  proc.stdout.on('data', (d) => chunks.push(d));
  // ... similar para stderr

  return new Promise((resolve) => {
    proc.on('close', (code) => {
      const stdout = Buffer.concat(chunks).toString();
      const stderr = Buffer.concat(errChunks).toString();
      resolve(parseHookOutput(stdout, stderr, code));
    });
  });
}
```

---

## 5. Leitura de .claude/settings.json

```typescript
// config/claude-settings.ts
interface ClaudeSettings {
  hooks?: Record<string, ClaudeHookGroup[]>;
  disableAllHooks?: boolean;
}

async function loadClaudeSettings(projectDir: string): Promise<ClaudeSettings> {
  const hierarchy = [
    path.join(os.homedir(), '.claude/settings.json'),
    path.join(projectDir, '.claude/settings.json'),
    path.join(projectDir, '.claude/settings.local.json'),
  ];

  let merged: ClaudeSettings = {};
  for (const file of hierarchy) {
    if (existsSync(file)) {
      const content = readFileSync(file, 'utf-8');
      merged = deepMerge(merged, JSON.parse(content));
    }
  }

  return merged;
}

// Mapear hooks do Claude para eventos do OpenCode
function mapClaudeHookToOpenCode(claudeHook: ClaudeHookGroup): ScriptEntry[] {
  // Ex: PreToolUse → tool.execute.before
  // Ex: PostToolUse → tool.execute.after
  return claudeHook.hooks.map((h) => ({
    source: 'claude' as const,
    path: extractCommandPath(h.command),
    matcher: claudeHook.matcher,
    async: h.async,
    timeout: h.timeout,
  }));
}
```

---

## 6. Migração de Predicates → Scripts

Deletar `config/security-rules.ts` e criar scripts equivalentes:

| Predicate Atual        | Script Novo                 | Evento                |
| ---------------------- | --------------------------- | --------------------- |
| `blockEnvFiles`        | `block-env-files.sh`        | `tool.execute.before` |
| `blockGitForce`        | `block-git-force.sh`        | `tool.execute.before` |
| `blockProtectedBranch` | `block-protected-branch.sh` | `tool.execute.before` |
| `blockNoVerify`        | `block-no-verify.sh`        | `tool.execute.before` |
| `blockByPath`          | `block-by-path.sh`          | `tool.execute.before` |
| `blockScriptsFailed`   | (remover - lógica interna)  | -                     |

Formato do script (ex: `block-env-files.sh`):

```bash
#!/bin/bash
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Block .env file access
if echo "$COMMAND" | grep -qE '(^|[[:space:];&|])(cat|less|head|tail|more|source|grep|sed|awk|bat)([[:space:]][^;&|>]*)?[[:space:]]([^[:space:];&|>]*/)?\.env([[:space:];&|>]|$)'; then
  jq -n --arg r "Blocked .env file access" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $r
    }
  }'
  exit 0
fi

exit 0
```

---

## 7. Atualização de config/settings.ts

```typescript
export const userConfig: UserEventsConfig = {
  enabled: true,
  loadClaudeHookSettings: { enabled: false }, // default: off

  events: {
    'tool.execute.before': {
      scripts: [
        { source: 'native', path: 'format.sh' },
        { source: 'claude', path: 'block-env-files.sh' },
      ],
    },
    'tool.execute.after': {
      scripts: [{ source: 'native', path: 'log-tool.sh' }],
    },
  },

  tools: {
    'tool.execute.before': {
      bash: {
        scripts: [
          { source: 'claude', path: 'block-destructive.sh', matcher: 'Bash' },
        ],
      },
      write: {
        scripts: [{ source: 'native', path: 'validate-write.sh' }],
      },
    },
  },
};
```

---

## 8. Mapeamento de Eventos (Para Referência)

| Claude Code Hook   | OpenCode Evento                   | Suportado?  |
| ------------------ | --------------------------------- | ----------- |
| PreToolUse         | `tool.execute.before`             | ✅          |
| PostToolUse        | `tool.execute.after`              | ✅          |
| PostToolUseFailure | `tool.execute.after` (com erro)   | ✅          |
| Stop               | `session.status` (completed/idle) | ⚠️ Indireto |
| SubagentStop       | `tool.execute.after.subagent`     | ✅          |
| SessionStart       | `session.created`                 | ✅          |
| SessionEnd         | `session.deleted`                 | ✅          |
| PreCompact         | `experimental.session.compacting` | ✅          |
| UserPromptSubmit   | `chat.message`                    | ✅          |
| PermissionRequest  | `permission.asked`                | ✅          |
| Notification       | ❌ NÃO EXISTE                     | ❌          |
| ConfigChange       | ❌ NÃO EXISTE                     | ❌          |
| CwdChanged         | ❌ NÃO EXISTE                     | ❌          |
| FileChanged        | `file.watcher.updated`            | ✅          |

---

## 9. Ordem de Implementação

1. **Tipos** - Adicionar `ScriptEntry`, `ClaudeHookSettings` em `types/config.ts`
2. **Executor** - Refatorar `executor.ts` com novo parser e suporte a stdin
3. **Stdin builder** - Criar `buildClaudeStdin()` em `executor.ts`
4. **Claude settings** - Criar `config/claude-settings.ts` para ler hierarquia
5. **Event handler** - Atualizar `opencode-hooks.ts` para usar novos scripts
6. **Migrar predicates** - Criar scripts e deletar `security-rules.ts`
7. **Atualizar config** - Modificar `config/settings.ts` com novo formato
8. **Testes** - Adicionar testes para Claude Code hooks

---

## 10. Arquivos a Serem Criados/Modificados

| Arquivo                             | Ação      | Descrição                      |
| ----------------------------------- | --------- | ------------------------------ |
| `types/config.ts`                   | Modificar | Adicionar novos tipos          |
| `executor.ts`                       | Modificar | Novo parser + stdin + executor |
| `config/claude-settings.ts`         | Criar     | Leitura .claude/settings.json  |
| `scripts/block-env-files.sh`        | Criar     | Migrar predicate               |
| `scripts/block-git-force.sh`        | Criar     | Migrar predicate               |
| `scripts/block-protected-branch.sh` | Criar     | Migrar predicate               |
| `scripts/block-no-verify.sh`        | Criar     | Migrar predicate               |
| `config/security-rules.ts`          | Deletar   | Migrado para scripts           |
| `config/settings.ts`                | Modificar | Novo formato de scripts        |
| `opencode-hooks.ts`                 | Modificar | Integrar novos scripts         |

---

---

## Decisões do Grill-Me (2026-04-29)

### 1. Tipos e Compatibilidade

- **Quebra seca (hard break):** `scripts` aceita apenas `ScriptEntry[]` (formato `{ source, path }`). Strings simples (`'script.sh'`) não são mais suportadas.
- `matcher` permanece no `ScriptEntry` para compatibilidade direta com `.claude/settings.json`.

### 2. Parser Universal

- `exit code 2` = block imediato (antes de parse JSON). Scripts native também podem usar exit 2.
- `updatedInput` do Claude Code é mesclado no `output.args`: `output.args = { ...output.args, ...updatedInput }`.
- `systemMessage` é ignorado silenciosamente (SDK não suporta).

### 3. Mapeamentos

- **`EVENT_NAME_MAP`:** OpenCode event → Claude `hook_event_name`.
  - `tool.execute.before` → `PreToolUse`
  - `tool.execute.after` → `PostToolUse`
  - `tool.execute.after.subagent` → `SubagentStop`
  - `session.created` → `SessionStart`
  - `session.deleted` → `SessionEnd`
  - `session.idle` → `Stop` (usar `session.idle`, não `session.status`)
  - `chat.message` → `UserPromptSubmit`
  - `permission.asked` → `PermissionRequest`
  - `experimental.session.compacting` → `PreCompact`
  - `file.watcher.updated` → `FileChanged`

- **`TOOL_FIELD_MAP`:** Tradução de campos entre Claude e OpenCode (expandir sob demanda).
  ```typescript
  const TOOL_FIELD_MAP: Record<string, Record<string, string>> = {
    Bash: { command: 'command' },
    Write: { file_path: 'filePath', content: 'content' },
    // ... expandir conforme necessário
  };
  ```

### 4. Executor e Scripts

- Criar novo executor suportando native/claude. Apagar `run-script.ts` antigo após migração.
- **`async: true`:** Fire-and-forget. Spawn sem aguardar `close`. Log de auditoria registra início, mas não resultado. Timeout é irrelevante.
- Scripts migrados de predicates usam formato Claude JSON (`hookSpecificOutput.permissionDecision: "deny"`) para reuso do `parseHookOutput()`.

### 5. Carregamento de Settings

- `loadClaudeHookSettings: { enabled: true }` faz **merge automático**:
  - Scripts do `settings.ts` (usuário) = prioridade alta.
  - Scripts do `.claude/settings.json` = prioridade baixa (complemento).
- Eventos sem equivalente (`Notification`, `ConfigChange`, `CwdChanged`) geram warning no log de auditoria (`plugin-scripts.json`).

### 6. Atualizações de Tipos

- `EventOverride.scripts` e `ToolOverride.scripts` mudam de `string[]` para `ScriptEntry[]`.
- Resolvers (`tool-config.resolver.ts`, `event-config-builder.ts`) atualizados para tratar `ScriptEntry`.

### 7. Testes

- **Fase 1:** Testes unitários (`parseHookOutput`, `buildClaudeStdin`, `TOOL_FIELD_MAP`).
- **Fase 2:** Testes de integração para `loadClaudeSettings` e mapeamentos.

---

**Plano atualizado.** Deseja que eu implemente?
