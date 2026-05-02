import { vi } from 'vitest';
import type {
  ToolExecuteAfterInput,
  ToolExecuteBeforeInput,
  ToolExecuteAfterOutput,
} from '.opencode/plugins/types/core';
import type { AuditConfig } from '.opencode/plugins/types/audit';
import {
  createEventRecorder,
  createToolExecuteAfterRecord,
  createSessionEventRecord,
  extractTool,
  extractSession,
  extractDirectory,
  createGenericEventRecord,
  setGlobalTruncationKB,
} from '.opencode/plugins/features/audit/event-recorder';

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
  });

  describe('extractDirectory', () => {
    it('should return directory from input.info.directory', () => {
      const input = { info: { id: 'session-123', directory: '/project' } };
      expect(extractDirectory(input)).toBe('/project');
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
    it('should handle null record gracefully', async () => {
      const mockWriteLine = vi.fn();
      const config = {
        enabled: false,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
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
        await import('.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'audit',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
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
        logTruncationKB: 10,
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
        await import('.opencode/plugins/features/audit/event-recorder');
      const defaultConfig = {
        enabled: true,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
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
        }),
        'session-123'
      );
    });

    it('should not log when level is audit', async () => {
      const { createEventRecorder } =
        await import('.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'audit',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
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
  });

  describe('logSessionEvent', () => {
    it('should not log when disabled', async () => {
      const { createEventRecorder } =
        await import('.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: true,
        level: 'audit',
        maxSizeMB: 10,
        maxAgeDays: 30,
        logTruncationKB: 10,
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
        logTruncationKB: 10,
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
    expect(items.length).toBe(51);
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

describe('LARGE_FIELDS truncation (line 166)', () => {
  beforeEach(() => {
    setGlobalTruncationKB(10);
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
