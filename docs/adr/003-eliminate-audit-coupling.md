# ADR-003: Eliminate features → audit dependency

## Status

Implemented

## Context

Two feature modules imported `audit/plugin-integration` directly:

- `EventConfigBuilder` called `getEventRecorder()` to log unknown events
- `ToastDirectorImpl` called `getErrorRecorder()` to log dropped toasts

This created invisible cross-feature coupling. Swapping the audit system
would require changing both events and core modules.

## Decision

Inject callbacks instead of importing global audit state:

- `EventConfigBuilder` reads `onUnknownEvent` from `ConfigResolverContext`
  (a required field, always callable without `?.`)
- `ToastDirectorImpl` takes `onToastDropped` as a required third
  constructor parameter

A `let` binding in `context.ts` provides late-binding: `setOnUnknownEvent()`
replaces the no-op default after `initAuditLogging()` runs. The entry point
(`opencode-hooks.ts`) wires both callbacks to the real audit recorder.

`toastQueue` was also added to `UserEventsConfig` (`ToastQueueConfig` with
`staggerMs` and `maxSize` fields) so test files could pass explicit values
instead of inheriting hardcoded defaults.

## Consequences

- Both feature modules no longer import from `audit/`
- Tests pass `vi.fn()` as callbacks instead of mocking audit
- Type safety: `onUnknownEvent` and `onToastDropped` are required on
  their respective types — no `?.` at call sites
- Late-binding via `let` variable means no module restructuring needed
- `toastQueue` config allows users to tune toast stagger and queue size
