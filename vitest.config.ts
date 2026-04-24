import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['test/**/*.test.ts', '.opencode/plugins/**/*.test.ts'],
    exclude: ['test/e2e/**', '**/node_modules/**'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: [['text', { maxCols: 120 }], 'html', 'json'],
      reportsDirectory: 'coverage',
      reportOnFailure: true,
      include: [
        '.opencode/plugins/**/*.ts',
        '!/**/*.test.ts',
        '!node_modules/**',
        '!.opencode/plugins/types/**',
        '!**/index.ts',
      ],
      thresholds: {
        statements: 96,
        branches: 96,
        functions: 96,
        lines: 96,
      },
    },
  },
});
