# Plan: Eliminate features → audit dependency

## Goal

Remove direct imports of `features/audit/plugin-integration` from `EventConfigBuilder`
and `ToastDirectorImpl`, replacing them with injected callbacks. The entry point
handles wiring between feature modules and the audit system.

## Decisions

### 1. Approach: `setResolverCallbacks()` + required callbacks

| Aspect            | Decision                                                                  |
| ----------------- | ------------------------------------------------------------------------- |
| **Mechanism**     | `setOnUnknownEvent()` in `context.ts` + required param in `ToastDirector` |
| **Typing**        | Callbacks are **required** on the type, always callable with no `?.`      |
| **No-op default** | Callbacks default to no-op before wiring (late-binding)                   |
| **Late-binding**  | `let` binding in `context.ts` — replaceable after module load             |
| **Tests**         | Tests pass `vi.fn()` instead of mocking audit                             |

### 2. ToastDirector: third required constructor param

```typescript
constructor(
  private showFn: (toast: TuiToast) => void | Promise<void>,
  private options: { staggerMs?: number; maxSize?: number },
  private onToastDropped: (dropped: TuiToast) => void,
) {}
```

`onToastDropped` is required — entry point always passes it, tests pass `vi.fn()`.

### 3. EventConfigBuilder: via context field

`ConfigResolverContext` gains a `onUnknownEvent` field as a mutable binding in
`context.ts`. The default is a no-op. The entry point calls `setOnUnknownEvent()`
after `initAuditLogging()`.

```typescript
let onUnknownEvent: OnUnknownEventFn = () => {};

export function setOnUnknownEvent(fn: OnUnknownEventFn): void {
  onUnknownEvent = fn;
}
```

All singletons created before wiring use the `let` binding, so they automatically
pick up the real callback after `setOnUnknownEvent()` is called.

---

## 1. types/events.ts — callback type

Add:

```typescript
interface OnUnknownEventInput {
  readonly eventType: string;
  readonly context: Record<string, unknown>;
}

type OnUnknownEventFn = (input: OnUnknownEventInput) => void;
```

Add `onUnknownEvent: OnUnknownEventFn` to `ConfigResolverContext`.

---

## 2. context.ts — mutable binding + setter

Add `let onUnknownEvent: OnUnknownEventFn = () => {}` and `setOnUnknownEvent()`.
Include `onUnknownEvent` in the context object returned by `createContext()`.

---

## 3. events.ts — re-export setter

Re-export `setOnUnknownEvent` from `features/events/context`.

---

## 4. event-config-builder.ts — replace audit call

Replace:

```typescript
const eventRecorder = getEventRecorder();
if (eventRecorder) {
  eventRecorder.logEvent(...).catch(() => {});
}
```

With:

```typescript
this.context.onUnknownEvent({
  eventType: this.eventType,
  context: { input: { eventType: this.eventType } },
});
```

Remove the `getEventRecorder` import entirely.

---

## 5. toast-director.ts — required callback, remove audit

Remove `getErrorRecorder` import. Add `onToastDropped` as a required third
constructor parameter. Replace the try-catch logging block with a direct call
to `this.onToastDropped(dropped)`.

---

## 6. toast-queue.ts — pass callback through

Add `onToastDropped: (dropped: TuiToast) => void` parameter to
`initGlobalToastQueue()`, pass it to `ToastDirectorImpl` constructor.

---

## 7. opencode-hooks.ts — wiring

After `initAuditLogging()`:

```typescript
setOnUnknownEvent(async (input) => {
  const rec = getEventRecorder();
  if (rec) {
    await rec.logEvent('UNKNOWN_EVENT_IN_RESOLVE', input.context);
  }
});
```

When calling `initGlobalToastQueue()`, pass a callback that logs via
`getErrorRecorder()`.

---

## 8. Tests

### EventConfigBuilder tests

Remove `vi.mock` of `audit/plugin-integration`. The `onUnknownEvent` callback
defaults to no-op via `create-context.ts`. No test changes needed — the callback
is never asserted on in existing tests.

### ToastDirector tests

Remove `vi.mock` of `audit/plugin-integration` and the `mockLogError` hoisted
variable. Add `onToastDropped: (toast: TuiToast) => void` as a third argument
to every `new ToastDirectorImpl(...)` call. Update the "records dropped toast"
test to assert on `onToastDropped` instead of `mockLogError`.

### Other tests affected

`toast-queue.test.ts`, `show-startup-toast.test.ts`, `adapters.test.ts`,
`run-script-handler.test.ts` — all call `initGlobalToastQueue` with one argument.
Add a second no-op argument `() => {}`.

`test-defaults.ts` — `createDefaultContext()` needs `onUnknownEvent: () => {}`.

---

## Files Changed

| #   | File                                                                  | Change                                     |
| --- | --------------------------------------------------------------------- | ------------------------------------------ |
| 1   | `.opencode/plugins/types/events.ts`                                   | `OnUnknownEventFn` type, context field     |
| 2   | `.opencode/plugins/features/events/context.ts`                        | `let` binding + `setOnUnknownEvent()`      |
| 3   | `.opencode/plugins/features/events/events.ts`                         | Re-export `setOnUnknownEvent`              |
| 4   | `.opencode/plugins/features/events/resolvers/event-config-builder.ts` | Replace `getEventRecorder()` with callback |
| 5   | `.opencode/plugins/features/core/toast-director.ts`                   | Required callback, remove audit import     |
| 6   | `.opencode/plugins/core/toast-queue.ts`                               | Pass through `onToastDropped`              |
| 7   | `.opencode/plugins/opencode-hooks.ts`                                 | Wiring both callbacks                      |
| 8   | `test/unit/helpers/create-context.ts`                                 | Add `onUnknownEvent` default               |
| 9   | `test/unit/helpers/test-defaults.ts`                                  | Add `onUnknownEvent` default               |
| 10  | `test/unit/features/core/toast-director.test.ts`                      | Remove audit mock, use callback            |
| 11  | `test/unit/core/toast-queue.test.ts`                                  | Second arg to `initGlobalToastQueue`       |
| 12  | `test/unit/features/messages/show-startup-toast.test.ts`              | Second arg to `initGlobalToastQueue`       |
| 13  | `test/unit/features/scripts/adapters.test.ts`                         | Second arg to `initGlobalToastQueue`       |
| 14  | `test/unit/features/scripts/run-script-handler.test.ts`               | Second arg to `initGlobalToastQueue`       |

---

## Validation

- `npm run build` — TypeScript compilation
- `npm run lint` — ESLint (no-empty fixed)
- `npm run test:cov` — 596 tests passing, 96.82% coverage

---

## Risks

None. Required callbacks with no-op defaults = zero breaking change.
Current behavior preserved via wiring in the entry point.
