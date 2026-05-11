import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldLogEvents,
  extractTool,
  extractSession,
  extractDirectory,
  createToolExecuteBeforeRecord,
  createToolExecuteAfterRecord,
  createSessionEventRecord,
  createGenericEventRecord,
  createEventRecorder,
} from '.opencode/plugins/features/audit/event-recorder';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteAfterInput,
} from '.opencode/plugins/types/core';
import { makeAuditConfig as makeConfig } from '../../../helpers/audit-config';

describe('shouldLogEvents', () => {
  it('returns true when enabled and level is debug', () => {
    expect(shouldLogEvents(makeConfig())).toBe(true);
  });

  it('returns false when disabled', () => {
    expect(shouldLogEvents(makeConfig({ enabled: false }))).toBe(false);
  });

  it('returns false when level is audit', () => {
    expect(shouldLogEvents(makeConfig({ level: 'audit' }))).toBe(false);
  });
});

describe('extractTool', () => {
  it('returns tool name from input', () => {
    const input: ToolExecuteBeforeInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
    };
    expect(extractTool(input)).toBe('bash');
  });

  it('returns "unknown" when tool is missing', () => {
    const input = {} as ToolExecuteBeforeInput;
    expect(extractTool(input)).toBe('unknown');
  });
});

describe('extractSession', () => {
  it('returns sessionID from tool input', () => {
    const input: ToolExecuteBeforeInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
    };
    expect(extractSession(input)).toBe('s1');
  });

  it('returns info.id from session input', () => {
    const input = { info: { id: 's2' } };
    expect(extractSession(input)).toBe('s2');
  });

  it('returns "unknown" when no session info', () => {
    expect(extractSession({})).toBe('unknown');
  });
});

describe('extractDirectory', () => {
  it('returns info.directory when present', () => {
    const input = { info: { id: 's1', title: 't', directory: '/home' } };
    expect(extractDirectory(input)).toBe('/home');
  });

  it('falls back to top-level directory', () => {
    const input = { directory: '/tmp' };
    expect(extractDirectory(input)).toBe('/tmp');
  });

  it('returns "unknown" when no directory', () => {
    expect(extractDirectory({})).toBe('unknown');
  });
});

describe('createToolExecuteBeforeRecord', () => {
  it('returns null when shouldLogResult is false', () => {
    const input: ToolExecuteBeforeInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
    };
    expect(createToolExecuteBeforeRecord(input, false)).toBeNull();
  });

  it('creates record with correct fields', () => {
    const input: ToolExecuteBeforeInput = {
      tool: 'read',
      sessionID: 's1',
      callID: 'c1',
    };
    const record = createToolExecuteBeforeRecord(input, true);
    expect(record).not.toBeNull();
    expect(record!.event).toBe('tool.execute.before');
    expect(record!.tool).toBe('read');
    expect(record!.session).toBe('s1');
    expect(record!.ts).toEqual(expect.any(String));
  });
});

describe('createToolExecuteAfterRecord', () => {
  it('returns null when shouldLogResult is false', () => {
    const input: ToolExecuteAfterInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
      args: {},
    };
    expect(createToolExecuteAfterRecord(input, undefined, false)).toBeNull();
  });

  it('creates success record when exit is 0', () => {
    const input: ToolExecuteAfterInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
      args: {},
    };
    const output = { title: 'ok', output: 'done', metadata: { exit: 0 } };
    const record = createToolExecuteAfterRecord(input, output, true);
    expect(record!.status).toBe('success');
    expect(record!.error).toBeUndefined();
  });

  it('creates error record when exit is non-zero', () => {
    const input: ToolExecuteAfterInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
      args: {},
    };
    const output = { title: 'fail', output: '', metadata: { exit: 1 } };
    const record = createToolExecuteAfterRecord(input, output, true);
    expect(record!.status).toBe('error');
    expect(record!.error).toBe('Exit code: 1');
  });

  it('creates success record when no metadata.exit', () => {
    const input: ToolExecuteAfterInput = {
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
      args: {},
    };
    const output = { title: 'ok', output: 'done', metadata: {} };
    const record = createToolExecuteAfterRecord(input, output, true);
    expect(record!.status).toBe('success');
    expect(record!.error).toBeUndefined();
  });
});

describe('createSessionEventRecord', () => {
  it('returns null when shouldLogResult is false', () => {
    expect(createSessionEventRecord('session.created', {}, false)).toBeNull();
  });

  it('creates record with event type and directory', () => {
    const input = { info: { id: 's1', title: 't', directory: '/home' } };
    const record = createSessionEventRecord('session.created', input, true);
    expect(record!.event).toBe('session.created');
    expect(record!.session).toBe('s1');
    expect(record!.directory).toBe('/home');
  });
});

describe('createGenericEventRecord', () => {
  it('returns null when shouldLogResult is false', () => {
    expect(
      createGenericEventRecord(
        'custom',
        { sessionID: 's1' },
        {},
        'tool',
        false,
        [],
        100,
        3,
        200
      )
    ).toBeNull();
  });

  it('creates record with session from input.sessionID', () => {
    const record = createGenericEventRecord(
      'custom',
      { sessionID: 's1' },
      {},
      'tool',
      true,
      [],
      100,
      3,
      200
    );
    expect(record!.event).toBe('custom');
    expect(record!.session).toBe('s1');
    expect(record!.tool).toBe('tool');
  });

  it('extracts session from input.info.id', () => {
    const record = createGenericEventRecord(
      'custom',
      { info: { id: 's2' } },
      {},
      undefined,
      true,
      [],
      100,
      3,
      200
    );
    expect(record!.session).toBe('s2');
  });

  it('sanitizes input fields', () => {
    const record = createGenericEventRecord(
      'test',
      { password: 'secret', name: 'ok' },
      {},
      undefined,
      true,
      [],
      100,
      3,
      200
    );
    expect(record!.input?.password).toBe('[REDACTED: 6 chars]');
    expect(record!.input?.name).toBe('ok');
  });

  it('truncates large fields', () => {
    const largeContent = 'x'.repeat(200);
    const record = createGenericEventRecord(
      'test',
      { patch: largeContent },
      {},
      undefined,
      true,
      ['patch'],
      10,
      3,
      200
    );
    expect(record!.input?.patch).toContain('[truncated]');
    expect((record!.input?.patch as string).length).toBeLessThan(
      largeContent.length
    );
  });

  it('handles arrays with primitive items', () => {
    const record = createGenericEventRecord(
      'test',
      { items: [1, 'hello', true, null] },
      {},
      undefined,
      true,
      [],
      100,
      10,
      200
    );
    const result = record!.input?.items as Array<unknown>;
    expect(result[0]).toBe(1);
    expect(result[1]).toBe('hello');
    expect(result[2]).toBe(true);
    expect(result[3]).toBeNull();
  });

  it('limits array items', () => {
    const items = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
    const record = createGenericEventRecord(
      'test',
      { items },
      {},
      undefined,
      true,
      [],
      100,
      2,
      200
    );
    const result = record!.input?.items as Array<unknown>;
    expect(result).toHaveLength(3);
    expect(result[2]).toContain('more items');
  });

  it('includes tool name from input.tool', () => {
    const record = createGenericEventRecord(
      'test',
      { sessionID: 's1', tool: 'bash' },
      {},
      undefined,
      true,
      [],
      100,
      3,
      200
    );
    expect(record!.tool).toBe('bash');
  });

  it('skips sanitization when input is undefined', () => {
    const record = createGenericEventRecord(
      'test',
      undefined,
      {},
      undefined,
      true,
      [],
      100,
      3,
      200
    );
    expect(record!.input).toBeUndefined();
  });

  it('sanitizes output fields', () => {
    const record = createGenericEventRecord(
      'test',
      { sessionID: 's1' },
      { token: 'abc' },
      undefined,
      true,
      [],
      100,
      3,
      200
    );
    expect(record!.output?.token).toBe('[REDACTED: 3 chars]');
  });
});

async function createRecorderAndExecuteAfter(
  configOverride?: Parameters<typeof makeConfig>[0]
) {
  const mockWriteLine = vi.fn().mockResolvedValue(undefined);
  const config = makeConfig(configOverride);
  const recorder = createEventRecorder(config, { writeLine: mockWriteLine });
  await recorder.logToolExecuteAfter(
    { tool: 'bash', sessionID: 's1', callID: 'c1', args: {} },
    { title: 't', output: 'o', metadata: { exit: 0 } }
  );
  return mockWriteLine;
}

async function createRecorderAndLogEvent(
  configOverride?: Parameters<typeof makeConfig>[0]
) {
  const mockWriteLine = vi.fn().mockResolvedValue(undefined);
  const config = makeConfig(configOverride);
  const recorder = createEventRecorder(config, { writeLine: mockWriteLine });
  await recorder.logEvent('custom', { sessionID: 's1' });
  return mockWriteLine;
}

describe('createEventRecorder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls writeLine on logToolExecuteBefore', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });

    await recorder.logToolExecuteBefore({
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
    });
    expect(mockWriteLine).toHaveBeenCalledOnce();
    expect(mockWriteLine.mock.calls[0][0]).toBe('events');
  });

  it('calls writeLine on logToolExecuteAfter', async () => {
    const mockWriteLine = await createRecorderAndExecuteAfter();
    expect(mockWriteLine).toHaveBeenCalledOnce();
  });

  it('calls writeLine on logSessionEvent', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });

    await recorder.logSessionEvent('session.created', { info: { id: 's1' } });
    expect(mockWriteLine).toHaveBeenCalledOnce();
  });

  it('calls writeLine on logEvent', async () => {
    const mockWriteLine = await createRecorderAndLogEvent();
    expect(mockWriteLine).toHaveBeenCalledOnce();
  });

  it('does not write when config level is audit', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig({ level: 'audit' });
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });

    await recorder.logToolExecuteBefore({
      tool: 'bash',
      sessionID: 's1',
      callID: 'c1',
    });
    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  it('does not write when config level is audit [logToolExecuteAfter]', async () => {
    const mockWriteLine = await createRecorderAndExecuteAfter({
      level: 'audit',
    });
    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  it('does not write when config level is audit [logSessionEvent]', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig({ level: 'audit' });
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });
    await recorder.logSessionEvent('session.created', { info: { id: 's1' } });
    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  it('does not write when config level is audit [logEvent]', async () => {
    const mockWriteLine = await createRecorderAndLogEvent({ level: 'audit' });
    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  it('logEvent with input but no sessionID covers L317 ?? fallback', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });

    await recorder.logEvent('custom', { input: { key: 'val' } });
    expect(mockWriteLine).toHaveBeenCalledOnce();
  });

  it('logEvent without input and without sessionID covers L318 ?? fallback', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });

    await recorder.logEvent('custom', {});
    expect(mockWriteLine).toHaveBeenCalledOnce();
  });

  it('appends context to logEvent records', async () => {
    const mockWriteLine = vi.fn().mockResolvedValue(undefined);
    const config = makeConfig();
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });

    await recorder.logEvent('custom', {
      sessionID: 's1',
      context: 'my-context',
    });
    const record = mockWriteLine.mock.calls[0][1] as Record<string, unknown>;
    expect(record.context).toBe('my-context');
  });
});

describe('sanitizeAndTruncate large fields', () => {
  it('truncates large field content when over maxBytes', () => {
    const largeContent = 'y'.repeat(5000);
    const record = createGenericEventRecord(
      'test',
      { patch: largeContent },
      {},
      undefined,
      true,
      ['patch'],
      10000,
      3,
      1 // logTruncationKB = 1 → maxBytes = 1024 < 5000
    );
    expect(record!.input?.patch).toContain('[truncated]');
    expect((record!.input?.patch as string).length).toBe(
      1024 + '... [truncated]'.length
    );
  });
});
