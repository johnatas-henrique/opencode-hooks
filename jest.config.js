module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/test', '<rootDir>/.opencode/plugins'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@opencode-ai/plugin$': '<rootDir>/test/__mocks__/plugin.ts',
    '^@opencode-ai/sdk$': '<rootDir>/test/__mocks__/sdk.ts',
    '^fs/promises$': '<rootDir>/test/__mocks__/fs-promises.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
  },
  clearMocks: true,
  fakeTimers: {
    enableGlobally: false,
  },
  detectOpenHandles: true,
  collectCoverageFrom: [
    '.opencode/plugins/opencode-hooks.ts',
    '.opencode/plugins/**/*.ts',
    '!/**/*.test.ts',
    '!node_modules/**',
    '!.opencode/plugins/types/**',
  ],
  coverageThreshold: {
    global: { statements: 80, branches: 60, functions: 65, lines: 80 },
  },
};
