# Test Folder Restructuring Plan

**Created:** 2026-04-07 02:42
**Status:** Completed

## Execution

| Step                                                          | Status | Timestamp |
| ------------------------------------------------------------- | ------ | --------- |
| 1. Create test/unit/ and move unit tests from test/\*.test.ts | ⏳     | -         |
| 2. Keep test/integration/ in place (common pattern)           | ⏳     | -         |
| 3. Decide on benchmark and property tests                     | ⏳     | -         |
| 4. Keep test/e2e/ in place                                    | ⏳     | -         |
| 5. Update jest.config.js paths                                | ⏳     | -         |
| 6. Fix test imports (relative paths)                          | ⏳     | -         |
| 7. Run tests to verify                                        | ⏳     | -         |

## Current Structure

```
test/
├── *.test.ts              ← 17 unit tests (to move)
├── integration/           ← 1 integration test
├── benchmark/            ← 1 benchmark test (decision pending)
├── property/             ← 3 property tests (decision pending)
└── e2e/                  ← 2 shell scripts (keep)
```

## Target Structure

```
test/
├── unit/                 ← All unit tests
│   ├── *.test.ts
│   └── integration/     ← Integration tests here? (TBD)
├── e2e/                  ← Keep in place
└── benchmark/            ← Decision pending
└── property/             ← Decision pending
```

## Decision Pending

- **benchmark/** and **property/**: Remove or keep?
