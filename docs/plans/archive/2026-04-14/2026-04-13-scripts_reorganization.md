# OpenCode Hooks - Scripts Reorganization Plan

**Created:** 2026-04-13 15:45:00  
**Updated:** 2026-04-14 01:40  
**Agent:** build  
**Status:** DISCONTINUED - Partially implemented, see `2026-04-14_0125_pending-consolidated.md`

---

## Summary

This plan was partially implemented. The completed items have been migrated to the consolidated pending plan.

## Completed Steps

| Step | Description                               | Status | Timestamp |
| ---- | ----------------------------------------- | ------ | --------- |
| 1    | Analyze all active scripts and categorize | ✅     | 15:45     |
| 2    | Create detailed recommendation table      | ✅     | 15:50     |
| 3    | Extract ideas from unused scripts         | ✅     | 16:10     |
| 4    | Update plan with user feedback            | ✅     | 16:15     |
| 6    | Disable server-connected.sh               | ✅     | 01:35     |
| 7    | Add new predicates (blockNoVerify, etc)   | ✅     | 01:35     |

## Discontinued Steps

| Step | Description                           | Moved To                                  |
| ---- | ------------------------------------- | ----------------------------------------- |
| 5    | Implement data-only logging migration | `2026-04-14_0125_pending-consolidated.md` |
| 8    | Improve existing scripts (set +e)     | `2026-04-14_0125_pending-consolidated.md` |

---

## See Also

- `2026-04-14_0125_pending-consolidated.md` - Current pending items

---

## 1. User Feedback Summary

| Item                   | User Decision                                      |
| ---------------------- | -------------------------------------------------- |
| 1. Unused scripts      | **EVALUATE and extract ideas** - don't just delete |
| 2. log-agent/log-skill | **MIGRATE to data-only** ✅                        |
| 3. server-connected.sh | **DISABLE** ✅                                     |
| 4. New predicates      | **ADD all**, but check which tool events apply     |
| 5. Session context     | **KEEP detailed** ✅                               |

---

## 2. Current State Summary

### Scripts Inventory

| Category              | Active | Unused | Total  |
| --------------------- | ------ | ------ | ------ |
| **Logging**           | 2      | 4      | 6      |
| **Session Lifecycle** | 3      | 14     | 17     |
| **Tool Hooks**        | 0      | 25     | 25     |
| **Validation**        | 0      | 6      | 6      |
| **Analysis**          | 0      | 3      | 3      |
| **Other**             | 1      | 1      | 2      |
| **Total**             | **6**  | **53** | **59** |

### Scripts Currently Active

| Script                               | Event Trigger                      | Purpose                 | Complexity |
| ------------------------------------ | ---------------------------------- | ----------------------- | ---------- |
| `log-agent.sh`                       | `tool.execute.after.subagent.task` | Audit log               | Simple     |
| `log-skill.sh`                       | `tool.execute.after.skill`         | Audit log               | Simple     |
| `session-created.sh`                 | `session.created`                  | Show context on start   | Medium     |
| `session-stop.sh`                    | `server.instance.disposed`         | Archive session state   | Medium     |
| `server-connected.sh`                | `server.connected`                 | Show connection info    | Simple     |
| `experimental-session-compacting.sh` | `experimental.session.compacting`  | Pre-compaction snapshot | Medium     |

---

## 3. Ideas Extracted from Unused Scripts

### 3.1 Block Predicates (Convert from Script)

| Source Script                            | Idea                              | Target Tools    | Type          |
| ---------------------------------------- | --------------------------------- | --------------- | ------------- |
| `tool-execute-before-block-no-verify.sh` | Block `--no-verify` flag          | `bash`          | **Predicate** |
| `tool-execute-before-commit-quality.sh`  | Warn on console.log/debugger/TODO | `bash` (commit) | **Predicate** |

### 3.2 Quality Gate (Keep as Script)

| Source Script                        | Idea                                           | Status                         |
| ------------------------------------ | ---------------------------------------------- | ------------------------------ |
| `tool-execute-after-quality-gate.sh` | Run `npm run build`, `lint`, `test` after tool | **Keep as script** (needs npm) |

### 3.3 Reminder Scripts (Keep as Script or Toast)

| Source Script                              | Idea                         | Status                             |
| ------------------------------------------ | ---------------------------- | ---------------------------------- |
| `tool-execute-before-git-push-reminder.sh` | Remind to review before push | **Keep as script** (shows message) |

### 3.4 Validation Scripts (Evaluate for Future)

| Source Script                           | Idea                                             | Status                                 |
| --------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| `validate-commit.sh`                    | Validate shebang, sections, JSON, TODO ownership | **Keep for reference** (game-specific) |
| `tool-execute-before-commit-quality.sh` | Check staged files for console.log, debugger     | **Convert to predicate**               |

---

## 4. Recommendation Matrix

### 4.1 Script vs Predicate vs Data-Only

| Current Script                       | Recommendation  | Reason                                  |
| ------------------------------------ | --------------- | --------------------------------------- |
| `log-agent.sh`                       | **DATA-ONLY**   | Simple string formatting, no I/O needed |
| `log-skill.sh`                       | **DATA-ONLY**   | Simple string formatting, no I/O needed |
| `session-created.sh`                 | **KEEP SCRIPT** | Git/filesystem access required          |
| `session-stop.sh`                    | **KEEP SCRIPT** | Git/filesystem access required          |
| `server-connected.sh`                | **DISABLE**     | Redundant with session-created          |
| `experimental-session-compacting.sh` | **KEEP SCRIPT** | Pre-compaction needs context            |

### 4.2 Current vs New Block Predicates

#### Current Predicates

| Predicate            | Tool                                    | Logic                                 |
| -------------------- | --------------------------------------- | ------------------------------------- |
| `blockEnvFiles`      | `write`, `read`, `filesystem_read_file` | `filePath?.includes('.env')`          |
| `blockGitForce`      | `bash`                                  | `cmd?.includes('--force')`            |
| `blockScriptsFailed` | `bash`                                  | `results.some(r => r.exitCode !== 0)` |
| `blockByPath`        | `read`, `filesystem_read_file`          | Pattern matching on path              |

#### New Predicates to Add

| Predicate        | Tool Events                | Logic                               | Source                                     |
| ---------------- | -------------------------- | ----------------------------------- | ------------------------------------------ |
| `blockNoVerify`  | `tool.execute.before.bash` | `cmd?.includes('--no-verify')`      | `tool-execute-before-block-no-verify.sh`   |
| `blockGitCommit` | `tool.execute.before.bash` | Blocks `git commit` if issues found | `tool-execute-before-commit-quality.sh`    |
| `warnBeforePush` | `tool.execute.before.bash` | Toast warning before push           | `tool-execute-before-git-push-reminder.sh` |

---

## 5. Implementation Details

### 5.1 Data-Only Logging Migration

**Current config:**

```typescript
TOOL_EXECUTE_AFTER_SUBAGENT: {
  task: {
    toast: true,
    scripts: ['log-agent.sh'],
    saveToFile: true,
  },
},
TOOL_EXECUTE_AFTER: {
  skill: {
    toast: true,
    scripts: ['log-skill.sh'],
    saveToFile: true,
  },
},
```

**Proposed - No scripts needed:**

```typescript
TOOL_EXECUTE_AFTER_SUBAGENT: {
  task: {
    toast: true,
    scripts: [],  // Removed
    saveToFile: {
      enabled: true,
      path: 'production/session-logs/agent-audit.log',
      template: '[{timestamp}] | Agent invoked: {input.subagent}',
    },
  },
},
TOOL_EXECUTE_AFTER: {
  skill: {
    toast: true,
    scripts: [],  // Removed
    saveToFile: {
      enabled: true,
      path: 'production/session-logs/skill-audit.log',
      template: '[{timestamp}] | Skill invoked: {input.skill}',
    },
  },
},
```

**Note:** This requires enhanced `saveToFile` with template support. For now, we can use a simpler approach with `toastMessage` callback.

### 5.2 New Block Predicates

```typescript
// In user-events.config.ts

// Block --no-verify flag
const blockNoVerify: BlockPredicate = (input, output) => {
  const cmd = (input.args.command ?? output.args.command) as string;
  return /\s(-(-)?no-verify)\b/.test(cmd);
};

// Block git commit with quality issues
const blockGitCommit: BlockPredicate = (input, output) => {
  const cmd = (input.args.command ?? output.args.command) as string;
  return /\bgit\s+commit\b/.test(cmd);
};

// Warn before git push (non-blocking)
const warnBeforePush: BlockPredicate = (input, output) => {
  const cmd = (input.args.command ?? output.args.command) as string;
  return /\bgit\s+push\b/.test(cmd);
};
```

### 5.3 Predicate Application by Tool Event

```typescript
TOOL_EXECUTE_BEFORE: {
  bash: {
    block: [
      blockGitForce,      // Existing
      blockNoVerify,      // NEW
      blockScriptsFailed, // Existing
    ],
    // Non-blocking warnings
    toast: true,
    toastMessage: (input, output) => {
      const cmd = input.args.command as string;
      if (/\bgit\s+push\b/.test(cmd)) {
        return '💡 Remember to review your changes before pushing!';
      }
      return undefined;
    },
  },
  write: {
    block: [blockEnvFiles],  // Existing
  },
  read: {
    block: [blockEnvFiles, blockByPath(['credentials.json', 'secrets/', '.ssh/'])],
  },
  filesystem_read_file: {
    block: [blockEnvFiles, blockByPath(['credentials.json', 'secrets/', '.ssh/'])],
  },
},
```

---

## 6. Pending: Enhanced saveToFile Schema

To support data-only logging, we need to enhance `saveToFile`:

```typescript
interface SaveToFileConfig {
  enabled: boolean;
  path: string; // Supports: {eventType}, {date}, {timestamp}
  template?: string; // Supports: {input.field}, {output.field}
  maxSize?: string; // e.g., '10MB'
  rotate?: boolean;
}
```

**Current workaround:** Use `appendToSession: true` with `toastMessage` callback to log to session instead of file.

---

## 7. Implementation Order

### Phase 1: Quick Wins (This Session)

| Task                              | Status |
| --------------------------------- | ------ |
| Disable server-connected.sh       | ⏳     |
| Migrate log-agent.sh to data-only | ⏳     |
| Migrate log-skill.sh to data-only | ⏳     |
| Add blockNoVerify predicate       | ⏳     |
| Add warnBeforePush toast          | ⏳     |

### Phase 2: Script Improvements

| Task                                      | Status |
| ----------------------------------------- | ------ |
| Update session-created.sh with `set +e`   | ⏳     |
| Update session-stop.sh robustness         | ⏳     |
| Update experimental-session-compacting.sh | ⏳     |

### Phase 3: Future Features

| Task                               | Status |
| ---------------------------------- | ------ |
| Enhanced saveToFile with templates | ⏳     |
| Quality gate script                | ⏳     |
| Commit quality predicate           | ⏳     |

---

## 8. Questions Resolved

Based on user feedback:

1. **Unused scripts**: Will be evaluated for ideas, not deleted
2. **Logging**: Migrating to data-only ✅
3. **server-connected.sh**: Disabling ✅
4. **New predicates**: Adding all, applied to `tool.execute.before.bash`
5. **Session context**: Keeping detailed ✅

---

## 9. Appendix: Unused Scripts to Keep for Ideas

| Script                                   | Idea to Extract      | Future Feature            |
| ---------------------------------------- | -------------------- | ------------------------- |
| `tool-execute-before-block-no-verify.sh` | Block `--no-verify`  | `blockNoVerify` predicate |
| `tool-execute-after-quality-gate.sh`     | Build/lint/test      | Quality gate script       |
| `tool-execute-before-commit-quality.sh`  | Check staged files   | Commit quality predicate  |
| `tool-failed-mcp-health.sh`              | MCP failure logging  | MCP monitoring            |
| `validate-commit.sh`                     | Multiple validations | Commit validation suite   |
