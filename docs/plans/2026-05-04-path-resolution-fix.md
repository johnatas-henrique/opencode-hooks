# Plano: Correção do Path Resolution para Claude Hooks

## Problema

Scripts em `.claude/settings.json` usam paths com `$CLAUDE_PROJECT_DIR`:

```json
"command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit-verify.sh"
```

O OpenCode Hooks não expande esse placeholder. Resultado:

- `resolveScriptPath()` concatena com `./scripts/`
- Fica `./scripts/$CLAUDE_PROJECT_DIR/.claude/hooks/...` (path inválido)
- `spawn()` falha: "ENOENT no such file or directory"

## Solução

1. Expandir `$CLAUDE_PROJECT_DIR` no valor do `command` → path absoluto
2. `resolveScriptPath()` detectar paths absolutos e retornar direto
3. Remover bloqueio de paths absolutos no `validateScriptPath()`

---

## Alterações

### 1. `config/claude-settings.ts`

**A. `extractCommandPath()` - expandir $CLAUDE_PROJECT_DIR**

```typescript
// ANTES:
function extractCommandPath(command: string): string {
  const trimmed = command.trim();
  if (trimmed.startsWith('node ')) return trimmed.slice(5).trim();
  if (trimmed.startsWith('bash ')) return trimmed.slice(5).trim();
  return trimmed;
}

// DEPOIS:
function extractCommandPath(command: string, projectDir: string): string {
  let trimmed = command.trim();
  // Expande $CLAUDE_PROJECT_DIR para o path real do projeto
  if (projectDir) {
    trimmed = trimmed.replace(
      /\$CLAUDE_PROJECT_DIR|\$\{CLAUDE_PROJECT_DIR\}/g,
      projectDir
    );
  }
  if (trimmed.startsWith('node ')) trimmed = trimmed.slice(5).trim();
  if (trimmed.startsWith('bash ')) trimmed = trimmed.slice(5).trim();
  return trimmed;
}
```

**B. `mapClaudeHookToOpenCode()` - receber e repassar projectDir**

```typescript
// ANTES:
export function mapClaudeHookToOpenCode(
  claudeEventName: string,
  hookGroup: ClaudeHookGroup
);

// DEPOIS:
export function mapClaudeHookToOpenCode(
  claudeEventName: string,
  hookGroup: ClaudeHookGroup,
  projectDir: string // NOVO
);
```

E na linha que chama `extractCommandPath()`, pasar o `projectDir`.

**C. `loadClaudeSettings()` - repassar projectDir na chamada**

Na linha que chama `mapClaudeHookToOpenCode()`, pasar o `projectDir`.

---

### 2. `features/scripts/executor.ts`

**D. `resolveScriptPath()` - detectar absolute e retornar direto**

```typescript
// ANTES:
export function resolveScriptPath(scriptPath: string): string {
  const scriptsDir = path.join(process.cwd(), DEFAULTS.scripts.dir);
  return path.join(scriptsDir, scriptPath);
}

// DEPOIS:
export function resolveScriptPath(scriptPath: string): string {
  // Paths absolutos (do .claude/settings.json) → usar direto
  if (path.isAbsolute(scriptPath)) {
    return scriptPath;
  }
  // Paths relativos (scripts nativos) → resolver em ./scripts/
  const scriptsDir = path.join(process.cwd(), DEFAULTS.scripts.dir);
  return path.join(scriptsDir, scriptPath);
}
```

**E. `validateScriptPath()` - permitir absolutos**

```typescript
// ANTES:
export const validateScriptPath = (scriptPath: string): boolean => {
  if (!scriptPath || typeof scriptPath !== 'string') return false;
  if (scriptPath.includes('..')) return false;
  if (scriptPath.startsWith('/') || scriptPath.startsWith('~')) return false;
  if (/^[a-zA-Z]:\\/.test(scriptPath)) return false;
  if (scriptPath.includes('\\')) return false;
  return true;
};

// DEPOIS:
// Remover check de startsWith('/') e startsWith('~')
export const validateScriptPath = (scriptPath: string): boolean => {
  if (!scriptPath || typeof scriptPath !== 'string') return false;
  if (scriptPath.includes('..')) return false;
  if (/^[a-zA-Z]:\\/.test(scriptPath)) return false; // Windows only
  if (scriptPath.includes('\\')) return false;
  return true;
};
```

---

## Fluxo Resultante

```
Settings.json: "$CLAUDE_PROJECT_DIR/.claude/hooks/post-edit-verify.sh"
projectDir:    "/home/johnatas/projects/opencode-hooks"

1. extractCommandPath(cmd, projectDir)
   → "/home/johnatas/projects/opencode-hooks/.claude/hooks/post-edit-verify.sh"

2. validateScriptPath(path)
   → true (absoluto permitido agora)

3. resolveScriptPath(path)
   → path.isAbsolute() → true
   → retorna "/home/johnatas/.../.claude/hooks/post-edit-verify.sh" direto

4. spawn(path)
   → executa arquivo real, existe, tem 755
   → FUNCIONA!
```

---

## Arquivos Modificados

| Arquivo                                          | Mudanças                                   |
| ------------------------------------------------ | ------------------------------------------ |
| `.opencode/plugins/config/claude-settings.ts`    | 3 (função +2 parametros +2 chamadas)       |
| `.opencode/plugins/features/scripts/executor.ts` | 2 (resolveScriptPath + validateScriptPath) |
