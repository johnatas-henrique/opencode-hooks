# Coverage Closure: Cleanup + Unit + Integration (Minimum Tests)

## Objective

Close all remaining coverage gaps with minimum tests, cleaning up unnecessary `?.`/`??` operators along the way.

## Phase 1: Simplify `?.`/`??` Operators

Based on current types: `EventHandler.title`, `EventHandler.variant`, `EventHandler.duration` are **REQUIRED** (not optional). When handler exists, these fields are always defined — no `??` fallback needed.

### 1A. Deduplicate `userEventConfig ?? false` (tool-config.resolver.ts `resolveBase`)

Repeat 6 times → compute once:

```typescript
const cfg: EventOverride | false = userEventConfig ?? false;
```

Affected lines: 286, 294, 300, 308, 329, 335, 341
Diff: `userEventConfig ?? false` → `cfg` (removes **5** `??`)

### 1B. Simplify `handler?.X ?? default` → `(handler ? handler.X : default)`

**event-config-builder.ts `buildDefault`:**
| Before | After | Removes |
|--------|-------|---------|
| `this.handler?.title ?? ''` | `this.handler ? this.handler.title : ''` | `?.` + `??` |
| `this.handler?.variant ?? 'info'` | `this.handler ? this.handler.variant : 'info'` | `?.` + `??` |
| `this.handler?.duration ?? DEFAULTS...` | `this.handler ? this.handler.duration : DEFAULTS...` | `?.` + `??` |

**event-config-builder.ts `buildMerged`:**
| Before | After | Removes |
|--------|-------|---------|
| `toastCfg?.title ?? this.handler?.title ?? ''` | `toastCfg?.title ?? (this.handler ? this.handler.title : '')` | 1 `?.` + 1 `??` |
| `toastCfg?.variant ?? this.handler?.variant ?? 'info'` | `toastCfg?.variant ?? (this.handler ? this.handler.variant : 'info')` | 1 `?.` + 1 `??` |
| `toastCfg?.duration ?? this.handler?.duration ?? DEFAULTS...` | `toastCfg?.duration ?? (this.handler ? this.handler.duration : DEFAULTS...)` | 1 `?.` + 1 `??` |

**tool-config.resolver.ts `getDefaultConfig`:**
| Before | After | Removes |
|--------|-------|---------|
| `handler?.title ?? ''` | `handler ? handler.title : ''` | `?.` + `??` |
| `handler?.variant ?? 'info'` | `handler ? handler.variant : 'info'` | `?.` + `??` |
| `handler?.duration ?? DEFAULTS...` | `handler ? handler.duration : DEFAULTS...` | `?.` + `??` |

**tool-config.resolver.ts `resolve` (L147-153):**
| Before | After | Removes |
|--------|-------|---------|
| `toolHandler?.title ?? eventHandler?.title ?? ''` | `toolHandler ? toolHandler.title : (eventHandler ? eventHandler.title : '')` | 2 `?.` + 2 `??` |
| `toolHandler?.variant ?? eventHandler?.variant ?? 'info'` | `toolHandler ? toolHandler.variant : (eventHandler ? eventHandler.variant : 'info')` | 2 `?.` + 2 `??` |
| `toolHandler?.duration ?? eventHandler?.duration ?? DEFAULTS...` | `toolHandler ? toolHandler.duration : (eventHandler ? eventHandler.duration : DEFAULTS...)` | 2 `?.` + 2 `??` |

**tool-config.resolver.ts `resolveBase` (L306,322,324):**
| Before | After | Removes |
|--------|-------|---------|
| `toastCfg?.title ?? handler?.title ?? ''` | `toastCfg?.title ?? (handler ? handler.title : '')` | 1 `?.` + 1 `??` |
| `toastCfg?.variant ?? handler?.variant ?? 'info'` | `toastCfg?.variant ?? (handler ? handler.variant : 'info')` | 1 `?.` + 1 `??` |
| `toastCfg?.duration ?? handler?.duration ?? DEFAULTS...` | `toastCfg?.duration ?? (handler ? handler.duration : DEFAULTS...)` | 1 `?.` + 1 `??` |

### Impact Summary

| Removal Type                | Count   |
| --------------------------- | ------- |
| `??` removed (dedup)        | 5       |
| `?.` removed (cleanup)      | ~18     |
| `??` removed (cleanup)      | ~20     |
| **Total operators removed** | **~43** |

## Phase 2: Unit (6 tests in existing files)

Real gaps (not v8 false positives from `??` chaining):

| #   | File                     | Test                                         | Branch                 |
| --- | ------------------------ | -------------------------------------------- | ---------------------- |
| u1  | `audit-logger.test.ts`   | Export `createDefaultDeps`, import + call    | functions 88.88%       |
| u2  | `event-recorder.test.ts` | `logEvent` without `input`                   | L318 ternary false     |
| u3  | `plugin-status.test.ts`  | failed user without `.error` field           | L165 `p.error ?` false |
| u4  | `plugin-status.test.ts`  | user-separated mode with all 4 sections      | L181-201               |
| u5  | `plugin-status.test.ts`  | all-labeled mode with built-in fail+incompat | L232                   |
| u6  | `executor.test.ts`       | `passStdin: false` on native script          | L245-247               |

## Phase 3: Integration (1 file, 6 tests)

These need state that's hard/impractical to set up in unit tests (real `getErrorRecorder`, async timing):

| #   | Test                                               | Mocks                                                             | Branches                                  |
| --- | -------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| i1  | `getCwdSafe` catch: `process.cwd()` throws         | `process.cwd = () => throw`                                       | opencode-hooks.ts:76,83                   |
| i2  | dropped toast writes error via recorder            | `vi.mock(plugin-integration)` + `maxSize:1`                       | toast-director.ts:35-36                   |
| i3  | re-entrant enqueue during queue processing         | `showFn` that calls `enqueue()` internally                        | toast-director.ts:53 (`processing=true`)  |
| i4  | toast without `duration` uses default              | toast object sem `duration`                                       | toast-director.ts:131 (`??` false branch) |
| i5  | `showStartupToast` catch with recorder active      | `vi.mock(showActivePlugins)` reject + `vi.mock(getErrorRecorder)` | show-startup-toast.ts:49-51               |
| i6  | `runScriptAndHandle` with `runOnlyOnce` + subagent | Spawn + scriptRecorder setup                                      | run-script-handler.ts:37                  |

### Why integration over unit?

- L35-36 (toast-director): `getErrorRecorder()` returns `undefined` in unit because `initAuditLogging` never called.
- L49-51 (show-startup-toast): Same issue - recorder never initialized in standalone test.
- L53 (toast-director): `processing=true` requires `processQueue` to be running mid-enqueue - impossible to trigger synchronously without a callback-driven approach.
- L76 (opencode-hooks): Requires `process.cwd()` to throw AND `/.opencode/scripts` to not exist - integration setup.

## Runbook

1. Apply Phase 1 simplifications (edit 2 files)
2. Add Phase 2 unit tests (edit 4 files, export 1 function)
3. Create Phase 3 integration test (1 new file)
4. Run `npm run test:cov` → verify all gaps closed
5. Run `npm run lint` → verify clean
6. Clean up any 3 old integration test files
