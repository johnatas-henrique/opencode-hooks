# Professional Project Setup - Consolidated Plan

**Date:** 2026-04-04  
**Status:** Planning  
**Author:** Plan Agent

---

## Summary

Consolidation of three original plans for professional project setup with Release Please workflow.

---

## What Was Already Done (Manual Cleanup)

| Step | Description                               | Status | Timestamp  |
| ---- | ----------------------------------------- | ------ | ---------- |
| -    | Delete GitHub Releases (v0.1.0-v0.3.1)    | ✅     | 2026-04-04 |
| -    | Delete Git tags (local + remote)          | ✅     | 2026-04-04 |
| -    | Delete release.config.js                  | ✅     | 2026-04-04 |
| -    | Delete custom-release-notes.js            | ✅     | 2026-04-04 |
| -    | Delete .github/workflows/release.yml      | ✅     | 2026-04-04 |
| -    | Delete docs/release-please-example.md     | ✅     | 2026-04-04 |
| -    | Remove semantic-release from package.json | ✅     | 2026-04-04 |
| -    | Reset version to 0.0.0-dev-01             | ✅     | 2026-04-04 |
| -    | Git history rebase (manual)               | ✅     | 2026-04-04 |

---

## What Still Needs To Be Done (Execution Table)

| Step | Description                                | Status | Timestamp |
| ---- | ------------------------------------------ | ------ | --------- |
| 1.   | Clean package-lock.json (`npm install`)    | ⏳     | -         |
| 2.   | Create Release Please workflow             | ⏳     | -         |
| 3.   | Create release-please-config.json          | ⏳     | -         |
| 4.   | Add GitHub Issue templates (bug + feature) | ⏳     | -         |
| 5.   | Add GitHub PR template                     | ⏳     | -         |
| 6.   | Create codecov.yml                         | ⏳     | -         |
| 7.   | Update CI workflow with codecov            | ⏳     | -         |
| 8.   | Update README badges                       | ⏳     | -         |
| 9.   | Verify build, lint, tests                  | ⏳     | -         |
| 10.  | Commit and push                            | ⏳     | -         |
| 11.  | Create LICENSE file (MIT)                  | ⏳     | -         |
| 12.  | Create CODEOWNERS file                     | ⏳     | -         |
| 13.  | Create SECURITY.md file                    | ⏳     | -         |
| 14.  | Create CONTRIBUTING.md file                | ⏳     | -         |
| 15.  | Add Dependabot configuration               | ⏳     | -         |
| 16.  | Create .editorconfig file                  | ⏳     | -         |
| 17.  | Create .npmignore file                     | ⏳     | -         |
| 18.  | Update Files Summary section               | ⏳     | -         |

---

## Implementation Details

### Step 1: Clean package-lock.json

Run `npm install` to remove orphaned semantic-release dependencies from the lockfile.

### Step 2: Create Release Please Workflow

File: `.github/workflows/release-please.yml`

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

### Step 3: Create release-please-config.json

```json
{
  "packages": {
    ".": {
      "release-type": "node",
      "changelog-sections": [
        { "type": "feat", "section": "Features" },
        { "type": "fix", "section": "Bug Fixes" },
        { "type": "docs", "section": "Documentation" },
        { "type": "chore", "section": "Maintenance" }
      ]
    }
  }
}
```

### Step 4: Add GitHub Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md` with proper YAML frontmatter.

### Step 5: Add PR Template

Create `.github/pull_request_template.md` with sections for Summary, Changes, Testing, and Checklist.

### Step 6: Create codecov.yml

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

### Step 7: Update CI Workflow

Add codecov upload step to `.github/workflows/ci.yml`:

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

### Step 8: Update README Badges

Replace the existing coverage badge with Codecov badge:

```markdown
[![Codecov](https://codecov.io/gh/johnatas-henrique/opencode-hooks/branch/main/graph/badge.svg)](https://codecov.io/gh/johnatas-henrique/opencode-hooks)
```

### Step 9: Verify

Run: `npm run build && npm run lint && npm run test`

### Step 10: Commit and Push

Commit message following conventional commits format.

### Step 11: Create LICENSE File (MIT)

Create a standard MIT license file in the root directory. The file should contain the standard MIT license text with "[year]" replaced with 2026 and "[full name of author]" replaced with "Johnatas Henrique".

### Step 12: Create CODEOWNERS File

File: `.github/CODEOWNERS`

```bash
# Default owner
* @johnatas-henrique
```

### Step 13: Create SECURITY.md File

File: `.github/SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you find a security vulnerability, please report it privately to avoid exposing the issue publicly.

1. **Do NOT** open a public GitHub issue
2. Email: johnatas.henrique@gmail.com
3. Response time: Within 48 hours

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any fixes you suggest (optional)
```

### Step 14: Create CONTRIBUTING.md File

File: `CONTRIBUTING.md` in root:

````markdown
# Contributing to OpenCode Hooks

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository
2. Run `npm install`
3. Run `npm run build`

## Running Tests

```bash
npm run test
npm run test:ci
```
````

## Code Style

- ESLint + Prettier are enforced
- Use TypeScript with strict mode
- Follow existing patterns in the codebase

## Commit Messages

This project uses Conventional Commits. Format:

```
<type>: <description>

Types: feat, fix, docs, chore, refactor, test
```

Example: `feat: add new event handler for session.compacted`

## Pull Request Process

1. Create a feature branch
2. Make changes and ensure tests pass
3. Update documentation if needed
4. Submit PR with clear description

````


### Step 15: Add Dependabot Configuration

File: `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```


### Step 16: Create .editorconfig File

File: `.editorconfig` in root:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.ts]
indent_style = space
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

### Step 17: Create .npmignore File

File: `.npmignore` in root:

```
# Development
docs/
test/
scripts/
.github/
.editorconfig
.eslintrc.js
.prettierrc
tsconfig.json
jest.config.js
*.test.ts
*.spec.ts

# Build artifacts (keep dist/)
dist/node_modules/

# Logs
*.log
logs/

# OS
.DS_Store
Thumbs.db

# Coverage
coverage/
```

### Step 18: Update Files Summary

Update the Files Summary section at the end to include all new files.

---

## Files Summary

| Action | Files                                                                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create | release-please.yml, release-please-config.json, codecov.yml, 2 issue templates, PR template, LICENSE, CODEOWNERS, SECURITY.md, CONTRIBUTING.md, dependabot.yml, .editorconfig, .npmignore |
| Modify | package-lock.json, .github/workflows/ci.yml, README.md                                                                                                                                    |

---

## Notes

- Release Please will automatically create a PR on next push to main with changelog
- Merge that PR to trigger the release creation
- Register repo on codecov.io and add CODECOV_TOKEN to GitHub secrets
- Initial version will be determined by Release Please based on commit history
````
