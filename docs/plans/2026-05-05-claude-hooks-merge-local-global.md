# Plano: Merge Global + Local de Claude Code Hooks

## Objetivo

Implementar merge de hooks do Claude Code onde **Local substitui Global** (estratégia A).

---

## Problema Atual

- Hooks do **global** (`~/.claude/settings.json`) estão executando
- Hooks do **local** (`.claude/settings.json` do projeto) **NÃO** estão executando
- `process.cwd()` usado no init pode não apontar pro projeto correto

---

## Causa Raiz

A função `loadClaudeSettings()` é chamada uma vez no init (linha 45-53 em `context.ts`), mas:

- Pode estar usando `process.cwd()` que nem sempre é o diretório do projeto
- O cache não é invalidado quando o evento traz um `cwd` diferente

**Solução:** Buscar `cwd` do input.properties por evento, não no init.

---

## Implementação

### 1. Atualizar `claude-settings.ts` — Estratégia de Merge A

```typescript
// ANTES (linha 27-52): deepMerge simples
// DEPOIS: merge com estratégia A (local override global)

function loadClaudeSettings(projectDir: string): ClaudeSettings {
  // Hierarquia: global < local < local-override
  const globalSettings = path.join(os.homedir(), '.claude/settings.json');
  const localSettings = path.join(projectDir, '.claude/settings.json');
  const localOverride = path.join(projectDir, '.claude/settings.local.json');

  const files = [
    { path: globalSettings, priority: 0 }, // Global: mais fraco
    { path: localSettings, priority: 1 }, // Local: override global
    { path: localOverride, priority: 2 }, // Override: mais forte
  ];

  // Estratégia A: maior priority wins (local override global)
  // Merge campos específicos, não replace total
  const merged: ClaudeSettings = {};
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      const content = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
      // Merge com estratégia A:
      // - Se same hook em both: local (higher priority) wins
      // - Se same matcher in same hook: local wins
      merged.hooks = mergeHooks(merged.hooks, content.hooks, file.priority);
    }
  }
  return merged;
}

function mergeHooks(
  existing: Record<string, ClaudeHookGroup[]> | undefined,
  incoming: Record<string, ClaudeHookGroup[]> | undefined,
  incomingPriority: number
): Record<string, ClaudeHookGroup[]> {
  // Estratégia A: incoming override existing if same key
}
```

### 2. Atualizar `context.ts` — Buscar projectDir por evento

```typescript
// ANTES: Called once at init (linha 48-54)
// DEPOIS: Buscar cwd por evento, não no init

getClaudeScripts: (projectDir: string) => {
  // Chamar loadClaudeSettings(projectDir) a cada chamada
  // Não usar cache antigo (pode estar errado)
  if (!userConfig.loadClaudeHookSettings.enabled) return {};
  const result = loadClaudeSettings(projectDir);
  return result.hooks;
};
```

### 3. Atualizar `event-config-builder.ts` e `tool-config.resolver.ts`

Passar o `projectDir` correto para `getClaudeScripts()`:

```typescript
// tool-config.resolver.ts:281
this.context.getClaudeScripts(context.getProjectDir(input));
```

---

## Resumo das Mudanças

| Arquivo                          | Linha     | Mudança                        |
| -------------------------------- | --------- | ------------------------------ |
| `config/claude-settings.ts`      | ~207      | Implementar merge estratégia A |
| `features/events/context.ts`     | 48-54     | Não usar cache no init         |
| `features/events/resolvers/*.ts` | ~60, ~215 | Passar projectDir por evento   |

---

## Teste

Após implementar, verificar em `plugin-scripts.json`:

- Scripts do global: `/home/johnatas/.claude/hooks/...` ✓ (já funciona)
- Scripts do local: `/home/.../opencode-hooks/.claude/hooks/...` (deve aparecer)

Exemplo no log esperado:

```json
{"script": "/home/johnatas/projects/opencode-hooks/.claude/hooks/post-edit-verify.sh", ...}
{"script": "/home/johnatas/.claude/hooks/peon-ping/...", ...}
```
