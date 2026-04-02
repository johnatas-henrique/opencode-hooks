# Plan: Event Toggle System via JSON Config

## Objective
Create a JSON configuration file to enable/disable events without modifying code. Each event can be turned on/off independently via configuration. The design must be **future-proof** - no need to update when OpenCode adds new events.

---

## Execution

| Step | Status | Timestamp |
| ---- | ------ | --------- |
| 1. Create events-config.json with opt-out pattern | ✅ | 2026-04-02 02:30 |
| 2. Create events-config.ts loader module | ✅ | 2026-04-02 02:35 |
| 3. Update session-plugins.ts to use config | ✅ | 2026-04-02 02:40 |
| 4. Add granular controls (toast, script, appendToSession) | ✅ | 2026-04-02 02:40 |
| 5. Test the toggle system | ✅ | 2026-04-02 02:45 |
| 6. Update documentation | ✅ | 2026-04-02 02:45 |
| 7. Fix logToFile flag for script output | ✅ | 2026-04-02 05:00 |

---

## All OpenCode Events (from Official Docs)

### Categories & Events

| Category | Events | Plugin Status |
|----------|--------|----------------|
| **Command** | `command.executed` | ❌ Not implemented |
| **File** | `file.edited`, `file.watcher.updated` | ⚠️ Not fully implemented |
| **Installation** | `installation.updated` | ❌ Not implemented |
| **LSP** | `lsp.client.diagnostics`, `lsp.updated` | ❌ Not implemented |
| **Message** | `message.part.removed`, `message.part_updated`, `message.removed`, `message.updated` | ❌ Not implemented |
| **Permission** | `permission.asked`, `permission.replied` | ❌ Not implemented |
| **Server** | `server.connected`, `server.instance.disposed` | ⚠️ Partial |
| **Session** | `session.created`, `session.compacted`, `session.deleted`, `session.diff`, `session.error`, `session.idle`, `session.status`, `session.updated` | ✅ Fully implemented |
| **Todo** | `todo.updated` | ❌ Not implemented |
| **Shell** | `shell.env` | ❌ Not implemented |
| **Tool** | `tool.execute.after`, `tool.execute.before` | ⚠️ Partial |
| **TUI** | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` | ❌ Not implemented |

**Total: 38 events across 12 categories**

---

## Proposed Configuration Structure

### File: `.opencode/plugins/events-config.json`

```json
{
  "version": "1.0.0",
  "description": "Event toggle config - defaults to ON, override what you want OFF",
  
  "global": {
    "enabled": true,
    "logToFile": true,
    "defaultToastDuration": 3000
  },
  
  "events": {
    // === EXAMPLES (uncomment and modify as needed) ===
    
    // Disable entire event:
    // "session.status": false,
    // "session.updated": false,
    // "tool.execute.before": false,
    
    // Disable only toast for specific event:
    // "session.diff": { "toast": false },
    
    // Enable specific features for event:
    // "session.created": { "toast": true, "script": true, "appendToSession": true },
    // "session.compacted": { "toast": true, "script": true, "appendToSession": true }
  },
  
  "toast": true,
  "scripts": true,
  "appendToSession": true
}
```

### How It Works

| Property | Default | Override |
|----------|---------|----------|
| `events."event-name"` | true | `"event-name": false` (disable) or `"event-name": { "toast": false }` (granular) |
| `toast` | true | `"toast": false` (disable all toasts) |
| `scripts` | true | `"scripts": false` (disable all scripts) |
| `appendToSession` | true | `"appendToSession": false` (disable all appends) |

### Usage Examples

| Case | Configuration |
|------|---------------|
| Disable entire event | `"session.idle": false` |
| Disable only toast for session.diff | `"session.diff": { "toast": false }` |
| Disable all toasts globally | `"toast": false` |
| Disable all scripts globally | `"scripts": false` |
| Combine global + specific | `"toast": false` + `"session.error": { "toast": true }` |

### Priority Order

```
1. Specific event (events."event.name".toast/script/appendToSession)
2. Global feature toggle (toast/scripts/appendToSession)
3. Fallback to true
```

---

## Future-Proof Design Strategy

### How It Works - Cascading Fallback System

```
Priority (highest to lowest):
1. Specific event override → events."event.name".*
2. Category default → categories."category".*
3. Global default → global.*
```

### Benefits

| Feature | Description |
|---------|-------------|
| **Zero maintenance** | New OpenCode events automatically use category defaults |
| **Easy to understand** | User only configures what they need |
| **Flexible** | Override at event level OR category level |
| **Git trackable** | JSON changes are version controlled |

### Example: Future Event Auto-Enable

If OpenCode adds `session.migrated` in the future:
- Automatically inherits from `categories.session` settings
- User doesn't need to update config
- Can opt-out by adding to `events.*` with `"enabled": false`

---

## Configuration Properties

### Hierarchy of Control

```
┌────────────────────────────────────────────┐
│  GLOBAL (global.*)                         │
│  - enabled, toast, scripts, appendToSession│
│  - logToFile, defaultToastDuration        │
├────────────────────────────────────────────┤
│  CATEGORY (categories.session, etc)      │
│  - Override global for entire category    │
├────────────────────────────────────────────┤
│  SPECIFIC EVENT (events.session.created)  │
│  - Override specific event                 │
└────────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1: events-config.json (Simplified)

```json
{
  "version": "1.0.0",
  "description": "Event toggle configuration - opt-out pattern (defaults to ON)",
  
  "global": {
    "enabled": true,
    "logToFile": true,
    "defaultToastDuration": 3000
  },
  
  "events": {
    // === Current implementations - defaults to ON ===
    // "session.created": { "toast": true, "script": true, "appendToSession": true },
    // "session.compacted": { "toast": true, "script": true, "appendToSession": true },
    // "session.deleted": { "toast": true },
    // "session.diff": { "toast": true },
    // "session.error": { "toast": true },
    // "session.idle": { "toast": true },
    // "server.instance.disposed": { "script": true },
    // "tool.execute.after": { "toast": true, "script": true },
    
    // === Disabled by default ===
    // "session.status": false,
    // "session.updated": false,
    // "tool.execute.before": false,
    
    // === Override examples ===
    // "session.diff": { "toast": false }
  },
  
  "toast": true,
  "scripts": true,
  "appendToSession": true
}
```

### Step 2: events-config.ts (Loader Module)

```typescript
// .opencode/plugins/helpers/events-config.ts

import { readFile } from "fs/promises";
import { join } from "path";

export interface EventToggleConfig {
  enabled?: boolean;
  toast?: boolean;
  script?: boolean;
  appendToSession?: boolean;
}

export interface GlobalConfig {
  enabled: boolean;
  logToFile: boolean;
  defaultToastDuration: number;
}

export interface EventsConfig {
  version: string;
  description: string;
  global: GlobalConfig;
  events: Record<string, EventToggleConfig | boolean>;
  toast: boolean;
  scripts: boolean;
  appendToSession: boolean;
}

// Default config - everything ON by default
const DEFAULT_CONFIG: EventsConfig = {
  version: "1.0.0",
  description: "Default event toggle configuration",
  global: {
    enabled: true,
    logToFile: true,
    defaultToastDuration: 3000,
  },
  events: {
    // Session events - enabled by default
    "session.created": { enabled: true, toast: true, script: true, appendToSession: true },
    "session.compacted": { enabled: true, toast: true, script: true, appendToSession: true },
    "session.deleted": { enabled: true, toast: true },
    "session.diff": { enabled: true, toast: true },
    "session.error": { enabled: true, toast: true },
    "session.idle": { enabled: true, toast: true },
    
    // Disabled by default
    "session.status": { enabled: false },
    "session.updated": { enabled: false },
    
    // Server events
    "server.instance.disposed": { enabled: true, script: true },
    "server.connected": { enabled: false },
    
    // Tool events
    "tool.execute.after": { enabled: true, toast: true, script: true },
    "tool.execute.before": { enabled: false },
  },
  toast: true,
  scripts: true,
  appendToSession: true,
};

let cachedConfig: EventsConfig | null = null;

export async function loadEventsConfig(): Promise<EventsConfig> {
  if (cachedConfig) return cachedConfig;

  try {
    const configPath = join(__dirname, "..", "events-config.json");
    const content = await readFile(configPath, "utf-8");
    cachedConfig = JSON.parse(content) as EventsConfig;
    return cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

// Get config with cascading fallback
export function getEventConfig(eventType: string): EventToggleConfig {
  const config = cachedConfig || DEFAULT_CONFIG;
  
  // 1. Check specific event in config
  const eventConfig = config.events[eventType];
  if (eventConfig !== undefined) {
    // If boolean false, event is disabled
    if (typeof eventConfig === "boolean") {
      return { enabled: eventConfig };
    }
    return eventConfig;
  }

  // 2. Fallback to global feature defaults
  return {
    enabled: true,
    toast: config.toast,
    script: config.scripts,
    appendToSession: config.appendToSession,
  };
}

export function isEventEnabled(eventType: string): boolean {
  const config = getEventConfig(eventType);
  return config.enabled !== false;
}

export function resetConfigCache(): void {
  cachedConfig = null;
}
```

### Step 3: session-plugins.ts (Updated)

```typescript
import { loadEventsConfig, getEventConfig } from "./helpers/events-config";

export const SessionPlugins: Plugin = async (ctx: PluginInput) => {
  const { client, $ } = ctx;
  const config = await loadEventsConfig();
  
  // Check global master switch
  if (!config.global.enabled) {
    return { event: async () => {}, "tool.execute.after": async () => {} };
  }
  
  const toastQueue = getGlobalToastQueue(/* ... */);
  const timestamp = new Date().toISOString();

  return {
    event: async ({ event }) => {
      const eventConfig = getEventConfig(event.type);
      
      // Skip if event is disabled
      if (eventConfig.enabled === false) {
        return;
      }

      // Log to file (controlled by global)
      if (config.global.logToFile) {
        await saveToFile({ content: `[${timestamp}] ${event.type}\n` });
      }

      switch (event.type) {
        case "session.created": {
          if (eventConfig.toast) {
            toastQueue.add({ /* toast code */ });
          }
          
          let output = "";
          if (eventConfig.script) {
            output = await runScript($, "session-start.sh");
          }
          
          if (eventConfig.appendToSession && output) {
            await appendToSession(ctx, sessionEvent.properties.info.id, output);
          }
          break;
        }
        
        case "session.compacted": {
          if (eventConfig.toast) { /* ... */ }
          if (eventConfig.script) { /* ... */ }
          if (eventConfig.appendToSession) { /* ... */ }
          break;
        }
        
        // ... other events
      }
    },

    "tool.execute.after": async (input, _output) => {
      const toolConfig = getEventConfig(`tool.execute.${input.tool}`);
      
      if (toolConfig.enabled === false) {
        return;
      }
      
      if (input.tool === "task") {
        if (toolConfig.toast) { /* ... */ }
        if (toolConfig.script) { /* ... */ }
      }
    }
  };
};
```

---

## Usage Examples

### Disable entire event
```json
{
  "events": {
    "session.idle": false
  }
}
```

### Disable only toast for specific event
```json
{
  "events": {
    "session.diff": { "toast": false }
  }
}
```

### Disable all toasts globally
```json
{
  "toast": false
}
```

### Combine global off + specific on
```json
{
  "toast": false,
  "events": {
    "session.error": { "toast": true }
  }
}
```

### Disable all scripts globally
```json
{
  "scripts": false
}
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `.opencode/plugins/events-config.json` | CREATE |
| `.opencode/plugins/helpers/events-config.ts` | CREATE |
| `.opencode/plugins/helpers/index.ts` | MODIFY (export) |
| `.opencode/plugins/session-plugins.ts` | MODIFY (use config) |

---

## Open-Source Ready

This design is ready for open-source distribution:

- ✅ User can override via JSON without forking
- ✅ Future events work automatically via category fallback
- ✅ Git version control friendly
- ✅ Sensible defaults included
- ✅ Extensible for new events without code changes