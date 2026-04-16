import { appendToSession } from '../../.opencode/plugins/features/messages/append-to-session';
import { MAX_PROMPT_LENGTH } from '../../.opencode/plugins/core/constants';

describe('append-to-session', () => {
  let mockClient: { session: { prompt: jest.Mock } };

  beforeEach(() => {
    mockClient = {
      session: {
        prompt: jest.fn().mockResolvedValue(undefined),
      },
    };
  });

  it('should call session.prompt with truncated text when exceeding max length', async () => {
    const longText = 'a'.repeat(MAX_PROMPT_LENGTH + 100);
    await appendToSession(
      { client: mockClient } as { client: { session: { prompt: jest.Mock } } },
      'session-123',
      longText
    );

    expect(mockClient.session.prompt).toHaveBeenCalledWith(
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

  it('should call session.prompt with full text when under max length', async () => {
    const shortText = 'short text';
    await appendToSession(
      { client: mockClient } as { client: { session: { prompt: jest.Mock } } },
      'session-456',
      shortText
    );

    expect(mockClient.session.prompt).toHaveBeenCalledWith(
      expect.objectContaining({
        path: { id: 'session-456' },
        body: {
          noReply: true,
          parts: [{ type: 'text', text: shortText }],
        },
      })
    );
  });

  it('should call session.prompt with empty output', async () => {
    await appendToSession(
      { client: mockClient } as { client: { session: { prompt: jest.Mock } } },
      'session-789',
      ''
    );

    expect(mockClient.session.prompt).toHaveBeenCalledWith(
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
