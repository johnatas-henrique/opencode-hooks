import type { PluginInput } from '@opencode-ai/plugin';
import { DEFAULTS } from '../../core/constants';

export const appendToSession = async (
  ctx: PluginInput,
  sessionId: string,
  text: string
): Promise<void> => {
  const truncatedText =
    text.length > DEFAULTS.core.maxPromptLength
      ? text.substring(0, DEFAULTS.core.maxPromptLength) + '... [truncated]'
      : text;

  await ctx.client.session.prompt({
    path: { id: sessionId },
    body: {
      noReply: true,
      parts: [{ type: 'text', text: truncatedText }],
    },
  });
};
