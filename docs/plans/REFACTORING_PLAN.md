# OpenCode Hooks — Refactoring Plan

## Overview

7 refactoring items across the codebase, organized by safety and dependency. Each item in a separate commit. Integration tests written first for the 3 architecture items.

## Test Suite Baseline

- `npm run test:unit` — 596 passed
- `npm run test:integration` — 16 passed (+15 new)
- `npm run lint` — clean

## Integration Tests

**File:** `test/integration/hooks/hook-executor.test.ts`

Covers handler → resolver → executor chain with real handlers, real resolver, mocked I/O only.

### Scenarios (15 tests)

| #   | Category          | Scenario                                                    | Covers     |
| --- | ----------------- | ----------------------------------------------------------- | ---------- |
| 1   | Handler → Toast   | `tool.execute.before.bash` → title `====BASH BEFORE====`    | #5, #6     |
| 2   | Handler → Toast   | `tool.execute.after.bash` → title `====BASH AFTER====`      | #5, #6     |
| 3   | Handler → Toast   | `session.created` → variant `success`, duration `10000`     | #5, #6     |
| 4   | Handler → Toast   | `permission.asked` → variant `warning`                      | #5, #6     |
| 5   | Fallback          | No handler → `title=''`, `variant='info'`, `duration=2000`  | #6         |
| 6   | Override          | Tool config `toast: { title: 'Custom' }` → toast with title | #6         |
| 7   | Script execution  | `defaultScript` from handler executed via `executeScript`   | #5, #6, #7 |
| 8   | Error toast       | Script fails → error toast shown                            | #7         |
| 9   | Output toast      | Script succeeds with output → output toast shown            | #7         |
| 10  | Suppressed output | `showOutput: false` → no output toast                       | #7         |
| 11  | Multiple scripts  | 2 scripts (1 pass, 1 fail) → both executed, error toast     | #6, #7     |
| 12  | Session append    | `appendToSession: true` → output appended                   | #7         |
| 13  | Disabled event    | `enabled: false` → no toast/script, logs EVENT_DISABLED     | #6, #7     |
| 14  | Block exit code 2 | `tool.execute.before` + exit 2 → throws Error               | #7         |
| 15  | Stop hook clear   | `session.idle` no blocking → `clearState` called            | #7         |

---

## Fase 1 — Seguros e independentes

### P2: Consolidar branches redundantes em `normalizeInputForHandler`

**File:** `features/events/resolvers/normalize-input.ts:12-26`

**What:** 3 `if/else if/else` branches each return `{ properties: input, output }`. Collapse into a single check since they produce identical results.

**Before:**

```ts
if (eventType.startsWith('shell.env')) {
  return { properties: input, output };
} else if (eventType.startsWith('chat.') || eventType.startsWith('permission.') || eventType.startsWith('command.execute.before')) {
  return { properties: input, output };
} else if (eventType.startsWith('tool.execute.before') || ...) {
  return { properties: input, output };
} else {
  return { properties: input, output };
}
```

**After:** One condition that returns `{ properties: input, output }`.

**Risk:** Trivial — cosmetic only, no behavioral change.
**Tests:** Existing tests cover normalized output.

---

### P4: Passar `logTruncationKB` como parâmetro em vez de variável de módulo

**File:** `features/audit/event-recorder.ts:132,141,274`

**What:** `sanitizeAndTruncate` currently reads mutable module-level `globalTruncationKB` set during `init()`. Pass it as a parameter instead — the value doesn't change between init and use.

**Changes:**

1. Add `logTruncationKB: number` param to `sanitizeAndTruncate`
2. Update call sites (2 internal, 1 test)

**Risk:** Low — pure function refactor.
**Tests:** Existing event-recorder tests cover truncation behavior.

---

### P3: Extrair `sanitizeArg` para utils compartilhado

**Files:**

- `features/scripts/executor.ts` (exported, used in tests)
- `features/scripts/run-script.ts` (private)

**Create:** `features/scripts/utils.ts`

**What:** Both files have identical `sanitizeArg` regex:

```ts
const sanitizeArg = (arg: string): string =>
  arg.replace(/[^a-zA-Z0-9._-]/g, '_');
```

**Extract to `utils.ts`:** Export `sanitizeArg`, re-export from both original files to avoid breaking existing imports.

**Note:** `validateScriptPath` is NOT extracted — implementations differ:

- `executor.ts`: blocks `..` and `\\` and Windows drive paths
- `run-script.ts`: blocks `..` and `/` and `~` and Windows drive paths

These are different security rules for different use cases.

**Risk:** Trivial.
**Tests:** Existing executor tests call `sanitizeArg` via `createExecutorMock()` mock.

---

## Fase 2 — Refatorações médias

### P1: Extrair helper `renderSection` em `formatPluginStatus`

**File:** `features/messages/plugin-status.ts:131-250`

**What:** 3 `if/else if/else` branches each build an active/failed/incompatible section with only label strings and source-filters differing. ~119 lines → ~60 lines.

**Pattern (each branch):**

```ts
const sectionLines: string[] = [];
if (toolStatuses.length > 0) {
  sectionLines.push(' LABEL');
  for (const item of toolStatuses) {
    // filter by source
    // add formatted line
  }
}
if (sectionLines.length > 0) {
  lines.push(...sectionLines, '');
}
```

**Extract:** `renderSection(lines, statuses, title, sourceFilter, labelFn)` — each branch becomes 3 lines.

**Risk:** Low — function is pure with 22 test cases.
**Tests:** Existing 22 test cases cover all branches.

---

### P5: Handler boilerplate — dados + gerador

**Files:**

- `features/handlers/tool-before-handlers.ts` (~230 lines, 25 handlers)
- `features/handlers/tool-after-handlers.ts` (~230 lines, 25 handlers)

**What:** 50 explicit `createHandler({...})` calls with near-identical structure. The only differences per handler are: `title`, `defaultScript`, and `allowedFields`.

**Before (50 copies):**

```ts
'tool.execute.before.bash': createHandler({
  title: '====BASH BEFORE====',
  variant: 'info',
  duration: DEFAULTS.toast.durations.FIVE_SECONDS,
  defaultScript: 'tool-execute-before.bash.sh',
  buildMessage: buildKeysMessage,
  allowedFields: ['tool', 'args.command'],
}),
```

**After:** Data array + generator:

```ts
const BEFORE_TOOL_CONFIGS = [
  {
    tool: 'bash',
    title: '====BASH BEFORE====',
    defaultScript: 'tool-execute-before.bash.sh',
    allowedFields: ['tool', 'args.command'],
  },
  {
    tool: 'codesearch',
    title: '====CODE SEARCH BEFORE====',
    defaultScript: 'tool-execute-before.codesearch.sh',
    allowedFields: ['tool', 'args.query'],
  },
  // ... 23 more
];

function createToolBeforeHandlers(): Record<string, EventHandler> {
  const result: Record<string, EventHandler> = {};
  for (const cfg of BEFORE_TOOL_CONFIGS) {
    result[`tool.execute.before.${cfg.tool}`] = createHandler({
      title: cfg.title,
      variant: 'info',
      duration: DEFAULTS.toast.durations.FIVE_SECONDS,
      defaultScript: cfg.defaultScript,
      buildMessage: buildKeysMessage,
      allowedFields: cfg.allowedFields,
    });
  }
  return result;
}

export const toolBeforeHandlers = createToolBeforeHandlers();
```

**~460 lines total → ~50 lines (data) + ~30 lines (generator).**

**Risk:** Low — tests enumerate ALL expected keys and properties, will catch any missing handler or wrong field.
**Tests:** Existing `tool-before-handlers.test.ts`, `tool-after-handlers.test.ts` (enumerative).

---

## Fase 3 — Arquitetura (Requer mais cuidado)

### P6: tool-config.resolver — extrair métodos privados

**File:** `features/events/resolvers/tool-config.resolver.ts` (182-line method)

**What:** The `resolve()` method has clear extraction points:

1. **Triple ternaries (lines 115-146):** Extract `resolveToolOverrides(toolHandler, eventHandler)`:
   - `toastTitle`: toolHandler > eventHandler > ''
   - `toastVariant`: toolHandler > eventHandler > 'info'
   - `toastDuration`: toolHandler > eventHandler > TWO_SECONDS
   - `toastMessage`: toolHandler.tryBuildMessage > eventHandler.tryBuildMessage > ''

2. **Boolean field resolution (lines 189-229):** Extract `applyBooleanFields(config, toolConfig)`:
   - 6 calls to `getBooleanField()` for enabled, toast, runScripts, logToAudit, appendToSession, runOnlyOnce

**Design:**

```ts
private resolveToolOverrides(
  toolHandler: EventHandler | undefined,
  eventHandler: EventHandler | undefined,
  toolEventType: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): { title: string; variant: EventVariant; duration: number; message: string } {
  return {
    title: toolHandler?.title ?? eventHandler?.title ?? '',
    variant: toolHandler?.variant ?? eventHandler?.variant ?? 'info',
    duration: toolHandler?.duration ?? eventHandler?.duration ?? DEFAULTS.toast.durations.TWO_SECONDS,
    message: toolHandler
      ? this.defaultResolver.tryBuildMessage(toolHandler, toolEventType, input, output, toolHandler.allowedFields)
      : eventHandler
        ? this.defaultResolver.tryBuildMessage(eventHandler, toolEventType, input, output, eventHandler.allowedFields)
        : '',
  };
}
```

**Risk:** Medium — internal refactor, 15 existing tests cover all branches.
**Tests:** Existing 15 resolver tests.

---

### P7: HookExecutor.execute — 11 concerns → métodos extraídos

**File:** `features/hooks/hook-executor.ts:51-209`

**What:** 158-line method with distinct concerns:

| Lines   | Concern           | Extracted method          |
| ------- | ----------------- | ------------------------- |
| 62-64   | runOnlyOnce guard | `shouldSkipRunOnlyOnce()` |
| 66-79   | Disabled event    | `handleDisabledEvent()`   |
| 81-88   | Event recording   | `recordEvent()`           |
| 90-97   | Toast display     | `showMainToast()`         |
| 99-113  | Script execution  | `executeScripts()`        |
| 115-124 | Stop hook mgmt    | `handleStopHookState()`   |
| 126-142 | Script recording  | `recordScriptResults()`   |
| 144-167 | Error toast       | `showErrorToast()`        |
| 169-190 | Output toast      | `showOutputToast()`       |
| 173-190 | Session append    | `appendToSession()`       |
| 200-208 | Block detection   | `checkBlockedExecution()` |

**Design:** Each extracted method takes only what it needs from `event` and `this.deps`.

```ts
async execute(event: HookEvent): Promise<void> {
  if (this.shouldSkipRunOnlyOnce(event)) return;
  if (!event.resolved.enabled) {
    await this.handleDisabledEvent(event);
    return;
  }
  await this.recordEvent(event);
  this.showMainToast(event);
  const results = await this.executeScripts(event);
  this.handleStopHookState(event, results);
  await this.recordScriptResults(event, results);
  this.showErrorToast(event, results);
  this.showOutputToast(event, results);
  await this.appendToSession(event, results);
  this.checkBlockedExecution(event, results);
}
```

**Risk:** HIGH — zero tests for `HookExecutor` directly. But `opencode-hooks.test.ts` covers it through the plugin API (14 tests exercising executor paths).

**Note:** The integration tests (15 scenarios) now provide direct coverage.

---

## Execution Order

| Step | Item | Commit message                                               | Validation                 | Status |
| ---- | ---- | ------------------------------------------------------------ | -------------------------- | ------ |
| 0    | —    | Integration tests for HookExecutor                           | `npm run test:integration` | ✓      |
| 1    | P2   | refactor: consolidate normalizeInputForHandler branches      | `npm run test:unit`        | ✓      |
| 2    | P4   | refactor: pass logTruncationKB as parameter                  | `npm run test:unit`        | ✓      |
| 3    | P3   | refactor: extract sanitizeArg to shared utils                | `npm run test:unit`        | ✓      |
| 4    | P1   | refactor: extract renderSection helper in formatPluginStatus | `npm run test:unit`        | ✓      |
| 5    | P5   | refactor: data-driven handler generation                     | `npm run test:unit`        | ⏳     |
| 6    | P6   | refactor: extract private methods in tool-config.resolver    | `npm run test:unit`        | ⏳     |
| 7    | P7   | refactor: extract private methods in HookExecutor.execute    | `npm run test:unit`        | ⏳     |

**After each step:** `npm run test:unit && npm run test:integration && npm run lint`
