# Testing Guidelines

## Jest Setup

- Test files live in `test/` with `.test.ts` suffix
- Use `jest.fn()` for mocks; place shared mocks in `test/__mocks__/`
- Reset shared state with `beforeEach` (e.g., `resetGlobalToastQueue()`)
- Test tsconfig uses `commonjs` module (not `nodenext`)

## Coverage Thresholds

- 80% statements
- 60% branches
- 65% functions

## Mocking Patterns

- Mock `config/settings.ts` and `features/messages/default-handlers.ts` in tests that use `features/events/`
- Use `jest.resetModules()` + `jest.doMock()` for per-test config overrides
- Mock `@opencode-ai/plugin` and `@opencode-ai/sdk` via `test/__mocks__/`

## Running Tests

```bash
npm run test               # Run all tests
npm run test:unit          # Run unit tests
npm run test:ci            # Run with coverage
npm run coverage           # Full coverage report
npm run coverage:report    # Text-summary only
```

### Single Test

```bash
NODE_OPTIONS='--experimental-vm-modules' npx jest test/unit/handlers.test.ts --forceExit
NODE_OPTIONS='--experimental-vm-modules' npx jest -t "session.created" --forceExit
```
