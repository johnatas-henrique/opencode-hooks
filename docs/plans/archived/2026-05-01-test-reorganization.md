# Test Reorganization Plan

## Date

2026-05-01

## Coverage Baseline (MUST NOT CHANGE)

- Statements: 99.06% (1379/1392)
- Branches: 97.09% (1004/1034)
- Functions: 99.33% (299/301)
- Lines: 99.31% (1309/1318)

## Goals

1. Fix inconsistent file names
2. Move misplaced test files
3. Join duplicate test files for same source code
4. Improve test cohesion (describe/it structure)

---

## Actions

### A) Rename Files (9)

| #   | From                                                                  | To                                                         |
| --- | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | test/unit/features/events/events.test.ts                              | test/unit/features/events/resolvers/event-resolver.test.ts |
| 2   | test/unit/features/events/events.get-tool-handler.test.ts             | test/unit/features/events/get-tool-handler.test.ts         |
| 3   | test/unit/features/events/events.context.test.ts                      | test/unit/features/events/context.test.ts                  |
| 4   | test/unit/features/events/resolution/resolution.boolean-field.test.ts | test/unit/features/events/resolution/boolean-field.test.ts |
| 5   | test/unit/features/events/resolution/resolution.tool-config.test.ts   | test/unit/features/events/resolvers/tool-config.test.ts    |
| 6   | test/unit/features/events/resolution/toast-resolution.test.ts         | test/unit/features/events/resolution/toast.test.ts         |
| 7   | test/unit/features/events/resolvers/resolution.event-config.test.ts   | test/unit/features/events/resolvers/event-config.test.ts   |
| 8   | test/unit/opencode-hooks/opencode-hooks-enabled-coverage.test.ts      | test/unit/opencode-hooks/enabled-coverage.test.ts          |
| 9   | test/unit/opencode-hooks/opencode-hooks-specialized-coverage.test.ts  | test/unit/opencode-hooks/specialized-coverage.test.ts      |

### B) Move File (1)

| #   | From                                       | To                                                   |
| --- | ------------------------------------------ | ---------------------------------------------------- |
| 10  | test/unit/features/scripts/scripts.test.ts | test/unit/features/events/resolution/scripts.test.ts |

### C) Join Files (1)

| #   | Files                                                  | New File              |
| --- | ------------------------------------------------------ | --------------------- |
| 11  | plugin-status.test.ts + plugin-status-coverage.test.ts | plugin-status.test.ts |

### D) Fix Cohesion (7)

| #   | File                                         | Issue                   | Fix                                                              |
| --- | -------------------------------------------- | ----------------------- | ---------------------------------------------------------------- |
| 12  | truncate.test.ts                             | Only 1 it()             | Move to message-formatter directory                              |
| 13  | mask-sensitive.test.ts                       | Only 1 it()             | Merge into build-keys-message.test.ts                            |
| 14  | show-active-plugins.test.ts                  | 2 separate describes    | Rename describes for clarity                                     |
| 15  | toast-silence-detector.test.ts               | 2 functions in one file | Split into wait-for-toast-silence.test.ts + count-toasts.test.ts |
| 16  | plugin-status.test.ts                        | Nested describes        | Flatten structure                                                |
| 17  | message-formatter.build-keys-message.test.ts | Long name               | Rename to build-keys-message.test.ts                             |
| 18  | message-formatter.get-value-by-path.test.ts  | Long name               | Rename to get-value-by-path.test.ts                              |

---

## Verification

After all changes:

- [ ] npm run lint passes
- [ ] npm run build passes
- [ ] npm run test:cov matches baseline (99.06% / 97.09% / 99.33% / 99.31%)
