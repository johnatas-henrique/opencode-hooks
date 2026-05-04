import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { appendToSession } from '.opencode/plugins/features/messages/append-to-session';
import type { PluginInput } from '@opencode-ai/plugin';

function makeCtx(mockPrompt: ReturnType<typeof vi.fn>): PluginInput {
  return fromPartial<PluginInput>({
    client: {
      session: {
        prompt: mockPrompt,
      },
    },
  });
}

describe('appendToSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls ctx.client.session.prompt with the given session id and text', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const ctx = makeCtx(mockPrompt);

    await appendToSession(ctx, 'ses_abc123', 'Hello world');

    expect(mockPrompt).toHaveBeenCalledOnce();
    expect(mockPrompt).toHaveBeenCalledWith({
      path: { id: 'ses_abc123' },
      body: {
        noReply: true,
        parts: [{ type: 'text', text: 'Hello world' }],
      },
    });
  });

  it('does not truncate text under maxPromptLength', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const ctx = makeCtx(mockPrompt);

    const text = 'a'.repeat(500);
    await appendToSession(ctx, 's1', text);

    const callBody = mockPrompt.mock.calls[0][0];
    expect(callBody.body.parts[0].text).toBe(text);
    expect(callBody.body.parts[0].text).not.toContain('[truncated]');
  });

  it('truncates text over maxPromptLength (10000)', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const ctx = makeCtx(mockPrompt);

    const text = 'a'.repeat(15000);
    await appendToSession(ctx, 's1', text);

    const callBody = mockPrompt.mock.calls[0][0];
    expect(callBody.body.parts[0].text.length).toBeLessThan(15000);
    expect(callBody.body.parts[0].text).toContain('[truncated]');
  });

  it('truncates exactly at maxPromptLength plus ellipsis', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const ctx = makeCtx(mockPrompt);

    const text = 'a'.repeat(15000);
    await appendToSession(ctx, 's1', text);

    const callBody = mockPrompt.mock.calls[0][0];
    expect(callBody.body.parts[0].text.length).toBe(
      10000 + '... [truncated]'.length
    );
  });

  it('passes the correct session id', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const ctx = makeCtx(mockPrompt);

    await appendToSession(ctx, 'ses_xyz', 'test');
    expect(mockPrompt.mock.calls[0][0].path.id).toBe('ses_xyz');
  });
});
