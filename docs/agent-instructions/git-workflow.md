# Git Workflow & Release

## Branch Workflow

- Always create a new branch before making changes
- Use `gh` CLI for GitHub interactions (PRs, issues, CI)
- Commit author: `Johnatas Henrique <johnatas.henrique@gmail.com>`

## Commit Conventions

- Use Conventional Commits format: `type: description`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `ci`, `build`
- Plans in `plans/` must be written in English with timestamps

## Release Process

1. Merge feature branch to main via PR
2. Bump version in `package.json` (semver: feat=MINOR, fix=PATCH, BREAKING=MAJOR)
3. Commit version bump via PR
4. Tag release: `git tag v0.1.0 && git push origin v0.1.0`
5. Create release: `gh release create v0.1.0 --title "v0.1.0" --notes-file RELEASE_NOTES.md`
