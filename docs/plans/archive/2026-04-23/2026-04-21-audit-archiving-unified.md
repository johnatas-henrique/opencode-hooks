# Plan: Unified Audit Archiving System

**Date**: 2026-04-21
**Status**: Draft

---

## Problem Statement

Currently, the audit system has inconsistent archiving behavior:

| Problem | Description                                                                            |
| ------- | -------------------------------------------------------------------------------------- |
| 1       | `session_events.log` and `session_unknown_events.log` still being written (old system) |
| 2       | `plugin-errors` and `plugin-scripts` not archived at 1MB                               |
| 3       | No general rule for all audit files                                                    |
| 4       | Different thresholds for different files                                               |

---

## Rule (Single Source of Truth)

> **Every `.json` file in the audit directory that exceeds `maxSizeMB` (configured in `settings.ts` by the user) is automatically archived. When closing OpenCode, all files are archived.**

- **Threshold source**: `config.maxSizeMB` from `settings.ts`
- **Dynamic detection**: Any `.json` file in audit directory
- **Shutdown**: All files archived on close

---

## Implementation

### Step 1: Read maxSizeMB in writeLine

**File**: `audit-logger.ts`

Read `config.maxSizeMB` to use as threshold for archiving.

### Step 2: Detect any .json file size

**File**: `audit-logger.ts`

In `writeLine`, after writing, check the file size of any `.json` file in the directory.

### Step 3: Archive if size >= maxSizeMB

**File**: `audit-logger.ts`

If `stat.size >= maxSizeMB`, archive the file.

### Step 4: Shutdown hook archives ALL .json

**File**: `plugin-integration.ts`

On `server.instance.disposed`, archive all `.json` files in the directory.

### Step 5: Identify saveToFile calls for legacy files

Search project for `saveToFile` calls using old files:

| Legacy File                  | Replace With               |
| ---------------------------- | -------------------------- |
| `session_events.log`         | `eventRecorder.logEvent()` |
| `session_unknown_events.log` | `eventRecorder.logEvent()` |

### Step 6: Migrate saveToFile calls

Replace legacy `saveToFile` calls with audit system calls.

### Step 7: Stop using legacy files

After migration, do not write to:

- `session_events.log`
- `session_unknown_events.log`

---

## Benefits

| Benefit               | Description                                        |
| --------------------- | -------------------------------------------------- |
| **Single source**     | `maxSizeMB` is the only source for threshold       |
| **Dynamic**           | Any new `.json` is automatically captured          |
| **Complete shutdown** | All files saved on close                           |
| **User configurable** | Value in `settings.ts` is editable                 |
| **No migration**      | Legacy data kept, just stop writing                |
| **Extensible**        | Future files (`plugin-block.json`) follow the rule |

---

## Expected Result

| Behavior               | Status          |
| ---------------------- | --------------- |
| Any `.json` detected   | ✅ Dynamic      |
| Threshold: `maxSizeMB` | ✅ Configurable |
| Archive on shutdown    | ✅ Complete     |
| Legacy saveToFile      | ✅ Migrated     |

---

## Configuration

```typescript
// settings.ts
audit: {
  maxSizeMB: 2,  // User configurable
  ...
}
```

---

## Acceptance Criteria

1. All `.json` files in audit directory are archived when exceeding `maxSizeMB`
2. All `.json` files are archived on OpenCode shutdown
3. No more writes to `session_events.log` or `session_unknown_events.log`
4. User can change `maxSizeMB` in `settings.ts` and it takes effect immediately
