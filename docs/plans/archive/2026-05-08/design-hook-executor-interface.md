# HookExecutor — Interface Design

**Date**: 2026-05-08
**Status**: Draft
**Target**: `features/hooks/hook-executor.ts`

## 1. Interface

### Public Types

```typescript
// features/hooks/hook-executor.ts (public surface)

import type { PluginInput } from '@opencode-ai/plugin';
import type { ResolvedEventConfig } from '../../types/config';
import type { ScriptRunResult } from '../../types/scripts';
import type { EventRecorder, ScriptRecorder } from '../../types/audit';

/** Per-event input — what varies across the 12 call sites */
export interface HookInput {
  eventType: string;
  resolved: ResolvedEventConfig;
  sessionId: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  toolName?: string;
  scriptArg?: string;
}

/** Per-call override flags. Defaults = typical happy path. */
export interface HookOptions {
  skipAudit?: boolean;
  skipSession?: boolean;
  suppressToasts?: boolean;
}

export type HookResult = 'completed' | 'blocked';

/** All module-level dependencies, injected once. */
export interface HookExecutorDeps {
  ctx: PluginInput;
  eventRecorder?: EventRecorder;
  scriptRecorder?: ScriptRecorder;
  config: { logDisabledEvents: boolean };
  services: {
    executeScript: (
      script: string,
      eventType: string,
      toolName: string,
      input: Record<string, unknown>,
      output?: Record<string, unknown>
    ) => Promise<ScriptRunResult>;
    isSubagent: (sessionId: string) => boolean;
    appendToSession: (
      ctx: PluginInput,
      sessionId: string,
      text: string
    ) => Promise<void>;
    getStopHookActive: (sessionId: string) => boolean;
    setStopHookState: (sessionId: string) => void;
    clearStopHookState: (sessionId: string) => void;
    enqueueToast: (toast: {
      title: string;
      message: string;
      variant: string;
      duration: number;
    }) => void;
    writeDebug: (info: Record<string, unknown>) => void;
    getNormalizedSessionId: (raw: string) => string;
  };
}
```

### Class

```typescript
export class HookExecutor {
  constructor(private deps: HookExecutorDeps) {}

  async execute(input: HookInput, opts?: HookOptions): Promise<HookResult> {
    // 1. Run-only-once guard → return early
    // 2. Disabled event → optional audit log → return early
    // 3. Event audit (skip if opts.skipAudit)
    // 4. Toast (skip if opts.suppressToasts)
    // 5. Stop-hook state machine (session.idle only)
    // 6. Execute scripts + debug
    // 7. Script audit (skip if opts.skipAudit)
    // 8. Error/output toasts (skip if opts.suppressToasts)
    // 9. Session append (skip if opts.skipSession)
    // 10. Blocking throw (exitCode === 2)
  }
}
```

### Factory (for production wiring)

```typescript
export function createHookExecutor(
  ctx: PluginInput,
  eventRecorder?: EventRecorder,
  scriptRecorder?: ScriptRecorder
): HookExecutor {
  return new HookExecutor({
    ctx,
    eventRecorder,
    scriptRecorder,
    config: { logDisabledEvents: userConfig.logDisabledEvents },
    services: {
      executeScript,
      isSubagent,
      appendToSession,
      getStopHookActive,
      setStopHookState,
      clearStopHookState,
      enqueueToast: (toast) => useGlobalToastQueue().add(toast),
      writeDebug,
      getNormalizedSessionId,
    },
  });
}
```

## 2. Usage — Before vs After

### Common case (12 of 12 handlers)

**Before** (8 lines, 6 are repetitive noise):

```typescript
await executeHook({
  ctx,
  eventType: event.type,
  resolved,
  sessionId,
  input: eventInput,
  eventRecorder,
  scriptRecorder,
});
```

**After** (2 lines — one to create at init, one per event):

```typescript
// At plugin init:
const hookExecutor = createHookExecutor(ctx, eventRecorder, scriptRecorder);

// Each handler:
await hookExecutor.execute({
  eventType: event.type,
  resolved,
  sessionId,
  input: eventInput,
});
```

### Shell.env — custom toolName

```typescript
// Before — same boilerplate
await executeHook({
  ctx,
  eventType: OpenCodeEvents.SHELL_ENV,
  resolved,
  sessionId: input.sessionID!,
  input,
  output,
  toolName: OpenCodeEvents.SHELL_ENV,
  eventRecorder,
  scriptRecorder,
});

// After
await hookExecutor.execute({
  eventType: OpenCodeEvents.SHELL_ENV,
  resolved,
  sessionId: input.sessionID!,
  input,
  output,
  toolName: OpenCodeEvents.SHELL_ENV,
});
```

### Chat message — scriptArg edge case

```typescript
// Before
await executeHook({
  ctx,
  eventType: OpenCodeEvents.CHAT_MESSAGE,
  resolved,
  sessionId: input.sessionID,
  input,
  output,
  scriptArg: input.sessionID,
  eventRecorder,
  scriptRecorder,
});

// After — scriptArg still supported
await hookExecutor.execute({
  eventType: OpenCodeEvents.CHAT_MESSAGE,
  resolved,
  sessionId: input.sessionID,
  input,
  output,
  scriptArg: input.sessionID,
});
```

### Suite of all 12 callers in `opencode-hooks.ts`

```typescript
// Current: ~90 lines of repetitive executeHook({...}) calls
// After: ~12 lines + 1 init line
```

## 3. What's Hidden Behind the Seam

The caller no longer touches:

| Concern                        | Lines in executeHook | Hidden by            |
| ------------------------------ | -------------------- | -------------------- |
| Run-only-once guard            | 100-102              | HookExecutor.execute |
| Disabled event → audit         | 104-113              | HookExecutor.execute |
| Event recording                | 116-123              | HookExecutor.execute |
| Toast enqueueing               | 125-134              | HookExecutor.execute |
| Stop-hook state machine        | 136-137, 183-192     | HookExecutor.execute |
| Script execution + Promise.all | 140-150              | HookExecutor.execute |
| Debug writes (×2)              | 152-181              | HookExecutor.execute |
| Script audit recording         | 194-210              | HookExecutor.execute |
| Error toasts                   | 212-235              | HookExecutor.execute |
| Output toasts                  | 237-258              | HookExecutor.execute |
| Session append                 | 260-266              | HookExecutor.execute |
| Blocking throws                | 268-276              | HookExecutor.execute |

**Total hidden**: ~190 lines → 1 method call.

## 4. Dependency Strategy

Three tiers, separated by frequency of change:

### Tier 1 — Constructor (injected once)

- `ctx: PluginInput` — same for all hooks; available at plugin init
- `eventRecorder` / `scriptRecorder` — module-level singletons created at init
- `config.logDisabledEvents` — static config read once

### Tier 2 — Services object (injected once)

All module-level functions wrapped into a `services` bag. This is the **test seam**: tests replace `services.executeScript`, `services.isSubagent`, etc., without mocking modules.

### Tier 3 — Per-call `HookInput` + `HookOptions`

Everything that varies per event (eventType, resolved, sessionId, input/output/toolName).

### Why not function arguments only?

The current design passes `ctx`, `eventRecorder`, and `scriptRecorder` identically on every call. That's 3 arguments × 12 call sites = 36 repetitive parameters. Constructor injection eliminates all 36.

### Testability

```typescript
// Test — no global vi.mock needed
const executor = new HookExecutor({
  ctx: mockCtx,
  config: { logDisabledEvents: false },
  services: {
    executeScript: mockExecuteScript,
    isSubagent: () => false,
    appendToSession: mockAppend,
    getStopHookActive: () => false,
    setStopHookState: () => {},
    clearStopHookState: () => {},
    enqueueToast: mockToast,
    writeDebug: () => {},
    getNormalizedSessionId: (s) => s,
  },
});

const result = await executor.execute(mockInput);
expect(result).toBe('completed');
expect(mockToast).toHaveBeenCalled();
```

## 5. Trade-offs

### Where leverage is high ✓

| Leverage              | Why                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------- |
| **Caller complexity** | 8-line blocks → 1 line. Zero decision-making at call sites.                                          |
| **Test isolation**    | 100% DI. No `vi.mock` needed. `executeScript` can return success/failure deterministically.          |
| **Consistency**       | One place to change recording, toasts, debug. No risk of 1/12 callers diverging.                     |
| **Readability**       | `hookExecutor.execute(...)` is self-documenting. Today's `executeHook` is a grab-bag of 11 concerns. |

### Where leverage is thin ⚠

| Weakness                | Why                                                                                                                                                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Constructor growth**  | If a new concern needs a dep, the constructor + interface + factory all change. Mitigation: the `services` bag absorbs new injected functions without interface churn.               |
| **Edge-case overrides** | `HookOptions` (skipAudit, skipSession, suppressToasts) adds 3 flags that 0 of 12 current callers need. These are speculative — added because callers now CAN'T opt out without them. |
| **Type surface**        | 5 exported types + 1 class + 1 factory for one function. That's heavy for extraction. Justified by 12 call sites and 190 hidden lines.                                               |

### Design decisions worth revisiting

1. **Should `HookOptions` be a parameter or a method modifier?** Current: parameter. Alternative: method chaining (`executor.withoutAudit()`) — too much API surface for 0 current users.
2. **Should `HookInput` include `scriptArg`?** Currently unused in `executeHook` body but part of the params interface. Keeping for backward compatibility, but it's dead weight.
3. **Should `writeDebug` be injected or called internally?** It references an inline function (`writeDebug` on line 56 of `opencode-hooks.ts`). Extracted as a dependency so the class has no fs dependency. The factory wires it.
4. **Should `getNormalizedSessionId` be part of `services`?** Currently inline on line 79. Extracted for testability — `normalizeSessionId(raw: string): string` is a pure function that's easier to test in isolation.
