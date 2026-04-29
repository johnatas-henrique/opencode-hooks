# RFC: Script Executor - Deep Module Refactor

## Problema

A função `runScriptAndHandle` (116 linhas) mistura 6 responsabilidades:

1. Execução de script
2. Gating runOnlyOnce
3. Erros e toast notifications
4. Audit logging
5. Session appending
6. Retorno de resultado

Isso dificulta testes, espalha lógica e força handlers a montarem mesmo objeto repetidamente.

## Arquivos envolvidos

- `.opencode/plugins/features/scripts/run-script-handler.ts` (função atual)
- `.opencode/plugins/features/scripts/script-runner.ts` (novo módulo)
- `test/unit/script-runner.test.ts` (novos testes)

## Constraints

- Não quebrar código existente: `runScriptAndHandle` deve permanecer intacta
- Comportamento idêntico ao scenario atual
- Tipos obrigatórios (mínimo uso de `??`)
- Seguir arquitetura: features em `features/scripts/`

## Design Recomendado

Factory `createScriptRunner` que captura dependências na inicialização e retorna uma função `runScript(script, arg?, options?)`.

### Interface

```ts
export interface ScriptRunnerDeps {
  ctx: PluginInput;
  sessionId: string;
  eventType: string;
  resolved: ResolvedEventConfig;
  scriptToasts: ScriptToastsConfig;
  scriptRecorder?: ScriptRecorder;
  toolName?: string;
}

export interface RunScriptOptions {
  suppressToast?: boolean;
  skipAudit?: boolean;
  skipSession?: boolean;
  runOnlyOnce?: boolean;
}

export function createScriptRunner(
  deps: ScriptRunnerDeps
): (
  script: string,
  arg?: string,
  opts?: RunScriptOptions
) => Promise<ScriptExecutionResult>;
```

### Como funciona

- A factory captura `ctx`, `sessionId`, `eventType`, `resolved`, `scriptToasts`, `scriptRecorder`, `toolName`
- A função retornada:
  - Recebe `script`, `arg` (opcional) e `options` (opcional)
  - Constrói `EventScriptConfig` com clones de `deps` + overrides das `options`
  - Chama `runScriptAndHandle` original (wrapper)
  - Retorna exatamente o mesmo `{ script, output }`

### Exemplo

```ts
// Setup único (ex: no plugin init)
const record = createScriptRunner({
  ctx,
  sessionId: ctx.session.id,
  eventType: 'tool.execute.after',
  resolved: config.resolved,
  scriptToasts: config.scriptToasts,
  scriptRecorder: recorder,
  toolName: 'deploy',
});

// Uso comum em handler
await record('deploy.sh', '--prod'); // 1 linha
```

### Trade-offs

- ✅ Reduz boilerplate; simplifica handlers
- ✅ Centraliza construção de config
- ✅ Testável em isolamento
- ✅ Não quebra nada existente
- ❌ Adiciona camada extra (mas leve)
- ❌ Dependências capturadas por closure

## Próximos passos

- [x] Implementar `script-runner.ts`
- [x] Escrever testes unitários
- [ ] Migrar handlers? (futuro opcional)
