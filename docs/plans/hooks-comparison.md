# Plan: Hooks Comparison and Implementation

**Date:** 2026-04-09  
**Project:** opencode-hooks

---

## Execution

| Step                                 | Status | Timestamp |
| ------------------------------------ | ------ | --------- |
| 1. Analyze ECC hooks                 | ✅     | -         |
| 2. List our current hooks            | ✅     | -         |
| 3. Create comparative document       | ✅     | -         |
| 4. Save plan                         | ✅     | -         |
| 5. Decide which hooks to implement   | ⏳     | -         |
| 6. Create .sh scripts for new hooks  | ⏳     | -         |
| 7. Inject into user-events.config.ts | ⏳     | -         |
| 8. Document each hook                | ⏳     | -         |
| 9. Implement async support if needed | ⏳     | -         |

---

## OUR CURRENT HOOKS (6 scripts)

| #   | Script                | Event                             | What it does                                                                          |
| --- | --------------------- | --------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | `session-created.sh`  | `session.created`                 | Displays session context (branch, recent commits, sprints, open bugs, state recovery) |
| 2   | `session-closed.sh`   | `session.deleted`                 | Logs session summary (commits, modified files, clears active state)                   |
| 3   | `pre-compact.sh`      | `EXPERIMENTAL_SESSION_COMPACTING` | Shows session state, modified files, work in progress in docs                         |
| 4   | `log-agent.sh`        | `tool.execute.after` (task)       | Logs agent invocation for audit trail                                                 |
| 5   | `log-skill.sh`        | `tool.execute.after` (skill)      | Logs skill invocation for audit trail                                                 |
| 6   | `server-connected.sh` | `server.connected`                | Shows connection info, project status, active plugins                                 |

---

## ECC HOOKS (31 hooks) - ORGANIZED BY EVENT

### PreToolUse (11 hooks)

| #   | ID                                | Matcher         | What it does                                                       | Async?  | Permissions                                             |
| --- | --------------------------------- | --------------- | ------------------------------------------------------------------ | ------- | ------------------------------------------------------- |
| 7   | `pre:bash:block-no-verify`        | Bash            | Blocks `git --no-verify` that skips hooks                          | No      | `runScripts: true`, `saveToFile: false`, `toast: false` |
| 8   | `pre:bash:auto-tmux-dev`          | Bash            | Auto-start dev servers in tmux                                     | No      | `runScripts: true`, `toast: true`                       |
| 9   | `pre:bash:tmux-reminder`          | Bash            | Reminder to use tmux for long-running commands                     | No      | `runScripts: true`, `toast: true`                       |
| 10  | `pre:bash:git-push-reminder`      | Bash            | Reminder to review before git push                                 | No      | `runScripts: true`, `toast: true`                       |
| 11  | `pre:bash:commit-quality`         | Bash            | Lint staged files, validate commit msg, detect console.log/secrets | No      | `runScripts: true`, `saveToFile: true`, `toast: false`  |
| 12  | `pre:write:doc-file-warning`      | Write           | Warning about non-standard documentation                           | No      | `runScripts: true`, `toast: true`                       |
| 13  | `pre:edit-write:suggest-compact`  | Edit/Write      | Suggests manual compaction at logical intervals                    | No      | `runScripts: true`, `toast: true`                       |
| 14  | `pre:observe:continuous-learning` | \*              | Captures observations for continuous learning                      | **Yes** | `runScripts: true`, `async: true`                       |
| 15  | `pre:governance-capture`          | Bash/Write/Edit | Captures governance events (security)                              | No      | `runScripts: true`, `saveToFile: true`                  |
| 16  | `pre:config-protection`           | Write/Edit      | Blocks modification of config files (linter)                       | No      | `runScripts: true`, `saveToFile: false`                 |
| 17  | `pre:mcp-health-check`            | \*              | Checks MCP server health before execution                          | No      | `runScripts: true`, `saveToFile: true`                  |

### PreCompact (1 hook)

| #   | ID            | What it does                          | Async? | Permissions                                             |
| --- | ------------- | ------------------------------------- | ------ | ------------------------------------------------------- |
| 18  | `pre:compact` | Saves state before context compaction | No     | `runScripts: true`, `saveToFile: false`, `toast: false` |

### SessionStart (1 hook)

| #   | ID              | What it does                                       | Async? | Permissions                                                                          |
| --- | --------------- | -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------ |
| 19  | `session:start` | Loads previous context and detects package manager | No     | `runScripts: true`, `saveToFile: true`, `appendToSession: true`, `runOnlyOnce: true` |

### PostToolUse (10 hooks)

| #   | ID                                 | Matcher         | What it does                                 | Async?  | Permissions                                           |
| --- | ---------------------------------- | --------------- | -------------------------------------------- | ------- | ----------------------------------------------------- |
| 20  | `post:bash:command-log-audit`      | Bash            | Audit log of all bash commands               | No      | `runScripts: true`, `saveToFile: true`                |
| 21  | `post:bash:command-log-cost`       | Bash            | Cost tracker - bash usage with timestamps    | No      | `runScripts: true`, `saveToFile: true`                |
| 22  | `post:bash:pr-created`             | Bash            | Logs PR URL after creation                   | No      | `runScripts: true`, `saveToFile: true`, `toast: true` |
| 23  | `post:bash:build-complete`         | Bash            | Build analysis (async)                       | **Yes** | `runScripts: true`, `async: true`, `timeout: 30`      |
| 24  | `post:quality-gate`                | Edit/Write      | Runs quality gate after edits (async)        | **Yes** | `runScripts: true`, `async: true`, `timeout: 30`      |
| 25  | `post:edit:design-quality-check`   | Edit/Write      | Warns about generic UI in frontend edits     | No      | `runScripts: true`, `toast: true`                     |
| 26  | `post:edit:accumulator`            | Edit/Write      | Records edited JS/TS files for batch         | No      | `runScripts: true`, `saveToFile: true`                |
| 27  | `post:edit:console-warn`           | Edit            | Warns about console.log after edits          | No      | `runScripts: true`, `toast: true`                     |
| 28  | `post:governance-capture`          | Bash/Write/Edit | Captures governance events from tool outputs | No      | `runScripts: true`, `saveToFile: true`                |
| 29  | `post:observe:continuous-learning` | \*              | Captures results for continuous learning     | **Yes** | `runScripts: true`, `async: true`                     |

### PostToolUseFailure (1 hook)

| #   | ID                      | What it does                                       | Async? | Permissions                            |
| --- | ----------------------- | -------------------------------------------------- | ------ | -------------------------------------- |
| 30  | `post:mcp-health-check` | Marks unhealthy MCP servers and attempts reconnect | No     | `runScripts: true`, `saveToFile: true` |

### Stop (6 hooks)

| #   | ID                       | What it does                                                    | Async?         | Permissions                                           |
| --- | ------------------------ | --------------------------------------------------------------- | -------------- | ----------------------------------------------------- |
| 31  | `stop:format-typecheck`  | Batch format (Biome/Prettier) + typecheck (tsc) on edited files | No (but heavy) | `runScripts: true`, `saveToFile: true`                |
| 32  | `stop:check-console-log` | Checks console.log in modified files                            | No             | `runScripts: true`, `toast: true`                     |
| 33  | `stop:session-end`       | Persists session state (async)                                  | **Yes**        | `runScripts: true`, `async: true`, `saveToFile: true` |
| 34  | `stop:evaluate-session`  | Evaluates session for extractable patterns (async)              | **Yes**        | `runScripts: true`, `async: true`                     |
| 35  | `stop:cost-tracker`      | Tracks tokens and cost per session (async)                      | **Yes**        | `runScripts: true`, `async: true`, `saveToFile: true` |
| 36  | `stop:desktop-notify`    | Sends desktop notification with summary (async)                 | **Yes**        | `runScripts: true`, `async: true`                     |

### SessionEnd (1 hook)

| #   | ID                   | What it does                                | Async?  | Permissions                       |
| --- | -------------------- | ------------------------------------------- | ------- | --------------------------------- |
| 37  | `session:end:marker` | Session lifecycle end marker (non-blocking) | **Yes** | `runScripts: true`, `async: true` |

---

## COMPARATIVE SUMMARY

| Category          | We Have                | ECC Has                             |
| ----------------- | ---------------------- | ----------------------------------- |
| Session lifecycle | ✅ 2 (created, closed) | ✅ 2 (start, end + marker)          |
| Tool logging      | ✅ 2 (agent, skill)    | ✅ 10+ (command log, cost, PR, etc) |
| Pre-tool hooks    | ❌                     | ✅ 11                               |
| Post-tool hooks   | ✅ Partial             | ✅ 10                               |
| Stop hooks        | ❌                     | ✅ 6                                |
| Quality/Linting   | ❌                     | ✅ 6                                |
| Git/GitHub safety | ❌                     | ✅ 3                                |
| MCP health        | ❌                     | ✅ 2                                |
| Notifications     | ❌                     | ✅ 1                                |

---

## INSPIRATIONS

Repositories that inspired our plugin:

1. **romain325/opencode-hooks-plugin** - https://github.com/romain325/opencode-hooks-plugin
   - Claude Code hooks compatibility
   - Support for multiple handler types (command, http, prompt, agent)
   - Regex matcher to filter by tool name

2. **affaan-m/everything-claude-code** - https://github.com/affaan-m/everything-claude-code
   - 31 complete hooks organized by event
   - Focus on code quality, governance, and continuous learning
   - Scripts with Node.js wrappers (we will adapt to pure .sh)

---

## IMPLEMENTATION NOTES

### Implementation Structure

For each chosen hook:

1. **Create .sh script** in `.opencode/scripts/`
2. **Inject into `user-events.config.ts`** with ideal permissions:
   - `enabled`, `toast`, `runScripts`, `runOnlyOnce`, `saveToFile`, `appendToSession`, etc.
3. **Create documentation** in `.opencode/scripts/README.md` with:
   - Script name
   - Associated event
   - Description
   - Required permissions (appendToSession, runOnlyOnce, toast, saveToFile, debug)
   - How to use

### About Async Hooks

The ECC uses `"async": true` to run hooks in background without blocking Claude's response. Currently our plugin doesn't have native async support like Claude Code.

**Current approach:** We'll mark which hooks would benefit from async in the table above. Testing will show if we need to add async support to the plugin.

**Future improvement:** Add native async support to the plugin:

- Add `async` field to event configuration
- Run scripts with `&` + timeout management in the plugin
- This would allow proper timeout control (process killed after X seconds)

### Script Permissions Explained

| Permission        | Description                                   |
| ----------------- | --------------------------------------------- |
| `appendToSession` | Output goes to session context (user sees it) |
| `runOnlyOnce`     | Script runs only once per session             |
| `toast`           | Show visual notification to user              |
| `saveToFile`      | Save output to a log file                     |
| `debug`           | Enable detailed logging                       |

- All new hooks will be implemented as **pure .sh scripts**
- No Node.js dependency - auditable by any Linux user
- Each script must be self-contained with readable output
- Follow existing hook patterns in the project
