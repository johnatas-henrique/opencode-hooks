import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '.opencode': path.resolve(__dirname, '.opencode'),
      test: path.resolve(__dirname, 'test'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
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
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90,
      },
    },
  },
});
