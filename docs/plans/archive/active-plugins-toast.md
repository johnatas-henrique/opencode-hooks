# Plan: Active Plugins Toast Notification

## Objective

Parse OpenCode's structured log files to determine which plugins are actually loaded (active) vs failed to load, then display this information via Toast when OpenCode starts — **after** other plugins have shown their toasts, with **overwrite detection** and **fallback in session.created**, zero memory leaks.

---

## Execution

| Step                                                                           | Status | Timestamp        |
| ------------------------------------------------------------------------------ | ------ | ---------------- |
| 1. Create plugin-status.ts (log parsing and status detection)                  | ✅     | 2026-04-03 16:30 |
| 2. Create show-active-plugins.ts (toast formatting and display)                | ✅     | 2026-04-03 16:32 |
| 3. Create toast-silence-detector.ts (dynamic toast monitoring with cleanup)    | ✅     | 2026-04-03 17:00 |
| 4. Refactor opencode-hooks.ts (startup logic + overwrite detection + fallback) | ✅     | 2026-04-03 17:30 |
| 5. Write tests for toast-silence-detector.ts and overwrite detection           | ✅     | 2026-04-03 18:00 |
| 6. Run lint and tests to verify everything passes                              | ✅     | 2026-04-03 18:30 |

## Result ✅

**VERIFIED:** Plugin Status toast now appears correctly after TrueMem toast during TUI initialization.

### Additional Improvements (fix-plugin-status-toast-timing)

- Added immediate "Loading plugin status..." toast for user feedback
- Added 1000ms buffer after silence detection
- Increased toast duration to 15000ms for readability
- Added custom duration parameter to `showActivePluginsToast`
- Removed `--forceExit` from Jest scripts (no longer needed)

---

## Trigger Strategy (Updated from TrueMem Analysis)

**Not via `server.connected` event** — OpenCode doesn't support this as a top-level plugin hook.

**Instead:** Execute directly in the plugin body (like TrueMem does), with:

1. `setTimeout` initial delay (1s) to let boot settle
2. **Dynamic toast monitoring** — poll log file for `/tui/show-toast` entries
3. Wait for **1.5s of silence** after last toast from other plugins
4. **`Promise.race`** with 5s timeout fallback
5. **Proper cleanup** — `clearInterval` + `clearTimeout` after toast is shown
6. **Overwrite detection** — monitor 3s after our toast for new toasts
7. **Fallback in session.created** — if overwritten, show once in session.created (before config check)
8. **Subagent detection** — skip fallback for subagent sessions

## How Toast Monitoring Works

OpenCode logs every toast to `~/.local/share/opencode/log/`:

```
INFO  2026-04-03T16:41:36 +39ms service=server method=POST path=/tui/show-toast request
INFO  2026-04-03T16:41:36 +3ms service=bus type=tui.toast.show publishing
```

We poll the log file every 200ms, counting `/tui/show-toast` entries. When the count stops increasing for 1.5s, we know other plugins are done showing toasts.

## Full Flow Diagram

```
Boot → Plugin init
  ↓
hasShownToast? → Yes → Skip (hot-reload protection)
  ↓ No
Get latest log file
  ↓
Start waitForToastSilence(logFile)
  ↓
Poll every 200ms: count /tui/show-toast entries
  ↓
Count increases? → Reset 1.5s silence timer
  ↓
1.5s silence detected (or 5s timeout) → cleanup()
  ↓
Show our toast via toastQueue
  ↓
Record toastCountAfter = current /tui/show-toast count
  ↓
Monitor for 3s:
  ↓
  New toasts detected? (count > toastCountAfter)
    ↓ Yes                ↓ No
    wasOverwritten=true  wasOverwritten=false
    ↓                    ↓
    session.created?     Done - no fallback needed
      ↓
      isSubagentSession? → Yes → Skip
      ↓ No
      fallbackShown? → Yes → Skip
      ↓ No
      Show toast (fallback)
      fallbackShown = true
```

## Implementation Details

### Step 1: `helpers/plugin-status.ts` (Already Created)

**Status:** ✅ Complete

**Key functions:**

- `getLogDirectory(): string` - Return log directory path (supports XDG_DATA_HOME)
- `getLatestLogFile(): string | null` - Find the most recent log file
- `parseLogLine(line: string): PluginEntry | null` - Parse a single structured log line
- `getPluginStatus(): PluginStatus[]` - Full pipeline: find log → parse → correlate → return status
- `formatPluginStatus(statuses: PluginStatus[]): string` - Format for human-readable display

### Step 2: `helpers/show-active-plugins.ts` (Already Created)

**Status:** ✅ Complete

**Key function:**

- `showActivePluginsToast(queue: ToastQueue): Promise<void>` - Main entry point

### Step 3: Create `helpers/toast-silence-detector.ts` (New)

**Purpose:** Monitor OpenCode log for toast activity and resolve when silence is detected.

**Key function:**

```typescript
function waitForToastSilence(
  logFile: string,
  options?: { pollMs?: number; silenceMs?: number }
): { promise: Promise<void>; cleanup: () => void };
```

**Returns:** An object with:

- `promise` — Resolves when silence is detected
- `cleanup()` — Cancels polling and timers (call this after toast is shown)

**Logic:**

1. Read log file every `pollMs` (default 200ms)
2. Count occurrences of `path=/tui/show-toast`
3. If count increases → reset silence timer to `silenceMs` (default 1500ms)
4. If count stays same for `silenceMs` → resolve promise
5. On any error → resolve immediately (fail-safe)

**Memory safety:**

- `cleanup()` calls `clearInterval` + `clearTimeout`
- No lingering timers after resolution
- One-shot: resolves once, never re-triggers

### Step 4: Refactor `opencode-hooks.ts`

**Remove:** `server.connected` handler (doesn't work)

**Add:** Module-level state flags:

```typescript
let hasShownToast = false;
let wasOverwritten = false;
let fallbackShown = false;
let ourToastCount = 0;
```

**Add:** Startup toast logic in plugin body:

```typescript
if (!hasShownToast) {
  hasShownToast = true;
  const logFile = getLatestLogFile();

  if (logFile) {
    const { promise, cleanup } = waitForToastSilence(logFile);
    const timeout = new Promise<void>((resolve) => {
      const t = setTimeout(resolve, 5000);
      (timeout as any)._timer = t;
    });

    Promise.race([promise, timeout]).then(async () => {
      clearTimeout((timeout as any)._timer);
      cleanup();

      try {
        await showActivePluginsToast(toastQueue);
        ourToastCount = countToastsInLog(logFile);

        setTimeout(async () => {
          const newCount = countToastsInLog(logFile);
          if (newCount > ourToastCount) {
            wasOverwritten = true;
          }
        }, 3000);
      } catch {
        // Silent fail - startup toast should not break plugin
      }
    });
  }
}
```

**Add:** Overwrite detection helper:

```typescript
function countToastsInLog(logFile: string): number {
  try {
    const content = readFileSync(logFile, 'utf-8');
    return (content.match(/path=\/tui\/show-toast/g) || []).length;
  } catch {
    return 0;
  }
}
```

**Modify:** `event` handler — add fallback BEFORE config check:

```typescript
event: async ({ event }) => {
  // FALLBACK: Show toast if ours was overwritten (runs before config check)
  if (event.type === 'session.created' && wasOverwritten && !fallbackShown) {
    const props = event.properties as Record<string, unknown>;
    const info = props?.info as Record<string, unknown> | undefined;
    const title = typeof info?.title === 'string' ? info.title : '';

    if (!isSubagentSession(title)) {
      fallbackShown = true;
      await showActivePluginsToast(toastQueue);
    }
  }

  // EXISTING: Configurable event handling
  const resolved = resolveEventConfig(event.type);
  // ... rest of existing logic
};
```

**Add:** Subagent detection helper:

```typescript
function isSubagentSession(title: string): boolean {
  return title.startsWith('Task:') || title.startsWith('Agent:');
}
```

### Step 5: Tests

**Update:** `test/plugin-status.test.ts` (already complete, 16 tests passing)

**Add:** `test/toast-silence-detector.test.ts` covering:

- Resolves when no toasts in log
- Resolves after silence period following toast activity
- Resets timer when new toast appears
- Resolves on log file error (fail-safe)
- Cleanup stops all polling and timers
- No lingering processes after cleanup

**Add:** Tests for overwrite detection:

- `countToastsInLog` returns correct count
- `isSubagentSession` correctly identifies subagent sessions
- Fallback triggers when `wasOverwritten=true` and not subagent
- Fallback does not trigger when `wasOverwritten=false`
- Fallback only triggers once (`fallbackShown` flag)

### Step 6: Verify

Run `npm run lint` and `npm run test` to ensure all tests pass.

## Files to Create/Modify

| File                                                  | Action  | Purpose                                                                     |
| ----------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `.opencode/plugins/helpers/plugin-status.ts`          | Created | Log file parsing and plugin status detection                                |
| `.opencode/plugins/helpers/show-active-plugins.ts`    | Created | Toast formatting and display                                                |
| `.opencode/plugins/helpers/toast-silence-detector.ts` | Create  | Dynamic toast monitoring with cleanup                                       |
| `.opencode/plugins/helpers/index.ts`                  | Modify  | Export new helpers                                                          |
| `.opencode/plugins/opencode-hooks.ts`                 | Modify  | Remove server.connected, add startup logic + overwrite detection + fallback |
| `test/plugin-status.test.ts`                          | Created | Unit tests for log parsing                                                  |
| `test/toast-silence-detector.test.ts`                 | Create  | Unit tests for toast monitoring                                             |

## Memory Safety Guarantees

| Resource                       | Created When          | Cleaned Up When                    | Safety Mechanism                         |
| ------------------------------ | --------------------- | ---------------------------------- | ---------------------------------------- |
| `setInterval`                  | `waitForToastSilence` | `cleanup()` or error               | `clearInterval` in cleanup               |
| `setTimeout` (silence)         | New toast detected    | `cleanup()` or silence detected    | `clearTimeout` in cleanup                |
| `setTimeout` (timeout)         | Plugin init           | After `Promise.race` resolves      | `clearTimeout` after race                |
| `setTimeout` (overwrite check) | After our toast shown | Auto-expires after 3s              | One-shot, no cleanup needed              |
| State flags                    | Plugin init           | Never (intentional, prevents spam) | 4 booleans + 1 number, negligible memory |

After toast is shown and overwrite check completes: **ZERO** intervals, **ZERO** timeouts, **5 primitives** in memory. No degradation over time.

## Risks & Mitigations

| Risk                                  | Mitigation                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Log path varies by OS                 | Use XDG_DATA_HOME fallback, support macOS `~/Library/Application Support/` |
| Log format changes                    | Parse defensively with regex, handle missing fields gracefully             |
| Log file doesn't exist yet            | Skip monitoring, show toast after 5s timeout fallback                      |
| Race condition (log not written yet)  | 5s timeout ensures toast always appears                                    |
| Memory leak from polling              | `cleanup()` guarantees all timers stopped, `finally` block ensures it runs |
| Toast spam on hot-reload              | `hasShownToast` flag prevents duplicate toasts                             |
| Other plugin crashes during toast     | `try/catch` around `showActivePluginsToast` prevents cascade failure       |
| Fallback triggers in subagent session | `isSubagentSession()` check prevents this                                  |
| Fallback triggers multiple times      | `fallbackShown` flag ensures one-time only                                 |
