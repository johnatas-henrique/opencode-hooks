# OpenCode Hooks - Consolidated Pending Items

**Created:** 2026-04-14 01:25  
**Updated:** 2026-04-14 01:40  
**Agent:** plan  
**Status:** Draft - Ready for Implementation

---

## Pending Items

### 1. File Templates para saveToFile

**Source:** From migration of `log-agent.sh` and `log-skill.sh` to data-only

**Problem:** Currently `saveToFile: true` only works when there's a script to generate output. Without scripts, we need a way to define what data to save.

**Proposed Schema:**

```typescript
interface FileTemplate {
  enabled: boolean;
  path: string;           // Supports: {eventType}, {date}, {sessionID}
  template: string;       // Supports: {input.tool}, {output.exit}, {properties.sessionID}, etc
  maxSize?: string;      // Optional: log rotation
}

// Example usage:
'session.created': {
  saveToFile: {
    enabled: true,
    path: 'logs/sessions/{date}.log',
    template: '[{timestamp}] Session: {info.id} | Title: {info.title}',
  },
},
```

**Decision Needed:** Replace `saveToFile: true` or make additive?

- Option A: `saveToFile: true` uses default template, `saveToFile: { template: '...' }` uses custom
- Option B: `saveToFile: true` stays as-is, `saveToFile: { template: '...' }` is new schema
- Option C: Remove `saveToFile: true`, only accept template object

### 2. Opinionated Base Config

**Source:** `2026-04-14_1030_refactoring_plan.md` - Step 7

Create a default configuration that works well out of the box with sensible defaults.

**Decision:** Option A - Comments/documentation in `settings.ts`

### 3. Improve Existing Scripts

**Source:** `2026-04-13_1545_scripts_reorganization.md` - Step 8

Add `set +e` proactively to remaining scripts to prevent failures on non-critical errors.

**Scripts to update:**

- `session-stop.sh` - check if has `set +e`
- `experimental-session-compacting.sh` - check if has `set +e`

---

## Execution

| Step | Description                                    | Status | Timestamp |
| ---- | ---------------------------------------------- | ------ | --------- |
| 1    | Mark old plans as discontinued                 | ⏳     | -         |
| 2    | Decide on file templates schema (Option A/B/C) | ⏳     | -         |
| 3    | Implement file templates for saveToFile        | ⏳     | -         |
| 4    | Add opinionated config comments to settings.ts | ⏳     | -         |
| 5    | Add `set +e` to remaining scripts              | ⏳     | -         |
| 6    | Build, lint, test                              | ⏳     | -         |

---

## Old Plans Status

| Plan                                               | Status                                  |
| -------------------------------------------------- | --------------------------------------- |
| `2026-04-14_1445_allowed-fields-implementation.md` | ✅ Completed                            |
| `2026-04-14_1030_refactoring_plan.md`              | ⚠️ Discontinued - partially implemented |
| `2026-04-13_1545_scripts_reorganization.md`        | ⚠️ Discontinued - partially implemented |

---

## Questions

1. **File Templates:** Which option (A, B, or C) for saveToFile schema?
2. **Order:** Should we do file templates first or opinionated config first?
