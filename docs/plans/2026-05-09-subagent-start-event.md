# SubagentStart Event Mapping

## Goal

Create `SubagentStart` Claude Code hook event support by mapping it to
`tool.execute.before.subagent` in OpenCode Hooks.

## Context

- OpenCode SDK fires `tool.execute.before` for all tool calls.
- When the tool is `task` with `args.subagent_type`, it means a subagent is being started.
- Claude Code has a native `SubagentStart` event — we map it the same way
  we already map `SubagentStop` → `tool.execute.after.subagent`.

## Changes

### `.claude/hooks/log-agent.sh` — NEW

Raw script from Donchitos/Claude-Code-Game-Studios.
Reads `agent_type` from stdin → logs to `production/session-logs/agent-audit.log`.

### `.claude/settings.json` — MODIFY

Add `SubagentStart` block that triggers log-agent.sh on subagent start.

### `claude-settings.ts` — MODIFY

Add `SubagentStart: 'tool.execute.before.subagent'` to `CLAUDE_EVENT_MAP`.

### `executor.ts` — MODIFY (2 places)

1. Add `'tool.execute.before.subagent': 'SubagentStart'` to `EVENT_NAME_MAP`
2. `buildClaudeStdin`: add `agent_type` + `description` for `SubagentStart`
3. `buildOpencodeStdin`: add `agent_type` + `description` for `tool.execute.before.subagent`

### `opencode-hooks.ts` — MODIFY

Route `tool.execute.before` when `tool === 'task'` + `subagent_type` → `tool.execute.before.subagent`.
Enrich input with `subagentType` and `description`.

### `events-catalog.md` — MODIFY

Add `tool.execute.before.subagent` entry.

### `docs/compatibility/claude-code-hooks-compatibility.md` — MODIFY

- `SubagentStart`: ❌ → ✅
- Add stdin fields: `agent_type`, `description`
- Note: `model` not yet available (not in SDK tool events)

## Fields not yet supported

- `model` — not available in `tool.execute.before` SDK event.
  Only exists in `chat.params` / `chat.message` events.
  Future: cache model per session from those events.
