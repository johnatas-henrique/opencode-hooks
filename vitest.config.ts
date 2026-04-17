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
      reporter: ['text', 'html', 'json'],
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
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
