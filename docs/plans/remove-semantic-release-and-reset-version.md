## Execution

| Step                                    | Status | Timestamp |
| --------------------------------------- | ------ | --------- |
| 1. Research and construct plan          | ⏳     | -         |
| 2. Delete GitHub releases and tags      | ⏳     | -         |
| 3. Set version to 0.0.1 in package.json | ⏳     | -         |
| 4. Remove semantic-release files        | ⏳     | -         |
| 5. Clean package.json dependencies      | ⏳     | -         |
| 6. Clean git history (rebase)           | ⏳     | -         |
| 7. Verify build and tests               | ⏳     | -         |
| 8. Commit changes                       | ⏳     | -         |

---

## Overview

Remove Semantic Release completely, reset version to 0.0.1, delete all GitHub releases/tags, and clean git history.

---

## Current State

### GitHub Releases (deleted)

- v0.1.0, v0.2.0, v0.3.0, v0.3.1

### Git Tags (deleted)

- v0.1.0, v0.2.0, v0.3.0, v0.3.1

### Files to Remove

- `release.config.js`
- `custom-release-notes.js`
- `.github/workflows/release.yml`
- `docs/release-please-example.md`

### Dependencies to Remove from package.json

- `@semantic-release/commit-analyzer`
- `@semantic-release/github`
- `@semantic-release/release-notes-generator`
- `semantic-release`
- `conventional-changelog-conventionalcommits`

---

## Implementation Steps

### Step 1: Delete GitHub Releases and Tags

```bash
gh release delete v0.1.0 --yes
gh release delete v0.2.0 --yes
gh release delete v0.3.0 --yes
gh release delete v0.3.1 --yes

git tag -d v0.1.0 v0.2.0 v0.3.0 v0.3.1
git push origin --delete v0.1.0 v0.2.0 v0.3.0 v0.3.1
```

### Step 2: Reset to version 0.0.1

Edit `package.json`:

```json
"version": "0.0.1"
```

### Step 3: Remove Files

```bash
rm release.config.js
rm custom-release-notes.js
rm .github/workflows/release.yml
rm docs/release-please-example.md
```

### Step 4: Clean Dependencies

Remove from package.json devDependencies:

- semantic-release packages
- conventional-changelog

### Step 5: Clean Git History

Reset to commit before semantic-release was added:

```bash
git reset --hard 1d2bb96
```

Then cherry-pick commits after that (excluding semantic-release related ones).

### Step 6: Verify

```bash
npm run lint
npm run test
npm run build
```

---

## Files to Modify

| File                           | Action                                       |
| ------------------------------ | -------------------------------------------- |
| package.json                   | Update version to 0.0.1, remove dependencies |
| release.config.js              | Delete                                       |
| custom-release-notes.js        | Delete                                       |
| .github/workflows/release.yml  | Delete                                       |
| docs/release-please-example.md | Delete                                       |

---

## Post-Cleanup: Add Release Please

After this plan is complete, run the "migrate-to-release-please" plan to set up Release Please.
