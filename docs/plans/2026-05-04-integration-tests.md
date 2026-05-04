# Coverage 100% — Unit Additions + Minimal Integration

## Objective

Achieve **100% across all 4 metrics** (Statements, Branches, Functions, Lines) with the **minimum possible work**. Priority: targeted unit test additions over integration tests. Integration tests only for what genuinely needs component interaction.

## Current Gaps

| File                                 | Missing Branches                                                                                                        | Type                      |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `opencode-hooks.ts`                  | L77, L81 (validateScriptsDirectory), L113 (debug mode), L187-189 (block throw), L244-257 (error toast), L300 (disabled) | Unit-feasible             |
| `debug.ts`                           | L73 (debugRecorder.logDebug)                                                                                            | Unit-feasible (same test) |
| `toast-queue.ts`                     | L18-22 (queue methods), L30 (uninit throw)                                                                              | Unit-feasible             |
| `toast-director.ts`                  | L35 (dropped toast error recording)                                                                                     | Unit-feasible             |
| `event-config-builder.ts`            | L168 (isEventDisabled with `true`)                                                                                      | Unit-feasible             |
| `tool-config.resolver.ts`            | L75 (handler.defaultScript), L179 (scripts merge), L286,290-301,308,329-341 (resolveBase)                               | Unit-feasible             |
| `plugin-status.ts`                   | L165 (failed w/o error), L181-201 (user-sep sections), L218,227,232-240 (all-labeled sections)                          | Unit-feasible             |
| `show-startup-toast.ts`              | L48-50 (catch block)                                                                                                    | Unit-feasible (vi.spyOn)  |
| `toast-silence-detector.ts`          | L45-46 (catch block)                                                                                                    | Unit-feasible (DI)        |
| `executor.ts`                        | L243-244 (claude source stdin)                                                                                          | Unit-feasible             |
| `script-executor.ts`                 | L45 (runOnlyOnce + isSubagent)                                                                                          | Unit-feasible             |
| `run-script-handler.ts`              | L37 (isSubagent proxy)                                                                                                  | Unit-feasible (same flow) |
| `audit-logger.ts`                    | uncalled `createDefaultDeps`                                                                                            | Unit-feasible             |
| `event-recorder.ts`                  | L317-318 (logEvent data.input)                                                                                          | Unit-feasible             |
| `script-recorder.ts`                 | L44 (input.args null)                                                                                                   | Unit-feasible             |
| `test/helpers/test-cleanup.ts`       | Stmts 66.66%                                                                                                            | Unit-feasible             |
| `test/unit/helpers/test-defaults.ts` | Stmts 56.25%, Funcs 12.5%                                                                                               | Unit-feasible             |

## Strategy

### Refactor: Make `validateScriptsDirectory` testable (L77)

Extract `getCwdSafe()` and add optional `cwd` parameter — no `?.`/`??`:

```typescript
function getCwdSafe(): string {
  try {
    return process.cwd();
  } catch {
    return '/';
  }
}

function validateScriptsDirectory(cwd: string = getCwdSafe()): void {
  const scriptsDir = path.join(cwd, DEFAULTS.scripts.dir);
  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory()) {
    throw new Error(`Scripts directory not found: ${scriptsDir}`);
  }
}
```

This covers:

- L77 (`cwd = '/'`): test passes a non-existent cwd, path doesn't exist → throw
- L81 (`throw new Error`): test passes a cwd where scripts dir is missing

**File:** `.opencode/plugins/opencode-hooks.ts` (refactor) + `test/unit/opencode-hooks.test.ts` (additions)

### Unit Test Additions

All additions go in **existing test files** — no new files. Each addition follows the testing guide rules.

#### 1. `opencode-hooks.test.ts` — 4 new tests

| Test                                | What it covers | How                                                                          |
| ----------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| plugin disabled returns empty hooks | L300           | `mockSettings.userConfig.enabled = false`, call `OpencodeHooks`, expect `{}` |
| debug mode calls handleDebugLog     | L113           | `resolveEventConfig` returns `{ debug: true }`, verify handleDebugLog path   |
| tool.execute.before throws on block | L187-189       | spawn exit 2 + `hooks['tool.execute.before']`, expect throw                  |
| error toast on script failure       | L244-257       | spawn exit 1 + `showError: true`, verify toast added with error              |

#### 2. `debug.test.ts` — 1 new test

| What                               | How                                                   |
| ---------------------------------- | ----------------------------------------------------- |
| handleDebugLog with debug recorder | Call with global recorder set, expect logDebug called |

#### 3. `event-config-builder.test.ts` — 1 new test

| What                                             | How                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| isEventDisabled with `true` returns false (L168) | `getEventConfig: () => true`, verify `result.enabled === true`, goes through `buildMerged` |

#### 4. `tool-config.resolver.test.ts` — 3 new tests

| What                                              | How                                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| getDefaultConfig with handler.defaultScript (L75) | Handler with defaultScript + default `runScripts: true`, getEventConfig = undefined   |
| resolve with toolHandler.defaultScript (L179)     | Non-empty toolConfig + handler.defaultScript + runScripts                             |
| resolveBase fields (L286,290+ etc)                | getEventConfig returns EventConfig object, verify resolveBase produces correct fields |

#### 5. `plugin-status.test.ts` — 3 new tests

| What                                           | How                                                      |
| ---------------------------------------------- | -------------------------------------------------------- |
| user-only with failed plugin (no error) (L165) | `{ status: 'failed', source: 'user' }` sem `error` field |
| user-separated with all sections (L181-201)    | active user + built-in + failed + incompatible           |
| all-labeled mode edge cases (L218,227,232-240) | built-in failed, built-in incompatible                   |

#### 6. `executor.test.ts` — 1 new test

| What                                        | How                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------- |
| executeScript with claude source (L243-244) | `{ source: 'claude', path: 'test.sh' }`, verify `buildClaudeStdin` used |

#### 7. `script-executor.test.ts` — 1 new test

| What                              | How                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| runOnlyOnce with isSubagent (L45) | `options.runOnlyOnce: true`, `deps.isSubagent` returns `true`, verify early return |

#### 8. `show-startup-toast.test.ts` — 1 new test

| What                                                 | How                                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| catch block on showActivePluginsToast error (L48-50) | `vi.spyOn(showActivePlugins, 'showActivePluginsToast').mockRejectedValue(...)`, verify errorRecorder called |

#### 9. `toast-silence-detector.test.ts` — 1 new test

| What                                     | How                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------- |
| catch block on readFileFn error (L45-46) | Pass `readFileFn` that rejects, verify promise resolves (cleanup path) |

#### 10. `toast-director.test.ts` — 1 new test

| What                                | How                                                                |
| ----------------------------------- | ------------------------------------------------------------------ |
| dropped toast error recording (L35) | `maxSize: 1`, 2 toasts, set `globalThis.__opencode_error_recorder` |

#### 11. `audit-logger.test.ts` — 1 new test

| What                     | How                                               |
| ------------------------ | ------------------------------------------------- |
| call `createDefaultDeps` | Import and call to cover the function declaration |

#### 12. `event-recorder.test.ts` — 1 new test

| What                                    | How                                                                       |
| --------------------------------------- | ------------------------------------------------------------------------- |
| logEvent with data.input set (L317-318) | Call `logEvent` with non-empty `input`, verify record contains input data |

#### 13. `script-recorder.test.ts` — 1 new test

| What                                         | How                                                             |
| -------------------------------------------- | --------------------------------------------------------------- |
| createScriptRecord with undefined args (L44) | Call with `input.args = undefined`, verify `args: []` in output |

#### 14. `test-cleanup.test.ts` (new unit file)

| What                                 | How                                             |
| ------------------------------------ | ----------------------------------------------- |
| Cover `test/helpers/test-cleanup.ts` | Create `test/unit/helpers/test-cleanup.test.ts` |

#### 15. `test-defaults.test.ts` additions

| What                                                           | How                                               |
| -------------------------------------------------------------- | ------------------------------------------------- |
| Cover `test/unit/helpers/test-defaults.ts` remaining functions | Add tests for uncalled functions in existing file |

## Summary

| Category            | Count      | Files                                          |
| ------------------- | ---------- | ---------------------------------------------- |
| Unit test additions | ~21 tests  | 14 existing test files + 1 new                 |
| Integration tests   | 0          | All coverage achievable via unit rules         |
| Refactor            | 1 function | `validateScriptsDirectory` with `getCwdSafe()` |

Total estimated impact: **~21 test additions, 1 refactor, 0 new integration files**.
