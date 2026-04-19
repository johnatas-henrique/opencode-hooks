import type { PluginInput } from '@opencode-ai/plugin';
import type { Mock } from 'vitest';
import { appendToSession } from '../../.opencode/plugins/features/messages/append-to-session';
import { MAX_PROMPT_LENGTH } from '../../.opencode/plugins/core/constants';

describe('append-to-session', () => {
  let mockCtx: PluginInput;

  beforeEach(() => {
    mockCtx = {
      client: {
        session: {
          prompt: vi.fn().mockResolvedValue(undefined),
        },
      },
    } as unknown as PluginInput;
  });

  it('should call session.prompt with truncated text when exceeding max length', async () => {
    const longText = 'a'.repeat(MAX_PROMPT_LENGTH + 100);
    await appendToSession(mockCtx, 'session-123', longText);

    expect((mockCtx.client.session.prompt as Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        path: { id: 'session-123' },
        body: {
          noReply: true,
          parts: [
            { type: 'text', text: expect.stringContaining('[truncated]') },
          ],
        },
      })
    );
  });

  it('should call session.prompt with empty output', async () => {
    await appendToSession(mockCtx, 'session-789', '');

    expect((mockCtx.client.session.prompt as Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        path: { id: 'session-789' },
        body: {
          noReply: true,
          parts: [{ type: 'text', text: '' }],
        },
      })
    );
  });
});
