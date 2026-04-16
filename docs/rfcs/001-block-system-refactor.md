# RFC: Block System Refactor

**Status**: Draft  
**Priority**: High  
**Date**: 2026-04-16  
**Author**: Architecture Review

---

## Summary

Separate pure block predicates from side effects (toast + file logging) to improve testability.

---

## Problem Statement

Current `executeBlocking()` in `block-handler.ts` mixes:

- Pure evaluation logic
- Side effects (`useGlobalToastQueue()`, `saveToFile()`)
- Error throwing

**Issues:**

1. `BlockPredicate` defined in TWO places (`blocks.ts` and `types/config.ts`) — duplication!
2. Hard to unit test pure predicate logic
3. Side effects prevent testing without heavy mocking

---

## Current Architecture

```
helpers/config/blocks.ts (67 lines) — Pure predicates
helpers/block-handler.ts (47 lines) — Mixed logic + side effects
types/config.ts — DUPLICATE BlockPredicate definition
```

---

## Design Options

### Option A: Minimal Interface (Recommended)

```typescript
// 1-3 entry points, separates pure from effects

interface BlockResult {
  blocked: boolean;
  predicate: BlockPredicate;
  message?: string;
}

interface BlockSystem {
  // Pure evaluation (testable)
  evaluate(
    predicates: BlockPredicate[],
    input: ToolExecuteBeforeInput,
    output: ToolExecuteBeforeOutput,
    scriptResults: ScriptResult[]
  ): BlockResult | null;

  // With side effects (convenient)
  evaluateWithEffects(config: BlockConfig): void;
}

interface BlockEffects {
  notify: (message: string, details?: unknown) => void;
  log: (data: unknown) => void;
}
```

**Usage:**

```typescript
// Pure test
const result = blockSystem.evaluate([blockEnvFiles], input, output, []);
expect(result?.blocked).toBe(true);

// With effects
blockSystem.evaluateWithEffects({ predicates, input, output, scriptResults });
```

---

### Option B: Flexible (Composables)

```typescript
// Supports AND/OR/NOT combinators, async predicates

interface BlockContext {
  input: ToolExecuteBeforeInput;
  output: ToolExecuteBeforeOutput;
  scriptResults: ScriptResult[];
  eventType: string;
  timestamp: Date;
}

interface BlockDefinition {
  id?: string;
  predicate: (ctx: BlockContext) => boolean;
  condition?: BlockPredicateGroup;
  message?: string | ((ctx: BlockContext) => string);
  severity?: 'error' | 'warning' | 'soft-block';
}

// Composable predicates
const dangerousGitOps = compose.or(blockGitForce, blockProtectedBranch);
```

**Trade-off**: More powerful but higher learning curve.

---

### Option C: Ports & Adapters

```typescript
// Hexagonal architecture

interface NotificationPort {
  notify(notification: ToastNotification): void;
}

interface LoggerPort {
  log(event: BlockedEvent): void;
}

interface BlockPorts {
  notification: NotificationPort;
  logger: LoggerPort;
  onBlockResult: BlockResultPort;
}

// Core stays pure
function executeBlocking(params, ports: BlockPorts): void;
```

**Trade-off**: Clean boundaries, but more files to maintain.

---

## Recommendation

**Option A (Minimal)** for this codebase size:

- Simple, easy to understand
- 1-3 entry points
- Clear separation
- Migration path via `evaluateWithEffects()`

---

## Migration Path

```typescript
// Before (current)
executeBlocking(blockConfig, input, output, results, eventType);

// After (new)
const system = createBlockSystem(defaultEffects);
system.evaluateWithEffects({
  predicates: blockConfig,
  input,
  output,
  scriptResults,
  eventType,
});
```

---

## Files to Change

| File                       | Action                            |
| -------------------------- | --------------------------------- |
| `helpers/block-system.ts`  | Create new module                 |
| `helpers/config/blocks.ts` | Rename to `block-predicates.ts`   |
| `helpers/block-handler.ts` | Update to use `BlockSystem`       |
| `types/config.ts`          | Remove duplicate `BlockPredicate` |

---

## Testability Gain

```typescript
// Pure unit test (no mocks needed)
const result = blockSystem.evaluate(
  [blockEnvFiles, blockGitForce],
  { tool: 'write' },
  { args: { filePath: '.env' } },
  []
);
expect(result?.blocked).toBe(true);
```

---

## Open Questions

1. Should we support async predicates?
2. Do we need composable predicates (AND/OR/NOT)?
3. Keep throwing errors or return result?

---

## Next Steps

- [ ] User reviews this RFC
- [ ] Pick design option
- [ ] Implement in `feat/block-system-refactor` branch
- [ ] Write tests for pure logic
