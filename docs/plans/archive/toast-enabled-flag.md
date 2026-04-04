# Add toast.enabled flag to allow custom title/variant without showing toast

## Problem

Currently, when `toast: false` is set, the toast-related properties (title, variant, message, duration) are ignored. Users want to keep custom titles/variants for potential future use or debugging without showing the toast.

## Solution

Add `enabled?: boolean` property to `ToastOverride` interface and update the logic to check `toast.enabled` instead of just `toast` truthiness.

## Execution

| Step                                                 | Status | Timestamp           |
| ---------------------------------------------------- | ------ | ------------------- |
| 1. Add enabled property to ToastOverride interface   | ✅     | 2026-04-04 13:55:00 |
| 2. Update resolveEventConfig to handle toast.enabled | ✅     | 2026-04-04 13:55:00 |
| 3. Update resolveToolConfig to handle toast.enabled  | ✅     | 2026-04-04 13:55:00 |
| 4. Add tests for new functionality                   | ⏳     | -                   |

## Changes

### 1. event-types.ts

Add `enabled?: boolean` to ToastOverride interface:

```typescript
export interface ToastOverride {
  enabled?: boolean;
  title?: string;
  message?: string;
  variant?: EventVariant;
  duration?: number;
}
```

### 2. events.ts - resolveEventConfig function

Update logic to handle toast.enabled:

- When toast is `true` → toast.enabled = true (current behavior)
- When toast is `false` → toast.enabled = false (current behavior, title/variant still set but ignored)
- When toast is object `{ enabled: false, title: 'X', variant: 'success' }` → toast.enabled = false but title/variant available

The key change is: resolve `toast` boolean based on:

- If toast is boolean → use it
- If toast is object → use toast.enabled ?? true (default to true if not specified)

Example usage after change:

```typescript
[EventType.SESSION_CREATED]: {
  runScripts: true,
  toast: {
    enabled: false,  // Don't show toast
    title: 'Nova Sessão',  // But keep title for future use
    variant: 'success'
  },
},
```

### 3. events.ts - resolveToolConfig function

Same logic update for tool configs.

### 4. Add tests in events.test.ts

Test cases:

- `toast: { enabled: false }` should set resolved.toast = false but keep toastTitle
- `toast: { enabled: false, title: 'X' }` should preserve title
- `toast: { title: 'X' }` (no enabled) should default to enabled = true
