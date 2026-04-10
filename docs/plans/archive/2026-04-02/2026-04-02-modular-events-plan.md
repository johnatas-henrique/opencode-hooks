# Modular Event System - Implementation Plan

**Date:** 2026-04-02
**Status:** Ready for Review

## Execution

| Step | Description                                                                       | Status | Timestamp        |
| ---- | --------------------------------------------------------------------------------- | ------ | ---------------- |
| 1    | Create handlers.ts with all event defaults + messageBuilders using OpenCode types | ✅     | 2026-04-02 20:58 |
| 2    | Create user-events.config.ts template with global defaults                        | ✅     | 2026-04-02 20:59 |
| 3    | Create events.ts with resolveEventConfig logic                                    | ✅     | 2026-04-02 21:00 |
| 4    | Update helpers/index.ts to export new modules                                     | ✅     | 2026-04-02 21:01 |
| 5    | Refactor opencode-hooks.ts to use new modular system                              | ✅     | 2026-04-02 21:02 |
| 6    | Remove old events-config.json                                                     | ✅     | 2026-04-02 21:03 |
| 7    | Update/review tests                                                               | ✅     | 2026-04-02 21:04 |
| 8    | Run all tests and verify (154/154 passing)                                        | ✅     | 2026-04-02 21:05 |
| 9    | Add EventType enum with all 28 OpenCode events                                    | ✅     | 2026-04-02 21:06 |
| 10   | Add handlers for all 28 events                                                    | ✅     | 2026-04-02 21:07 |
| 11   | Add tool.execute.before and shell.env hooks                                       | ✅     | 2026-04-02 21:08 |

---

## Overview

Replace the current hardcoded event system with a fully modular, configurable system where:

- Configuration in TypeScript (type-safe)
- Each event has a handler with messageBuilder (preserves extra data like error.name)
- Multiple scripts per event supported
- Per-tool configuration for tool.execute events
- User edits only `user-events.config.ts`
- Defaults are in `handlers.ts`

---

## File Structure

```
.opencode/plugins/
├── helpers/
│   ├── constants.ts
│   ├── handlers.ts              ← BASE: defaults + messageBuilders (DO NOT EDIT)
│   ├── events.ts                ← LOGIC: resolveEventConfig (DO NOT EDIT)
│   ├── user-events.config.ts    ← USER: only this file
│   └── ...
├── opencode-hooks.ts
└── ...
```

---

## 1. handlers.ts - Base Defaults

### Purpose

Contains ALL default values for each event:

- title
- variant
- duration
- defaultScript
- buildMessage (preserves event data like error.name, sessionID)

### Structure

```typescript
import type {
  EventSessionCreated,
  EventSessionCompacted,
  EventSessionDeleted,
  EventSessionError,
  EventSessionDiff,
  EventSessionIdle,
  EventSessionStatus,
  EventSessionUpdated,
} from '@opencode-ai/sdk';

export interface EventHandler<T = any> {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: (event: T) => string;
}

export const handlers: Record<string, EventHandler> = {
  'session.created': {
    title: '====SESSION CREATED====',
    variant: 'success',
    duration: 2000,
    defaultScript: 'session-created.sh',
    buildMessage: (event: EventSessionCreated) =>
      `Session Id: ${event.properties.info.id}\n` +
      `Title: ${event.properties.info.title}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.compacted': {
    title: '====SESSION COMPACTED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-compacted.sh',
    buildMessage: (event: EventSessionCompacted) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.deleted': {
    title: '====SESSION DELETED====',
    variant: 'error',
    duration: 2000,
    defaultScript: 'session-deleted.sh',
    buildMessage: (event) =>
      `Session Id: ${event.properties.info.id}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.error': {
    title: '====SESSION ERROR====',
    variant: 'error',
    duration: 30000,
    defaultScript: 'session-error.sh',
    buildMessage: (event: EventSessionError) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Error: ${event.properties.error?.name || 'Unknown error'}\n` +
      `Message: ${event.properties.error?.data?.message || 'Unknown message'}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.diff': {
    title: '====SESSION DIFF====',
    variant: 'warning',
    duration: 2000,
    defaultScript: 'session-diff.sh',
    buildMessage: (event) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.idle': {
    title: '====IDLE SESSION====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-idle.sh',
    buildMessage: (event) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.status': {
    title: '====SESSION STATUS====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-status.sh',
    buildMessage: (event) =>
      `Session Id: ${event.properties.sessionID}\n` +
      `Status: ${JSON.stringify(event.properties.status)}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'session.updated': {
    title: '====UPDATED SESSION====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'session-updated.sh',
    buildMessage: (event: EventSessionUpdated) =>
      `Session Id: ${event.properties.info.id}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'server.instance.disposed': {
    title: '',
    variant: 'info',
    duration: 0,
    defaultScript: 'session-stop.sh',
    buildMessage: (event) =>
      `Directory: ${event.properties.directory || 'unknown'}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },

  'tool.execute.after': {
    title: '====SUBAGENT CALLED====',
    variant: 'info',
    duration: 2000,
    defaultScript: 'tool-execute-after.sh',
    buildMessage: (event: any) =>
      `Session Id: ${event.properties?.sessionID || 'unknown'}\n` +
      `Time: ${new Date().toLocaleTimeString()}`,
  },
};
```

---

## 2. user-events.config.ts - User Configuration

### Purpose

Only file the user needs to edit. Contains overrides to defaults.

### Structure

```typescript
export const userConfig = {
  // ========== GLOBALS ==========
  // If not specified in event → uses these values
  enabled: true,
  toast: true,
  saveToFile: true,
  appendToSession: true,
  runScripts: true,

  // ========== EVENTS ==========
  // If event not listed → uses global defaults
  // If event: true → uses all global defaults
  // If event: false → disables everything
  // If event: { ... } → enabled: true implicit, overrides specified fields
  events: {
    // Simple - uses all global defaults
    'session.created': true,

    // Object - any key implicitly enabled: true
    'session.error': {
      runScripts: false,
      appendToSession: false,
    },

    'session.compacted': {
      scripts: ['my-compact.sh'],
    },

    'session.idle': false,
  },

  // ========== TOOLS ==========
  // Per-tool configuration for tool.execute events
  tools: {
    'tool.execute.after': {
      task: {
        toast: true,
        scripts: ['log-agent.sh', 'notify.sh'],
      },
      chat: {
        toast: false,
      },
      'git.commit': {
        runScripts: false,
      },
    },
  },
};
```

---

## 3. events.ts - Logic

### Purpose

Contains functions to merge user config with handler defaults.

### Key Functions

```typescript
import { handlers } from './handlers';
import { userConfig } from './user-events.config';

export interface ResolvedEventConfig {
  enabled: boolean;
  toast: boolean;
  toastTitle: string;
  toastMessage?: string;
  toastVariant: 'success' | 'warning' | 'error' | 'info';
  toastDuration: number;
  scripts: string[];
  saveToFile: boolean;
  appendToSession: boolean;
}

export function getHandler(eventType: string) {
  return handlers[eventType];
}

export function resolveEventConfig(eventType: string): ResolvedEventConfig {
  const handler = handlers[eventType];
  const userEventConfig = userConfig.events[eventType];
  const global = userConfig;

  // Handle: event disabled globally or specifically
  if (!global.enabled) {
    return { enabled: false } as ResolvedEventConfig;
  }

  // Handle: event not configured → use global defaults
  if (userEventConfig === undefined) {
    return {
      enabled: true,
      toast: global.toast,
      toastTitle: handler.title,
      toastMessage: undefined, // use buildMessage
      toastVariant: handler.variant,
      toastDuration: handler.duration,
      scripts: global.runScripts ? [handler.defaultScript] : [],
      saveToFile: global.saveToFile,
      appendToSession: global.appendToSession,
    };
  }

  // Handle: event set to false → disable everything
  if (userEventConfig === false) {
    return { enabled: false } as ResolvedEventConfig;
  }

  // Handle: event is object (implicitly enabled: true)
  const cfg = userEventConfig as any;

  // Resolve scripts (runScripts: false wins over scripts array)
  let scripts: string[] = [];
  if (cfg.runScripts === false) {
    scripts = []; // explicitly disabled
  } else if (cfg.scripts !== undefined) {
    scripts = cfg.scripts; // use array from config
  } else if (cfg.runScripts === true || global.runScripts) {
    scripts = [handler.defaultScript]; // use default
  }

  return {
    enabled: true,
    toast: cfg.toast ?? global.toast,
    toastTitle: cfg.toastTitle ?? handler.title,
    toastMessage: cfg.toastMessage, // if specified, override buildMessage
    toastVariant: cfg.toastVariant ?? handler.variant,
    toastDuration: cfg.toastDuration ?? handler.duration,
    scripts,
    saveToFile: cfg.saveToFile ?? global.saveToFile,
    appendToSession: cfg.appendToSession ?? global.appendToSession,
  };
}

export function resolveToolConfig(
  toolEventType: string,
  toolName: string
): ResolvedEventConfig {
  const toolConfigs = userConfig.tools?.[toolEventType];
  const toolConfig = toolConfigs?.[toolName];

  if (!toolConfig) {
    return resolveEventConfig(toolEventType);
  }

  // Merge tool config with event defaults
  const handler = handlers[toolEventType];
  const global = userConfig;

  if (toolConfig === false) {
    return { enabled: false } as ResolvedEventConfig;
  }

  const cfg = toolConfig as any;

  let scripts: string[] = [];
  if (cfg.runScripts === false) {
    scripts = [];
  } else if (cfg.scripts !== undefined) {
    scripts = cfg.scripts;
  } else if (cfg.runScripts === true || global.runScripts) {
    scripts = [handler.defaultScript];
  }

  return {
    enabled: true,
    toast: cfg.toast ?? global.toast,
    toastTitle: cfg.toastTitle ?? handler.title,
    toastMessage: cfg.toastMessage,
    toastVariant: cfg.toastVariant ?? handler.variant,
    toastDuration: cfg.toastDuration ?? handler.duration,
    scripts,
    saveToFile: cfg.saveToFile ?? global.saveToFile,
    appendToSession: cfg.appendToSession ?? global.appendToSession,
  };
}
```

---

## 4. opencode-hooks.ts - Main Plugin

### Changes

- Remove hardcoded handlers
- Use `resolveEventConfig` and `resolveToolConfig` from events.ts
- Use `handlers[eventType].buildMessage(event)` to build messages
- Execute scripts sequentially
- Simplified structure (~150 lines)

```typescript
export const OpencodeHooks: Plugin = async (ctx: PluginInput) => {
  const { client, $ } = ctx;
  const globalConfig = userConfig;

  if (!globalConfig.enabled) {
    return { event: async () => {}, 'tool.execute.after': async () => {} };
  }

  const toastQueue = getGlobalToastQueue((toast) => {
    client.tui.showToast({ body: toast });
  });

  return {
    event: async ({ event }) => {
      const resolved = resolveEventConfig(event.type);
      if (!resolved.enabled) return;

      const handler = handlers[event.type];

      // Toast
      if (resolved.toast) {
        toastQueue.add({
          title: resolved.toastTitle,
          message: resolved.toastMessage ?? handler.buildMessage(event),
          variant: resolved.toastVariant,
          duration: resolved.toastDuration,
        });
      }

      // Scripts (sequential)
      for (const script of resolved.scripts) {
        try {
          const output = await runScript($, script);
          if (resolved.saveToFile && output) {
            await saveToFile({ content: output });
          }
        } catch (err) {
          console.error(`Script ${script} failed:`, err);
        }
      }
    },

    'tool.execute.after': async (input, _output) => {
      const resolved = resolveToolConfig('tool.execute.after', input.tool);
      if (!resolved.enabled) return;

      const handler = handlers['tool.execute.after'];

      if (resolved.toast) {
        toastQueue.add({
          title: resolved.toastTitle,
          message: resolved.toastMessage ?? handler.buildMessage(input),
          variant: resolved.toastVariant,
          duration: resolved.toastDuration,
        });
      }

      for (const script of resolved.scripts) {
        try {
          const output = await runScript($, script, input.tool);
          if (resolved.saveToFile && output) {
            await saveToFile({ content: output });
          }
        } catch (err) {
          console.error(`Script ${script} failed:`, err);
        }
      }
    },
  };
};
```

---

## 5. Test Updates

Need to update tests to:

1. Mock `handlers.ts`
2. Mock `user-events.config.ts`
3. Test `resolveEventConfig` logic
4. Test `resolveToolConfig` logic

---

## Decision Table - Scripts Resolution

| `runScripts` | `scripts` array | Result                   |
| ------------ | --------------- | ------------------------ |
| `false`      | `['a.sh']`      | ❌ No scripts            |
| `true`       | not defined     | ✅ default script        |
| not defined  | `['a.sh']`      | ✅ `['a.sh']`            |
| not defined  | not defined     | uses global `runScripts` |

---

## Field Summary

### User Config Fields

| Field             | Type    | Description                   |
| ----------------- | ------- | ----------------------------- |
| `enabled`         | boolean | Global plugin on/off          |
| `toast`           | boolean | Global toast on/off           |
| `saveToFile`      | boolean | Global saveToFile on/off      |
| `appendToSession` | boolean | Global appendToSession on/off |
| `runScripts`      | boolean | Global scripts on/off         |

### Event Override Fields

| Field             | Type     | Description                                     |
| ----------------- | -------- | ----------------------------------------------- |
| `runScripts`      | boolean  | Override: disable scripts                       |
| `scripts`         | string[] | Override: use these scripts                     |
| `toast`           | boolean  | Override: toggle toast                          |
| `toastTitle`      | string   | Override: custom title                          |
| `toastMessage`    | string   | Override: custom message (ignores buildMessage) |
| `toastVariant`    | string   | Override: custom variant                        |
| `toastDuration`   | number   | Override: custom duration in ms                 |
| `saveToFile`      | boolean  | Override: toggle saveToFile                     |
| `appendToSession` | boolean  | Override: toggle appendToSession                |

---

## Implementation Order

1. Create `handlers.ts` with all event defaults + messageBuilders
2. Create `user-events.config.ts` with empty template
3. Update `events.ts` with resolve logic
4. Refactor `opencode-hooks.ts` to use new system
5. Update/fix tests

---

## Benefits

| Benefit              | How It's Achieved                         |
| -------------------- | ----------------------------------------- |
| Type-safe config     | TypeScript catches typos                  |
| Small user config    | Only list what you want different         |
| Data preserved       | messageBuilder always includes event data |
| Multiple scripts     | `scripts: ['a.sh', 'b.sh']`               |
| Per-tool config      | `tools['tool.execute.after']['task']`     |
| Quick enable/disable | `event: false` or `event.toast: false`    |
| Easy to understand   | flat structure, logical field names       |

---

## Result ✅

This plan was completed. The modular event system is fully implemented with 28 OpenCode events, configurable via `user-events.config.ts`.
