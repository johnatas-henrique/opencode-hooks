# HookExecutor Design

Extracted from `executeHook` in `.opencode/plugins/opencode-hooks.ts:86-277`.

## Current state

`executeHook` is a monolithic async function that does 10 things sequentially:

| Step | Behavior            | Config-driven?                                      | Dep                                                     |
| ---- | ------------------- | --------------------------------------------------- | ------------------------------------------------------- |
| 1    | Run-only-once guard | `resolved.runOnlyOnce`                              | `isSubagent()`                                          |
| 2    | Disabled-event log  | `resolved.enabled` + `userConfig.logDisabledEvents` | `getEventRecorder()`                                    |
| 3    | Event audit         | `eventRecorder` param                               | injected via param                                      |
| 4    | Toast enqueue       | `resolved.toast`                                    | `useGlobalToastQueue()`                                 |
| 5    | Stop-hook state     | `eventType === 'session.idle'`                      | `getStopHookActive/setStopHookState/clearStopHookState` |
| 6    | Script execution    | `resolved.scripts`                                  | `executeScript()`                                       |
| 7    | Debug write         | always                                              | `writeDebug()` (inline `fs.appendFileSync`)             |
| 8    | Script audit        | `scriptRecorder` param                              | injected via param                                      |
| 9    | Error/output toasts | `resolved.scriptToasts`                             | `useGlobalToastQueue()`                                 |
| 10   | Session append      | `resolved.appendToSession`                          | `appendToSession()`                                     |
| 11   | Blocking throw      | `(before hooks) exitCode === 2`                     | none                                                    |

Dependencies are a mix of module-level singleton imports (`getEventRecorder()`, `useGlobalToastQueue()`), inline code (`writeDebug`), and function params (`eventRecorder`, `scriptRecorder`).

## Seam

The seam is the function boundary itself. Every caller in `opencode-hooks.ts` passes the same 7-9 fields. The module hides:

- **Lifecycle orchestration** — the order and conditional wiring of all 10 steps
- **Guard logic** — subagent check, enabled check, disabled-event logging
- **Toast formatting** — title/message construction, variant mapping, error vs output distinction
- **Stop-hook state machine** — condition (`session.idle`), block detection (`exitCode === 2 || output.includes('block')`), set/clear timing
- **Debug schema** — the `opencode_hooks_180`/`opencode_hooks_210` envelope structure
- **Blocking exception** — which event types throw, which exit codes trigger it

## Interface

```typescript
// Public surface (features/hooks/hook-executor.ts)
interface HookExecutor {
  execute(event: HookEvent): Promise<void>;
}
```

The `HookExecutorDeps` type in `types/executor.ts` defines all injectable dependencies as a single constructor argument. The factory `createHookExecutor(overrides?)` wires production defaults and returns a ready instance.

```
┌──────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Caller (12×) │─────>│  HookExecutor    │─────>│  Adapters    │
│              │      │  .execute(event) │      │  (injected)  │
└──────────────┘      │                  │      └──────────────┘
                      │  Guard           │
                      │  → event audit   │
                      │  → toast         │
                      │  → scripts       │
                      │  → debug         │
                      │  → stop-hook     │
                      │  → script audit  │
                      │  → error toast   │
                      │  → output toast  │
                      │  → session       │
                      │  → block throw   │
                      └──────────────────┘
```

## Dependency strategy

**Constructor injection** via a single `HookExecutorDeps` object. The factory `createHookExecutor(overrides?)` resolves all module-level singletons (toast queue, event recorder, etc.) and returns a wired instance.

```typescript
// — Usage (current code at each call site) —
await executeHook({
  ctx,
  eventType,
  resolved,
  sessionId,
  input,
  output,
  toolName,
  eventRecorder,
  scriptRecorder,
});

// — Usage (with HookExecutor) —
const executor = createHookExecutor(); // production
await executor.execute({
  ctx,
  eventType,
  resolved,
  sessionId,
  input,
  output,
  toolName,
});

// — Test usage —
const executor = new HookExecutor({
  executeScript: mockExecute,
  isSubagent: () => false,
  appendToSession: mockAppend,
  stopHook: mockStopHook,
  toastQueue: mockToastQueue,
  eventRecorder: undefined,
  scriptRecorder: undefined,
  logDisabledEvents: false,
  writeDebug: () => {},
});
await executor.execute(testEvent);
```

## Adapter types

Six adapter interfaces in `types/executor.ts`:

| Interface         | Method                                                              | Purpose                 |
| ----------------- | ------------------------------------------------------------------- | ----------------------- |
| `StopHookAPI`     | `isActive(sessionId)` `setState(sessionId)` `clearState(sessionId)` | Stop-hook state machine |
| `ExecuteScriptFn` | `(scriptEntry, eventType, toolName, input, output?) => result`      | Script runner           |
| `WriteDebugFn`    | `(data) => void`                                                    | Debug logging           |
| `ToastQueue`      | `add(toast)`                                                        | Toast display queue     |
| `EventRecorder`   | `logEvent(type, data)`                                              | Event audit             |
| `ScriptRecorder`  | `logScript(input, result)`                                          | Script audit            |
| `SessionAppender` | `(ctx, sessionId, text) => Promise<void>`                           | Session append          |

## Leverage (what callers get from a small interface)

1. **12 call sites shrink** from 9-line blocks to single `executor.execute(event)` calls
2. **No module-level imports** needed at call sites — executor owns all wiring
3. **Testable in isolation** — swap any adapter without touching `opencode-hooks.ts`
4. **Config sealed** — `logDisabledEvents`, toast queue instance, recorder instances all resolved once at construction

## Depth (what the implementation hides)

The implementation hides substantial complexity: conditional guards, toast formatting, stop-hook state machine, debug schema structure, blocked-script detection. The whole 10-step pipeline is invisible to callers.

## Trade-offs

| Dimension               | Leverage                                                                                 | Thinness                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Per-call opt-out**    | None — current design exposes no `options` param. Every execution runs the full pipeline | If you need to skip toast/audit for a specific call, you must split the class or pass a noop adapter          |
| **Lifecycle hooks**     | None — no `before`/`after` interceptor points                                            | To add middleware, you'd need to extend the class or wrap `.execute()`                                        |
| **Adapter granularity** | Toast and audit are single adapters, not per-behavior                                    | You can swap the whole toast system, but you can't, say, silence only error toasts while keeping event toasts |
| **Extensibility**       | Subclass or wrap for new behaviors                                                       | Adding a new pipeline step requires editing the class                                                         |
| **Class vs function**   | Simple, discoverable API; constructor makes deps explicit                                | A factory function + object would be lighter for tree-shaking and composition                                 |

## Alternate designs considered

### Pipeline with middleware (not chosen)

```typescript
interface HookMiddleware {
  before?: (ctx: ExecutionContext) => Promise<void>;
  after?: (ctx: ExecutionContext) => Promise<void>;
}
```

Pros: per-step interception, composable
Cons: caller-facing complexity, over-engineering for current 12 call sites that all want the same thing

### Per-behavior options (not chosen)

```typescript
interface ExecuteOptions {
  skipAudit?: boolean;
  skipToast?: boolean;
  skipSession?: boolean;
}
```

Pros: per-call flexibility
Cons: unused in current codebase (no caller wants subset behavior); adds parameter noise

### Present design choice

A single `execute(event)` method with constructor-injected adapters. This minimises caller surface area while making testing and reconfiguration possible. The depth is appropriate: the pipeline has stable ordering and no caller has ever needed to skip a step.

If per-call flags become needed later, add an optional `options` parameter to `execute()`. If lifecycle hooks become needed, wrap the executor or add a middleware chain — the adapter pattern already proves the dependency-injection mechanism.
