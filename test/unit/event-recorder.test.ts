import { vi } from 'vitest';
import type {
  ToolExecuteAfterInput,
  ToolExecuteBeforeInput,
  ToolExecuteAfterOutput,
} from '../../.opencode/plugins/types/core';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';
import {
  createEventRecorder,
  createToolExecuteAfterRecord,
  createSessionEventRecord,
  createToolExecuteBeforeRecord,
  extractTool,
  extractSession,
  extractDirectory,
  createGenericEventRecord,
  setGlobalTruncationKB,
} from '../../.opencode/plugins/features/audit/event-recorder';

describe('event-recorder', () => {
  describe('extractTool', () => {
    it('should return unknown when tool is undefined', () => {
      expect(extractTool({} as ToolExecuteBeforeInput)).toBe('unknown');
    });
  });

  describe('extractSession', () => {
    it('should return unknown when no session identifier', () => {
      expect(extractSession({} as ToolExecuteBeforeInput)).toBe('unknown');
    });
  });

  describe('createToolExecuteAfterRecord', () => {
    it('should create record with error status for non-zero exit', () => {
      const input: ToolExecuteAfterInput = {
        tool: 'bash',
        sessionID: 'session-123',
        callID: 'call-1',
        args: {},
      };
      const output = {
        title: '',
        output: '',
        metadata: { exit: 1 },
      } as ToolExecuteAfterOutput;
      const record = createToolExecuteAfterRecord(input, output, true);

      expect(record).not.toBeNull();
      expect(record).toMatchObject({
        status: 'error',
        error: 'Exit code: 1',
      });
    });
  });

  describe('createSessionEventRecord', () => {
    it('should create record with correct fields', () => {
      const input = {
        info: { id: 'session-123', title: 'Test', directory: '/project' },
      };
      const record = createSessionEventRecord('session.created', input, true);

      expect(record).not.toBeNull();
      expect(record).toMatchObject({
        event: 'session.created',
        session: 'session-123',
        directory: '/project',
      });
    });

    it('should use sessionID directly when provided', () => {
      const input = { sessionID: 'session-456', directory: '/home' };
      const record = createSessionEventRecord('session.updated', input, true);

      expect(record).not.toBeNull();
      expect(record?.session).toBe('session-456');
      expect(record?.directory).toBe('/home');
    });

    it('should return null when shouldLogResult is false', () => {
      const input = { info: { id: 'session-123' } };
      const record = createSessionEventRecord('session.created', input, false);

      expect(record).toBeNull();
    });
  });

  describe('extractDirectory', () => {
    it('should return unknown when directory is not available', () => {
      const input = { info: { id: 'session-123' } };
      expect(extractDirectory(input)).toBe('unknown');
    });
  });

  describe('createToolExecuteBeforeRecord', () => {
    it('should return null when shouldLogResult is false', () => {
      const input = {
        tool: 'read',
        sessionID: 'session-123',
        callID: 'call-1',
      } as ToolExecuteBeforeInput;
      const record = createToolExecuteBeforeRecord(input, false);

      expect(record).toBeNull();
    });

    it('should return record when shouldLogResult is true', () => {
      const input = {
        tool: 'read',
        sessionID: 'session-123',
        callID: 'call-1',
      } as ToolExecuteBeforeInput;
      const record = createToolExecuteBeforeRecord(input, true);

      expect(record).not.toBeNull();
      expect(record?.event).toBe('tool.execute.before');
      expect(record?.tool).toBe('read');
      expect(record?.session).toBe('session-123');
    });
  });
});

describe('createEventRecorder', () => {
  const mockWriteLine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteLine.mockResolvedValue(undefined);
  });

  describe('logEvent', () => {
    it('should log generic event with input and output', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };

      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });

      // sessionID must be in the input object to be captured
      await recorder.logEvent('session.idle', {
        sessionID: 'session-123',
        input: { sessionID: 'session-123', duration: 5000 },
        output: { status: 'idle' },
      });

      expect(mockWriteLine).toHaveBeenCalledOnce();
      const loggedData = mockWriteLine.mock.calls[0][1];
      expect(loggedData.event).toBe('session.idle');
      expect(loggedData.session).toBe('session-123');
      expect(loggedData.input).toBeDefined();
      expect(loggedData.input?.duration).toBe(5000);
      expect(loggedData.output).toBeDefined();
      expect(loggedData.output?.status).toBe('idle');
    });

    it('should not log when level is audit', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'audit',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
      };

      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });

      await recorder.logEvent('session.idle', {
        sessionID: 'session-123',
        input: { duration: 5000 },
      });

      expect(mockWriteLine).not.toHaveBeenCalled();
    });

    it('should include tool name when provided', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };

      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });

      await recorder.logEvent('tool.execute.after', {
        sessionID: 'session-123',
        tool: 'write',
        input: { filePath: '/test.txt' },
        output: { success: true },
      });

      expect(mockWriteLine).toHaveBeenCalledOnce();
      const loggedData = mockWriteLine.mock.calls[0][1];
      expect(loggedData.tool).toBe('write');
    });

    it('should add context field when provided', async () => {
      const mockWriteLine = vi.fn();
      const config = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };

      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });

      await recorder.logEvent('custom.event', {
        sessionID: 'session-123',
        context: 'hook',
        input: {},
      });

      expect(mockWriteLine).toHaveBeenCalledOnce();
      const loggedData = mockWriteLine.mock.calls[0][1];
      expect(loggedData.context).toBe('hook');
    });

    it('should handle null record gracefully', async () => {
      const mockWriteLine = vi.fn();
      const config = {
        enabled: false,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };

      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });

      await recorder.logEvent('session.idle', {
        sessionID: 'session-123',
      });

      expect(mockWriteLine).not.toHaveBeenCalled();
    });
  });

  describe('logToolExecuteBefore', () => {
    it('should not log when level is audit', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'audit',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
      };
      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });
      await recorder.logToolExecuteBefore({
        tool: 'bash',
        sessionID: 'session-123',
        callID: 'call-1',
      });

      expect(mockWriteLine).not.toHaveBeenCalled();
    });

    it('should log when record is not null', async () => {
      const mockWriteLine = vi.fn();
      const config = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };
      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });
      await recorder.logToolExecuteBefore({
        tool: 'bash',
        sessionID: 'session-123',
        callID: 'call-1',
      });

      expect(mockWriteLine).toHaveBeenCalled();
    });
  });

  describe('logToolExecuteAfter', () => {
    it('should log tool.execute.after with correct fields', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const defaultConfig = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };
      const recorder = createEventRecorder(defaultConfig as AuditConfig, {
        writeLine: mockWriteLine,
      });
      await recorder.logToolExecuteAfter(
        { tool: 'bash', sessionID: 'session-123', callID: 'call-1', args: {} },
        { title: '', output: '', metadata: { exit: 0 } }
      );

      expect(mockWriteLine).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({
          event: 'tool.execute.after',
          tool: 'bash',
          session: 'session-123',
          status: 'success',
        })
      );
    });
  });

  it('should not log when level is audit', async () => {
    const { createEventRecorder } =
      await import('../../.opencode/plugins/features/audit/event-recorder');
    const config = {
      enabled: true,
      level: 'audit',
      maxSizeMB: 10,
      maxAgeDays: 30,
      truncationKB: 10,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      basePath: '/tmp/audit-test/test',
      largeFields: [],
    };
    const recorder = createEventRecorder(config as AuditConfig, {
      writeLine: mockWriteLine,
    });
    await recorder.logToolExecuteAfter(
      { tool: 'bash', sessionID: 'session-123', callID: 'call-1', args: {} },
      { title: '', output: '', metadata: { exit: 0 } }
    );

    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  describe('logSessionEvent', () => {
    it('should not log when disabled', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'audit',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };
      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });
      await recorder.logSessionEvent('session.created', {
        info: { id: 'session-123' },
      });

      expect(mockWriteLine).not.toHaveBeenCalled();
    });

    it('should log when record is not null', async () => {
      const mockWriteLine = vi.fn();
      const config = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        maxFieldSize: 1000,
        maxArrayItems: 50,
        basePath: '/tmp/audit-test/test',
        largeFields: [],
      };
      const recorder = createEventRecorder(config as AuditConfig, {
        writeLine: mockWriteLine,
      });
      await recorder.logSessionEvent('session.created', {
        info: { id: 'session-123' },
      });

      expect(mockWriteLine).toHaveBeenCalled();
    });
  });
});

describe('createGenericEventRecord', () => {
  it('should create record with sanitized input and output', () => {
    const input = {
      tool: 'read',
      sessionID: 'session-123',
      args: { filePath: '/test/file.txt' },
    };
    const output = {
      content: 'Lorem ipsum dolor sit amet',
      lines: 42,
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      output,
      'read',
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    expect(record?.event).toBe('tool.execute.before');
    expect(record?.tool).toBe('read');
    expect(record?.session).toBe('session-123');
    expect(record?.input).toBeDefined();
    expect(record?.output).toBeDefined();
  });

  it('should extract session from info.id when sessionID not present', () => {
    const input = {
      info: { id: 'session-info-123', title: 'Test' },
      data: 'test',
    };

    const record = createGenericEventRecord(
      'session.created',
      input,
      undefined,
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    expect(record?.session).toBe('session-info-123');
  });

  it('should return null when shouldLogResult is false', () => {
    const record = createGenericEventRecord(
      'tool.execute.before',
      { tool: 'read', sessionID: 'session-123' },
      undefined,
      'read',
      false,
      [],
      1000,
      50
    );

    expect(record).toBeNull();
  });

  it('should truncate large string fields', () => {
    const longData = 'a'.repeat(1500);
    const input = {
      data: longData,
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    expect(record?.input?.data).toBe('a'.repeat(1000) + '... [truncated]');
  });

  it('should redact sensitive fields', () => {
    const input = {
      password: 'supersecret123',
      apiKey: 'sk-abc123xyz789',
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    expect(record?.input?.password).toBe('[REDACTED: 14 chars]');
    expect(record?.input?.apiKey).toBe('[REDACTED: 15 chars]');
  });

  it('should limit array items', () => {
    const input = {
      items: Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `item-${i}`,
      })),
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    const items = record?.input?.items as Array<unknown>;
    expect(items.length).toBe(51); // 50 items + "more items" indicator
    expect(items[50]).toBe('... [50 more items]');
  });

  it('should sanitize nested objects', () => {
    const input = {
      nested: {
        password: 'secret123',
        data: 'x'.repeat(2000),
      },
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    const nested = record?.input?.nested as Record<string, unknown>;
    expect(nested.password).toBe('[REDACTED: 9 chars]');
    expect(nested.data).toBe('x'.repeat(1000) + '... [truncated]');
  });

  it('should handle arrays with primitive values', () => {
    const input = {
      tags: ['tag1', 'tag2', 'tag3'],
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    expect(record?.input?.tags).toEqual(['tag1', 'tag2', 'tag3']);
  });

  it('should handle empty input and output', () => {
    const record = createGenericEventRecord(
      'session.idle',
      {},
      {},
      undefined,
      true,
      [],
      1000,
      50
    );

    expect(record).not.toBeNull();
    expect(record?.event).toBe('session.idle');
    expect(record?.input).toBeUndefined();
    expect(record?.output).toBeUndefined();
  });
});

describe('setGlobalTruncationKB', () => {
  it('should set global truncation KB value', () => {
    setGlobalTruncationKB(5);
    const input = {
      content: 'x'.repeat(10000),
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      ['content'],
      1000,
      50
    );

    const content = record?.input?.content as string;
    expect(content).toContain('... [truncated]');
    expect(content.length).toBeLessThan(10000);
  });
});

describe('LARGE_FIELDS truncation (line 166)', () => {
  beforeEach(() => {
    setGlobalTruncationKB(10);
  });

  it('should truncate patch field when larger than truncationKB', () => {
    const input = {
      patch: 'y'.repeat(20000),
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.before',
      input,
      undefined,
      undefined,
      true,
      ['patch', 'diff', 'content', 'snapshot', 'output', 'result', 'text'],
      1000,
      50
    );

    const patch = record?.input?.patch as string;
    expect(patch).toContain('... [truncated]');
    expect(patch).not.toBe('y'.repeat(20000));
  });

  it('should truncate diff field', () => {
    const input = {
      diff: 'z'.repeat(25000),
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.after',
      input,
      undefined,
      undefined,
      true,
      ['patch', 'diff', 'content', 'snapshot', 'output', 'result', 'text'],
      1000,
      50
    );

    const diff = record?.input?.diff as string;
    expect(diff).toContain('... [truncated]');
  });

  it('should truncate diff field inside properties (session.diff structure)', () => {
    const input = {
      type: 'session.diff',
      properties: {
        sessionID: 'session-123',
        diff: [
          {
            file: 'settings.ts',
            patch: 'x'.repeat(20000), // Long patch inside diff array
          },
        ],
      },
    };

    const record = createGenericEventRecord(
      'session.diff',
      input,
      undefined,
      undefined,
      true,
      ['patch', 'diff', 'content', 'snapshot', 'output', 'result', 'text'],
      1000,
      50
    );

    // The diff array should be present
    const recordInput = record?.input as Record<string, unknown>;
    const properties = recordInput?.properties as
      | Record<string, unknown>
      | undefined;
    const diffArray = properties?.diff as unknown;
    expect(diffArray).toBeDefined();
    expect(Array.isArray(diffArray)).toBe(true);

    // The patch inside the first diff item should be truncated
    const firstPatch = (diffArray as Record<string, unknown>[])[0]
      ?.patch as string;
    expect(firstPatch).toContain('... [truncated]');
    expect(firstPatch.length).toBeLessThan(20000);
  });

  it('should truncate content field when it is LARGE_FIELD', () => {
    const input = {
      content: 'w'.repeat(30000),
      sessionID: 'session-123',
    };

    const record = createGenericEventRecord(
      'tool.execute.after',
      input,
      undefined,
      undefined,
      true,
      ['patch', 'diff', 'content', 'snapshot', 'output', 'result', 'text'],
      1000,
      50
    );

    const content = record?.input?.content as string;
    expect(content).toContain('... [truncated]');
    expect(content.length).toBeLessThan(30000);
  });
});
