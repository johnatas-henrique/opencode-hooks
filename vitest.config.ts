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
        '!test/**/*.ts',
        '!node_modules/**',
      ],
      exclude: ['**/types/**', '**/index.ts'],
      thresholds: {
        statements: 100,
        branches: 100,
        functions: 100,
        lines: 100,
      },
    },
  },
});
