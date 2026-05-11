# Troubleshooting — OpenCode Hooks

Common issues and how to diagnose them.

## Quick Checklist

| Symptom                   | Most Likely Cause            | Check                                         |
| ------------------------- | ---------------------------- | --------------------------------------------- |
| Plugin not loading        | Missing scripts directory    | `production/session-logs/plugin-errors.json`  |
| Scripts not running       | `runScripts` not enabled     | `settings.ts` event config                    |
| Script fails silently     | Permission or path issue     | `production/session-logs/plugin-scripts.json` |
| OpenCode stops responding | Plugin threw unhandled error | `production/session-logs/plugin-errors.json`  |
| Block not working         | Wrong event type             | Blocks only work on `tool.execute.before`     |
| Toast not showing         | `toast: false` or queue full | Toast queue maxSize config                    |

## Plugin Not Loading

If OpenCode starts but the plugin doesn't run, check these files:

### Check `plugin-errors.json`

```bash
cat production/session-logs/plugin-errors.json
```

Common startup failures:

- **"Scripts directory not found"** — The plugin expects `.opencode/scripts/`
  to exist. Create it: `mkdir -p .opencode/scripts`
- **Import errors** — A missing dependency or TypeScript compilation error.
  Run `npm run build` to check for build errors.
- **Malformed `.claude/settings.json` or `.claude/local.json`** — If the
  Claude settings files contain invalid JSON, the plugin will fail when
  trying to parse them.

### Check if Events Are Being Logged

```bash
cat production/session-logs/plugin-events.json
```

If this file is empty or doesn't exist, the plugin isn't running.

## Silent Plugin Crash

The most dangerous failure mode: the plugin crashes silently and OpenCode
continues running but without hooks, scripts, or security.

### How a Crash Happens

The plugin is a TypeScript file loaded by OpenCode's plugin host. If any
hook handler throws an unhandled error, the entire plugin instance may be
disposed by OpenCode. After that:

- No events are processed
- No scripts run
- No security blocks work
- **OpenCode may not notify you** that the plugin has stopped

### What Causes Silent Crashes

1. **Unhandled error in a hook handler** — An error thrown inside
   `tool.execute.before`, `event`, or any hook that is not caught by the
   plugin's error handling.

2. **Invalid JSON in `.claude/settings.json` or `.claude/local.json`** —
   The plugin parses these files during initialization. A syntax error
   (missing comma, trailing comma, unquoted key) causes a JSON parse
   failure that prevents the plugin from loading.

3. **Script file not found or not executable** — If a script configured in
   `settings.ts` doesn't exist, the plugin detects this at runtime and
   logs an error, but may not crash entirely. However, if the error
   propagates unhandled, it can take down the plugin.

4. **Missing `scripts` directory** — The `validateScriptsDirectory()`
   function throws during plugin initialization. The plugin constructor
   will fail and the plugin won't load.

### How to Diagnose a Crash

```bash
# Check for errors
cat production/session-logs/plugin-errors.json

# Check if events were being logged before the crash
cat production/session-logs/plugin-events.json | tail -20

# Check if scripts ran
cat production/session-logs/plugin-scripts.json | tail -20
```

If `plugin-errors.json` doesn't exist or is empty, the crash may have
happened before the audit system was initialized. In that case:

- Check OpenCode's own logs (if available)
- Disable the plugin by setting `enabled: false` in `settings.ts`
- Re-enable it step by step, testing after each change

### Recovering from a Crash

1. **Disable the plugin** temporarily — set `enabled: false` in
   `settings.ts` so OpenCode loads an empty hooks object:

   ```typescript
   export const userConfig: UserEventsConfig = {
     enabled: false,
     // ... rest of config
   };
   ```

2. **Check the error** — Read `production/session-logs/plugin-errors.json`
   and fix the root cause (missing script, invalid path, etc.).

3. **Re-enable and test** — Set `enabled: true`, restart the session, and
   verify the fix.

## Scripts Not Running

If a script is configured but doesn't execute:

### Check `runScripts`

The event or tool override must have `runScripts: true`:

```typescript
// This will NOT run scripts
[OpenCodeEvents.SESSION_CREATED]: {
  scripts: [{ source: 'native', path: 'my-script.sh' }],
}

// This WILL run scripts
[OpenCodeEvents.SESSION_CREATED]: {
  runScripts: true,
  scripts: [{ source: 'native', path: 'my-script.sh' }],
}
```

### Check Script Path

- **Relative paths** resolve from `.opencode/scripts/`
- **Absolute paths** (starting with `/`) are used as-is
- **Path traversal** (`..`) is **rejected** for security

### Check Script Permissions

The script must be executable:

```bash
chmod +x .opencode/scripts/my-script.sh
```

### Check exit code in `plugin-scripts.json`

```bash
# Scripts that ran with their exit code
cat production/session-logs/plugin-scripts.json | grep -c '"exit":0'
cat production/session-logs/plugin-scripts.json | grep '"exit":[^0]'
```

## Block Not Working

Blocks only work on **`tool.execute.before`** and
**`command.execute.before`** events. If you configure a blocking script on
`tool.execute.after` or `session.created`, the tool will NOT be blocked
even if the script exits 2.

### Verify in Settings

```typescript
tools: {
  [OpenCodeEvents.TOOL_EXECUTE_BEFORE]: {
    bash: {
      runScripts: true,
      scripts: [
        { source: 'native', path: 'my-blocker.sh' },
      ],
    },
  },
}
```

## Debug Mode

For detailed troubleshooting, enable debug-level audit logging:

```typescript
audit: {
  enabled: true,
  level: 'debug',  // <-- captures stdin and scriptType
  basePath: './production/session-logs',
  // ...
}
```

When `level: 'debug'` is set:

- Script logs include the full `stdin` JSON sent to each script
- Each script entry includes `scriptType` showing where it originated
  (`settings-native`, `settings-claude`, `local-claude`, `global-claude`)

## Audit Log Files

| File                   | What It Contains             | How to Read                |
| ---------------------- | ---------------------------- | -------------------------- |
| `plugin-events.json`   | All events processed         | `cat` or `tail` for recent |
| `plugin-scripts.json`  | Script execution + exit code | Check for non-zero exits   |
| `plugin-errors.json`   | Errors and stack traces      | Check first on failure     |
| `plugin-security.json` | Security blocks              | Verify blocks are firing   |
| `plugin-debug.json`    | Detailed debug logs          | Check for unexpected state |
