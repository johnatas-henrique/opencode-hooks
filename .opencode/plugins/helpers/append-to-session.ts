import type { PluginInput } from '@opencode-ai/plugin';
import { MAX_PROMPT_LENGTH } from './constants';

export const appendToSession = async (
  ctx: PluginInput,
  sessionId: string,
  text: string
): Promise<void> => {
  const truncatedText =
    text.length > MAX_PROMPT_LENGTH
      ? text.substring(0, MAX_PROMPT_LENGTH) + '... [truncated]'
      : text;

  await ctx.client.session.prompt({
    path: { id: sessionId },
    body: {
      noReply: true,
      parts: [{ type: 'text', text: truncatedText }],
    },
  });
};
