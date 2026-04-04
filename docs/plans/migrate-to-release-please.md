## Execution

| Step                                           | Status | Timestamp |
| ---------------------------------------------- | ------ | --------- |
| 1. Research and construct plan                 | ⏳     | -         |
| 2. Create branch                               | ⏳     | -         |
| 3. Remove semantic-release from package.json   | ⏳     | -         |
| 4. Delete release.config.js                    | ⏳     | -         |
| 5. Delete custom-release-notes.js              | ⏳     | -         |
| 6. Update/remove .github/workflows/release.yml | ⏳     | -         |
| 7. Delete docs/release-please-example.md       | ⏳     | -         |
| 8. Create Release Please workflow              | ⏳     | -         |
| 9. Verify build and tests                      | ⏳     | -         |
| 10. Commit changes                             | ⏳     | -         |

---

## Overview

Remove Semantic Release and related configurations, then set up Release Please for automated versioning based on conventional commits.

---

## Current State

### Files to Remove

| File                             | Description                              |
| -------------------------------- | ---------------------------------------- |
| `release.config.js`              | Semantic Release configuration           |
| `custom-release-notes.js`        | Custom release notes generator           |
| `.github/workflows/release.yml`  | Semantic Release GitHub Actions workflow |
| `docs/release-please-example.md` | CHANGELOG documentation file             |

### package.json Dependencies to Remove

```json
"@semantic-release/commit-analyzer": "^13.0.1",
"@semantic-release/github": "^12.0.6",
"@semantic-release/release-notes-generator": "^14.1.0",
"semantic-release": "^25.0.3",
"conventional-changelog-conventionalcommits": "^9.3.1"
```

---

## Implementation Steps

### Step 1: Create Branch

```bash
git checkout -b refactor/migrate-to-release-please
```

### Step 2: Remove Semantic Release Dependencies

Edit `package.json` to remove:

- `@semantic-release/commit-analyzer`
- `@semantic-release/github`
- `@semantic-release/release-notes-generator`
- `semantic-release`
- `conventional-changelog-conventionalcommits`

### Step 3: Delete Release Files

```bash
rm release.config.js
rm custom-release-notes.js
rm .github/workflows/release.yml
rm docs/release-please-example.md
```

### Step 4: Create Release Please Workflow

**File:** `.github/workflows/release-please.yml`

```yaml
name: Release Please

on:
  push:
    branches:
      - main

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          release-type: node
          package-name: opencode-hooks
          default-branch: main
```

### Step 5: Verify

```bash
npm run lint
npm run test
npm run build
```

---

## Files to Modify

| File                                 | Action                               |
| ------------------------------------ | ------------------------------------ |
| package.json                         | Remove semantic-release dependencies |
| release.config.js                    | Delete                               |
| custom-release-notes.js              | Delete                               |
| .github/workflows/release.yml        | Delete                               |
| docs/release-please-example.md       | Delete                               |
| .github/workflows/release-please.yml | Create                               |

---

## How Release Please Works

1. **On push to main**: Release Please scans commits since last release
2. **Creates/updates PR**: Creates a "release-pr" PR with changelog
3. **Conventional commits**: Analyzes commit messages to determine version bump
   - `feat:` → minor version bump
   - `fix:` → patch version bump
   - `feat!:` or `BREAKING CHANGE:` → major version bump
4. **Merge release-pr**: When merged, creates GitHub release with tags

---

## Verification Commands

```bash
npm run lint
npm run test
npm run build
```

---

## Notes

- Release Please uses conventionalcommits automatically - no extra config needed
- The `default-branch` should match your main branch name
- Release Please will create a `CHANGELOG.md` automatically
- First run will create initial release (v0.1.0 or similar)
