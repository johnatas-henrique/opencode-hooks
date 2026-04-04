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
