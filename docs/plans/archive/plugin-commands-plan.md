# Plan: Plugin for Automatic Command Execution

## Context
Implement an OpenCode plugin that automatically executes commands on session events, similar to Claude Code hooks.

---

## Commands ↔ Events Mapping

| Command | OpenCode Event | Trigger | Automatic? |
|---------|----------------|----------|--------------|
| `session-start.md` | `session.created` | New session starts | ✅ YES |
| `session-stop.md` | `session.idle` | Session ends | ✅ YES |
| `pre-compact.md` | `session.compacted` | Before compacting | ✅ YES |
| `validate-commit.md` | `tool.execute.before` | When git commit is executed | ✅ YES |
| `validate-push.md` | `tool.execute.before` | When git push is executed | ✅ YES |
| `validate-assets.md` | `file.watcher.updated` | When file in assets/ changes | ✅ YES |
| `log-agent.md` | `tool.execute.after` | When subagent (Task) is invoked | ✅ YES |
| `detect-gaps.md` | - | Manual execution | ❌ NO |

---

## Execution

| Step | Status | Timestamp |
|------|--------|------------|
| 1. Create `.opencode/plugins/` directory | ✅ | 2026-03-31 |
| 2. Create plugin `session-commands.js` | ✅ | 2026-03-31 |
| 3. Implement `executeCommand()` function | ✅ | 2026-03-31 |
| 4. Map events to commands | ✅ | 2026-03-31 |
| 5. Update documentation | ✅ | 2026-03-31 |

---

## Step 1: File Structure

```
.opencode/
  ├── commands/
  │   ├── session-start.md      # Already exists → AUTOMATIC
  │   ├── session-stop.md        # Already exists → AUTOMATIC
  │   ├── pre-compact.md         # Already exists → AUTOMATIC
  │   ├── validate-commit.md     # Already exists → AUTOMATIC
  │   ├── validate-push.md       # Already exists → AUTOMATIC
  │   ├── validate-assets.md     # Already exists → AUTOMATIC
  │   ├── log-agent.md           # Already exists → AUTOMATIC (via Task)
  │   └── detect-gaps.md         # Already exists → MANUAL
  └── plugins/
      └── session-commands.js    # NEW
```

---

## Step 2: Command Details Integrated with Plugin

### Command 1: session-start.md (AUTOMATIC)
**File**: `.opencode/commands/session-start.md`  
**Event**: `session.created`  
**Trigger**: When a new session starts

**Description**: Displays project context at session start (branch, commits, sprint, milestone, open bugs count, TODO/FIXME counts, and previous session state if exists)

---

### Command 2: session-stop.md (AUTOMATIC)
**File**: `.opencode/commands/session-stop.md`  
**Event**: `session.idle`  
**Trigger**: When the session ends (goes idle)

**Description**: Records session summary at end (commits, modified files, archives state)

---

### Command 3: pre-compact.md (AUTOMATIC)
**File**: `.opencode/commands/pre-compact.md`  
**Event**: `session.compacted`  
**Trigger**: Before context is compacted

**Description**: State dump before compaction (modified files, WIP markers in design docs)

---

### Command 4: validate-commit.md (AUTOMATIC)
**File**: `.opencode/commands/validate-commit.md`  
**Event**: `tool.execute.before` (intercepts git commit)  
**Trigger**: When `git commit` is executed

**Description**: Validates files before commit (design docs, JSON, hardcoded values, TODO/FIXME ownership)

---

### Command 5: validate-push.md (AUTOMATIC)
**File**: `.opencode/commands/validate-push.md`  
**Event**: `tool.execute.before` (intercepts git push)  
**Trigger**: When `git push` is executed

**Description**: Alerts when pushing to protected branches (main, master, develop)

---

### Command 6: validate-assets.md (AUTOMATIC)
**File**: `.opencode/commands/validate-assets.md`  
**Event**: `file.watcher.updated`  
**Trigger**: When file in `assets/` is modified

**Description**: Validates naming convention and JSON in assets

---

### Command 7: log-agent.md (AUTOMATIC)
**File**: `.opencode/commands/log-agent.md`  
**Event**: `tool.execute.after` (intercepts Task)  
**Trigger**: When Task tool is used to call a subagent

**Description**: Audit log - records timestamp and agent name invoked

**How to Detect**:
```javascript
"tool.execute.after": async (input) => {
  // Detect when Task tool is called
  if (input.tool === "task") {
    const subagentType = input.args?.subagent_type
    const description = input.args?.description
    
    console.log(`Agent invoked: ${subagentType}`)
    console.log(`Task: ${description}`)
  }
}
```

**Note**: We use `after` instead of `before` because:
- We already know which tool was executed
- We don't need to modify arguments
- We can get the result if needed

---

### Command 8: detect-gaps.md (MANUAL)
**File**: `.opencode/commands/detect-gaps.md`  
**Event**: None (manual execution only)  
**How to use**: `/detect-gaps`

**Description**: Detects documentation gaps (project without config, code without docs, systems without ADRs)

---

## Step 3: Plugin Code

```javascript
// .opencode/plugins/session-commands.js
import type { Plugin } from "@opencode-ai/plugin"

export const SessionCommands: Plugin = async ({ directory, client }) => {
  return {
    // Session lifecycle events
    event: async ({ event }) => {
      if (event.type === "session.created") {
        await executeCommand(directory, client, "session-start")
      }
      
      if (event.type === "session.idle") {
        await executeCommand(directory, client, "session-stop")
      }
      
      if (event.type === "session.compacted") {
        await executeCommand(directory, client, "pre-compact")
      }
    },
    
    // Intercept git commands (BEFORE - to validate before)
    "tool.execute.before": async (input, output) => {
      if (input.tool !== "bash") return
      
      const cmd = output.args.command?.toString() || ""
      
      // Detect git commit
      if (cmd.match(/git\s+commit/i)) {
        await executeCommand(directory, client, "validate-commit")
      }
      
      // Detect git push
      if (cmd.match(/git\s+push/i)) {
        await executeCommand(directory, client, "validate-push")
      }
    },
    
    // Detect Task tool calls (AFTER - to log after)
    "tool.execute.after": async (input) => {
      if (input.tool === "task") {
        const subagentType = input.args?.subagent_type
        if (subagentType) {
          await executeCommand(directory, client, "log-agent", { subagent: subagentType })
        }
      }
    },
    
    // Watch for asset file changes
    "file.watcher.updated": async (input) => {
      const filePath = input.filePath || ""
      if (filePath.startsWith("assets/")) {
        await executeCommand(directory, client, "validate-assets")
      }
    }
  }
}

async function executeCommand(directory, client, commandName, extraData = {}) {
  if (!client || !directory) return
  
  const commandPath = `${directory}/.opencode/commands/${commandName}.md`
  
  try {
    const { default: fs } = await import("fs/promises")
    const fileContent = await fs.readFile(commandPath, "utf-8")
    
    // Remove frontmatter to get just the prompt
    let prompt = fileContent.replace(/^---[\s\S]*?---\n/, "")
    
    // Inject extra data if provided (e.g., subagent name for log-agent)
    if (extraData.subagent) {
      prompt = prompt.replace(/\$ARGUMENTS/g, extraData.subagent)
    }
    
    if (prompt.trim()) {
      await client.chat({ message: prompt })
    }
  } catch (e) {
    // Command file doesn't exist - that's OK
  }
}
```

---

## Step 4: Documentation Update

### Files to Update

| File | What to Update |
|---------|----------------|
| `.opencode/docs/commands-reference.md` | Add note about automation via plugin |
| `.opencode/docs/skills-reference.md` | Add note about commands |
| `docs/WORKFLOW-GUIDE.md` | Mention hooks transformed into commands |

### Suggested Text for commands-reference.md

```markdown
## Hooks Transformed into Commands

Some commands can be executed automatically via plugin:

| Command | Event | Automatic |
|---------|--------|-------------|
| session-start | session.created | ✅ Yes |
| session-stop | session.idle | ✅ Yes |
| pre-compact | session.compacted | ✅ Yes |
| validate-commit | git commit (before) | ✅ Yes |
| validate-push | git push (before) | ✅ Yes |
| validate-assets | file in assets/ | ✅ Yes |
| log-agent | Task tool (after) | ✅ Yes |
| detect-gaps | - | ❌ Manual (/detect-gaps) |

To enable automatic execution, install the `session-commands.js` plugin.
```

---

## Step 5: How to Use

### Automatic Execution (via Plugin)
| Scenario | Command | Event |
|---------|---------|--------|
| Open project | session-start | session.created |
| Session ends | session-stop | session.idle |
| Context compacted | pre-compact | session.compacted |
| `git commit` | validate-commit | tool.execute.before |
| `git push` | validate-push | tool.execute.before |
| Edit `assets/data/foo.json` | validate-assets | file.watcher.updated |
| Call subagent (Task tool) | log-agent | tool.execute.after |

### Manual Execution
```bash
/session-start
/session-stop
/detect-gaps
```

---

## Important Notes

### Difference: tool.execute.before vs after

| Hook | When Executes | Use |
|------|----------------|-----|
| `tool.execute.before` | BEFORE the tool | Validate, modify arguments |
| `tool.execute.after` | AFTER the tool | Log, capture results |

### Available Events in OpenCode
- **Session Events**: session.created, session.idle, session.compacted, etc.
- **Tool Events**: tool.execute.before, tool.execute.after
- **File Events**: file.watcher.updated, file.edited
- **Message Events**: message.updated, message.part_updated
- **Command Events**: command.executed

### Infinite Recursion
⚠️ The plugin must be silent - don't execute commands that trigger other events.

### Limitations
1. `session.idle` events may not fire in all sessions
2. `file.watcher.updated` may fire multiple times
3. Commands execute via `client.chat()` - doesn't block flow

---

## Required Action

1. Create `.opencode/plugins/` directory
2. Create `.opencode/plugins/session-commands.js` with the code
3. Update documentation (commands-reference.md, skills-reference.md)
4. Test by opening a new session

---

## References

- OpenCode Plugins: https://opencode.ai/docs/plugins/
- OpenCode Events: https://opencode.ai/docs/plugins/#events
- Session Events: session.created, session.idle, session.compacted
- Tool Events: tool.execute.before, tool.execute.after
- File Events: file.watcher.updated