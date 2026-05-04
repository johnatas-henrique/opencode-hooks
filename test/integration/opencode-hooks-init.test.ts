import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
  fs.mkdirSync(path.join(TEST_ROOT, '.opencode', 'scripts'), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(TEST_ROOT, '.opencode', 'scripts', 'test.sh'),
    'echo ok'
  );
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
  it('handles process.cwd() throwing in getCwdSafe', async () => {
    const originalCwd = process.cwd;
    process.cwd = () => {
      throw new Error('cwd-error');
    };

    try {
      await expect(OpencodeHooks(mockCtx())).rejects.toThrow(
        'Scripts directory not found'
      );
    } finally {
      process.cwd = originalCwd;
    }
  });
});
