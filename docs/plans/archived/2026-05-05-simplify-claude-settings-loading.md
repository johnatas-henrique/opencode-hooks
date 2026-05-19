# Simplify Claude Settings Loading

## Objective

Eliminate complexity, remove duplicate/dead code, follow DRY/KISS/Clean Code principles in Claude hooks loading system.

## Changes Made

### 1. Simplified `loadClaudeSettings` (`claude-settings.ts`)

**Removed:**

- `global`, `local`, `unsupported` from return type
- Now returns directly `Record<string, ScriptEntry[]>`
- Always initialize `globalHooks`, `localHooks`, `localOverrideHooks` as `{}`
- Removed `try-catch` (plugin must crash if directory not found)

**Before:**

```typescript
export function loadClaudeSettings(
  projectDir: string,
  opts?: { loadGlobal?: boolean; loadLocal?: boolean }
): {
  global: Record<string, ScriptEntry[]>;
  local: Record<string, ScriptEntry[]>;
  all: Record<string, ScriptEntry[]>;
} {
  // ... complex return with global, local, all, unsupported
}
```

**After:**

```typescript
export function loadClaudeSettings(
  projectDir: string,
  opts?: { loadGlobal?: boolean; loadLocal?: boolean }
): Record<string, ScriptEntry[]> {
  // ... returns directly merged scripts
}
```

### 2. Renamed `mergeHooksStrategyA` → `mergeGlobalAndLocalScripts`

**Changes:**

- Renamed function for clarity
- Renamed `g` → `globalHooks`, `l` → `localHooks`
- Removed `?.` and `|| []` (now using guaranteed objects)

### 3. Fixed `mergeGlobalAndLocalScripts` - Proper Script-Level Merge

**Problem (previously fixed incorrectly):**
The old code did OR logic - if local had ANY scripts for an event, it replaced ALL global scripts for that event.

**What was requested (§2066§, §2068§):**

- Global has 5 scripts, Local has 4 scripts
- 1 script is duplicated (same name + same matcher)
- Result should be 8 scripts (5 + 4 - 1 duplicate where local wins)
- All other scripts from both sides should coexist

**Solution - Script-level merging:**

```typescript
function mergeGlobalAndLocalScripts(
  global: Record<string, ClaudeHookGroup[]>,
  local: Record<string, ClaudeHookGroup[]>
): Record<string, ClaudeHookGroup[]> {
  const merged: Record<string, ClaudeHookGroup[]> = {};

  const allKeys = new Set<string>([
    ...Object.keys(global),
    ...Object.keys(local),
  ]);

  for (const key of allKeys) {
    const globalGroups = global[key] || [];
    const localGroups = local[key] || [];

    // Map: matcher -> group of hooks
    const groupMap = new Map<string, ClaudeHookGroup>();

    // 1. Add all global groups
    for (const group of globalGroups) {
      groupMap.set(group.matcher, {
        matcher: group.matcher,
        hooks: [...group.hooks],
      });
    }

    // 2. Merge local groups
    for (const localGroup of localGroups) {
      const existing = groupMap.get(localGroup.matcher);

      if (existing) {
        // SAME matcher: merge hooks (local overrides by command)
        const hookMap = new Map<string, ClaudeHook>();

        // Add global hooks
        for (const hook of existing.hooks) {
          hookMap.set(hook.command, hook);
        }

        // Add/replace with local hooks
        for (const hook of localGroup.hooks) {
          hookMap.set(hook.command, hook); // Local wins if duplicated
        }

        existing.hooks = Array.from(hookMap.values());
      } else {
        // NEW matcher: add entire local group
        groupMap.set(localGroup.matcher, {
          matcher: localGroup.matcher,
          hooks: [...localGroup.hooks],
        });
      }
    }

    merged[key] = Array.from(groupMap.values());
  }

  return merged;
}
```

### 4. Simplified `createContext` (`context.ts`)

**Removed:**

- Duplicate getter `get claudeScripts` (lines 58-74)
- `claudeUnsupported` (dead code, never used)
- Lazy getters (all values now direct, since `userConfig` doesn't change)
- `try-catch` in `getClaudeScripts`

**Fixed `getProjectDir`:**

- If `props.cwd` exists → use it
- Else → `process.cwd()`
- **NO try-catch, NO hardcoded fallback** → let it crash if error

**Before:**

```typescript
getProjectDir: (input?: EventInput) => {
  const props = input?.properties as Record<string, unknown> | undefined;
  if (props?.cwd && typeof props.cwd === 'string') return props.cwd;
  try { return process.cwd(); }
  catch { return '/home/johnatas/projects/opencode-hooks'; }
},
```

**After:**

```typescript
getProjectDir: (input?: EventInput) => {
  const props = input?.properties as Record<string, unknown> | undefined;
  if (props?.cwd && typeof props.cwd === 'string') return props.cwd;
  return process.cwd(); // Let it throw if fails
},
```

### 5. Updated Callers

**`event-config-builder.ts`:**

- Changed `claudeScripts.all` → `claudeScripts` (direct access)
- Uses `this.context.getProjectDir(this.input)` for proper project directory

**`tool-config.resolver.ts`:**

- Changed `claudeScripts.all` → `claudeScripts`

### 6. Fixed Test Files

**`claude-settings.test.ts`:**

- Removed `.all` and `.unsupported` references
- Updated to use direct return value from `loadClaudeSettings`

**`context.test.ts`:**

- Removed references to `claudeScripts` and `claudeUnsupported`
- Uses `ctx.getClaudeScripts('/test')` instead of `ctx.claudeScripts`

**`test-defaults.ts`:**

- Removed `claudeScripts` and `claudeUnsupported` from `createDefaultContext`
- Added proper `getClaudeScripts` function

**`create-context.ts`:**

- Updated to match new `ConfigResolverContext` type
- Uses `(_projectDir: string) => ({})` for default `getClaudeScripts`

**`tool-config.resolver.test.ts`:**

- Replaced `claudeScripts` with `getClaudeScripts` calls
- Fixed syntax errors from incomplete edits

### 7. Lint Fixes

- Prefixed unused variables with `_` (e.g., `_ctx`, `_projectDir`)

## Merge Priority Order

1. Global Claude hooks (`~/.claude/settings.json`)
2. Local Claude hooks (`./.claude/settings.json`)
3. Type-claude scripts from `settings.ts`
4. Type-native scripts from `settings.ts`

**Script-level precedence:** When same `command` + `matcher` exists in multiple sources, later loaded wins.

## Three-Level Merge Structure

The double `mergeGlobalAndLocalScripts` call handles three levels:

```typescript
const mergedHooks = mergeGlobalAndLocalScripts(
  mergeGlobalAndLocalScripts(globalHooks, localHooks), // Level 1+2: global + local
  localOverrideHooks // Level 3: localOverride
);
```

| Level                   | Priority | Example                         |
| ----------------------- | -------- | ------------------------------- |
| 1. `globalHooks`        | Lowest   | `~/.claude/settings.json`       |
| 2. `localHooks`         | Medium   | `./.claude/settings.json`       |
| 3. `localOverrideHooks` | Highest  | `./.claude/settings.local.json` |

## Validation

- ✅ Build: passed
- ✅ Lint: passed
- ✅ Tests: 623 passing (Statements 98.56%, Branch 93.79%, Functions 96.87%, Lines 98.81%)

## Notes

- Plugin must crash if it cannot find project directory (no silent failures)
- `getProjectDir` uses `input?.properties?.cwd` with fallback to `process.cwd()`
- No more `unsupported` events tracking (dead code removed)
- No more lazy getters in `createContext` (config doesn't change after init)
- **MERGE BEHAVIOR**: Scripts are merged at individual level, not group level. If global has 5 scripts and local has 4, with 1 duplicate (same command + matcher), result is 8 scripts (5+4-1).

## Status

COMPLETED — all changes implemented and validated.
