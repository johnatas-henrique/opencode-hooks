# RFC: Deep Module — Event Config Resolution

**Status**: Implemented  
**Implemented Date**: 2026-04-16  
**Priority**: Medium  
**Date**: 2026-04-16  
**Author**: Architecture Review

---

## Summary

Break `events.ts` (543 lines) into pure, composable resolution functions with dependency injection.

---

## Problem Statement

`events.ts` has complex resolution logic depending on global `userConfig`:

| Function               | Lines | Problem                            |
| ---------------------- | ----- | ---------------------------------- |
| `resolveEventConfig()` | 100+  | 15+ resolution steps               |
| `resolveToolConfig()`  | 80+   | Inherits from `resolveEventConfig` |
| `resolveToast()`       | 15+   | Nested boolean logic               |
| `resolveScripts()`     | 20+   | 5 config shapes to handle          |
| `getWithDefault()`     | 10+   | Dynamic key handling               |

**Issues:**

- `userConfig` imported globally — can't swap for tests
- Functions depend on each other — can't extract one
- Testing edge case requires mocking entire config tree

---

## Current Problem

```typescript
// events.ts - hard to test
import { userConfig } from './config/index';

export function resolveEventConfig(
  eventType: string,
  input?: Record<string, unknown>,
  output?: Record<string, unknown>
): ResolvedEventConfig {
  const handler = handlers[eventType];
  const userEventConfig = userConfig.events[eventType]; // GLOBAL!

  if (!userConfig.enabled) {
    // GLOBAL!
    return DISABLED_CONFIG;
  }
  // ... 100+ more lines
}
```

---

## Proposed Architecture

```
helpers/events/
├── index.ts                    # Public API (backward compatible)
├── interfaces.ts               # All types
├── context.ts                  # DI container (replaces global)
├── resolvers/
│   ├── event-config.resolver.ts    # Main resolution
│   ├── tool-config.resolver.ts     # Tool-specific
│   └── default-config.resolver.ts  # Default factory
└── resolution/
    ├── scripts.ts              # Pure: resolve scripts
    ├── toast.ts                # Pure: resolve toast
    ├── save-to-file.ts         # Pure: resolve file config
    └── boolean-field.ts        # Pure: getWithDefault
```

---

## Interface Signatures

```typescript
// context.ts - Dependency Injection

export interface ConfigResolverContext {
  readonly enabled: boolean;
  readonly default: EventOverride;
  readonly scriptToasts: ScriptToastsConfig;
  readonly getEventConfig: (eventType: string) => EventConfig | undefined;
  readonly getToolConfigs: (
    toolEventType: string
  ) => Record<string, ToolConfig> | undefined;
}

export function createContext(
  userConfig: UserEventsConfig
): ConfigResolverContext {
  return {
    get enabled() {
      return userConfig.enabled;
    },
    getEventConfig: (type) =>
      userConfig.events[type as keyof typeof userConfig.events],
    getToolConfigs: (type) =>
      userConfig.tools[type as keyof typeof userConfig.tools] as Record<
        string,
        unknown
      >,
  };
}
```

```typescript
// resolution/scripts.ts - Pure function

export function resolveScripts(
  config: EventConfig | undefined,
  handlerDefaultScript: string,
  eventBaseScripts: string[]
): { scripts: string[]; runScripts: boolean } {
  if (config === false) return { scripts: [], runScripts: false };
  if (config === true)
    return { scripts: [handlerDefaultScript], runScripts: true };

  if (typeof config === 'object' && config !== null) {
    if (config.runScripts === false) return { scripts: [], runScripts: false };
    if (config.scripts) return { scripts: config.scripts, runScripts: true };
    if (config.runScripts === true)
      return { scripts: [handlerDefaultScript], runScripts: true };
    return { scripts: eventBaseScripts, runScripts: false };
  }

  return { scripts: [], runScripts: false };
}
```

```typescript
// resolution/boolean-field.ts - Pure function

export function getBooleanField(
  eventConfig: EventConfig | undefined,
  defaultConfig: EventOverride | undefined,
  key: 'debug' | 'toast' | 'runScripts' | 'appendToSession',
  fallback: boolean
): boolean {
  if (typeof eventConfig === 'object' && eventConfig !== null) {
    const value = eventConfig[key];
    if (value !== undefined) return Boolean(value);
  }

  if (defaultConfig) {
    const value = defaultConfig[key];
    if (value !== undefined) return Boolean(value);
  }

  return fallback;
}
```

---

## Usage Examples

### Before (current — global coupling)

```typescript
// events.ts - uses global userConfig
export function resolveEventConfig(eventType, input, output) {
  if (!userConfig.enabled) return DISABLED_CONFIG; // Can't test without mock
  // ...
}

// Test: Needs to mock entire userConfig tree
jest.mock('./config/index', () => ({
  userConfig: { enabled: true, events: {...}, ... }
}));
```

### After (pure, injectable)

```typescript
// New API - testable
import { createContext, createResolver } from './events/context';

const mockContext = createContext({
  enabled: false,
  default: {},
  events: {},
  tools: {},
  // ...
});

const resolver = createResolver(mockContext);
const result = resolver.resolve('session.created');

// Test: Just pass different context
expect(result.enabled).toBe(false);
```

---

## Unit Tests (After)

```typescript
// resolution/scripts.test.ts
import { resolveScripts } from './scripts';

describe('resolveScripts', () => {
  it('returns empty when config is false', () => {
    expect(resolveScripts(false, 'default.sh', [])).toEqual({
      scripts: [],
      runScripts: false,
    });
  });

  it('returns handler default when config is true', () => {
    expect(resolveScripts(true, 'default.sh', [])).toEqual({
      scripts: ['default.sh'],
      runScripts: true,
    });
  });

  it('returns explicit scripts array', () => {
    const config = { scripts: ['custom.sh'] };
    expect(resolveScripts(config, 'default.sh', [])).toEqual({
      scripts: ['custom.sh'],
      runScripts: true,
    });
  });
});
```

```typescript
// resolvers/event-config.test.ts
import { createContext, createResolver } from './context';

describe('EventConfigResolver', () => {
  it('returns DISABLED_CONFIG when global disabled', () => {
    const ctx = createContext({ ...mockConfig, enabled: false });
    const resolver = createResolver(ctx);

    expect(resolver.resolve('session.created').enabled).toBe(false);
  });
});
```

---

## Complexity Hidden

| Original                       | Hidden Behind               |
| ------------------------------ | --------------------------- |
| 100+ line `resolveEventConfig` | 8 pure resolution functions |
| 15+ config shapes for toast    | `resolveToastEnabled()`     |
| 5 shapes for scripts           | `resolveScripts()`          |
| Dynamic key handling           | `getBooleanField()`         |
| Nested FileTemplate parsing    | `parseFileTemplate()`       |

---

## Migration Path

```typescript
// STEP 1: Create structure (no changes)
helpers/events/
├── context.ts
├── interfaces.ts
├── resolution/scripts.ts
├── resolution/toast.ts
├── resolution/boolean-field.ts
├── resolution/save-to-file.ts
└── resolvers/event-config.resolver.ts

// STEP 2: Create adapter layer (backward compatible)
import { createContext } from './context';
import { userConfig } from '../config/index';

const context = createContext(userConfig);
export const resolveEventConfig = (eventType, input, output) =>
  createResolver(context).resolve(eventType, input, output);

// STEP 3: Add tests incrementally
// resolution/scripts.test.ts
// resolution/toast.test.ts
// resolvers/event-config.test.ts

// STEP 4: Deprecate original (optional)
// STEP 5: Remove old code
```

---

## File Count Reduction

| Metric              | Before | After |
| ------------------- | ------ | ----- |
| Lines per file      | 543    | <50   |
| Total files         | 1      | 12    |
| Testable units      | 0      | 8     |
| Global dependencies | 5+     | 0     |

---

## Next Steps

- [ ] User reviews this RFC
- [ ] Create `helpers/events/` module structure
- [ ] Implement resolution functions one by one
- [ ] Write tests for each resolution function
- [ ] Create DI context
- [ ] Migrate to new architecture
