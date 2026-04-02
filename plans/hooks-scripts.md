# Plan: Shell Scripts & Hooks System

## Objective
Maintain and fix shell scripts used by the plugin system for validation, logging, and session management.

---

## Execution

| Step | Status | Timestamp |
| ---- | ------ | --------- |
| 1. Fix validate-commit.sh glob patterns | ✅ | 2026-04-01 21:30 |
| 2. Add .sh and .opencode validation | ✅ | 2026-04-02 01:00 |
| 3. Add verbose output showing staged files | ✅ | 2026-04-02 01:30 |
| 4. Test the fixed hook | ✅ | 2026-04-02 02:00 |
| 5. Document session-stop.sh usage | ✅ | 2026-04-02 02:15 |
| 6. Investigate tool.execute.before issue | ⏳ | - |
| 7. Investigate session.idle not firing | ⏳ | - |

---

## Shell Scripts

### Scripts Directory: `.opencode/scripts/`

| Script | Event | Purpose | Status |
| ------ | ----- |---------|--------|
| `session-start.sh` | session.created | Show project context | ✅ |
| `session-stop.sh` | session.idle / server.instance.disposed | Archive session state | ✅ |
| `pre-compact.sh` | session.compacted | Dump state before compact | ✅ |
| `validate-commit.sh` | tool.execute.before (git commit) | Validate staged files | ✅ |
| `validate-push.sh` | tool.execute.before (git push) | Warn on protected branches | ✅ |
| `validate-assets.sh` | file.watcher.updated | Validate asset files | ✅ |
| `log-agent.sh` | tool.execute.after (task) | Log subagent usage | ✅ |
| `detect-gaps.sh` | Manual | Detect doc gaps | ⏳ |

---

## Scripts Details

### session-start.sh
- Shows current branch
- Recent commits count
- Active sprint/milestone
- Open bugs count
- TODO/FIXME counts
- Previous session state (if exists)

### session-stop.sh
- Archives active session state
- Logs recent commits
- Records modified files

### pre-compact.sh
- Displays current session state
- Shows modified files (unstaged/staged/untracked)
- WIP markers in design docs
- Recovery instructions

### validate-commit.sh
- Checks design docs for required sections
- Validates JSON in data files
- Detects hardcoded gameplay values
- Checks TODOs/FIXMEs without assignee

### validate-push.sh
- Detects pushes to protected branches (main/master/develop)
- Reminds about tests and S1/S2 bugs

---

## Known Issues

### Issue 1: tool.execute.before not firing
**Status**: ⏳ INVESTIGATING

The event `tool.execute.before` is not being triggered when git commands are executed.

**Possible Causes**:
1. Plugin not registered correctly
2. Event name mismatch
3. Plugin loading conflict
4. SDK requires additional configuration

**Investigation Steps**:
1. Verify plugin registration
2. Test with simple bash command
3. Check SDK documentation
4. Compare with ecc-hooks.ts working implementation

---

### Issue 2: session.idle not firing
**Status**: ⏳ INVESTIGATING

The event `session.idle` is not triggering even though other events work.

**Possible Causes**:
1. Inactivity timeout too high
2. Plugin handler not registered correctly
3. Event not being fired by core
4. Toast display issue

**Investigation Steps**:
1. Check timeout configuration
2. Verify handler registration
3. Monitor event flow
4. Test with reduced timeout

---

## Fix Applied: validate-commit.sh

### Problems Fixed:
1. Glob patterns didn't match staged files
2. Silent failures - no visible validation
3. No output for skipped files

### Solution:
- Remove quotes around glob patterns in [[ ]]
- Add verbose output showing all staged files
- Add fallback pattern to catch all staged files

---

## References

- Scripts location: `.opencode/scripts/*.sh`
- Git hooks: Can be added to `.git/hooks/` for local testing
- OpenCode events: https://opencode.ai/docs/plugins/#events