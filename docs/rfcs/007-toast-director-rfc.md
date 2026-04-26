# RFC: Toast Queue Refactor → ToastDirector

**Date**: 2025-04-24  
**Author**: Build Agent (OpenCode)  
**Status**: Draft  
**Candidate**: #3 — Toast Queue & Concurrency Control (from `architecture-deep-dive-analysis.md`)

---

## Problem Statement

Current toast queue implementation mixes global state with complex concurrency logic:

- **Global singleton** (`globalToastQueue`) makes tests flaky and order-dependent
- **139 lines** of mutable state (`queue`, `processingLock`, `activeTimers`, `activeToast`) in one function
- **Two mechanisms**: `showToastStaggered` (global activeToast) + `createToastQueue` (instance) — confusing
- **Hard to test**: Need to reset global state between tests; race conditions hard to reproduce
- **Error overflow logging** ties queue to `getErrorRecorder()` singleton (coupling)

**Goal**: Separate concerns, make testable, eliminate global state in handlers.

---

## Proposed Solution: `ToastDirector` + Adapters

### 1. Core Interface

```typescript
// types/toast.ts (extend)
export interface ToastDirector {
  // enqueue a toast for display
  enqueue(toast: TuiToast): void;

  // wait for all pending toasts to be displayed
  flush(): Promise<void>;

  // clear queue and cancel timers
  clear(): void;

  // statistics (for testing/monitoring)
  readonly pending: number;
  readonly isProcessing: boolean;

  // lifecycle
  shutdown(): Promise<void>; // waits for active toast to finish
}
```

### 2. Implementation Class

```typescript
// features/core/toast-director.ts
class ToastDirectorImpl implements ToastDirector {
  private queue: TuiToast[] = [];
  private processing = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private activePromise: Promise<void> | null = null;

  constructor(
    private showFn: (toast: TuiToast) => void | Promise<void>,
    private options: { staggerMs?: number; maxSize?: number } = {}
  ) {}

  enqueue(toast: TuiToast): void {
    if (this.queue.length >= this.options.maxSize) {
      this.queue.shift(); // drop oldest
    }
    if (toast.variant === 'error') {
      this.queue.unshift(toast); // priority
    } else {
      this.queue.push(toast);
    }
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const toast = this.queue.shift()!;
      await this.delay(this.options.staggerMs ?? 0);
      await Promise.resolve(this.showFn(toast));
      await this.delay(toast.duration ?? TOAST_DURATION.FIVE_SECONDS);
    }

    this.processing = false;
  }

  // ... other methods
}
```

### 3. Adapter for Existing Global API

To avoid breaking existing code, keep `useGlobalToastQueue()` but have it return a `ToastDirector` instance:

```typescript
// features/core/toast-directory-adapter.ts
let globalToastDirector: ToastDirector | null = null;

export function initGlobalToastDirector(showFn: ShowToastFn): ToastDirector {
  globalToastDirector = new ToastDirectorImpl(showFn, {
    staggerMs: STAGGER_MS.DEFAULT,
    maxSize: 50,
  });
  return globalToastDirector;
}

export function useGlobalToastDirector(): ToastDirector {
  if (!globalToastDirector) {
    throw new Error('ToastDirector not initialized');
  }
  return globalToastDirector;
}
```

And adapt `createToastQueue` to wrap a director:

```typescript
export function createToastQueue(
  showFn: (toast: TuiToast) => void | Promise<void>,
  options: { staggerMs?: number; maxSize?: number } = {}
): ToastQueue {
  const director = new ToastDirectorImpl(showFn, options);
  return {
    add: (t) => director.enqueue(t),
    addMultiple: (ts) => ts.forEach((t) => director.enqueue(t)),
    clear: () => director.clear(),
    flush: () => director.flush(),
    get pending() {
      return director.pending;
    },
  };
}
```

### 4. Refactor Handlers

Where handlers do:

```typescript
useGlobalToastQueue().add({ title, message, variant, duration });
```

It becomes:

```typescript
useGlobalToastDirector().enqueue({ title, message, variant, duration });
```

The method name changes, but the effect is the same.

---

## Migration Plan

1. **Create ToastDirector interface** in `types/toast.ts` (add to existing file)
2. **Implement ToastDirectorImpl** in `features/core/toast-director.ts`
3. **Create adapter** `features/core/toast-director-adapter.ts` that maintains `globalToastDirector`
4. **Refactor `createToastQueue`** to use `ToastDirectorImpl` internally
5. **Keep `useGlobalToastQueue`** as deprecated wrapper that throws if director not initialized
6. **Update all handlers** to use `useGlobalToastDirector().enqueue()` — one handler at a time, with regression tests
7. **Update tests** to use director directly where possible; test global adapter too
8. **Remove `showToastStaggered`** (its logic moves into director)
9. **Update `run-script-handler.ts`** (uses `useGlobalToastQueue`) → upgrade to director
10. **Remove global state** after all handlers migrated (optional, if no external users)

---

## Benefits

- **Testable**: Create fresh `ToastDirector` instance per test; no shared state
- **Clear lifecycle**: `init → enqueue → flush → shutdown`
- **Single responsibility**: Director manages queue only; no audit logging inside
- **Observable**: `pending` and `isProcessing` for metrics
- **Eliminates race conditions**: State isolated per instance

---

## Risks & Mitigations

| Risk                                                    | Mitigation                                                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Breaking external plugins using `useGlobalToastQueue()` | Keep adapter that throws clear error telling to migrate                                                    |
| Existing tests rely on global state                     | Tests already use `resetGlobalToastQueue()`; after adapter change they'll use `globalToastDirector = null` |
| Performance overhead from class vs closure              | Negligible (one extra object); director can be instantiated once at startup                                |
| `showToastStaggered` used elsewhere?                    | Search codebase; if used, migrate to `director.enqueue()` and remove function                              |

---

## Alternatives Considered

1. **Keep global but encapsulate in class** — would still be global, but at least state is contained. We want to eliminate global in handlers.
2. **Event-driven toast system** — too big, out of scope for this candidate.
3. **Do nothing** — high technical debt, flaky tests persist.

---

## Success Criteria

- ✅ All existing tests pass without modification (adapter preserves behavior)
- ✅ Can write isolated unit tests for `ToastDirector` with mock `showFn`
- ✅ No global mutable state in handler code (`useGlobalToastDirector` provides instance, but state is per-director)
- ✅ **100% coverage in all newly created/modified files** (toast-director.ts, adapters, updated handlers)
- ✅ Build + lint pass
- ✅ One commit per migrated handler (atomic)
- ✅ All RFCs saved in `plans/` directory for future reference

---

## Next Steps

1. Approval to proceed with implementation
2. Create `types/toast.ts` extension
3. Implement `ToastDirectorImpl`
4. Write unit tests
5. Refactor `createToastQueue` and global adapter
6. Migrate handlers one by one (starting with `run-script-handler.ts`)

---

**Estimated effort**: 2-3 hours (including tests)
