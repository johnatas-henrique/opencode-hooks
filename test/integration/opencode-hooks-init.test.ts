import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { OpencodeHooks } from '.opencode/plugins/opencode-hooks';
import type { PluginInput } from '@opencode-ai/plugin';

const TEST_ROOT = path.join(
  os.tmpdir(),
  'opencode-hooks-init-integration-test'
);

beforeAll(() => {
  if (fs.existsSync(TEST_ROOT)) {
    fs.rmSync(TEST_ROOT, { recursive: true });
  }
  fs.mkdirSync(TEST_ROOT, { recursive: true });
});

afterAll(() => {
  if (fs.existsSync(TEST_ROOT)) {
    fs.rmSync(TEST_ROOT, { recursive: true });
  }
});

function mockCtx(): PluginInput {
  return {
    client: {
      tui: { showToast: () => {} },
      session: { prompt: () => {} },
    },
  } as unknown as PluginInput;
}

describe('OpencodeHooks with real filesystem', () => {
  it('auto-creates the scripts directory if missing', async () => {
    const missingDir = path.join(TEST_ROOT, 'no-scripts-here');
    const originalCwd = process.cwd;
    process.cwd = () => missingDir;

    try {
      await OpencodeHooks(mockCtx());
      const scriptsDir = path.join(missingDir, '.opencode', 'scripts');
      expect(fs.existsSync(scriptsDir)).toBe(true);
      expect(fs.statSync(scriptsDir).isDirectory()).toBe(true);
    } finally {
      process.cwd = originalCwd;
    }
  });

  it('handles process.cwd() throwing in getCwdSafe', async () => {
    const origCwd = process.cwd;
    const origExistsSync = fs.existsSync;
    process.cwd = () => {
      throw new Error('cwd-error');
    };
    fs.existsSync = vi.fn(() => true);

    try {
      await OpencodeHooks(mockCtx());
    } finally {
      process.cwd = origCwd;
      fs.existsSync = origExistsSync;
    }
  });
});
