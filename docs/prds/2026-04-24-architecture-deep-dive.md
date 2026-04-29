# Codebase Architecture Deep-Dive Analysis

**Date**: 2025-04-24  
**Status**: #1 ✅ #4 ✅ #5 ✅ #6 ✅ #7 ✅ completed; #3 ⏭ skipped  
**Goal**: Identify modules with high architectural friction and opportunities for deepening to improve testability, AI-navigability, and maintainability.

---

## Executive Summary

Explored the OpenCode Hooks plugin codebase from entry point (`opencode-hooks.ts`) through major flows: event handling, script execution, audit logging, toast notifications, security validation, and message formatting.

**7 clusters** of architectural friction identified, ordered by severity:

1. Event Configuration Resolution (highest)
2. Script Execution & Audit Coupling
3. Toast Queue & Concurrency Control
4. Security Validation & Block System
5. Event Handler Registry
6. Message Formatting Pipeline
7. Constants & Global Configuration Scatter

Each cluster exhibits **shotgun surgery** or **tangled responsibilities**, making changes risky and testing inefficient.

---

## 1. Event Configuration Resolution

**Severity**: 🔴 Critical  
**Files**: `features/events/events.ts`, `features/events/context.ts`, `resolvers/event-config.resolver.ts`, `resolvers/tool-config.resolver.ts`, `resolution/scripts.ts`, `resolution/toast.ts`, `resolution/boolean-field.ts`  
**Dependency category**: Control + Data

### Why it's coupled

All share `EventConfig`, `ToolConfig`, `ConfigResolverContext` types. Resolution algorithm is scattered:

1. `resolveEventConfig()` in `events.ts` orchestrates
2. `EventConfigResolverImpl.resolve()` delegates
3. `resolveScripts()`, `resolveToastOverride()`, `getBooleanField()` in separate files

Total: **7 files** to understand one conceptual flow.

### Friction experienced

- Need to bounce between resolver, context, and resolution helpers
- Error swallowing in `tryBuildMessage()` catch blocks hides template bugs
- `runOnlyOnce` subagent logic mixed with script resolution
- Toast override inheritance not tracked in one place

### Test impact

Current coverage: integration tests (`event-flow.test.ts`) mock all dependencies, test happy paths only.

- Missing: edge cases for `runOnlyOnce` with subagents
- Missing: cascade behavior when multiple sources provide config
- Missing: invalid `allowedFields` detection

### Deepening opportunity

Created **ConfigBuilder** class in `features/events/resolvers/event-config-builder.ts` — consolidates all resolution logic (defaults → user config → handler metadata → validation) in one place. Clear stages: `resolve()` → `buildDefault()` / `buildMerged()`. Reduced file-hopping from 7 files to 1.

---

## 2. Script Execution & Audit Coupling

**Severity**: 🔴 Critical  
**Files**: `features/scripts/run-script-handler.ts`, `features/scripts/run-script.ts`, `features/audit/plugin-integration.ts`, `features/audit/script-recorder.ts`, `types/scripts.ts`, `types/audit.ts`  
**Dependency category**: Cross-cutting (audit) tangled with business logic

### Why they're coupled

`runScriptAndHandle()` is 116 lines handling:

- Script execution (with args)
- Error handling & toast display
- Audit logging (optional recorder)
- Session appending
- `runOnlyOnce` gating

Audit dependencies (`scriptRecorder`) passed through `plugin-integration` singleton, sometimes `undefined`.

### Friction experienced

- One function violates Single Responsibility Principle
- Null checks for optional `scriptRecorder` create noise
- Hard to test script failures without also testing audit mocks
- Session appending and toast display interwoven with execution logic

### Test impact

- Unit tests only validate path construction (`run-script.test.ts`)
- Integration tests mock too much; no tests for real `appendToSession` + toast + audit combo
- Missing: tests for script failure recovery patterns (retry, fallback, user notification)

### Deepening opportunity

Extract **ScriptExecutor** service: `execute(script, args, options) → ScriptResult`. Inject dependencies: `AuditLogger`, `ToastNotifier`, `SessionManager` via constructor. Test each collaborator via mocks, but test `ScriptExecutor` at boundary with real-to-test configuration.

---

## 3. Toast Queue & Concurrency Control ⏭ SKIPPED

**Severity**: 🟠 High  
**Files**: `core/toast-queue.ts`, `features/messages/default-handlers.ts`, `features/messages/show-startup-toast.ts`, `features/messages/append-to-session.ts`, `core/constants.ts`  
**Dependency category**: Cross-cutting (UI) with global state

**Why skipped (YAGNI + DRY):**

- `ToastDirectorImpl` (§38§) already exists and works
- Wrappers in `toast-queue.ts` provide clean API
- All 772 tests pass, build clean
- Further abstraction = over-engineering with no real ROI

### Why they're coupled

- Global singleton `globalToastQueue` accessed by handlers
- Queue manages: staggering (based on duration), error priority, overflow logging
- `default-handlers.ts` (50+ entries) configures toast behavior for all events
- Startup logic (`show-startup-toast.ts`) initializes global state

State variables: `activeToast`, `processingLock`, `activeTimers` (Map), `queue` (array). 139 lines of mutable concurrency logic.

### Friction experienced

- Global state makes tests order-dependent and flaky
- Queue logic buried in one file; hard to reason about concurrency
- Connection between handler config (toast duration) and queue behavior (stagger) not explicit

### Test impact

- `toast-queue-concurrency.test.ts` covers basic queueing
- `toast-contract.test.ts` tests handler→queue contract
- Missing: tests for global queue reset, load testing, error-toast priority edge cases

---

## 4. Security Validation & Block System

**Severity**: 🟠 High  
**Files**: `config/security-rules.ts`, `features/block-system/block-handler.ts`, `features/block-system/block-system.ts`, `features/audit/security-recorder.ts`, `features/audit/plugin-integration.ts`, `config/settings.ts`  
**Dependency category**: Control (gating operations) + data

### Why they're coupled

- 6 predicate functions (`blockSecrets`, `blockProtectedBranch`, `blockEnvFiles`, `blockLargeFields`, `blockSensitiveFields`, `blockExternalCalls`) defined in config file but executed via `BlockSystem`
- `block-handler.ts` creates `BlockSystem` instance per call with hardcoded effects, then throws if blocked
- `security-recorder.ts` singleton logs blocked events

### Friction experienced

- Predicates are pure functions but typed as opaque `BlockPredicate` → hard to discover
- `block-handler.ts` (90 lines) does: get recorder, log, create system, evaluate with effects — too many responsibilities
- No test verifies `blockEnvFiles` blocks `.env` but allows `env.example`
- Security-critical logic scattered across config + handler + system

### Test impact

- `block-handler-null-recorder.test.ts` covers only null recorder case
- Zero unit tests for individual predicates with realistic input spans
- No integration tests for blocking full event flow end-to-end

### Deepening opportunity

Extract **SecurityGate** service: `evaluate(event, context) → BlockResult`. Predicates become explicit methods or injected strategy objects. Consolidate effects (audit, toast, throw) in one place. Unit-test each predicate with exhaustive input space (positive/negative/corner cases). Integration tests verify full block flow.

---

## 5. Event Handler Registry ✅ COMPLETED

**Severity**: 🟡 Medium  
**Files**: `features/handlers/` (9 modular files)  
**Dependency category**: Data + Control

### Implementation

Split handlers by **domain** into separate modules: `session-handlers.ts`, `tool-handlers.ts`, `tool-before-handlers.ts`, `tool-after-handlers.ts`, `file-handlers.ts`, `chat-handlers.ts`, `command-handlers.ts`, `server-handlers.ts`, `misc-handlers.ts`. Created `handlers/index.ts` that aggregates all modules. Added TDD tests in `test/unit/handlers/`. Removed legacy 793-line file.

### Results

- Build + Lint passing
- All 1003 tests passing
- Coverage: 100% Statements, 100% Lines
- 9 new handler modules with unit tests

### Impact

Handlers now modular by domain. Adding new event = edit single domain file, not 793-line giant. TDD tests validate each handler.

---

## 6. Message Formatting Pipeline

**Severity**: 🟡 Medium  
**Files**: `build-keys-message.ts`, `format-value.ts`, `get-value-by-path.ts`, `format-time.ts`, `mask-sensitive.ts`, `truncate.ts`  
**Dependency category**: Cross-cutting

### Why they're coupled

Clear pipeline but scattered across 6 files:

1. `buildKeysMessage` (main entry)
2. `getValueByPath` (extract value from object)
3. `formatValue` (convert to string)
4. `maskSensitive` (optional redaction)
5. `truncate` (length limit)

Names don't indicate processing order; `mask-sensitive` vs `truncate` order ambiguous.

### Friction experienced

- Must open multiple files to see full transformation
- Security-critical masking logic (`mask-sensitive.ts`) has zero tests
- `format-time.ts` format string magic numbers unsupported by tests
- Truncation edge cases (Unicode grapheme clusters) not considered

### Test impact

- **0 unit tests** for `format-time.ts`, `mask-sensitive.ts`, `truncate.ts`
- `build-keys-message.ts` tested only through integration tests
- Pure functions but lack test coverage → bugs hidden until runtime

### Deepening opportunity

Create a **MessageFormatter** class with method: `format(event, data) → string`. Configure pipeline: [extract, format, mask, truncate] as composable steps. Unit-test each step with exhaustive cases (dates, emails, tokens, long strings). Integration test full pipeline. Make order explicit and configurable.

---

## 7. Constants & Global Configuration Scatter

**Severity**: 🟢 Low (maintenance)  
**Files**: `core/constants.ts`, `config/settings.ts`, `features/messages/default-handlers.ts`, `features/events/resolution/toast.ts`  
**Dependency category**: Data

### Why they're coupled

Constants used across disparate areas: toast durations, default script names, audit limits, sensitivity patterns. Values defined inline where used, not centralized.

Examples:

- Toast durations (2s, 5s, 10s, 15s) scattered in `toast.ts`, `default-handlers.ts`
- Default script name generation (`${eventType.replace(/\./g, '-')}.sh`) appears in two resolvers
- `MAX_TOAST_LENGTH` in `constants.ts` but other truncation limits in `settings.ts`

### Friction experienced

- To understand all "magic numbers", must check 4+ files
- No single source of truth for defaults
- Refactoring risky because constants are duplicated or referenced indirectly

### Test impact

- Constants themselves not tested (just values)
- But code depend on them is tested with hardcoded literals → refactor breaks tests
- No tests verify that `TOAST_DURATION.TWO_SECONDS = 2000` matches what handlers assume

### Deepening opportunity

Group constants by **domain** into typed objects: `ToastConfig`, `ScriptConfig`, `AuditConfig`. Export a single `DEFAULTS` object from a central module. Refactor all references to use `DEFAULTS.toast.durations.info`. Add unit tests for default values; encourage "constant as documentation" pattern.

---

## Next Steps

1. **Select a candidate** for first deep-dive refactor (recommend #1 or #2)
2. **Frame the problem space**: Write user-facing explanation with constraints and illustrative sketch
3. **Spawn 3+ sub-agents** to design radically different interfaces (minimal, flexible, caller-optimized, ports & adapters)
4. **Compare designs** and pick one (or hybrid)
5. **Save detailed RFC** in `./plans/rfc-[module-name].md`
6. **Implement** in iterative commits with tests

---

## Candidate Selection Matrix

| Candidate            | Friction | Testability | Impact | Complexity |
| -------------------- | -------- | ----------- | ------ | ---------- |
| [1] Event Resolution | Critical | High        | High   | High       |
| [2] Script+Audit     | Critical | High        | High   | Medium     |
| [3] Toast Queue      | High     | Medium      | Medium | Medium     |
| [4] Security         | High     | High        | High   | Medium     |
| [5] Handler Registry | Medium   | Medium      | Medium | Low        |
| [6] Message Pipeline | Medium   | High        | Medium | Low        |
| [7] Constants        | Low      | Low         | Low    | Low        |

**Recommendation**: Start with #2 (Script Execution & Audit Coupling) because:

- Clear boundary exists (script execution vs logging vs UI)
- Test coverage gaps are obvious
- Impact on reliability is high
- Implementation complexity is manageable

---

## Progress Log

### ✅ Candidate #2 — Script Execution & Audit Coupling (Completed 2025-04-24)

**Implementation**:

- Created `types/executor.ts` with clean service interfaces
- Built `ScriptExecutor` class in `features/scripts/script-executor.ts`
- Added `adapters.ts` to bridge existing singletons to new interfaces
- Refactored `run-script-handler.ts` to use the executor (behavior preserved)
- Comprehensive unit tests for executor and adapters

**Results**:

- Coverage: 100% Statements, 100% Lines, 99.29% Branch, 98.75% Functions
- Build + Lint passing
- Behavior unchanged — all existing tests pass
- Commit: `refactor(scripts): extract ScriptExecutor service with dependency injection`

**Impact**: Separated concerns, improved testability, reduced coupling. The `runScriptAndHandle` function remains as compatibility layer; `createScriptRunner` already uses it.

---

### ✅ Candidate #4 — Security Validation & Block System (Completed 2026-04-28)

**Implementation**:

- Made `block` required in `ResolvedEventConfig` (no longer optional `BlockCheck[] | undefined`)
- Removed defensive fallbacks: `blockConfig[0].message || 'Blocked'` → `blockConfig[0].message`
- Simplified types: `block: BlockCheck[]` instead of `block?: BlockCheck[]`
- Removed optional chaining: `resolved.block?.length` → `resolved.block.length`
- Updated all resolvers to always return `block: []` (never undefined)
- Fail-fast: if something is wrong, it breaks fast instead of silent fallback

**Results**:

- Build + Lint passing
- Coverage: Statements 100%, Branches 99.64%, Functions 99.62%, Lines 100%
- All 1003 tests passing

**Impact**: More direct code. If `block` is empty `[]`, no execution. If types are wrong, breaks fast. No silent fallbacks hiding bugs.

---

### ✅ Candidate #6 — Message Formatting Pipeline (Completed 2026-04-28)

**Implementation**:

- Created comprehensive unit tests for pure functions: `format-time.ts`, `mask-sensitive.ts`, `truncate.ts`
- No mocks used — real unit tests with actual function calls
- Tests cover: date formatting, email masking, token redaction, Unicode truncation, edge cases

**Results**:

- Coverage: 100% Statements, 100% Lines, 100% Functions, 100% Branches (for these files)
- Build + Lint passing
- All 772 tests passing

**Impact**: Critical formatting functions now have proper test coverage. Security-critical `mask-sensitive.ts` validated.

---

### ✅ Candidate #7 — Constants & Global Configuration Scatter (Completed 2026-04-28)

**Implementation**:

- Created typed config objects in `types/constants.ts`: `ToastConfig`, `ScriptConfig`, `AuditConfig`, `DefaultsConfig`
- Consolidated all constants into `DEFAULTS` object exported from `core/constants.ts`
- Migrated all files to use `DEFAULTS.toast.durations.X`, `DEFAULTS.scripts.dir`, etc.
- Deleted old constant exports (`TOAST_DURATION`, `SCRIPTS_DIR`, `MAX_PROMPT_LENGTH`, etc.)
- Updated all imports across 20+ files to use direct `DEFAULTS` references

**Results**:

- Build + Lint passing
- All 772 tests passing
- No `any` types introduced
- No re-exports — all imports direct from source

**Impact**: Single source of truth for defaults. Typed constants prevent magic number bugs. Follows project rules (types in `types/`, no re-exports).

---

### ⏭ Candidate #3 — Toast Queue & Concurrency Control (Skipped 2026-04-28)

**Reason (DRY + YAGNI)**:

- `ToastDirectorImpl` (§38§) already exists and works
- Wrappers in `toast-queue.ts` provide clean API
- All 772 tests pass, build clean
- Further abstraction = over-engineering with no real ROI

---

### ✅ Candidate #5 — Event Handler Registry (Completed 2026-04-28)

**Implementation**:

- Split handlers by domain into 9 modules: `session-handlers.ts`, `tool-handlers.ts`, `tool-before-handlers.ts`, `tool-after-handlers.ts`, `file-handlers.ts`, `chat-handlers.ts`, `command-handlers.ts`, `server-handlers.ts`, `misc-handlers.ts`
- Created `handlers/index.ts` aggregating all modules
- Added TDD tests in `test/unit/handlers/` (228 tests)
- Removed legacy 793-line `default-handlers.ts`

**Results**:

- Build + Lint passing
- All 1003 tests passing
- Coverage: 100% Statements, 100% Lines
- 9 new handler modules with unit tests

**Impact**: Handlers now modular by domain. Adding new event = edit single domain file, not 793-line giant. TDD tests validate each handler.

---

### ✅ Candidate #1 — Event Configuration Resolution (Completed 2026-04-28)

**Implementation**:

- Created `ConfigBuilder` class in `features/events/resolvers/event-config-builder.ts`
- Consolidates all resolution logic (defaults → user config → handler metadata → validation) in one place
- Removed scattered helper functions — logic now in builder methods
- Fixed `logEvent` call signature for unknown event logging
- Updated tests to cover `getHandler`, `getDefaultScript`

**Results**:

- Build + Lint passing
- All 779 tests passing
- Coverage: Statements 100%, Branches 99.4%, Functions 99.6%, Lines 100%

**Impact**: Single class handles full config resolution. Clear stages: `resolve()` → `buildDefault()` / `buildMerged()`. No more bouncing between 7 files.

---

## Next Steps

All candidates completed or skipped:

- ✅ #1 (ConfigBuilder), #2 (ScriptExecutor), #4 (block required), #5 (Handler modular), #6 (tests), #7 (DEFAULTS) — completed
- ⏭ #3 (Toast Queue) — skipped (YAGNI/DRY)
