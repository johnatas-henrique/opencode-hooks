# ADR-002: Extract HookExecutor from Entry Point

**Date:** 2026-05-08  
**Status:** Implemented  
**Deciders:** Johnatas Henrique

---

## Context

The entry point `opencode-hooks.ts` contained a 192-line `executeHook` function that handled every concern of hook execution: audit logging, toasts, script execution, stop hooks, session append, and blocking throws. It knew the internals of 5+ modules and could only be tested by instantiating the whole plugin.

The function received 8+ parameters per call, with `eventRecorder`, `scriptRecorder`, `scriptArg`, and `showToast` passed directly even though they never varied across the 12 call sites.

---

## Decision

Extract a `features/hooks/hook-executor.ts` module with constructor injection and a single `execute(event)` method. The entry point creates the executor once and delegates each hook event.

**Interface:**

```typescript
class HookExecutor {
  constructor(deps: HookExecutorDeps);
  async execute(event: HookEvent): Promise<void>;
}
```

**`HookExecutorDeps`** (constructor injected):

- `executeScript`, `isSubagent`, `appendToSession` — function references
- `stopHook` — state machine (`isActive`, `setState`, `clearState`)
- `toastQueue` — global toast queue
- `eventRecorder?`, `scriptRecorder?` — audit (optional)
- `logDisabledEvents` — config flag as function getter

**`HookEvent`** (per-call input):

- `ctx`, `eventType`, `sessionId`, `resolved` — required
- `input?`, `output?`, `toolName?` — optional, vary per event

**Factory:** `createHookExecutor()` — resolves all modular singletons (event/script recorders, toast queue, settings) in one place.

---

## Rationale

| Criterion            | Before                                             | After                                                           |
| -------------------- | -------------------------------------------------- | --------------------------------------------------------------- |
| Entry point size     | 277 lines                                          | ~60 lines                                                       |
| Hook execution logic | scattered inline                                   | single `HookExecutor` class                                     |
| Per-call arguments   | 8+ params (eventRecorder, scriptRecorder repeated) | 1 `HookEvent` object (7 fields, optional ones only when needed) |
| Testability          | whole-plugin mock                                  | DI-based, no global `vi.mock`                                   |
| Leverage             | 11 behaviors, no abstraction                       | 11 behaviors behind 1 method (`execute`)                        |

Rejected alternatives:

- **Middleware layer**: would introduce lifecycle hooks with zero consumers (violated "one adapter = hypothetical seam")
- **Per-call options**: `skipAudit` and `suppressToasts` are dead — both are controlled by resolved config, not per-call flags

---

## Consequences

### Positive

- Entry point is a thin router, easy to audit
- `HookExecutor` concentrates all hook execution logic
- `createHookExecutor()` is the single wiring point — if a new dependency is needed, only the factory changes
- Tests can inject mocks directly without module-level `vi.mock`

### Negative

- `logDisabledEvents` must be a function getter (not a captured boolean) so tests can change it after construction
- `createHookExecutor()` eagerly captures singletons — if a dependency changes at runtime, the change won't be reflected

### Risks

- None identified. The change is purely structural with the same external behavior, verified by 596 passing tests at 97% coverage.

---

## References

- Architecture deepening candidate #1 in `docs/architecture-deepening.md`
