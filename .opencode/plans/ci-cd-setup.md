# Plan: CI/CD Setup with Semantic Release

**Created:** 2026-04-04 13:15 UTC  
**Author:** Johnatas Henrique  
**Goal:** Add GitHub Actions CI and Semantic Release for automated versioning

---

## Execution

| Step                           | Status | Timestamp            |
| ------------------------------ | ------ | -------------------- |
| 1. Research and construct plan | ✅     | -                    |
| 2. Create branch               | ✅     | 2026-04-04 13:18 UTC |
| 3. Implement CI workflow       | ✅     | 2026-04-04 13:19 UTC |
| 4. Configure Semantic Release  | ✅     | 2026-04-04 13:20 UTC |
| 5. Add LICENSE file            | ✅     | 2026-04-04 13:21 UTC |
| 6. Update package.json         | ✅     | 2026-04-04 13:22 UTC |
| 7. Add badges to README        | ✅     | 2026-04-04 13:23 UTC |
| 8. Verify all tests pass       | ✅     | 2026-04-04 13:24 UTC |

---

## Overview

This plan adds professional CI/CD workflows to the project:

1. **GitHub Actions CI** - runs lint, tests, and build on every PR
2. **Semantic Release** - automatic versioning based on conventional commits
3. **LICENSE** - add MIT license file
4. **Badges** - status indicators in README

Currently the project has no CI/CD - commits are merged without validation.

---

## Current State

| Item                 | Status       |
| -------------------- | ------------ |
| GitHub Actions       | Not exists   |
| Semantic Release     | Not exists   |
| LICENSE file         | Not exists   |
| CI Badges in README  | Not exists   |
| Conventional Commits | Already done |

---

## Implementation Details

### Step 1: Create GitHub Actions CI Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

      - name: Run tests
        run: npm run test:ci

      - name: Build TypeScript
        run: npm run build
```

**Why:** Validates every PR before merge - prevents broken code in main.

---

### Step 2: Configure Semantic Release

**File:** `release.config.js`

```javascript
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
  ],
};
```

**Why:** Automatic versioning based on conventional commits. Creates GitHub tags and CHANGELOG.

**Note:** Not publishing to npm yet - only versioning locally and creating GitHub releases.

---

### Step 3: Add Release Workflow

**File:** `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      issues: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run build

      - uses: semantic-release/github@v9
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Why:** Runs semantic release on every merge to main.

---

### Step 4: Add LICENSE File

**File:** `LICENSE` (MIT)

Copied from https://opensource.org/licenses/MIT with:

- Author: Johnatas Henrique
- Year: 2026

**Why:** Required for proper open source distribution.

---

### Step 5: Update package.json

**Changes:**

1. Update author name and email
2. Add repository field
3. Add keywords
4. Add funding field

---

### Step 6: Add Badges to README

**After CI is working, add to README.md:**

```markdown
[![CI](https://github.com/johnatas-henrique/opencode-hooks/actions/workflows/ci.yml/badge.svg)](https://github.com/johnatas-henrique/opencode-hooks/actions)
[![npm version](https://img.shields.io/npm/v/opencode-hooks.svg)](https://www.npmjs.com/package/opencode-hooks)
[![license](https://img.shields.io/npm/l/opencode-hooks.svg)](LICENSE)
```

**Why:** Visual status indicators, looks professional.

---

## How It Will Work

### Current Flow:

```
You make PR -> merge -> manual version bump -> done
```

### New Flow:

```
You make PR -> GitHub Actions runs CI -> if pass, merge
        |
        v
GitHub Actions triggers on main push
        |
        v
Semantic Release analyzes commits since last tag
        |
        v
Decides: patch/minor/major based on conventional commits
        |
        v
Creates GitHub tag v0.3.0 + Release + CHANGELOG
```

### Version Decision Example:

| Commit Type     | Example          | Version Bump           |
| --------------- | ---------------- | ---------------------- |
| feat            | feat: add login  | minor (0.2.0 -> 0.3.0) |
| fix             | fix: resolve bug | patch (0.2.0 -> 0.2.1) |
| BREAKING CHANGE | in commit body   | major (0.2.0 -> 1.0.0) |
| docs/chore/test | any              | no version change      |

---

## Prerequisites

1. **GitHub Token:** Automatic (GITHUB_TOKEN) - no setup needed
2. **npm token:** Not needed now (not publishing to npm yet)

---

## After This Plan

When ready to publish to npm:

1. Add @semantic-release/npm plugin
2. Create npm token in GitHub secrets
3. Add NPM_TOKEN secret
4. Change release.config.js to include npm plugin

---

## Files to Create/Modify

| File                          | Action |
| ----------------------------- | ------ |
| .github/workflows/ci.yml      | Create |
| .github/workflows/release.yml | Create |
| release.config.js             | Create |
| LICENSE                       | Create |
| package.json                  | Modify |
| README.md                     | Modify |

---

## Verification

After implementation:

1. npm run lint passes
2. npm run test passes
3. npm run build passes
4. npm run format:check passes

Then push to main and verify: 5. GitHub Actions runs on PR 6. Semantic release creates tag on merge
