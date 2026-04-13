# 2026-04-10: Tool-Specific Handlers Architecture

## Execution

| Step | Description                                                 | Status | Timestamp |
| ---- | ----------------------------------------------------------- | ------ | --------- |
| 1    | Analyze existing tools and define handler specifications    | ✅     | -         |
| 2    | Create tool-specific handlers in `default-handlers.ts`      | ✅     | -         |
| 3    | Implement `getToolHandler(toolName)` helper in `events.ts`  | ✅     | -         |
| 4    | Update `resolveToolConfig` to merge tool handlers           | ✅     | -         |
| 5    | Update `user-events.config.ts` with simplified tool configs | ✅     | -         |
| 6    | Update tests to cover tool-specific handlers                | ✅     | -         |
| 7    | Validate build, lint, and all tests pass                    | ✅     | -         |

---

## Context & Problem

### Current Situation

- All tool events (`tool.execute.before`, `tool.execute.after`) share generic handlers with titles like `"====TOOL EXECUTE AFTER===="`
- To customize toast titles per tool, users must explicitly set `toast: { title: '...' }` for every tool in `user-events.config.ts`
- This creates configuration noise and repetition

### Example Current Config (Verbose)

```typescript
tools: {
  'tool.execute.after': {
    read: { toast: { title: '====FILE READ====' } },
    write: { toast: { title: '====FILE WRITE====' } },
    edit: { toast: { title: '====FILE EDIT====' } },
    // ... 20+ tools repeating the same pattern
  }
}
```

### Desired Outcome

```typescript
tools: {
  'tool.execute.after': {
    read: {},  // ← inherits nice defaults from handler
    write: {},
    edit: {},
  }
}
```

**Benefits:**

- Cleaner configuration
- Consistent UX across all tools
- Well-chosen default titles and variants
- Less duplicated code
- Easy to customize globally per tool

---

## Proposed Architecture

### 1. New Handler Convention

Add **tool-specific handlers** to `default-handlers.ts` with naming:

```
tool:{toolName}
```

**Examples:**

- `tool:read` → handler for `read` tool
- `tool:write` → handler for `write` tool
- `tool:bash` → handler for `bash` tool
- `tool:task` → handler for subagent `task` tool
- `tool:skill` → handler for skill invocations

These handlers provide:

- `title`: Friendly, descriptive toast title (e.g., `"====FILE READ===="`)
- `variant`: Appropriate variant (info, success, warning, error)
- `duration`: Sensible default duration (2000ms for quick ops, 5000ms for longer)
- `defaultScript`: Appropriate script name pattern (e.g., `tool-execute-after-file-read.sh`)
- `buildMessage`: Optional message builder showing relevant context (tool args, file path, etc.)

**Fallback Chain:**

1. Tool-specific handler (`handlers['tool:read']`)
2. Event handler (`handlers['tool.execute.after']`) — generic fallback
3. Config-level defaults

---

### 2. Updated `resolveToolConfig` Logic

#### Current Logic (simplified):

```typescript
const eventBase = /* resolveEventConfig or getDefaultConfig */;
if (!toolConfig || isEmptyObject(toolConfig)) {
  return eventBase; // inherits everything from event base
}
return {
  ...eventBase,
  toastTitle: toastCfg?.title ?? handler?.title ?? eventBase.toastTitle,
  // ...
};
```

#### New Logic:

```typescript
const eventBase = /* resolveEventConfig or getDefaultConfig */;
const toolHandler = getToolHandler(toolName); // ← NEW
const eventHandler = handlers[toolEventType];

// Build base config that incorporates tool handler defaults
const baseWithToolHandler = {
  ...eventBase,
  toastTitle: toolHandler?.title ?? eventHandler?.title ?? eventBase.toastTitle,
  toastVariant: toolHandler?.variant ?? eventHandler?.variant ?? eventBase.toastVariant,
  toastDuration: toolHandler?.duration ?? eventHandler?.duration ?? eventBase.toastDuration,
  defaultScript: toolHandler?.defaultScript ?? eventHandler?.defaultScript,
  buildMessage: toolHandler?.buildMessage ?? eventHandler?.buildMessage,
};

// Empty tool config → inherit from baseWithToolHandler
if (!toolConfig || isEmptyObject(toolConfig)) {
  return {
    ...baseWithToolHandler,
    // Ensure toast.enabled logic respects tool handler's implicit defaults
    toast: baseWithToolHandler.toast, // respects override logic
  };
}

// Partial tool config → merge with baseWithToolHandler as fallback
const scripts = resolveScripts(
  toolConfig,
  baseWithToolHandler.defaultScript,
  baseWithToolHandler.scripts
);
const toastCfg = resolveToastOverride(toolConfig);

return {
  ...baseWithToolHandler,
  enabled: getWithDefault(toolConfig, defaultCfg, 'enabled', baseWithToolHandler.enabled),
  debug: getWithDefault(toolConfig, defaultCfg, 'debug', baseWithToolHandler.debug),
  toast: getWithDefault(toolConfig, defaultCfg, 'toast', baseWithToolHandler.toast),
  toastTitle: toastCfg?.title ?? baseWithToolHandler.toastTitle,
  toastMessage: toastCfg?.message ?? baseWithToolHandler.toastMessage,
  toastVariant: toastCfg?.variant ?? baseWithToolHandler.toastVariant,
  toastDuration: toastCfg?.duration ?? baseWithToolHandler.toastDuration,
  scripts,
  saveToFile: getWithDefault(toolConfig, defaultCfg, 'saveToFile', baseWithToolHandler.saveToFile),
  appendToSession: getWithDefault(toolConfig, defaultCfg, 'appendToSession', baseWithToolHandler.appendToSession),
  runOnlyOnce: getWithDefault(toolConfig, defaultCfg, 'runOnlyOnce', baseWithToolHandler.runOnlyOnce),
};
```

**Key Change:** `toastTitle`, `toastVariant`, `toastDuration`, and `defaultScript` now pull from `toolHandler` when available, before falling back to event handler.

---

### 3. Helper Function: `getToolHandler`

Add to `events.ts`:

```typescript
function getToolHandler(toolName: string): EventHandler | undefined {
  return handlers[`tool:${toolName}`];
}
```

---

### 4. Handler Specification Document

Create `.opencode/plugins/helpers/tool-handlers.md` (or update README) documenting each tool's default:

| Tool  | Title                | Variant | Duration | Default Script                | Message Fields          |
| ----- | -------------------- | ------- | -------- | ----------------------------- | ----------------------- |
| read  | `====FILE READ===`   | info    | 2000     | `tool-execute-after-read.sh`  | `path`, `size?`         |
| write | `====FILE WRITE===`  | info    | 2000     | `tool-execute-after-write.sh` | `path`                  |
| edit  | `====FILE EDIT===`   | info    | 2000     | `tool-execute-after-edit.sh`  | `path`, `changes?`      |
| bash  | `====TERMINAL===`    | info    | 2000     | `tool-execute-after-bash.sh`  | `command`, `exitCode`   |
| task  | `====SUBAGENT===`    | success | 10000    | `log-agent.sh`                | `sessionId`, `subagent` |
| skill | `====SKILL===`       | success | 10000    | `log-skill.sh`                | `skillName`             |
| chat  | `====CHAT===`        | info    | 2000     | `tool-execute-after-chat.sh`  | `messageCount`          |
| glob  | `====FILE SEARCH===` | info    | 2000     | `tool-execute-after-glob.sh`  | `pattern`, `count`      |
| grep  | `====TEXT SEARCH===` | info    | 2000     | `tool-execute-after-grep.sh`  | `pattern`, `count`      |
| ...   | ...                  | ...     | ...      | ...                           | ...                     |

---

### 5. Script Naming Convention (Optional but Recommended)

Standardize script names to match tool-specific pattern:

```
tool-execute-after-{toolName}.sh
tool-execute-before-{toolName}.sh
```

This allows users to easily add custom scripts for specific tools if they want to override behavior.

**Migration Note:** Existing user scripts remain compatible if they reference old generic script names (e.g., `log-agent.sh`). The `defaultScript` in handlers is only used when `runScripts: true` and no explicit scripts provided.

---

## Implementation Steps Detail

### Step 1: Catalog All Tools

From current `user-events.config.ts` tools section:

**TOOL_EXECUTE_AFTER:** task, skill, bash, write, edit, chat, read, glob, grep, list, patch, webfetch, websearch, codesearch, todowrite, todoread, question, git.commit, git.push, git.pull, filesystem_read_file, filesystem_write_file, filesystem_list_directory, filesystem_search_files, filesystem_create_directory, filesystem_move_file, filesystem_get_file_info, gh_grep_searchGitHub

**TOOL_EXECUTE_BEFORE:** task, skill, bash, write, edit, chat, read, glob, grep, list, patch, webfetch, websearch, codesearch, todowrite, todoread, question, git.commit, git.push, git.pull, filesystem_read_file, filesystem_write_file, filesystem_list_directory, filesystem_search_files, filesystem_create_directory, filesystem_move_file, filesystem_get_file_info, gh_grep_searchGitHub

**TOOL_EXECUTE_AFTER_SUBAGENT:** task

---

### Step 2: Define Handler Specs

For each tool, specify:

| Field           | Consideration                                                                                                     | Examples                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `title`         | Should clearly indicate what happened. Use consistent format: `====ACTION===`                                     | `read` → `"====FILE READ===="`<br>`bash` → `"====TERMINAL COMMAND===="`     |
| `variant`       | info for read/write/edit, success for task/skill completion, warning for git pushes (caution), error for failures | `task` → `success`<br>`bash` → `info`<br>`git.push` → `warning`?            |
| `duration`      | Quick ops (file read/write): 2000ms<br>Agent task: 5000-10000ms<br>Git operations: 3000ms                         | `read`: 2000<br>`task`: 10000                                               |
| `defaultScript` | Follow naming convention. If no natural script exists, use generic placeholder                                    | `read`: `tool-execute-after-read.sh`<br>`git.commit`: `git-commit-post.sh`  |
| `buildMessage`  | Optional: context fields relevant to tool                                                                         | `bash`: `Command: properties.tool.input`<br>`read`: `File: properties.path` |

---

### Step 3: Create Handlers in `default-handlers.ts`

**Strategy:** Add at end of `handlers` object:

```typescript
export const handlers: Record<string, EventHandler> = {
  // ... existing handlers ...

  // Tool-specific handlers (take precedence over generic tool.execute.*)
  'tool:read': createHandler({
    title: '====FILE READ====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-read.sh',
    props: { File: 'properties.path' },
  }),
  'tool:write': createHandler({
    title: '====FILE WRITE====',
    variant: 'info',
    duration: TOAST_DURATION.TWO_SECONDS,
    defaultScript: 'tool-execute-after-write.sh',
    props: { File: 'properties.path' },
  }),
  // ...
};
```

**Important:** `tool:task` and `tool:skill` already have specific behavior in config (with titles like `"====SUBAGENT===="`, `"====SKILL===="`). We should align the handlers accordingly.

---

### Step 4: Update `getHandler` or Create `getToolHandler`

**Option A:** Add new function:

```typescript
export function getToolHandler(toolName: string): EventHandler | undefined {
  return handlers[`tool:${toolName}`];
}
```

**Option B:** Modify `getHandler` to accept optional tool name parameter — **not recommended** to avoid breaking existing code.

Use Option A for clarity.

---

### Step 5: Modify `resolveToolConfig`

The core change. Pseudocode in "Proposed Architecture" section above. Key points:

- Compute `toolHandler` first
- Merge toolHandler into `eventBase` to form `baseForTool`
- This becomes the fallback for `toolConfig`
- All field resolutions use `baseForTool.xxx` as the fallback instead of `eventBase.xxx`

**No change to `resolveEventConfig`.** Only `resolveToolConfig`.

---

### Step 6: Simplify `user-events.config.ts`

With tool handlers, most tool configs can be simplified from:

```typescript
read: { toast: { title: '====FILE READ====' } },
```

to:

```typescript
read: {},  // inherits handler defaults: toast: true + nice title
```

Or even omit entirely if behavior is exactly what we want (toast enabled with handler defaults). But we likely want to keep `enabled: true/false` and maybe override `runScripts` or `toast.enabled`.

**Suggested Final Config Pattern:**

```typescript
tools: {
  'tool.execute.after': {
    task: { enabled: false },  // disable task toast/scripts (still uses handler title if enabled)
    skill: { enabled: true, toast: { enabled: true, duration: 10000 } }, // override duration
    bash: { enabled: true, scripts: ['tool-execute-after-bash-audit.sh', ...] },
    read: {}, // enabled by default, toast with handler title
    // write/edit: maybe explicit config for special scripts?
  }
}
```

---

### Step 7: Update Tests

**Affected test files:**

- `test/unit/events.test.ts` - add tests for tool-specific handler resolution
- `test/unit/handlers.test.ts` - ensure all new handlers are present and valid

**New test scenarios:**

1. Tool with handler but no tool config → should get handler's title/variant/duration
2. Tool with handler and `enabled: false` → should be disabled (handler defaults not used)
3. Tool with handler and `toast: false` → title from handler kept but toast disabled? (verify expected)
4. Tool without handler → falls back to event handler (existing behavior)
5. Tool with `toast: { title: 'custom' }` → overrides handler title

**Also verify:** `getToolHandler()` returns correct handler.

---

### Step 8: Documentation

- Update `README.md` section "Per-Tool Configuration" to explain that tool-specific defaults are now automatic
- Add table of default handlers per tool in README or separate `TOOL_HANDLERS.md`
- Update comments in `user-events.config.ts` to reflect simplified config

---

## Backward Compatibility

**✅ Fully backward compatible:**

1. Existing configs that explicitly set `toast.title` continue to work (override takes precedence)
2. Handlers are only fallbacks when tool config is empty or missing fields
3. No breaking changes to API or type definitions
4. Users who don't update config still get generic `"====TOOL EXECUTE AFTER===="` but we can update our handlers to improve defaults

**Migration Path:**  
None required for existing users. Their configs continue to work. New defaults simply provide better out-of-the-box experience for new users or those who simplify configs.

---

## Trade-offs & Risks

✅ **Pros:**

- Better UX with specific titles
- Cleaner configs
- Easier to maintain (add new tool → add one handler)
- Consistent architecture matches event handlers
- No breaking changes

⚠️ **Cons:**

- More handlers to maintain (~25 new entries in `default-handlers.ts`)
- Need to decide appropriate titles/variants (but can iterate)
- Slight complexity increase in `resolveToolConfig` (still manageable)

---

## Open Questions

1. **Should `toast.enabled` default to `true` from tool handler?**  
   Currently `resolveToast` returns `toast.enabled ?? true` for object configs. If we want `enabled` to come from handler, we might need to adjust.  
   _Proposal: Yes, tool handler implies `toast: true` if not explicitly overridden._

2. **What about tool-specific `buildMessage`?**  
   Could show file path, command, subagent type. Nice to have but not essential for MVP.  
   _Recommendation: Implement in Phase 2 after core works._

3. **Should we rename existing `TOOL_EXECUTE_AFTER` handler title?**  
   It's currently `"====TOOL EXECUTE AFTER===="`. Might be kept as ultimate fallback, or changed to be more generic like `"====TOOL OPERATION===="`.  
   _Recommendation: Keep as-is; won't be used if all tools have handlers._

---

## Success Criteria

- [ ] All ~25 tools have corresponding `tool:${name}` handlers
- [ ] `resolveToolConfig` merges tool handler fields correctly
- [ ] Existing tests still pass
- [ ] New tests validate tool handler precedence
- [ ] Simplified `user-events.config.ts` works as expected
- [ ] Build and lint clean
- [ ] No performance regression (handlers lookup is O(1) object access)

---

## Estimated Scope

- **Handlers to create:** ~25
- **Code changes:**
  - `default-handlers.ts`: +100 lines
  - `events.ts`: modify `resolveToolConfig`, add `getToolHandler`: ~30 lines
  - `user-events.config.ts`: refactor tools section: -50 lines
- **Tests:** ~15 new test cases
- **Documentation:** Update README (+20 lines), comment in config

---

## Related References

- Existing implementation pattern: `default-handlers.ts` lines 190-436 (event handlers)
- Resolution strategy: `events.ts` `resolveToolConfig` function
- Configuration schema: `config.ts` `ToolConfig`, `ToolOverride` interfaces
- Current tools list: `user-events.config.ts` `tools` section

---

## Next Steps After This Plan

1. Implement this plan as **Fase 4** (after Phase 2 & 3)
2. Or, merge with Fase 2 if we determine it's foundational

**Recommendation:** Implement **after** Phase 2 (script error improvements) but **before** Phase 3 (runOnce, new hooks, test scripts) because the new hooks would benefit from having tool-specific handlers in place.

---

**Author's Note:** This plan brings tool configuration to feature parity with event configuration. Events have always had specific handlers; tools now will too. This is a natural evolution and major UX improvement.
