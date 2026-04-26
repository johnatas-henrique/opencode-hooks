import fs from 'fs';
import path from 'path';
import type { PluginInput } from '@opencode-ai/plugin';
import { SCRIPTS_DIR } from '../../.opencode/plugins/core/constants';

// Unit test for validateScriptsDirectory logic (extracted from opencode-hooks.ts)
function validateScriptsDirectory(): void {
  const scriptsDir = path.join(process.cwd(), SCRIPTS_DIR);
  if (!fs.existsSync(scriptsDir) || !fs.statSync(scriptsDir).isDirectory()) {
    throw new Error(`Scripts directory not found: ${scriptsDir}`);
  }
}

describe('validateScriptsDirectory', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Reset to project root for tests
    process.chdir(originalCwd);
    vi.resetModules();
  });

  afterEach(() => {
    // Cleanup temp directories
    const tempDirs = ['test-temp', 'test-temp-file'];
    tempDirs.forEach((dir) => {
      const fullPath = path.join(originalCwd, dir);
      if (fs.existsSync(fullPath)) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      }
    });
  });

  it('should pass when .opencode/scripts exists', () => {
    // Assuming .opencode/scripts exists in project root (it does)
    expect(() => validateScriptsDirectory()).not.toThrow();
  });

  it('should throw when scripts directory does not exist', () => {
    // Temporarily change cwd to a temp location without scripts folder
    const tempDir = path.join(originalCwd, 'test-temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    process.chdir(tempDir);

    expect(() => validateScriptsDirectory()).toThrow(
      'Scripts directory not found'
    );
  });

  it('should throw when scripts path exists but is a file', () => {
    const tempDir = path.join(originalCwd, 'test-temp-file');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    // Create a file named 'scripts' instead of directory
    const scriptsFilePath = path.join(tempDir, 'scripts');
    fs.writeFileSync(scriptsFilePath, 'not a directory');
    process.chdir(tempDir);

    expect(() => validateScriptsDirectory()).toThrow(
      'Scripts directory not found'
    );
  });
});

describe('OpencodeHooks plugin startup validation', () => {
  const originalCwd = process.cwd();

  beforeEach(() => {
    process.chdir(originalCwd);
    vi.resetModules();
  });

  it('should throw during plugin initialization when scripts directory missing', async () => {
    // Create temp dir without .opencode/scripts
    const tempDir = path.join(originalCwd, 'test-temp-init');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    process.chdir(tempDir);

    // Dynamically import the plugin after changing cwd
    const { OpencodeHooks } =
      await import('../../.opencode/plugins/opencode-hooks');

    // Mock minimal PluginInput using Partial to avoid needing full structure
    const mockPluginInput = {
      client: {
        tui: {
          showToast: () => {},
        },
        config: {},
      },
    } as Partial<PluginInput> as PluginInput;

    // Should reject because scripts directory missing
    await expect(OpencodeHooks(mockPluginInput)).rejects.toThrow(
      'Scripts directory not found'
    );
  });

  it('should initialize successfully when scripts directory exists', async () => {
    // Change to project root where .opencode/scripts exists
    process.chdir(originalCwd);

    const { OpencodeHooks } =
      await import('../../.opencode/plugins/opencode-hooks');

    const mockPluginInput = {
      client: {
        tui: {
          showToast: () => {},
        },
        config: {},
      },
    } as Partial<PluginInput> as PluginInput;

    // Should not throw and return Hooks
    const hooks = await OpencodeHooks(mockPluginInput);
    expect(hooks).toBeDefined();
    expect(typeof hooks).toBe('object');
  });
});
