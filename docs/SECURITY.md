# Security — OpenCode Hooks

The security model of OpenCode Hooks is **script-driven**. There is no built-in
block engine — all blocking decisions come from shell scripts that run during
`tool.execute.before` events.

## How Blocking Works

A script can block a tool in two ways:

### 1. Exit Code 2

The script exits with code 2. The block reason is taken from stderr if
available, otherwise from stdout, otherwise a default message.

```bash
#!/bin/bash
echo "Cannot write to .env files" >&2
exit 2
```

### 2. JSON Response on Stdout

The script prints a JSON object to stdout and exits 0. The
`parseHookOutput()` function in `executor.ts` recognises these formats:

```json
{ "decision": "block", "reason": "Cannot write to .env files" }
```

```json
{ "continue": false, "stopReason": "Save checkpoint needed" }
```

```json
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "Blocked by security policy",
    "updatedInput": { ... }
  }
}
```

When a block is detected, the plugin throws an error back to OpenCode.
This causes the tool execution to be cancelled with the block message.

> **Important:** Only `tool.execute.before` and `command.execute.before`
> events can block. Scripts on other events (e.g. `session.created`,
> `tool.execute.after`) that return exit code 2 will produce an error toast
> but will NOT cancel the operation.

## Behaviour by Exit Code

| Code | Meaning                        | Result                              |
| :--: | ------------------------------ | ----------------------------------- |
|  0   | Allow (or JSON block response) | Tool continues, exit 0              |
|  2   | Block                          | Tool is cancelled, reason displayed |
|  1+  | Error                          | Error toast, tool continues         |

## Default Security Scripts

The default `settings.ts` ships with these security scripts:

| Script                        | Type          | Target Tools                                                                     | What It Does                                                 |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `type-native-no-verify.sh`    | native        | `bash`, `git.commit`                                                             | Blocks `--no-verify` flag                                    |
| `block-sensitive.sh`          | native        | `bash`, `write`, `edit`, `read`, `filesystem_read_file`, `filesystem_write_file` | Blocks `.env`, credentials, `.ssh/`, protected branch pushes |
| `block-env-write.sh`          | claude        | `write`, `edit`                                                                  | Blocks writes to `.env` files (from Claude ecosystem)        |
| `block-dangerous-commands.js` | global claude | all                                                                              | Blocks dangerous commands (`rm -rf`, `chmod 777`, etc.)      |

These run on `tool.execute.before` — they check the tool input and decide
whether to allow or block before the tool executes.

## Viewing Security Events

When `audit.enabled` is `true` (default), security-relevant data is written
to two files in the audit directory:

- **`plugin-events.json`** — All tool execution events including tool name,
  input, and which security scripts ran.
- **`plugin-errors.json`** — If a security script throws or crashes, the
  error is recorded here.

Set `audit.level: 'debug'` to also capture the full stdin sent to each
script (including `scriptType`).

## Writing a Security Script

### Using the OpenCode Stdin Format

Place the script in `.opencode/scripts/` and reference it with
`source: 'native'`:

```typescript
tools: {
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
    write: {
      runScripts: true,
      scripts: [
        { source: 'native', path: 'my-blocker.sh' },
      ],
    },
  },
}
```

The script receives JSON on stdin with the OpenCode format. See
[SCRIPTS.md](SCRIPTS.md) for the full schema.

### Using the Claude-Compatible Format

If you already have a script from the Claude Code ecosystem, place it in
`~/.claude/hooks/` or `.claude/hooks/` and reference it with
`source: 'claude'`:

```typescript
tools: {
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
    bash: {
      runScripts: true,
      scripts: [
        { source: 'claude', path: '/home/user/.claude/hooks/block-destructive.sh' },
      ],
    },
  },
}
```

### Returning a Block

```bash
#!/bin/bash
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.filePath // empty')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block .env writes
if [ "$TOOL_NAME" = "write" ] && echo "$FILE_PATH" | grep -qE '\.env'; then
  echo "{\"decision\":\"block\",\"reason\":\"Blocked .env write\"}"
  exit 0
fi

exit 0
```

## Best Practices

1. **Be specific with tool targeting** — Configure security scripts only on
   the tools they apply to (e.g., `bash`, `write`, `read`), not on `task`
   or `chat` where blocking doesn't apply or breaks functionality.
2. **Check inputs before blocking** — Validate file paths, commands, and
   arguments. A block with a misleading reason is worse than no block.
3. **Test with `audit.level: 'debug'`** during development — you can verify
   the exact stdin the script receives.
4. **Keep scripts stateless** — Each execution is independent. Use script
   output to provide context for the block reason.
5. **Use native format for project-specific scripts** — More fields are
   available in the OpenCode format. Use Claude format only for scripts
   you imported from the Claude ecosystem.
