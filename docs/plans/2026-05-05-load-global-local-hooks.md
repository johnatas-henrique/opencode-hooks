# Plano: LoadClaudeHookSettings com Duas Chaves

## Objetivo

Separar `loadClaudeHookSettings` em duas chaves obrigatórias:

- `loadGlobalClaudeHooks`: carrega `~/.claude/settings.json`
- `loadLocalClaudeHooks`: carrega `.claude/settings.json` do projeto

## Decisões Tomadas

### 1. Tipo da Config

```typescript
interface LoadClaudeHookSettings {
  loadGlobalClaudeHooks: boolean;
  loadLocalClaudeHooks: boolean;
}
```

### 2. Defaults

Ambas `true` (compatível com comportamento atual).

### 3. Precedence (estratégia A, priority alta wins)

| Priority  | Fonte                      | Ativação                      |
| --------- | -------------------------- | ----------------------------- |
| 4 (alta)  | `settings.ts` (`native`)   | Manual em settings.ts         |
| 3         | `settings.ts` (`claude`)   | Manual em settings.ts         |
| 2         | Global (`~/.claude/`)      | `loadGlobalClaudeHooks: true` |
| 1 (baixa) | Local (`.claude/` projeto) | `loadLocalClaudeHooks: true`  |

**Ordem de merge:** `[local, global, settings.claude, settings.native]`
→ priority alta sobrescreve baixa

---

## 1. Tipo (types/config.ts)

Arquivo: `.opencode/plugins/types/config.ts`

Adicionar/modificar:

```typescript
interface LoadClaudeHookSettings {
  loadGlobalClaudeHooks: boolean;
  loadLocalClaudeHooks: boolean;
}
```

---

## 2. Defaults (config/settings.ts)

Arquivo: `.opencode/plugins/config/settings.ts`

Modificar:

```typescript
loadClaudeHookSettings: {
  loadGlobalClaudeHooks: true,
  loadLocalClaudeHooks: true
}
```

---

## 3. claude-settings.ts

Arquivo: `.opencode/plugins/config/claude-settings.ts`

Modificar para aceitar parâmetros:

```typescript
export function loadClaudeSettings(
  projectDir: string,
  opts?: { loadGlobal?: boolean; loadLocal?: boolean }
): {
  global: Record<string, ScriptEntry[]>;
  local: Record<string, ScriptEntry[]>;
  all: Record<string, ScriptEntry[]>;
  unsupported: string[];
} {
  const loadGlobal = opts?.loadGlobal ?? true;
  const loadLocal = opts?.loadLocal ?? true;

  const globalPath = path.join(os.homedir(), '.claude/settings.json');
  const localPath = path.join(projectDir, '.claude/settings.json');

  let globalHooks: Record<string, ClaudeHookGroup[]> | undefined;
  let localHooks: Record<string, ClaudeHookGroup[]> | undefined;

  if (loadGlobal && fs.existsSync(globalPath)) {
    const globalSettings = JSON.parse(
      fs.readFileSync(globalPath, 'utf-8')
    ) as ClaudeSettings;
    globalHooks = globalSettings.hooks;
  }

  if (loadLocal && fs.existsSync(localPath)) {
    const localSettings = JSON.parse(
      fs.readFileSync(localPath, 'utf-8')
    ) as ClaudeSettings;
    localHooks = localSettings.hooks;
  }

  // Mapear cada fonte separadamente
  const globalScripts = mapAllHooksToOpenCode(globalHooks, projectDir);
  const localScripts = mapAllHooksToOpenCode(localHooks, projectDir);

  // Estratégia A: global > local (priority 2 > priority 1)
  const mergedHooks = mergeHooksStrategyA(globalHooks, localHooks);
  const allScripts = mapAllHooksToOpenCode(mergedHooks, projectDir);

  // unsupported calculation ...

  return {
    global: globalScripts,
    local: localScripts,
    all: allScripts,
    unsupported,
  };
}
```

---

## 4. context.ts

Arquivo: `.opencode/plugins/features/events/context.ts`

Modificar para passar as chaves:

```typescript
getClaudeScripts: (projectDir: string) => {
  const { loadGlobalClaudeHooks, loadLocalClaudeHooks } =
    userConfig.loadClaudeHookSettings;

  if (!loadGlobalClaudeHooks && !loadLocalClaudeHooks) {
    return { global: {}, local: {}, all: {} };
  }

  return loadClaudeSettings(projectDir, {
    loadGlobal: loadGlobalClaudeHooks,
    loadLocal: loadLocalClaudeHooks,
  });
},
```

---

## 5. event-config-builder.ts

Arquivo: `.opencode/plugins/features/events/resolvers/event-config-builder.ts`

Modificar para aplicar merge com precedence:

```typescript
// Obter scripts de cada fonte
const settingsNative = scripts.filter((s) => s.source === 'native');
const settingsClaude = scripts.filter((s) => s.source === 'claude');

// scripts das pastas (já com precedence aplicado via all)
const projectDir = this.context.getProjectDir(input);
const { global: claudeGlobalScripts, local: claudeLocalScripts } =
  this.context.getClaudeScripts(projectDir);

// Merge precedence: [local, global, settings.claude, settings.native]
const mergedScripts = [
  ...claudeLocalScripts,
  ...claudeGlobalScripts,
  ...settingsClaude,
  ...settingsNative,
];
```

---

## 6. tool-config.resolver.ts

Arquivo: `.opencode/plugins/features/events/resolvers/tool-config.resolver.ts`

Mesmo merge que event-config-builder.ts.

---

## 7. Arquivos a Modificar

| #   | Arquivo                                        | Mudança                       |
| --- | ---------------------------------------------- | ----------------------------- |
| 1   | `.opencode/plugins/types/config.ts`            | Tipo LoadClaudeHookSettings   |
| 2   | `.opencode/plugins/config/settings.ts`         | Defaults loadGlobal/Local     |
| 3   | `.opencode/plugins/config/claude-settings.ts`  | Aceitar opts loadGlobal/Local |
| 4   | `.opencode/plugins/features/events/context.ts` | Passar chaves ao loader       |
| 5   | `event-config-builder.ts`                      | Merge precedence              |
| 6   | `tool-config.resolver.ts`                      | Merge precedence              |
| 7   | Testes relacionados                            | Ajustar mocks                 |

---

## 8. Ordem de Implementação

1. **types/config.ts** — Novo tipo
2. **config/settings.ts** — Defaults
3. **claude-settings.ts** — Aceitar opts
4. **context.ts** — Passar chaves
5. **event-config-builder.ts** — Merge
6. **tool-config.resolver.ts** — Merge
7. **Testes** — Ajustar

---

## 9. Validação

- Build passar
- Lint passar
- Testes passarem
- Reiniciar plugin
- Verificar logs mostrando scripts das 4 origens

---

## 10. Nota: Stdin Builders

| source   | stdin builder        |
| -------- | -------------------- |
| 'native' | buildOpencodeStdin() |
| 'claude' | buildClaudeStdin()   |

O executor já seleciona o builder baseado em `scriptEntry.source`.
