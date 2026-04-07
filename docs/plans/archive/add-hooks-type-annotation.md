# Plan: Add Hooks Type Annotation to Plugin Return

## Execution

| Step                                           | Status | Timestamp        |
| ---------------------------------------------- | ------ | ---------------- |
| 1. Add Hooks import to opencode-hooks.ts       | ✅     | 2026-04-06 16:30 |
| 2. Add explicit return type to plugin function | ✅     | 2026-04-06 16:30 |
| 3. Run build and tests to verify               | ✅     | 2026-04-06 16:30 |

---

## Overview

Add explicit `Hooks` type annotation to the plugin return for better documentation and type visibility.

## Changes

### File: `.opencode/plugins/opencode-hooks.ts`

1. **Add Hooks import** (line 1-2):

   ```typescript
   import type { Plugin, PluginInput, Hooks } from '@opencode-ai/plugin';
   ```

2. **Add explicit return type** (line 28):
   ```typescript
   export const OpencodeHooks: Plugin = async (ctx: PluginInput): Promise<Hooks> => {
   ```

---

## Verification

Run after changes:

- `npm run build`
- `npm run lint`
- `npm run test:unit`
