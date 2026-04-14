# Events Catalog - OpenCode Hooks

Reference for OpenCode Hooks users. This file shows all events with their available keys and real examples.

Use this to understand what data is available for each event type and decide which fields to show in toasts/logs.

## How to use

In `settings.ts`:

```typescript
events: {
  'session.created': {
    toast: true,
    allowedFields: ['info.id', 'info.title', 'info.directory']
  },
}
```

---

## Session Events

### session.created

Fired when a new session starts.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `info.id` | Session ID (canonical) |
| `info.slug` | Session slug (e.g., "silent-planet") |
| `info.version` | OpenCode version |
| `info.projectID` | Project identifier |
| `info.directory` | Project directory path |
| `info.title` | Session title (e.g., "New session - 2026-04-12T22:15:43.020Z") |
| `info.time.created` | Creation timestamp (epoch) |
| `info.time.updated` | Last update timestamp (epoch) |
| `info.parentID` | Parent session ID (if created by subagent) |

**Recommended:** `info.id`, `info.title`, `info.directory`, `info.parentID`

---

### session.compacted

Fired when session is compacted (context reduction).

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Unique session identifier |
| `properties.sessionID` | Session ID |
| `properties.contextSize` | Size of context before compaction |

**Recommended:** `sessionID`, `properties.contextSize`

**Note:** User is actively working on complex task, avoid interruptions.

---

### session.error

Fired when an error occurs in the session.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Unique session identifier |
| `error.name` | Error name/type |
| `error.data.message` | Error message |

**Recommended:** `sessionID`, `error.name`, `error.data.message`

**Note:** Important - user needs to know about errors.

---

### session.idle

Fired when session becomes idle.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Unique session identifier |

**Recommended:** `sessionID`

---

### session.deleted

Fired when session is deleted.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `info.id` | Session ID that was deleted |

**Recommended:** `info.id`

---

### session.diff

Fired when session diff is generated.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Unique session identifier |

**Recommended:** `sessionID`

---

### session.status

Fired when session status changes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Unique session identifier |
| `properties.status` | Current status |

**Recommended:** `sessionID`, `properties.status`

---

### session.updated

Fired when session is updated.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Unique session identifier |
| `info.id` | Session ID |
| `info.title` | Updated title |

**Recommended:** `sessionID`, `info.title`

---

## Tool Events - Before

### tool.execute.before

Fired BEFORE a tool is executed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Tool name (bash, write, read, edit, task, skill, etc.) |
| `sessionID` | Unique session identifier |
| `callID` | Unique call identifier for this execution |
| `args` | Tool-specific arguments object |

**Output Keys:**
| Key | Description |
|-----|-------------|
| `args.command` | For bash: the command being executed |
| `args.filePath` | For file tools: the file path |
| `args.path` | For filesystem tools: the path |
| `args.description` | Description of what will be executed |
| `args.timeout` | Timeout in milliseconds |

**Recommended:** `tool`, `args.command`, `args.filePath`, `args.description`

**Note:** `callID` usually not useful - too verbose.

---

### tool.execute.before.bash

Fired before a bash command is executed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "bash" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.command` | The bash command |
| `args.description` | Command description |
| `args.timeout` | Timeout in ms |

**Recommended:** `tool`, `args.command`, `args.description`

---

### tool.execute.before.write

Fired before writing to a file.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "write" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.filePath` | Path to file being written |
| `args.content` | Content (truncated in logs) |

**Recommended:** `tool`, `args.filePath`

**Note:** Content can be very large, usually not needed in toast.

---

### tool.execute.before.read

Fired before reading a file.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "read" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.path` | Path to file being read |

**Recommended:** `tool`, `args.path`

---

### tool.execute.before.edit

Fired before editing a file.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "edit" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.filePath` | Path to file being edited |
| `args.oldString` | String being replaced |
| `args.newString` | New string |

**Recommended:** `tool`, `args.filePath`

**Note:** `oldString`/`newString` can be large.

---

### tool.execute.before.task

Fired before invoking a task (subagent).

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "task" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.command` | Task command (e.g., "/check-file") |
| `args.prompt` | Task prompt |
| `args.subagent_type` | Subagent type (if provided) |

**Recommended:** `tool`, `args.command`, `args.subagent_type`

**Note:** `prompt` can be very large. This event fires for ALL task calls, regardless of whether `subagent_type` is present.

---

### tool.execute.before.skill

Fired before invoking a skill.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "skill" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.name` | Skill name being invoked |

**Recommended:** `tool`, `args.name`

---

## Tool Events - After

### tool.execute.after

Fired AFTER a tool is executed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Tool name |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args` | Tool arguments (same as before) |

**Output Keys:**
| Key | Description |
|-----|-------------|
| `title` | Output title (often the file path or command) |
| `output` | The actual output content |
| `metadata` | Additional metadata (exit code, description, etc.) |
| `metadata.output` | The command output (same as output) |
| `metadata.exit` | Exit code (0 = success) |
| `metadata.description` | Description of what happened |
| `metadata.truncated` | Whether output was truncated |
| `attachments` | Files returned by the tool |

**Recommended:** `tool`, `output.title`, `metadata.exit`, `metadata.description`

**Note:** `metadata`, `attachments` usually too verbose.

---

### tool.execute.after.bash

Fired after a bash command completes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "bash" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.command` | The command that was executed |

**Output Keys:**
| Key | Description |
|-----|-------------|
| `title` | Command description |
| `output` | Command output |
| `metadata.exit` | Exit code (0 = success) |
| `metadata.description` | Description |

**Recommended:** `tool`, `args.command`, `metadata.exit`

---

### tool.execute.after.subagent

Fired after a subagent (task with `subagent_type`) completes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Tool that was invoked (task/skill) |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `subagentType` | The subagent type that was invoked |

**Output Keys:**
| Key | Description |
|-----|-------------|
| `title` | Result title |
| `output` | Result content |

**Recommended:** `tool`, `subagentType`, `output.title`

**Note:** This event only fires when `args.subagent_type` is present in the task call.

---

### tool.execute.after.skill

Fired after a skill completes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Always "skill" |
| `sessionID` | Session ID |
| `callID` | Call ID |
| `args.name` | Skill name |

**Output Keys:**
| Key | Description |
|-----|-------------|
| `title` | Skill result title |
| `output` | Skill result |

**Recommended:** `tool`, `args.name`

---

## Permission Events

### permission.ask

Fired when user permission is needed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `tool` | Tool requesting permission |
| `type` | Permission type |
| `pattern` | Pattern being allowed/denied |
| `messageID` | Message ID |
| `callID` | Call ID |
| `title` | Permission title |

**Recommended:** `tool`, `type`, `pattern`, `title`

**Note:** Important - user must see this to approve/deny. Disabling this event does NOT hide the permission modal from the user - it only disables plugin hooks.

---

### permission.replied

Fired when user responds to permission.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `allowed` | Whether permission was granted |
| `tool` | Tool that requested permission |

**Recommended:** `allowed`, `tool`, `sessionID`

---

## File Events

### file.edited

Fired when a file is edited externally.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `path` | Path to edited file |

**Recommended:** `path`

---

### file.watcher.updated

Fired when file watcher detects changes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `path` | Path that changed |

**Recommended:** `path`

---

## Command Events

### command.execute.before

Fired before a user command is executed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `command` | Command name (e.g., "commit_list") |
| `sessionID` | Session ID |
| `arguments` | Command arguments |

**Output Keys:**
| Key | Description |
|-----|-------------|
| `parts` | Command description/guidelines |

**Recommended:** `command`, `arguments`

**Note:** `parts` contains full command instructions - usually too verbose.

---

### command.executed

Fired after a user command is executed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `name` | Command name |
| `sessionID` | Session ID |
| `arguments` | Command arguments |
| `messageID` | Message ID |

**Recommended:** `name`, `arguments`

---

## Message Events

### message.part.delta

Fired when a message part is updated (streaming).

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |

**Recommended:** (none - usually too frequent)

**Note:** Very frequent during streaming, likely too noisy.

---

### message.updated

Fired when a message is updated.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `info` | Updated message info |

**Recommended:** `info`

---

### message.removed

Fired when a message is removed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `messageID` | Message ID |

**Recommended:** `messageID`

---

### message.part.updated

Fired when a message part is updated.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `part` | Part data |

**Recommended:** `part`

---

### message.part.removed

Fired when a message part is removed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `messageID` | Message ID |
| `partID` | Part ID |

**Recommended:** `messageID`, `partID`

---

## LSP Events

### lsp.client.diagnostics

Fired when LSP reports diagnostics.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `uri` | File URI |
| `diagnostics` | Array of diagnostic issues |

**Recommended:** `uri`

**Note:** Can be frequent, show briefly.

---

### lsp.updated

Fired when LSP state is updated.

**Input Keys:**
| Key | Description |
|-----|-------------|
| (various) | LSP-specific properties |

**Recommended:** (varies by LSP)

---

## Misc Events

### shell.env

Fired when shell environment changes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `properties` | Environment variables |

**Recommended:** (none - technical info)

**Note:** Technical info, rarely needed by user.

---

### installation.updated

Fired when installation is updated.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `version` | New version |

**Recommended:** `version`

**Note:** One-time event, can show briefly.

---

### todo.updated

Fired when TODO list changes.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `todos` | Array of TODOs |

**Recommended:** (optional)

**Note:** Often verbose, can be useful.

---

### experimental.session.compacting

Fired before experimental session compaction.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |

**Recommended:** `sessionID`

**Note:** User is doing context management.

---

### experimental.chat.messages.transform

Fired when chat messages are transformed (experimental).

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID (optional) |
| `messages` | Message array |

**Recommended:** (varies)

---

### experimental.chat.system.transform

Fired when system prompt is transformed (experimental).

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID (optional) |
| `model` | Model info |

**Recommended:** (varies)

---

### experimental.text.complete

Fired when text completion is available (experimental).

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `messageID` | Message ID |
| `partID` | Part ID |

**Recommended:** (varies)

---

### tool.definition

Fired when a tool is defined.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `toolID` | Tool identifier |

**Recommended:** `toolID`

---

### chat.message

Fired when a chat message is sent.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `agent` | Agent type (optional) |
| `model` | Model info (optional) |
| `messageID` | Message ID (optional) |
| `variant` | Message variant (optional) |

**Recommended:** `sessionID`

---

### chat.params

Fired when chat parameters are set.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `agent` | Agent type |
| `model` | Model info |
| `provider` | Provider info |
| `message` | Message info |

**Recommended:** `agent`

---

### chat.headers

Fired when chat headers are set.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `sessionID` | Session ID |
| `agent` | Agent type |
| `model` | Model info |
| `provider` | Provider info |
| `message` | Message info |

**Recommended:** `agent`

---

### server.connected

Fired when server connects.

**Input Keys:**
| Key | Description |
|-----|-------------|
| (various) | Server-specific properties |

**Recommended:** (varies)

---

### server.instance.disposed

Fired when server instance is disposed.

**Input Keys:**
| Key | Description |
|-----|-------------|
| `directory` | Project directory |
| `sessionID` | Session ID (optional) |

**Recommended:** `directory`

---
