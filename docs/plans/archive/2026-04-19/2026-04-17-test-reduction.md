# Plan: Test Suite Reduction

**Goal**: Reduce test count from 344 to minimum without regressing coverage.

---

## Context

- **Current**: 344 test files
- **Target**: Remove redundant tests while maintaining 100% coverage
- **Stack**: Jest 30 + ts-jest + TypeScript

---

## Phase 1: Baseline

| Step | Action                                                                  | Status |
| ---- | ----------------------------------------------------------------------- | ------ |
| 1.1  | Run full suite with coverage                                            | ⏳     |
| 1.2  | Save `coverage/coverage-final.json` → `coverage/coverage-baseline.json` | ⏳     |
| 1.3  | Record baseline metrics (Stmts, Branch, Funcs, Lines)                   | ⏳     |
| 1.4  | Add `coverageProvider: 'v8'` to jest.config                             | ⏳     |

---

## Phase 2: Coverage-per-Test Analysis

| Step | Action                                         | Status |
| ---- | ---------------------------------------------- | ------ |
| 2.1  | Create `scripts/analyze-coverage.ts`           | ⏳     |
| 2.2  | Run each test file in isolation, save coverage | ⏳     |
| 2.3  | Build line-to-test mapping                     | ⏳     |
| 2.4  | Calculate exclusive coverage per test file     | ⏳     |
| 2.5  | Generate `coverage-redundancy-report.json`     | ⏳     |

---

## Phase 3: Filter Protected Tests

**NEVER remove** tests matching:

- Name contains: `regression`, `bug`, `fix`, `GH-`, `JIRA-`
- Only test for critical module
- Has `// @keep` comment

| Step | Action                        | Status |
| ---- | ----------------------------- | ------ |
| 3.1  | Parse candidates from Phase 2 | ⏳     |
| 3.2  | Apply exclusion filters       | ⏳     |
| 3.3  | Update candidates list        | ⏳     |

---

## Phase 4: Batch Removal with Validation

| Batch | Candidates  | Action              | Validation       | Status |
| ----- | ----------- | ------------------- | ---------------- | ------ |
| 4.1   | First 30    | Move to `_removed/` | Compare coverage | ⏳     |
| 4.2   | Next 30     | Move to `_removed/` | Compare coverage | ⏳     |
| 4.n   | Continue... | ...                 | ...              | ⏳     |

**Rule**: Revert entire batch if ANY metric decreases.

---

## Phase 5: Final Report

Deliver:

- [ ] Tests before: 344
- [ ] Tests after: X
- [ ] Tests removed: Y
- [ ] Coverage comparison table
- [ ] Confirmation: "No coverage regression"
- [ ] List of removed files with justification

---

## Execution Log

| Phase | Status  | Completed |
| ----- | ------- | --------- |
| 1     | Pending | -         |
| 2     | Pending | -         |
| 3     | Pending | -         |
| 4     | Pending | -         |
| 5     | Pending | -         |
