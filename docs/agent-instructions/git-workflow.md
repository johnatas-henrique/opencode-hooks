# Git Workflow & Release

## Branch Workflow

- Always create a new branch before making changes
- Use `gh` CLI for GitHub interactions (PRs, issues, CI)
- Commit author: `Johnatas Henrique <johnatas.henrique@gmail.com>`

## Commit Conventions

- Use Conventional Commits format: `type: description`
- Always make atomic commits with clear messages
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `style`, `ci`, `build`
- Plans in `docs/plans/` must be written in English with timestamps

## Release Process

1. Merge feature branch to main via PR
2. We use release-please GitHub Action to automate releases
3. Release-please creates a PR with the new version, bump version in package.json and changelog after merging to main
4. Review and ask user to merge the release-please PR to publish the new version, NEVER merge it yourself
