import { describe, it, expect } from 'vitest';
import { normalizeInputForHandler } from '.opencode/plugins/features/events/resolvers/normalize-input';

describe('normalizeInputForHandler', () => {
  it('returns { input, output } for tool.execute events', () => {
    const result = normalizeInputForHandler(
      'tool.execute.before',
      { tool: 'bash', sessionID: 'ses_1' },
      { args: { command: 'ls' } }
    );
    expect(result).toEqual({
      input: { tool: 'bash', sessionID: 'ses_1' },
      output: { args: { command: 'ls' } },
    });
  });

  it('wraps input in { properties, output } for shell.env', () => {
    const result = normalizeInputForHandler(
      'shell.env',
      { cwd: '/tmp' },
      { env: { PATH: '/usr/bin' } }
    );
    expect(result).toEqual({
      properties: { cwd: '/tmp' },
      output: { env: { PATH: '/usr/bin' } },
    });
  });

  it('returns { properties, output } for chat events', () => {
    const result = normalizeInputForHandler(
      'chat.message',
      { sessionID: 'ses_1' },
      { message: { role: 'user', content: 'hello' } }
    );
    expect(result).toEqual({
      properties: { sessionID: 'ses_1' },
      output: { message: { role: 'user', content: 'hello' } },
    });
  });

  it('returns { properties, output } for experimental events', () => {
    const result = normalizeInputForHandler(
      'experimental.chat.messages.transform',
      { sessionID: 'ses_1' },
      { messages: [] }
    );
    expect(result).toEqual({
      properties: { sessionID: 'ses_1' },
      output: { messages: [] },
    });
  });

  it('returns { properties, output } for permission events', () => {
    const result = normalizeInputForHandler(
      'permission.ask',
      { sessionID: 'ses_1', tool: 'bash' },
      { status: 'approved' }
    );
    expect(result).toEqual({
      properties: { sessionID: 'ses_1', tool: 'bash' },
      output: { status: 'approved' },
    });
  });

  it('returns { properties, output } for command.execute.before', () => {
    const result = normalizeInputForHandler(
      'command.execute.before',
      { command: 'ls -la', sessionID: 'ses_1' },
      { parts: [] }
    );
    expect(result).toEqual({
      properties: { command: 'ls -la', sessionID: 'ses_1' },
      output: { parts: [] },
    });
  });

  it('uses input.properties when available and not a known event type', () => {
    const result = normalizeInputForHandler('file.edited', {
      properties: { file: 'test.ts' },
    });
    expect(result).toEqual({
      properties: { file: 'test.ts' },
    });
  });

  it('wraps input in { properties: input } as fallback', () => {
    const result = normalizeInputForHandler('session.created', {
      sessionID: 'ses_1',
      info: { id: 'x', title: 't' },
    });
    expect(result).toEqual({
      properties: { sessionID: 'ses_1', info: { id: 'x', title: 't' } },
    });
  });
});
