# Event Config Resolution — Behavior Spec

**Status**: Draft  
**Date**: 2026-04-16

> Spec validada pelo usuário em 2026-04-16.

---

## Philosophy

### How OpenCode Events Work

Events and tools are intertwined:

- `tool.execute.before.bash` = event `"tool.execute.before"` + tool `"bash"`
- Tool config must override event config for granular control

### Script Discovery

Scripts use naming convention:

- Event `session.created` → script `.opencode/scripts/session-created.sh`
- User sets `runScripts: true`, script file must match event name
- User can override with explicit `scripts: [...]`

### Configuration Inheritance

- **Tools inherit defaults** → only override what's different (avoid verbose config)
- **Event can be disabled, tool can re-enable** → granular control
- **Handlers provide defaults** → user doesn't need to configure everything

---

## resolveEventConfig Behavior

### Boolean Fields (toast, debug, runScripts, appendToSession, runOnlyOnce)

**Precedence:** event config > default config > fallback

| userConfig.enabled | Event Config | Default Config | Result          |
| ------------------ | ------------ | -------------- | --------------- |
| `false`            | anything     | anything       | DISABLED_CONFIG |
| `true`             | `undefined`  | `undefined`    | fallback        |
| `true`             | `undefined`  | `true`         | `true`          |
| `true`             | `undefined`  | `false`        | `false`         |
| `true`             | `true`       | `false`        | `true`          |
| `true`             | `false`      | `true`         | `false`         |
| `true`             | `true`       | `true`         | `true`          |
| `true`             | `false`      | `false`        | `false`         |

### Event Config = false (shorthand)

| Event Config         | Result          |
| -------------------- | --------------- |
| `false`              | DISABLED_CONFIG |
| `{ enabled: false }` | DISABLED_CONFIG |

### Toast Override Object

| Event Config                                     | Result                                   |
| ------------------------------------------------ | ---------------------------------------- |
| `{ toast: { enabled: true } }`                   | `toast = true`                           |
| `{ toast: { enabled: false } }`                  | `toast = false`                          |
| `{ toast: { enabled: true, title: "X" } }`       | `toast = true`, `toastTitle = "X"`       |
| `{ toast: { enabled: true, variant: "error" } }` | `toast = true`, `toastVariant = "error"` |

### Scripts Resolution

| Event Config                    | Result                                                    |
| ------------------------------- | --------------------------------------------------------- |
| `false`                         | `[]` (no scripts)                                         |
| `true`                          | `[handlerDefaultScript]` (script with same name as event) |
| `{ scripts: ["a.sh", "b.sh"] }` | explicit scripts override default                         |
| `{ runScripts: false }`         | `[]` (runScripts false wins over scripts array)           |
| `{ runScripts: true }`          | `[handlerDefaultScript]`                                  |

---

## resolveToolConfig Behavior

### Precedence: Tool > Event > Default

| Event Config | Tool Config          | Result                      |
| ------------ | -------------------- | --------------------------- |
| `false`      | `{ enabled: true }`  | **Tool overrides, enabled** |
| `false`      | `{ enabled: false }` | Tool overrides, disabled    |
| `true`       | `{ enabled: true }`  | Both enabled                |
| `true`       | `{ enabled: false }` | Tool overrides, disabled    |
| `true`       | `undefined`          | Uses event config           |
| `undefined`  | defined              | Tool config applies         |

**Rationale:** `tool.execute.before.bash` is both event + tool. If event disabled but tool enabled, tool should win for granular control.

### Tool Inheritance from Default

Tools inherit all defaults, override only what's specified:

```typescript
tools: { "git.commit": { runScripts: false } }
// Result: inherits toast, debug, etc from default
//         overrides only runScripts: false
```

### Tool Handler Override

| Tool Handler | Event Handler | Result                 |
| ------------ | ------------- | ---------------------- |
| exists       | exists        | toolHandler.title wins |
| no           | exists        | eventHandler.title     |
| no           | no            | `""`                   |

### Scripts with Tool Config

| Tool Config                  | Event Scripts  | Tool Handler | Result                        |
| ---------------------------- | -------------- | ------------ | ----------------------------- |
| `undefined`                  | `["event.sh"]` | exists       | `["tool.sh"]` (if runScripts) |
| `undefined`                  | `["event.sh"]` | no           | `["event.sh"]`                |
| `{ scripts: ["custom.sh"] }` | any            | any          | `["custom.sh"]`               |

---

## Unknown Event Discovery

### Current Logic

```typescript
if (userEventConfig === undefined) {
  // Event not configured
  const isTool = eventType.startsWith('tool.');
  const hasHandler = !!handler;
  if (!isTool && !hasHandler) {
    // Log as UNKNOWN for discovery
  }
}
```

### Rules

| Event Type                 | Has Handler | Action                             |
| -------------------------- | ----------- | ---------------------------------- |
| `session.foo`              | no          | **UNKNOWN** → logged for discovery |
| `session.foo`              | yes         | Uses handler defaults              |
| `tool.execute.before`      | no          | **UNKNOWN** → logged for discovery |
| `tool.execute.before.bash` | no          | **UNKNOWN** → logged for discovery |

### Rationale

- OpenCode API evolves constantly → new events and tools appear
- **Any event without handler = UNKNOWN** → logged for discovery
- This ensures new tools (e.g., new `bash` tool) are tracked

---

## Edge Cases

### Empty Configs

| Config              | Behavior                                 |
| ------------------- | ---------------------------------------- |
| `{}` (empty object) | Treated as **configured**, uses defaults |
| `{ toast: true }`   | Only toast=true, others use fallback     |

### SaveToFile Resolution

| Event Config        | Default Config      | Result                             |
| ------------------- | ------------------- | ---------------------------------- |
| `undefined`         | `undefined`         | `false`                            |
| `undefined`         | `true`              | `true`                             |
| `undefined`         | `{ template: "x" }` | `{ enabled: true, template: "x" }` |
| `true`              | anything            | `true`                             |
| `{ template: "x" }` | anything            | `{ enabled: true, template: "x" }` |

---

## Validation Checklist

- [x] Boolean fields: event > default > fallback
- [x] Tool config overrides event config
- [x] runScripts: false wins over scripts array
- [x] Tool inherits from default (only override what's needed)
- [x] Unknown events: any event without handler is logged for discovery
- [x] Empty `{}` treated as configured
