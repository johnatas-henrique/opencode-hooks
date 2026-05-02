import fs from 'fs';
import path from 'path';
import type { PluginInput } from '@opencode-ai/plugin';

describe('OpencodeHooks plugin startup validation', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    try {
      process.chdir(originalCwd);
    } catch {
      process.chdir('/');
    }
    vi.resetModules();
  });

  afterEach(() => {
    try {
      process.chdir(originalCwd);
    } catch {
      process.chdir('/');
    }
  });

  it('should throw during plugin initialization when scripts directory missing', async () => {
    const tempDir = path.join(originalCwd, 'test-temp-init');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    process.chdir(tempDir);

    const { OpencodeHooks } = await import('.opencode/plugins/opencode-hooks');

    const mockPluginInput = {
      client: {
        tui: {
          showToast: () => {},
        },
        config: {},
      },
    } as Partial<PluginInput> as PluginInput;

    await expect(OpencodeHooks(mockPluginInput)).rejects.toThrow(
      'Scripts directory not found'
    );
  });
});
