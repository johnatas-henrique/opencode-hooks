# 2026-04-12: tool.execute.before - Blocking Actions

## Execution

| Step                                                               | Status | Timestamp        |
| ------------------------------------------------------------------ | ------ | ---------------- |
| 1. Add BlockCheck, ScriptResult, BlockPredicate types to config.ts | ✅     | 2026-04-13 00:45 |
| 2. Create block-handler.ts with executeBlocking logic              | ✅     | 2026-04-13 00:50 |
| 3. Add BLOCKED_EVENTS_LOG_FILE constant to constants.ts            | ✅     | 2026-04-13 01:10 |
| 4. Integrate blocking into executeHook in opencode-hooks.ts        | ✅     | 2026-04-13 01:15 |
| 5. Update user-events.config.ts with predicates and examples       | ✅     | 2026-04-13 00:55 |
| 6. Add tests for blocking functionality                            | ✅     | 2026-04-13 01:00 |
| 7. Build, lint, and test                                           | ✅     | 2026-04-13 01:20 |

## Context

### O que a documentação diz

A documentação oficial (https://opencode.ai/docs/plugins) confirma que:

1. `tool.execute.before` pode **bloquear execução** jogando um erro
2. O exemplo oficial é o .env protection:

```typescript
export const EnvProtection = async () => {
  return {
    'tool.execute.before': async (input, output) => {
      if (input.tool === 'read' && output.args.filePath.includes('.env')) {
        throw new Error('Do not read .env files');
      }
    },
  };
};
```

### Arquitetura proposta

```
tool.execute.before (OpenCode)
  ↓
1. Captura input + output ✓
2. Show toast ✓
3. Run scripts (array) → results
4. executeBlocking(resolved.block, input, output, results)
   - Se qualquer check.check retornar true → throw Error
   - Se não → hook termina → tool executa
5. Se bloqueou: show toast + log + throw
```

---

## Implementation Plan

### Step 1: Add BlockCheck and ScriptResult types to config.ts

Em `.opencode/plugins/helpers/config.ts`:

```typescript
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../types/opencode-hooks';

// ============================================
// BLOCK TYPES
// ============================================

// Resultados dos scripts executados
export interface ScriptResult {
  script: string;
  exitCode: number;
  output?: string;
}

// Tipo da função predicate
export type BlockPredicate = (
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: ScriptResult[]
) => boolean;

// Um check individual - sempre array
export interface BlockCheck {
  check: BlockPredicate;
  message?: string;
}

// Adicionar block ao ToolOverride
export interface ToolOverride {
  enabled?: boolean;
  debug?: boolean;
  toast?: boolean | ToastOverride;
  scripts?: string[];
  runScripts?: boolean;
  runOnlyOnce?: boolean;
  saveToFile?: boolean;
  appendToSession?: boolean;
  block?: BlockCheck[]; // ADD THIS - sempre array
}
```

### Step 2: Create block-handler.ts

Novo arquivo `.opencode/plugins/helpers/block-handler.ts`:

```typescript
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../types/opencode-hooks';
import type { BlockCheck, ScriptResult } from './config';
import { useGlobalToastQueue } from './toast-queue';
import { saveToFile } from './save-to-file';
import { BLOCKED_EVENTS_LOG_FILE } from './constants';

export function executeBlocking(
  blockConfig: BlockCheck[] | undefined,
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: ScriptResult[],
  eventType: string,
  logFilename: string = BLOCKED_EVENTS_LOG_FILE
): void {
  // Se não tem config, não bloqueia
  if (!blockConfig || blockConfig.length === 0) {
    return;
  }

  // Verificar cada check - qualquer um que retorne true bloqueia
  for (const blockCheck of blockConfig) {
    const shouldBlock = blockCheck.check(input, output, scriptResults);

    if (shouldBlock) {
      const message =
        blockCheck.message || `🚫 Blocked: ${input.tool} execution`;

      // Show toast
      useGlobalToastQueue().add({
        title: `BLOCKED - ${eventType}`,
        message,
        variant: 'error',
        duration: 10000,
      });

      // Save to log (arquivo dedicado para eventos bloqueados)
      saveToFile({
        content: JSON.stringify({
          timestamp: new Date().toISOString(),
          type: 'EVENT_BLOCKED',
          data: { eventType, input, output, blockCheck },
        }),
        filename: logFilename,
      });

      throw new Error(message);
    }
  }
}
```

### Step 3: Add BLOCKED_EVENTS_LOG_FILE constant

Em `.opencode/plugins/helpers/constants.ts`:

```typescript
export const LOG_FILE = 'session_events.log';
export const DEBUG_LOG_FILE = 'session_debug_events.log';
export const UNKNOWN_EVENT_LOG_FILE = 'session_unknown_events.log';
export const BLOCKED_EVENTS_LOG_FILE = 'blocked-events.log'; // NOVO
export const LOG_DIR = './production/session-logs';
```

### Step 4: Integrate blocking into executeHook

Em `.opencode/plugins/opencode-hooks.ts`, modificar a função `executeHook` após executar scripts:

```typescript
// Dentro de executeHook, após executar scripts (results)
// Importar ScriptResult, executeBlocking e BLOCKED_EVENTS_LOG_FILE
import { executeBlocking } from './helpers/block-handler';
import { BLOCKED_EVENTS_LOG_FILE } from './helpers/constants';
import type { ScriptResult } from './helpers/config';

// Após os scripts executarem (após linha ~132):
const scriptResults: ScriptResult[] = results.map((r) => ({
  script: r.script,
  exitCode: r.output ? 0 : 1,
  output: r.output,
}));

const inputAsBeforeInput = input as ToolExecuteBeforeInput | undefined;

// Chamar executeBlocking usando resolved.block direto
executeBlocking(
  resolved.block,
  {
    tool: toolName ?? '',
    sessionID: sessionId,
    callID: inputAsBeforeInput?.callID ?? '',
  },
  { args: (output as Record<string, unknown>) ?? {} },
  scriptResults,
  eventType,
  BLOCKED_EVENTS_LOG_FILE
);
```

### Step 5: Update user-events.config.ts

O arquivo completo com predicates reutilizáveis:

```typescript
// .opencode/plugins/helpers/user-events.config.ts

import { TOAST_DURATION } from './constants';
import { EventType } from './config';
import type { UserEventsConfig, BlockCheck } from './config';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from './types/opencode-hooks';

// ============================================
// BLOCK PREDICATES - Funções de bloqueio reutilizáveis
// ============================================

type BlockPredicate = (
  input: ToolExecuteBeforeInput,
  output: ToolExecuteBeforeOutput,
  scriptResults: { script: string; exitCode: number; output?: string }[]
) => boolean;

// Bloqueia arquivos .env
const blockEnvFiles: BlockPredicate = (_, output) =>
  (output.args.filePath as string)?.includes('.env');

// Bloqueia git --force ou git -f
const blockGitForce: BlockPredicate = (_, output) => {
  const cmd = output.args.command as string;
  return cmd?.includes('--force') || cmd?.includes(' -f');
};

// Bloqueia se scripts falharam
const blockScriptsFailed: BlockPredicate = (_, __, results) =>
  results.some((r) => r.exitCode !== 0);

// Factory: bloqueia por padrão de caminho
const blockByPath =
  (patterns: string[]): BlockPredicate =>
  (_, output) =>
    patterns.some((p) => (output.args.filePath as string)?.includes(p));

// Factory: bloqueia por padrão de comando
const blockCommandPattern =
  (patterns: string[]): BlockPredicate =>
  (_, output) =>
    patterns.some((p) => (output.args.command as string)?.includes(p));

// ============================================
// USER CONFIG
// ============================================

export const userConfig: UserEventsConfig = {
  enabled: true,

  logDisabledEvents: false,
  showPluginStatus: true,
  pluginStatusDisplayMode: 'user-only',

  scriptToasts: {
    showOutput: true,
    showError: true,
    outputVariant: 'warning',
    errorVariant: 'error',
    outputDuration: TOAST_DURATION.FIVE_SECONDS,
    errorDuration: TOAST_DURATION.FIFTEEN_SECONDS,
    outputTitle: '- SCRIPTS OUTPUT',
    errorTitle: '- SCRIPT ERROR',
  },

  default: {
    debug: false,
    toast: true,
    runScripts: false,
    runOnlyOnce: false,
    saveToFile: true,
    appendToSession: false,
  },

  events: {
    [EventType.SERVER_CONNECTED]: {},
    [EventType.SERVER_INSTANCE_DISPOSED]: {
      enabled: true,
      scripts: ['session-closed.sh'],
    },
    [EventType.SESSION_CREATED]: {
      enabled: true,
      runScripts: true,
      runOnlyOnce: true,
      appendToSession: true,
    },
    [EventType.SESSION_COMPACTED]: {
      enabled: false,
      scripts: ['pre-compact.sh'],
    },
    [EventType.SESSION_DELETED]: {
      enabled: false,
      runScripts: true,
    },
    [EventType.SESSION_IDLE]: {
      scripts: ['test-success-1.sh', 'test-success-2.sh'],
      runScripts: true,
    },
    [EventType.SESSION_DIFF]: { enabled: false },
    [EventType.SESSION_ERROR]: {
      enabled: true,
      toast: { duration: TOAST_DURATION.THIRTY_SECONDS, variant: 'error' },
    },
    [EventType.SESSION_STATUS]: { enabled: false },
    [EventType.SESSION_UPDATED]: { enabled: false },
    [EventType.SESSION_UNKNOWN]: { enabled: false },

    [EventType.MESSAGE_PART_DELTA]: { enabled: false },
    [EventType.MESSAGE_PART_REMOVED]: { enabled: false },
    [EventType.MESSAGE_PART_UPDATED]: { enabled: false },
    [EventType.MESSAGE_REMOVED]: { enabled: false },
    [EventType.MESSAGE_UPDATED]: { enabled: false },

    [EventType.FILE_EDITED]: {
      enabled: false,
      scripts: ['file-edit-console-warn.sh', 'file-edit-config-protection.sh'],
    },
    [EventType.FILE_WATCHER_UPDATED]: { enabled: false },

    [EventType.PERMISSION_ASKED]: { enabled: false },
    [EventType.PERMISSION_REPLIED]: { enabled: false },

    [EventType.COMMAND_EXECUTED]: { enabled: false },

    [EventType.LSP_CLIENT_DIAGNOSTICS]: { enabled: false },
    [EventType.LSP_UPDATED]: { enabled: false },

    [EventType.INSTALLATION_UPDATED]: { enabled: false },

    [EventType.TODO_UPDATED]: { enabled: false },

    [EventType.SHELL_ENV]: { enabled: false },

    [EventType.EXPERIMENTAL_SESSION_COMPACTING]: {
      enabled: false,
      toast: { variant: 'warning' },
      scripts: [
        'experimental-session-compacting-pre-compact.sh',
        'pre-compact.sh',
      ],
      saveToFile: true,
    },

    [EventType.CHAT_MESSAGE]: { enabled: false },
    [EventType.CHAT_PARAMS]: { enabled: false },
    [EventType.CHAT_HEADERS]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_MESSAGES_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_CHAT_SYSTEM_TRANSFORM]: { enabled: false },
    [EventType.EXPERIMENTAL_TEXT_COMPLETE]: { enabled: false },
    [EventType.TOOL_DEFINITION]: { enabled: false },

    [EventType.TUI_PROMPT_APPEND]: { toast: true },
    [EventType.TUI_COMMAND_EXECUTE]: { enabled: false },
    [EventType.TUI_TOAST_SHOW]: { enabled: false },
  },

  tools: {
    [EventType.TOOL_EXECUTE_AFTER_SUBAGENT]: {
      task: {
        enabled: true,
        toast: {
          enabled: true,
          duration: TOAST_DURATION.TEN_SECONDS,
        },
        scripts: ['log-agent.sh'],
        runScripts: true,
        saveToFile: true,
      },
    },
    [EventType.TOOL_EXECUTE_AFTER]: {
      task: { enabled: true },
      skill: {
        enabled: true,
        toast: true,
        scripts: ['log-skill.sh'],
        runScripts: true,
        saveToFile: true,
      },
      bash: {
        enabled: true,
        toast: { enabled: true },
        scripts: [
          'tool-execute-after-bash-audit.sh',
          'tool-execute-after-build-complete.sh',
          'tool-execute-after-governance-capture.sh',
          'tool-execute-after-pr-created.sh',
        ],
        runScripts: true,
      },
      write: {
        enabled: true,
        toast: { enabled: true },
        scripts: [
          'tool-execute-after-quality-gate.sh',
          'file-edit-accumulator.sh',
        ],
        runScripts: false,
      },
      edit: {
        enabled: false,
        scripts: [
          'file-edit-console-warn.sh',
          'file-edit-design-quality.sh',
          'file-edit-accumulator.sh',
        ],
        runScripts: false,
      },
      chat: {},
      read: {},
      glob: {},
      grep: {},
      list: {},
      patch: {},
      webfetch: {},
      websearch: {},
      codesearch: {},
      todowrite: {},
      todoread: {},
      question: {},
      'git.commit': {},
      'git.push': {},
      'git.pull': {},
      filesystem_read_file: {},
      filesystem_write_file: {},
      filesystem_list_directory: {},
      filesystem_search_files: {},
      filesystem_create_directory: {},
      filesystem_move_file: {},
      filesystem_get_file_info: {},
      gh_grep_searchGitHub: {},
    },

    // ============================================
    // TOOL.EXECUTE.BEFORE - Com BLOCK (sempre array)
    // ============================================
    [EventType.TOOL_EXECUTE_BEFORE]: {
      task: {},
      skill: {},
      bash: {
        block: [
          { check: blockGitForce, message: '🚫 git --force forbidden' },
          { check: blockScriptsFailed, message: '🚫 Blocking: scripts failed' },
        ],
      },
      write: {
        block: [
          { check: blockEnvFiles, message: '🚫 Cannot write .env files' },
        ],
      },
      read: {
        block: [
          { check: blockEnvFiles, message: '🚫 Cannot read .env files' },
          {
            check: blockByPath(['credentials.json', 'secrets/', '.ssh/']),
            message: '🚫 Protected files',
          },
        ],
      },
      edit: {},
      chat: {},
      glob: {},
      grep: {},
      list: {},
      patch: {},
      webfetch: {},
      websearch: {},
      codesearch: {},
      todowrite: {},
      todoread: {},
      question: {},
      'git.commit': {},
      'git.push': {},
      'git.pull': {},
      filesystem_read_file: {},
      filesystem_write_file: {},
      filesystem_list_directory: {},
      filesystem_search_files: {},
      filesystem_create_directory: {},
      filesystem_move_file: {},
      filesystem_get_file_info: {},
      gh_grep_searchGitHub: {},
    },
  },
};
```

### Step 6: Add tests

Criar `test/block-handler.test.ts`:

```typescript
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../.opencode/plugins/types/opencode-hooks';
import { executeBlocking } from '../.opencode/plugins/helpers/block-handler';

describe('block-handler', () => {
  const input: ToolExecuteBeforeInput = {
    tool: 'read',
    sessionID: '123',
    callID: 'call-1',
  };
  const output: ToolExecuteBeforeOutput = {
    args: { filePath: '/some/file.ts' },
  };

  describe('executeBlocking', () => {
    it('does not throw when block is undefined', () => {
      expect(() =>
        executeBlocking(undefined, input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('does not throw when block is empty array', () => {
      expect(() =>
        executeBlocking([], input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('throws when check.check returns true', () => {
      const block = [{ check: () => true, message: 'Custom blocked' }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Custom blocked');
    });

    it('does not throw when check.check returns false', () => {
      const block = [{ check: () => false }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('throws when any check in array returns true', () => {
      const block = [
        { check: () => false },
        { check: () => true, message: 'Second blocked' },
      ];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).toThrow('Second blocked');
    });

    it('does not throw when all checks return false', () => {
      const block = [{ check: () => false }, { check: () => false }];
      expect(() =>
        executeBlocking(block, input, output, [], 'tool.execute.before')
      ).not.toThrow();
    });

    it('blocks based on scriptResults', () => {
      const block = [
        {
          check: (_: any, __: any, results: any[]) =>
            results.some((r) => r.exitCode !== 0),
        },
      ];
      const scriptResults = [
        { script: 'test.sh', exitCode: 1, output: 'error' },
      ];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          scriptResults,
          'tool.execute.before'
        )
      ).toThrow();
    });

    it('allows when all scriptResults succeed', () => {
      const block = [
        {
          check: (_: any, __: any, results: any[]) =>
            results.some((r) => r.exitCode !== 0),
        },
      ];
      const scriptResults = [{ script: 'test.sh', exitCode: 0, output: 'ok' }];
      expect(() =>
        executeBlocking(
          block,
          input,
          output,
          scriptResults,
          'tool.execute.before'
        )
      ).not.toThrow();
    });
  });
});
```

### Step 7: Build, lint, and test

```bash
npm run build && npm run lint && npm run test:ci
```

---

## Files to Modify

| File                                              | Action                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------ |
| `.opencode/plugins/helpers/config.ts`             | Add BlockCheck, ScriptResult, BlockPredicate types + add block to ToolOverride |
| `.opencode/plugins/helpers/constants.ts`          | Add BLOCKED_EVENTS_LOG_FILE constant                                           |
| `.opencode/plugins/helpers/block-handler.ts`      | NEW FILE - executeBlocking function                                            |
| `.opencode/plugins/opencode-hooks.ts`             | Integrate blocking after scripts                                               |
| `.opencode/plugins/helpers/user-events.config.ts` | Add predicates and block config (always array)                                 |
| `test/unit/block-handler.test.ts`                 | NEW FILE - tests                                                               |

## Notes

- **Blocking só funciona em `tool.execute.before`** - é o único evento que roda antes da ação (conforme docs oficial)
- Quando bloqueado: toast + log + throw
- **Log separado**: Eventos bloqueados são salvos em `blocked-events.log` (via `BLOCKED_EVENTS_LOG_FILE` em constants.ts)
- `BlockCheck`: `{ check: BlockPredicate, message?: string }` - sempre em array
- Qualquer check que retorne `true` → bloqueia
- Predicates definidas no topo do `user-events.config.ts` são reutilizáveis entre tools
- Factory functions (`blockByPath`, `blockCommandPattern`) permitem criar predicates com parâmetros
- ScriptResult definido em config.ts e importado no block-handler.ts
- Não precisa adicionar block ao ResolvedEventConfig - usar direto de `resolved.block`
