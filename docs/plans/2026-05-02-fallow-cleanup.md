# Fallow Cleanup Plan — OpenCode Hooks

## Overview

Based on `fallow` analysis (v2.62.0) run on 2026-05-02:

- **Dead Code**: 235 issues (8 unused files, 2 unused exports, 223 unresolved imports, 1 unused dev dependency, 1 unlisted dependency)
- **Duplication**: 10.7% (36 clone groups, 1,013 duplicated lines)
- **Health**: 1 function above threshold, avg MI 95.4 (good)

---

## Phase 1: Dead Code

### 1.1 Delete Unused Files (8 files)

- `docs/testing/examples/user-events.config.test.ts`
- `scripts/find-duplicates.js`
- `test/__mocks__/fs-promises.js`
- `test/__mocks__/fs.ts`
- `test/__mocks__/plugin.ts`
- `test/__mocks__/user-config.ts`
- `test/integration/smoke-tool-handlers.ts`
- `test/smoke-test.ts`

### 1.2 Fix Unused Exports (2 exports)

- `test/helpers/create-config.ts` — `createAuditConfig`
- `test/helpers/test-cleanup.ts` — `createTempAuditDir`

### 1.3 Review Unresolved Imports (223 occurrences)

- Investigate if these are Vitest mocks or test configuration
- Adjust if needed or add suppressions

### 1.4 Dependencies

- Remove unused dev dependency
- Add unlisted dependency (`fallow` already in package.json)

---

## Phase 2: Duplication (10.7%)

### 2.1 Extract Shared Test Configurations

Create `test/helpers/test-configs.ts` with base configs (duplicated across 5+ files):

- Audit config
- Core config
- Scripts config
- Toast/disabled configs

### 2.2 Reduce Duplication in Integration Tests

- `test/integration/core/debug.test.ts` + `test/integration/messages/show-startup-toast.test.ts` — extract config setup
- `test/integration/events/context.test.ts` — extract duplicated context setup
- `test/integration/messages/show-startup-toast.test.ts` — extract duplicated mock setups

### 2.3 Clean Example File

- `docs/testing/examples/user-events.config.test.ts` — remove (already in 1.1) or extract duplicated config

---

## Phase 3: Complexity (Health)

### 3.1 Function Above Threshold

- Identify and refactor the 1 function above threshold
- Current score: 95.4 (good) — maintain

---

## Execution Order

1. **Phase 1.1** — Delete dead files (highest impact)
2. **Phase 1.2** — Fix unused exports
3. **Phase 2.1 + 2.2** — Extract shared configs (significantly reduces dupes)
4. **Phase 1.3** — Review unresolved imports
5. **Phase 3.1** — Refactor complex function
6. **Phase 1.4** — Clean dependencies

---

## Progress Tracking Commands

```bash
# During cleanup
./node_modules/.bin/fallow --summary

# At the end
./node_modules/.bin/fallow          # All should pass
./node_modules/.bin/fallow audit     # Quality gate
```

---

## Success Criteria

- [ ] Dead code: 0 issues
- [ ] Duplication: < 5%
- [ ] Health: 0 functions above threshold
- [ ] `fallow audit` passes
