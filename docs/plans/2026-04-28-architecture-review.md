# Architecture Review - post-finalization fixes

Date: 2026-04-28

## Issues to Fix

### 1. Duplicate EventType definitions

**Status:** TODO

Duplicate `EventType` in 3 files:

- `types/events.ts` (EventType enum)
- `types/core.ts` (OpenCodeEvents const)
- `types/config.ts` (re-exports)

**Actions:**

- Keep `EventType` enum in `types/events.ts` as single source
- Move `OpenCodeEventMap` and property types to `types/events.ts`
- Delete `EventType` / `OpenCodeEvents` duplication from `types/core.ts`
- **Delete ALL re-exports** from `types/config.ts`

### 2. Module-level state breaks test isolation

**Status:** TODO

`features/audit/plugin-integration.ts` uses:

```typescript
let auditLogger;
let eventRecorder;
let scriptRecorder;
```

**Problem:** Global mutable state breaks tests, can't mock properly, can't have multiple instances.

**Fix:** Pass dependencies explicitly via constructor/params instead of module-level singletons.

### 3. Duplicate RunScriptOptions interface

**Status:** TODO

`types/executor.ts` - `ScriptExecutorOptions` E `script-runner.ts` - `RunScriptOptions` têm MESMA estrutura.

**Fix:** Apagar `RunScriptOptions` de `script-runner.ts`, usar `ScriptExecutorOptions` de `types/executor.ts`.

### 4. Interfaces outside types/ folder

**Status:** TODO

REGRA: TODOS tipos/interfaces-devem estar em `types/`. Qualquer interface/type fora da pasta `types/` é ERRO.

**Interfaces found outside types/:**

1. `features/audit/debug-recorder.ts` - `DebugRecorder`
2. `features/audit/security-recorder.ts` - `SecurityRecorder`
3. `features/scripts/script-runner.ts` - `ScriptRunnerDeps`, `RunScriptOptions` (duplicate with ScriptExecutorOptions - see #3)

**Fix:** Mover para pasta `types/` e atualizar imports.

### 5. Non-null assertions getEventRecorder()!

**Status:** TODO

4 usages of `getEventRecorder()!` in `opencode-hooks.ts`:

- Line 90, 210, 228, 617

Same defensive pattern that was "fixed" before. Should use proper null checks or make function return non-null.

### 6. Global mutable state outside plugin

**Status:** TODO

- `subagentSessionIds` - Set in `features/scripts/run-script-handler.ts`
- `hasShownToast` - boolean in `opencode-hooks.ts`

Module-level globals break test isolation.

### 7. Unused types in core.ts

**Status:** TODO

`OpenCodeEvents`, `OpenCodeEventType`, `OpenCodeEventMap` - exported but never used outside core.ts.
`createEventHandler` generic function - exported but not used.

These should be removed or moved to events.ts.

### 8. Handler registration vs config mismatch

**Status:** TODO

EventType enum has `PERMISSION_ASKED` but NO handler registered for it.
Handler exists: `permission.ask`, but not `permission.asked`.

### 9. Magic numbers in code

**Status:** TODO

Hardcoded timeouts (10000, 5000, 2500, 3000) scattered. Should use constants.

### 10. Broken import in test mocks

**Status:** TODO

`test/__mocks__/user-config.ts` imports from non-existent path `./core/config`.

---

## Reviewed - No Issue

- Imperative vs declarative config ✓
- Type duplication (core.ts tool types) ✓
- No `any` in code/tests ✓

---

## Review Complete

Total: 10 TODO items
