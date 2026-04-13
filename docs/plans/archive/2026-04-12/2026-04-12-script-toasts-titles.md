## Execution

| Step                                                                         | Status | Timestamp |
| ---------------------------------------------------------------------------- | ------ | --------- |
| 1. Add outputTitle and errorTitle to ScriptToastsConfig interface            | ⏳     | -         |
| 2. Add outputTitle and errorTitle to user-events.config.ts defaults          | ⏳     | -         |
| 3. Update opencode-hooks.ts to use outputTitle/errorTitle in toast rendering | ⏳     | -         |
| 4. Run build, lint, and tests                                                | ⏳     | -         |

---

## Plan: Add Custom Titles for Script Output and Error Toasts

### Problem

Currently, script toasts (output and error) use the handler's `toastTitle`, which doesn't allow differentiating between:

- Regular tool toasts
- Script output toasts (successful scripts)
- Script error toasts (failed scripts)

### Solution

Add `outputTitle` and `errorTitle` fields to `ScriptToastsConfig` as REQUIRED fields (not optional):

1. **Update `config.ts`**: Add `outputTitle: string` and `errorTitle: string` to `ScriptToastsConfig` interface (REQUIRED, not optional)

2. **Update `user-events.config.ts`**: Add required titles:

   ```ts
   scriptToasts: {
     showOutput: true,
     showError: true,
     outputVariant: 'info',
     errorVariant: 'error',
     outputDuration: TOAST_DURATION.FIVE_SECONDS,
     errorDuration: TOAST_DURATION.FIFTEEN_SECONDS,
     outputTitle: 'Script Output',      // REQUIRED
     errorTitle: 'Script Error',        // REQUIRED
   },
   ```

3. **Update `opencode-hooks.ts`**: Use the new titles when rendering toasts:
   - For successful scripts: use `scriptToasts.outputTitle`
   - For error scripts: use `scriptToasts.errorTitle`
   - Remove fallback to `toastTitle` since fields are now required

### Files to Modify

- `.opencode/plugins/helpers/config.ts`
- `.opencode/plugins/helpers/user-events.config.ts`
- `.opencode/plugins/opencode-hooks.ts`

### Why Required Fields

- Forces user to always provide titles (no forgotten fields)
- Simplifies tests since there are no optional fallbacks to handle
- More explicit and maintainable code
