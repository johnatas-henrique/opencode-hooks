# Plan: Auto-Execute Commands via API

## Objective
Modify the plugin to automatically execute commands via OpenCode API, instead of just logging for manual execution.

## Execution

| Step | Status | Timestamp |
|------|--------|-----------|
| 1. Analyze current plugin structure | ✅ | 2026-03-31 |
| 2. Identify how to get session ID in plugin | ✅ | 2026-03-31 |
| 3. Implement command execution via client.session.command() | ✅ | 2026-03-31 |
| 4. Replace executeCommandLog with executeCommand | ✅ | 2026-03-31 |
| 5. Test the complete plugin | ✅ | 2026-04-02 |

---

## Current State Analysis

### What the plugin does TODAY:
1. Detects events (session.start, session.stop, git commit/push, subagents, etc.)
2. Logs are written to file (`plugin-logs.txt`)
3. The command is just suggested via log: "Execute manually with /command-name"

### What we need to DO:
1. Get the `sessionId` of the current session via plugin context
2. Use the API `client.session.command()` to automatically execute commands
3. Remove the dependency on logs and manual execution

---

## API for Command Execution

```typescript
// Correct way to execute commands
await ctx.client.session.command({
  path: { id: sessionId },
  body: {
    command: '/session-start',
    arguments: ''
  }
})
```

---

## Code Changes

### 1. Update Plugin type to receive client
```typescript
// Currently: async ({ directory, $ }) => { ... }
// New: async ({ directory, client, $ }) => { ... }
```

### 2. Get session ID of current session
```typescript
// Options:
- Use ctx.sessionID (available in tool execution context)
- List active sessions: await client.session.list()
- Pass via event parameter
```

### 3. New execution function
```typescript
async function executeCommand(
  client: OpenCodeClient,
  sessionId: string,
  commandName: string,
  arguments?: string
): Promise<void> {
  await client.session.command({
    path: { id: sessionId },
    body: {
      command: `/${commandName}`,
      arguments: arguments || ''
    }
  })
}
```

### 4. Remove command log system
- Remove `executeCommandLog` that only logs
- Replace with `executeCommand` that executes via API

---

## Events → Commands (keep same)

| Event | Command | Type |
|--------|---------|------|
| `session.created`/`session.updated` | session-start | Automatic |
| `server.instance.disposed` | session-stop | Automatic |
| `session.compacted` | pre-compact | Automatic |
| `tool.execute.before` (git commit) | validate-commit | Automatic |
| `tool.execute.before` (git push) | validate-push | Automatic |
| `tool.execute.after` (task) | log-agent | Automatic |
| `file.watcher.updated` (assets/) | validate-assets | Automatic |

---

## Risks and Considerations

| Risk | Mitigation |
|-----|-----------|
| Session ID not available in all events | Use `client.session.list()` as fallback |
| Command fails | Add try/catch and error logging |
| Multiple executions | Keep existing debounce |

---

## Files to Modify

- `.opencode/plugins/session-commands.ts` - Main plugin

---

## Expected Result

When opening a project, the command `/session-start` will be **automatically executed** and the result visible in the conversation, instead of just suggesting manual execution.