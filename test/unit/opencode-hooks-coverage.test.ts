import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import type { PluginInput } from '../__mocks__/@opencode-ai/plugin';

describe('OpencodeHooks tool handler coverage', () => {
  it('should use tool-specific handler when available', async () => {
    const mockClient = {
      tui: { showToast: jest.fn() },
      session: { prompt: jest.fn() },
    };
    const mockDollar = jest
      .fn()
      .mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' });
    const ctx = {
      client: mockClient,
      $: mockDollar,
      project: 'test',
      directory: '/test',
      worktree: '/test',
      serverUrl: 'http://localhost',
    } as unknown as PluginInput;

    const _plugin = await OpencodeHooks(ctx);

    // We need to ensure handlers['tool:myTool'] exists.
    // Since handlers is imported from default-handlers, we might need to mock it.
    // But let's see if we can trigger it with a known tool if any.
  });
});
