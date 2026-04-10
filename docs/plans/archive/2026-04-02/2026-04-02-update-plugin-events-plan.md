# Plan: Update game-studio-plugin.ts with All Events

## Context

The `game-studio-plugin.ts` plugin currently only executes `session-start.sh` on the `session.created` event. We need to expand it to support all 7 shell scripts with their respective OpenCode events.

---

## Execution

| Step                                      | Status | Timestamp  |
| ----------------------------------------- | ------ | ---------- |
| 1. Add session.idle (session-stop)        | ✅     | 2026-03-31 |
| 2. Add session.compacted (pre-compact)    | ✅     | 2026-03-31 |
| 3. Add tool.execute.before for git commit | ✅     | 2026-03-31 |
| 4. Add tool.execute.before for git push   | ✅     | 2026-03-31 |
| 5. Add file.watcher.updated for assets/   | ✅     | 2026-03-31 |
| 6. Add tool.execute.after for Task        | ✅     | 2026-03-31 |
| 7. Test plugin                            | ✅     | 2026-04-02 |

---

## Step 1: Current Plugin Structure

The current plugin has ~69 lines and follows this pattern:

```typescript
export const GameStudioPlugin: Plugin = async ({
  project,
  client,
  $,
  directory,
  worktree,
}) => {
  await log('Plugin initialized, directory:', directory);

  return {
    event: async ({ event }) => {
      if (event.type === 'session.created') {
        const sessionEvent = event as EventSessionCreated;
        const sessionId = sessionEvent.properties.info.id;
        const result = await $`./.opencode/hooks/session-start.sh`.quiet();
        const outputText = result.text();
        await client.session.prompt({
          path: { id: sessionId },
          body: {
            noReply: true,
            parts: [{ type: 'text', text: outputText }],
          },
        });
      }
    },
  };
};
```

---

## Step 2: Add New Events

### 2.1 Session Events

**session.idle** (session-stop.sh):

```typescript
if (event.type === 'session.idle') {
  const result = await $`./.opencode/hooks/session-stop.sh`.quiet();
  await log('Session stopped:', result.text());
}
```

**session.compacted** (pre-compact.sh):

```typescript
if (event.type === 'session.compacted') {
  const result = await $`./.opencode/hooks/pre-compact.sh`.quiet();
  // Show output to user via session.prompt
  const sessionId = (event as any).properties?.info?.id;
  if (sessionId) {
    await client.session.prompt({
      path: { id: sessionId },
      body: { noReply: true, parts: [{ type: 'text', text: result.text() }] },
    });
  }
}
```

### 2.2 Tool Events (tool.execute.before)

```typescript
"tool.execute.before": async (input) => {
  if (input.tool !== "bash") return;

  const command = (input.args?.command as string) || "";

  // git commit -> validate-commit.sh
  if (/\bgit\s+commit\b/i.test(command)) {
    const result = await $`./.opencode/hooks/validate-commit.sh`.quiet();
    await log("Validate commit:", result.text());
  }

  // git push -> validate-push.sh
  const pushMatch = command.match(/\bgit\s+push\b.*?(\S+)$/);
  if (pushMatch) {
    const targetBranch = pushMatch[1];
    const result = await $`./.opencode/hooks/validate-push.sh ${targetBranch}`.quiet();
    await log("Validate push:", result.text());
  }
}
```

### 2.3 File Events (file.watcher.updated)

```typescript
"file.watcher.updated": async (input) => {
  const filePath = (input.filePath as string) || "";

  if (filePath.startsWith("assets/")) {
    const result = await $`./.opencode/hooks/validate-assets.sh ${filePath}`.quiet();
    await log("Validate assets:", result.text());
  }
}
```

### 2.4 Tool Events (tool.execute.after)

```typescript
"tool.execute.after": async (input) => {
  if (input.tool === "task") {
    const subagentType = input.args?.subagent_type as string;
    if (subagentType) {
      const result = await $`./.opencode/hooks/log-agent.sh ${subagentType}`.quiet();
      await log("Log agent:", result.text());
    }
  }
}
```

---

## Step 3: Complete Updated Plugin Code

```typescript
import { Plugin } from "@opencode-ai/plugin";
import type { EventSessionCreated, EventSessionCompacted } from "@opencode-ai/sdk";
import { appendFile } from "fs/promises";

const LOG_FILE = "./plugin-logs.txt";

interface SerializedBuffer {
  type: 'Buffer';
  data: number[];
}

interface ShellResult {
  stdout: SerializedBuffer | string;
  stderr: SerializedBuffer | string;
  exitCode: number;
}

function isShellResult(value: unknown): value is ShellResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    'stdout' in value &&
    'stderr' in value &&
    'exitCode' in value
  );
}

const decodeOutput = async (value: unknown): Promise<string> => {
  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    const v = value as Record<string, unknown>;

    if ("stdout" in v) {
      const stdout = v.stdout as Record<string, unknown>;
      if (stdout.type === "Buffer" && Array.isArray(stdout.data)) {
        return Buffer.from(stdout.data as number[]).toString("utf-8");
      }
      return String(stdout);
    }

    if (v.type === "Buffer" && Array.isArray(v.data)) {
      return Buffer.from(v.data as number[]).toString("utf-8");
    }
  }

  return JSON.stringify(value);
}

const log = async (...args: unknown[]): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    const message = (await Promise.all(args.map(decodeOutput))).join(' ');
    await appendFile(LOG_FILE, `[${timestamp}] ${message}\n`);
  } catch {
    console.error("Failed to log message");
  }
};

const runHook = async ($: any, scriptPath: string, ...args: string[]): Promise<string> => {
  const cmd = args.length > 0
    ? `${\`${scriptPath} ${args.join(' ')}\`}`
    : `${\`${scriptPath}\`}`;
  const result = await (args.length > 0 ? $`${scriptPath} ${args.join(' ')}`.quiet() : $`${scriptPath}`.quiet());
  return result.text();
};

const showToUser = async (client: any, sessionId: string, text: string): Promise<void> => {
  await client.session.prompt({
    path: { id: sessionId },
    body: {
      noReply: true,
      parts: [{ type: 'text', text }],
    },
  });
};

export const GameStudioPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  await log("Plugin initialized, directory:", directory);

  return {
    // Session lifecycle events
    event: async ({ event }) => {
      await log(">>> EVENT:", event.type);

      // session.created -> session-start.sh
      if (event.type === "session.created") {
        const sessionEvent = event as EventSessionCreated;
        const sessionId = sessionEvent.properties.info.id;
        await log(">>> SESSION START detected - running session-start.sh");

        const outputText = await runHook($, "./.opencode/hooks/session-start.sh");
        await showToUser(client, sessionId, outputText);
        await log(outputText);
      }

      // session.idle -> session-stop.sh
      if (event.type === "session.idle") {
        await log(">>> SESSION IDLE detected - running session-stop.sh");
        const outputText = await runHook($, "./.opencode/hooks/session-stop.sh");
        await log(outputText);
      }

      // session.compacted -> pre-compact.sh
      if (event.type === "session.compacted") {
        const sessionEvent = event as EventSessionCompacted;
        const sessionId = sessionEvent.properties.info.id;
        await log(">>> SESSION COMPACTED detected - running pre-compact.sh");

        const outputText = await runHook($, "./.opencode/hooks/pre-compact.sh");
        await showToUser(client, sessionId, outputText);
        await log(outputText);
      }
    },

    // Tool execution events (before)
    "tool.execute.before": async (input) => {
      if (input.tool !== "bash") return;

      const command = (input.args?.command as string) || "";

      // git commit -> validate-commit.sh
      if (/\bgit\s+commit\b/i.test(command)) {
        await log(">>> GIT COMMIT detected - running validate-commit.sh");
        const outputText = await runHook($, "./.opencode/hooks/validate-commit.sh");
        await log("Validate commit result:", outputText);
      }

      // git push -> validate-push.sh (extract branch)
      if (/\bgit\s+push\b/i.test(command)) {
        await log(">>> GIT PUSH detected - running validate-push.sh");

        // Extract branch from command
        const branchMatch = command.match(/git\s+push\s+(?:origin\s+)?(\S+)/i);
        const targetBranch = branchMatch ? branchMatch[1] : "unknown";

        const outputText = await runHook($, "./.opencode/hooks/validate-push.sh", targetBranch);
        await log("Validate push result:", outputText);
      }
    },

    // Tool execution events (after)
    "tool.execute.after": async (input) => {
      // Task tool -> log-agent.sh
      if (input.tool === "task") {
        const subagentType = input.args?.subagent_type as string;
        if (subagentType) {
          await log(">>> TASK (subagent) detected - running log-agent.sh:", subagentType);
          const outputText = await runHook($, "./.opencode/hooks/log-agent.sh", subagentType);
          await log(outputText);
        }
      }
    },

    // File watcher events
    "file.watcher.updated": async (input) => {
      const filePath = (input.filePath as string) || "";

      // File in assets/ -> validate-assets.sh
      if (filePath.startsWith("assets/")) {
        await log(">>> ASSET CHANGED detected - running validate-assets.sh:", filePath);
        const outputText = await runHook($, "./.opencode/hooks/validate-assets.sh", filePath);
        await log(outputText);
      }
    },
  };
};
```

---

## Step 4: Final Event Mapping

| Script               | OpenCode Event                     | Trigger                   |
| -------------------- | ---------------------------------- | ------------------------- |
| `session-start.sh`   | `session.created`                  | New session starts        |
| `session-stop.sh`    | `session.idle`                     | Session ends              |
| `pre-compact.sh`     | `session.compacted`                | Context will be compacted |
| `validate-commit.sh` | `tool.execute.before` (git commit) | git commit executed       |
| `validate-push.sh`   | `tool.execute.before` (git push)   | git push executed         |
| `validate-assets.sh` | `file.watcher.updated`             | File in assets/ modified  |
| `log-agent.sh`       | `tool.execute.after` (task)        | Subagent invoked          |

---

## Step 5: Recommended Tests

1. **session.created**: Open new project → see session-start.sh output
2. **session.idle**: Leave session idle → verify session-stop.sh executed
3. **session.compacted**: Force compaction → verify pre-compact.sh executed
4. **tool.execute.before (commit)**: `git commit -m "test"` → verify validate-commit.sh
5. **tool.execute.before (push)**: `git push origin main` → verify validate-push.sh
6. **file.watcher.updated**: Edit `assets/data/test.json` → verify validate-assets.sh
7. **tool.execute.after (task)**: Call subagent via Task tool → verify log-agent.sh

---

## References

- OpenCode Plugins: https://opencode.ai/docs/plugins/
- OpenCode Events: https://opencode.ai/docs/plugins/#events
- Scripts in: `.opencode/hooks/*.sh`
