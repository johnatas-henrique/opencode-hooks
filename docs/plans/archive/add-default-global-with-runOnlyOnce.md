## Execution

| Step                                                                                                    | Status | Timestamp        |
| ------------------------------------------------------------------------------------------------------- | ------ | ---------------- |
| 1. Add default property to UserEventsConfig interface in event-types.ts                                 | ✅     | 2026-04-04 01:15 |
| 2. Rename runOnce to runOnlyOnce in all files (event-types, events, opencode-hooks, user-events.config) | ✅     | 2026-04-04 01:17 |
| 3. Update resolveEventConfig in events.ts to support default object                                     | ✅     | 2026-04-04 01:20 |
| 4. Update user-events.config.ts with default object and fix events                                      | ✅     | 2026-04-04 01:22 |
| 5. Update tests to use runOnlyOnce and mock default                                                     | ✅     | 2026-04-04 01:25 |
| 6. Run lint, build, and tests                                                                           | ✅     | 2026-04-04 01:26 |

## Goal

Simplify plugin configuration by adding a global `default` object that all events inherit from. Also rename `runOnce` to `runOnlyOnce` for clarity.

## New Configuration Format

```typescript
interface UserEventsConfig {
  enabled: boolean;
  default?: {
    debug?: boolean;
    toast?: boolean;
    runScripts?: boolean;
    runOnlyOnce?: boolean;
    saveToFile?: boolean;
    appendToSession?: boolean;
  };
  events: Partial<Record<EventType, EventConfig>>;
  tools: { ... };
}

type EventConfig = boolean | { enabled?: boolean } & EventOverride;
```

## Default Values

```typescript
default: {
  debug: false,
  toast: true,
  runScripts: false,
  runOnlyOnce: false,
  saveToFile: true,
  appendToSession: true,
}
```

## Merge Logic

```
enabled: false (or false) → DISABLED_CONFIG (skip everything)
Event-specific config → default → fallback (false)
```

## Example

```typescript
userConfig = {
  enabled: true,
  default: {
    toast: true,
    saveToFile: true,
    appendToSession: true,
    runScripts: false,
    runOnlyOnce: false,
    debug: false,
  },
  events: {
    'session.created': { runScripts: true, runOnlyOnce: true },
    'session.deleted': { enabled: false },
    'session.error': { toast: false },
  },
};
```

## Files to Modify

1. `.opencode/plugins/helpers/event-types.ts`
   - Add `default` to `UserEventsConfig`
   - Rename `runOnce` to `runOnlyOnce`

2. `.opencode/plugins/helpers/events.ts`
   - Update `resolveEventConfig` to read `default`
   - Apply merge logic: specific > default > fallback
   - Rename `runOnce` to `runOnlyOnce`

3. `.opencode/plugins/helpers/user-events.config.ts`
   - Add `default` object
   - Rename `runOnce` to `runOnlyOnce`
   - Update events to use new format

4. `.opencode/plugins/opencode-hooks.ts`
   - Rename `runOnce` to `runOnlyOnce`

5. `test/events.test.ts`
   - Update mocks
   - Update test expectations

6. `test/opencode-hooks.test.ts`
   - Update mocks
   - Rename `runOnce` to `runOnlyOnce`

## Events to Fix (add runScripts: true where scripts exist)

| Event                           | Current       | Fix                  |
| ------------------------------- | ------------- | -------------------- |
| session.created                 | runOnce: true | Add runScripts: true |
| experimental.session.compacting | true          | Add runScripts: true |

## Expected Result

All events inherit from default object. Users only need to specify what they want to change.

Created: 2026-04-03 23:30
