# Plano: Merge de 4 Fontes de Scripts (Claude + Native)

## Objetivo

Implementar merge de 4 origens de scripts com estratégia A (highest priority wins):

| #   | Fonte                     | source     | Stdin builder          | Priority  |
| --- | ------------------------- | ---------- | ---------------------- | --------- |
| 1   | `~/.claude/settings.json` | -          | `buildClaudeStdin()`   | 4 (baixa) |
| 2   | `./.claude/settings.json` | -          | `buildClaudeStdin()`   | 3         |
| 3   | `settings.ts` (claude)    | `'claude'` | `buildClaudeStdin()`   | 2         |
| 4   | `settings.ts` (native)    | `'native'` | `buildOpencodeStdin()` | 1 (alta)  |

---

## 1. Separação de Fontes em `claude-settings.ts`

### 1.1 Carregar global e local separadamente (~ linha 97)

```typescript
// Substituir loadClaudeSettings() atual
export function loadClaudeSettings(projectDir: string): {
  global: Record<string, ScriptEntry[]>;
  local: Record<string, ScriptEntry[]>;
  unsupported: string[];
} {
  const globalPath = path.join(os.homedir(), '.claude/settings.json');
  const localPath = path.join(projectDir, '.claude/settings.json');

  let globalHooks: Record<string, ClaudeHookGroup[]> | undefined;
  let localHooks: Record<string, ClaudeHookGroup[]> | undefined;

  if (fs.existsSync(globalPath)) {
    const globalSettings = JSON.parse(
      fs.readFileSync(globalPath, 'utf-8')
    ) as ClaudeSettings;
    globalHooks = globalSettings.hooks;
  }

  if (fs.existsSync(localPath)) {
    const localSettings = JSON.parse(
      fs.readFileSync(localPath, 'utf-8')
    ) as ClaudeSettings;
    localHooks = localSettings.hooks;
  }

  // Retornar separado (sem merge ainda)
  const globalScripts = mapAllHooksToOpenCode(globalHooks, globalPath);
  const localScripts = mapAllHooksToOpenCode(localHooks, localPath);

  return {
    global: globalScripts,
    local: localScripts,
    unsupported: [],
  };
}

function mapAllHooksToOpenCode(
  hooks: Record<string, ClaudeHookGroup[]> | undefined,
  projectDir: string
): Record<string, ScriptEntry[]> {
  if (!hooks) return {};
  const result: Record<string, ScriptEntry[]> = {};
  // ... map like before
  return result;
}
```

---

## 2. Atualizar `context.ts` (~ linha 50)

### 2.1 Expor global e local separadamente

```typescript
getClaudeScripts: (projectDir: string) => {
  if (!userConfig.loadClaudeHookSettings.enabled) {
    return { global: {}, local: {}, all: {} };
  }
  const result = loadClaudeSettings(projectDir);
  // Merge local > global para "all"
  const all = mergeStrategyA(result.global, result.local);
  return { global: result.global, local: result.local, all };
},
```

---

## 3. Novo merge em `scripts.ts` (~ linha 40)

### 3.1 Criar mergeAllScripts()

```typescript
export function mergeAllScripts(
  nativeScripts: ScriptEntry[], // source: 'native' (priority 1)
  claudeSettingsScripts: ScriptEntry[], // source: 'claude' de settings.ts (priority 2)
  claudeGlobalScripts: ScriptEntry[], // do ~/.claude/ (priority 3)
  claudeLocalScripts: ScriptEntry[] // do .claude/ do projeto (priority 4)
): ScriptEntry[] {
  // Estratégia A: priority inverte a ordem
  // later = higher priority = deve sobrescrever earlier
  // então adicionamos na ordem: lowest → highest
  return [
    ...claudeGlobalScripts, // priority 4 (baixa)
    ...claudeLocalScripts, // priority 3
    ...claudeSettingsScripts, // priority 2
    ...nativeScripts, // priority 1 (alta)
  ];
}
```

---

## 4. Atualizar `tool-config.resolver.ts` (~ linha 185)

### 4.1 Separar scripts por source e chamar mergeAllScripts

```typescript
// Separar scripts por source
const nativeScripts = scripts.filter((s) => s.source === 'native');
const claudeSettingsScripts = scripts.filter((s) => s.source === 'claude');

// Obter global e local do Claude
const projectDir = this.context.getProjectDir(input);
const { global: claudeGlobalScripts, local: claudeLocalScripts } =
  this.context.getClaudeScripts(projectDir);

// Merge das 4 fontes
const mergedScripts = mergeAllScripts(
  nativeScripts,
  claudeSettingsScripts,
  claudeGlobalScripts,
  claudeLocalScripts
);
```

---

## 5. Arquivos a Modificar

| Arquivo                                             | Ação      | Linhas   |
| --------------------------------------------------- | --------- | -------- |
| `config/claude-settings.ts`                         | Modificar | ~97-130  |
| `features/events/context.ts`                        | Modificar | ~50-65   |
| `features/events/resolution/scripts.ts`             | Modificar | ~40-60   |
| `features/events/resolvers/tool-config.resolver.ts` | Modificar | ~185-220 |

---

## 6. Ordem de Implementação

1. **claude-settings.ts** — Separar global/local return
2. **context.ts** — Expor { global, local, all }
3. **scripts.ts** — Criar mergeAllScripts()
4. **tool-config.resolver.ts** — Usar mergeAllScripts()

---

## 7. Validação

Após implementar:

- Build passar
- Testes passarem
- Logs mostrarem scripts de todas as 4 origens

## 8. Nota: Stdin Builders

| source   | stdin builder        |
| -------- | -------------------- |
| 'native' | buildOpencodeStdin() |
| 'claude' | buildClaudeStdin()   |

O executor já 选择 o builder baseado em `scriptEntry.source`.
