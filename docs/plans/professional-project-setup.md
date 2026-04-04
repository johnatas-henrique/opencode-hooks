# Professional Project Setup Plan

**Date:** 2026-04-04  
**Status:** Planning  
**Author:** Plan Agent

---

## Summary

Transform opencode-hooks into a professional-grade open source project with standardized release workflow, commit conventions, and CI/CD best practices.

---

## Execution

| Step | Description                               | Status |
| ---- | ----------------------------------------- | ------ |
| 1.   | Historical cleanup (rebase + delete tags) | ⏳     |
| 2.   | Configure Release Please                  | ⏳     |
| 3.   | Add GitHub templates (Issue + PR)         | ⏳     |
| 4.   | Configure Codecov                         | ⏳     |
| 5.   | Update README badges                      | ⏳     |
| 6.   | Verify and push                           | ⏳     |

---

## Step 1: Historical Cleanup (Rebase + Delete Tags)

### 1.1 Current State

**30 commits** from initial setup to current HEAD  
**4 tags:** v0.1.0, v0.2.0, v0.3.0, v0.3.1  
**1 release file:** RELEASE_NOTES.md

### 1.2 Rebase Strategy Options

**Option A: Full Interactive Rebase (Recommended)**

```bash
git rebase -i HEAD~30
```

Squash commits into ~7 meaningful atomic commits following Conventional Commits.

**Option B: Soft Reset (Simpler)**

```bash
git reset --soft HEAD~30
git commit -m "feat: complete initial implementation of opencode-hooks"
```

Single commit with all changes.

### 1.3 Delete Tags

```bash
# Local
git tag -d v0.1.0 v0.2.0 v0.3.0 v0.3.1

# Remote
git push --delete origin v0.1.0 v0.2.0 v0.3.0 v0.3.1
```

### 1.4 Manual Cleanup Required

- Delete GitHub Releases via GitHub UI
- Delete RELEASE_NOTES.md file

---

## Step 2: Configure Release Please

### 2.1 Create Workflow

**File:** `.github/workflows/release-please.yml`

```yaml
name: Release Please
on:
  push:
    branches: [main]
permissions:
  contents: write
jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - id: changesets
        uses: GoogleCloudPlatform/release-please-action@v4
        with:
          release-type: node
          package-name: opencode-hooks
```

### 2.2 Create Configuration

**File:** `release-please-config.json`

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "docs", "section": "Documentation" }
      ]
    }
  }
}
```

### 2.3 Remove Semantic Release

- Remove `@semantic-release/*` from package.json
- Delete `.github/workflows/release.yml`

---

## Step 3: Add GitHub Templates

### 3.1 Files to Create

| File                                        | Description             |
| ------------------------------------------- | ----------------------- |
| `.github/ISSUE_TEMPLATE/bug_report.md`      | Bug report form         |
| `.github/ISSUE_TEMPLATE/feature_request.md` | Feature request form    |
| `.github/pull_request_template.md`          | PR description template |

---

## Step 4: Configure Codecov

### 4.1 Create Configuration

**File:** `codecov.yml`

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 1%
comment:
  layout: 'reach,diff,flags,files,footer'
```

### 4.2 Update CI Workflow

Add codecov upload step to `.github/workflows/ci.yml`:

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

---

## Step 5: Update README Badges

**Replace line 6:**

```markdown
# FROM

[![Coverage](./coverage/badge-lines.svg)]

# TO

[![Codecov](https://codecov.io/gh/johnatas-henrique/opencode-hooks/branch/main/graph/badge.svg)](https://codecov.io/gh/johnatas-henrique/opencode-hooks)
```

---

## Step 6: Verify and Push

```bash
# Verify
npm run build && npm run lint && npm run test:ci

# Force push (rewrites history - safe since only 1 contributor)
git push --force-with-lease origin main

# Register repo on codecov.io and add CODECOV_TOKEN to GitHub secrets
```

---

## Questions Before Execution

1. **Rebase approach:** Full interactive rebase (7 atomic commits) OR soft reset (single commit)?
2. **First version:** Should first release be `v0.1.0` or `v1.0.0`?
3. **Codecov token:** Want to register now or skip for now?

---

## Files Summary

| Action | Files                                                                                       |
| ------ | ------------------------------------------------------------------------------------------- |
| Create | release-please.yml, release-please-config.json, codecov.yml, 2 issue templates, PR template |
| Modify | package.json (remove semantic-release), ci.yml (add codecov), README.md (badge)             |
| Delete | release.yml, RELEASE_NOTES.md, 4 tags                                                       |
