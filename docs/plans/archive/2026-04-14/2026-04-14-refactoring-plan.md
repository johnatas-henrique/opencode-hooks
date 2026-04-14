# OpenCode Hooks - Refactoring Plan

**Created:** 2026-04-14 01:25  
**Updated:** 2026-04-14 01:40  
**Agent:** build  
**Status:** DISCONTINUED - Partially implemented, see `2026-04-14_0125_pending-consolidated.md`

---

## Summary

This plan was partially implemented. The completed items have been migrated to the consolidated pending plan.

## Completed Steps

| Step | Description                                               | Status | Timestamp |
| ---- | --------------------------------------------------------- | ------ | --------- |
| 1    | Rename user-events.config.ts to settings.ts               | ✅     | 01:30     |
| 2    | Create config/ folder structure                           | ✅     | 01:30     |
| 3    | Create blocks.ts with security predicates                 | ✅     | 01:30     |
| 4    | Create events-catalog.md (evolved from events-library.ts) | ✅     | 01:35     |
| 5-6  | Add allowedFields (implemented separately)                | ✅     | 01:40     |

## Discontinued Steps

| Step | Description                    | Moved To                                  |
| ---- | ------------------------------ | ----------------------------------------- |
| 7    | Create base opinionated config | `2026-04-14_0125_pending-consolidated.md` |

---

## See Also

- `2026-04-14_0125_pending-consolidated.md` - Current pending items

---

## Step-by-Step Details

### Step 1: Rename user-events.config.ts

**Question for user:** What should the main config file be named?

Options:

- `behaviors.ts` - mas você disse que não é claro o suficiente
- `events.ts` - simples mas pode conflitar com helpers/events.ts
- `hooks.ts` - refere-se ao plugin, funciona
- `settings.ts` - genérico mas claro
- `opencode-hooks.ts` - mesmo nome do plugin,confuso
- `config.ts` - simples

**What this step does:**

- Rename `.opencode/plugins/helpers/user-events.config.ts` → chosen name
- Update all imports that reference it
- Run tests to verify nothing broke

---

### Step 2: Create config/ folder

**Proposed structure:**

```
.opencode/plugins/helpers/
├── config/                    # NEW FOLDER
│   ├── hooks.ts              # Main config (renamed from user-events.config.ts)
│   ├── guards.ts             # Security block predicates
│   └── templates.ts           # Future: saveToFile templates
├── events.ts                 # Existing - event resolution logic
├── default-handlers.ts       # Existing - default handlers
├── index.ts                  # Existing - barrel exports
```

**What this step does:**

- Create `config/` directory
- Move hooks.ts (renamed) to config/
- Create empty guards.ts placeholder
- Create empty templates.ts placeholder
- Update all imports
- Run tests

---

### Step 3: Create guards.ts

**Question for user:** What name is better than "guards"?

Options:

- `blocks.ts` - clear it's for blocking
- `security.ts` - focused on security
- `protectors.ts` - prevent harmful actions
- `defense.ts` - similar to protectors

**What this step does:**

- Create `.opencode/plugins/helpers/config/guards.ts`
- Move existing block predicates from hooks.ts
- Add new guards: `blockSecrets`, `blockLargeOutput`
- Export all guards for use in config
- Add doc comments explaining each guard

**Guards to include:**
| Guard | Description |
|-------|-------------|
| `blockEnvFiles` | Block .env files |
| `blockGitForce` | Block --force flag |
| `blockNoVerify` | Block --no-verify flag |
| `blockProtectedBranch` | Block push to main/master/develop |
| `blockSecrets` | Block output containing secrets/tokens |
| `blockLargeOutput` | Block output > 100KB |

---

### Step 4: Create events-library.ts

**Purpose:** Library showing all events with real examples from logs

**What this step does:**

- Create `.opencode/plugins/helpers/config/events-library.ts`
- Read real data from `production/session-logs/session_events.log`
- Document each event type with:
  - Event name
  - All available keys
  - Real example values
  - Which keys are useful vs verbose

**Example structure:**

```typescript
export const eventsLibrary = {
  'tool.execute.before': {
    description: 'Fired before a tool is executed',
    keys: {
      input: {
        tool: 'string - name of the tool (bash, write, read, etc)',
        sessionID: 'string - unique session identifier',
        callID: 'string - unique call identifier',
        args: 'object - tool-specific arguments',
      },
    },
    example: {
      input: {
        tool: 'bash',
        sessionID: 'abc-123-def',
        callID: 'call-456',
        args: { command: 'ls -la', timeout: 30000 },
      },
    },
    usefulKeys: ['tool', 'args.command'],
    verboseKeys: ['metadata', 'callID'],
  },
  // ... more events
};
```

---

### Step 5: Add allowedFields to default-handlers

**What this step does:**

- Update `default-handlers.ts` interface to include `allowedFields`
- Add `allowedFields` to each handler definition
- `allowedFields: string[]` - list of keys to show in toast

**Implementation:**

```typescript
interface EventHandler {
  title: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration: number;
  defaultScript: string;
  buildMessage: BuildMessageFn;
  allowedFields?: string[];  // NEW - keys to include in toast
}

// Example in handler:
'session.created': createHandler({
  title: '====SESSION CREATED====',
  variant: 'success',
  duration: TOAST_DURATION.TEN_SECONDS,
  defaultScript: 'session-created.sh',
  buildMessage: buildAllKeysMessageSimple,
  allowedFields: ['info.id', 'info.title', 'sessionID'],  // NEW
}),
```

**When allowedFields is empty/undefined:** Show all keys (current behavior)

---

### Step 6: Update events.ts to use allowedFields

**What this step does:**

- Modify `buildAllKeysMessage` and `buildAllKeysMessageSimple` to filter by allowedFields
- Update `resolveEventConfig` to pass handler's allowedFields to buildMessage
- If allowedFields is defined, filter the keys before building message

**Logic:**

```typescript
function buildMessageWithFilter(event, allowedFields) {
  const allKeys = buildAllKeysMessage(event); // existing logic

  if (!allowedFields || allowedFields.length === 0) {
    return allKeys; // show everything
  }

  // Filter to only allowed fields
  return filterKeys(allKeys, allowedFields);
}
```

---

### Step 7: Create base opinionated config

**What this step does:**

- Create default config that works well out of the box
- Include sensible guards for vibecoding security
- Include useful toast configurations
- Document what each setting does

**Proposed base config:**

```typescript
// config/hooks.ts - Opinionated defaults
export const defaultConfig = {
  // Security guards - always enabled
  guards: {
    blockEnvFiles: true,
    blockGitForce: true,
    blockNoVerify: true,
    blockProtectedBranch: true,
    blockSecrets: true,
    blockLargeOutput: true,
  },

  // Toast settings per event type
  events: {
    'session.created': {
      toast: true,
      allowedFields: ['info.id', 'info.title'],
    },
    'tool.execute.before': { toast: false }, // Too noisy
    'tool.execute.after': { toast: false }, // Too noisy
    'session.error': { toast: true },
    'permission.ask': {
      toast: true,
      allowedFields: ['tool', 'pattern', 'type'],
    },
  },

  // File logging
  saveToFile: true,
};
```

---

### Step 8: Run build and tests

**What this step does:**

- Run `npm run build`
- Run `npm run lint`
- Run `npm run test:unit`
- Fix any issues

---

## Questions for User

Before starting Step 1, please answer:

1. **Main config filename:** What should we call it instead of `user-events.config.ts`?
2. **Guards filename:** What should we call it instead of `guards.ts`?
3. **Templates filename:** What should we call it instead of `templates.ts`?
4. **Events library filename:** Is `events-library.ts` good or prefer another name?

Once we agree on names, I'll start with Step 1.
