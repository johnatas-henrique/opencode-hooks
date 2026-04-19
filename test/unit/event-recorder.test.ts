import {
  createToolExecuteAfterRecord,
  createSessionEventRecord,
  extractTool,
  extractSession,
} from '../../.opencode/plugins/features/audit/event-recorder';

describe('event-recorder', () => {
  describe('extractTool', () => {
    it('should return unknown when tool is undefined', () => {
      expect(extractTool({})).toBe('unknown');
    });
  });

  describe('extractSession', () => {
    it('should return unknown when no session identifier', () => {
      expect(extractSession({})).toBe('unknown');
    });
  });

  describe('createToolExecuteAfterRecord', () => {
    it('should create record with error status for non-zero exit', () => {
      const input = { tool: 'bash', sessionID: 'session-123' };
      const output = { metadata: { exit: 1 } };
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
});

describe('createEventRecorder', () => {
  const mockWriteLine = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWriteLine.mockResolvedValue(undefined);
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
        files: {
          events: 'plugin-events.jsonl',
          scripts: 'plugin-scripts.jsonl',
          errors: 'plugin-errors.jsonl',
        },
      };
      const recorder = createEventRecorder(config, {
        writeLine: mockWriteLine,
      });
      await recorder.logToolExecuteBefore({
        tool: 'bash',
        sessionID: 'session-123',
      });

      expect(mockWriteLine).not.toHaveBeenCalled();
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
        files: {
          events: 'plugin-events.jsonl',
          scripts: 'plugin-scripts.jsonl',
          errors: 'plugin-errors.jsonl',
        },
      };
      const recorder = createEventRecorder(defaultConfig, {
        writeLine: mockWriteLine,
      });
      await recorder.logToolExecuteAfter(
        { tool: 'bash', sessionID: 'session-123' },
        { metadata: { exit: 0 } }
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
      files: {
        events: 'plugin-events.jsonl',
        scripts: 'plugin-scripts.jsonl',
        errors: 'plugin-errors.jsonl',
      },
    };
    const recorder = createEventRecorder(config, { writeLine: mockWriteLine });
    await recorder.logToolExecuteAfter(
      { tool: 'bash', sessionID: 'session-123' },
      { metadata: { exit: 0 } }
    );

    expect(mockWriteLine).not.toHaveBeenCalled();
  });

  describe('logSessionEvent', () => {
    it('should not log when disabled', async () => {
      const { createEventRecorder } =
        await import('../../.opencode/plugins/features/audit/event-recorder');
      const config = {
        enabled: false,
        level: 'debug',
        maxSizeMB: 10,
        maxAgeDays: 30,
        truncationKB: 10,
        files: {
          events: 'plugin-events.jsonl',
          scripts: 'plugin-scripts.jsonl',
          errors: 'plugin-errors.jsonl',
        },
      };
      const recorder = createEventRecorder(config, {
        writeLine: mockWriteLine,
      });
      await recorder.logSessionEvent('session.created', {
        info: { id: 'session-123' },
      });

      expect(mockWriteLine).not.toHaveBeenCalled();
    });
  });
});
