import {
  createToolExecuteBeforeRecord,
  createToolExecuteAfterRecord,
  createSessionEventRecord,
  shouldLogEvents,
  extractTool,
  extractSession,
  extractDirectory,
} from '../../.opencode/plugins/features/audit/event-recorder';
import type { AuditConfig } from '../../.opencode/plugins/features/audit/types';

describe('event-recorder', () => {
  const defaultConfig: AuditConfig = {
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

  describe('shouldLogEvents', () => {
    it('should return true when enabled and level is debug', () => {
      expect(shouldLogEvents(defaultConfig)).toBe(true);
    });

    it('should return false when disabled', () => {
      const config = { ...defaultConfig, enabled: false };
      expect(shouldLogEvents(config)).toBe(false);
    });

    it('should return false when level is audit', () => {
      const config = { ...defaultConfig, level: 'audit' as const };
      expect(shouldLogEvents(config)).toBe(false);
    });

    it('should return false when disabled and audit', () => {
      const config = {
        ...defaultConfig,
        enabled: false,
        level: 'audit' as const,
      };
      expect(shouldLogEvents(config)).toBe(false);
    });
  });

  describe('extractTool', () => {
    it('should return tool name when provided', () => {
      expect(extractTool({ tool: 'bash' })).toBe('bash');
    });

    it('should return unknown when tool is undefined', () => {
      expect(extractTool({})).toBe('unknown');
    });
  });

  describe('extractSession', () => {
    it('should return sessionID when provided', () => {
      expect(extractSession({ sessionID: 'session-123' })).toBe('session-123');
    });

    it('should return info.id when sessionID is not provided', () => {
      expect(extractSession({ info: { id: 'session-456' } })).toBe(
        'session-456'
      );
    });

    it('should return unknown when no session identifier', () => {
      expect(extractSession({})).toBe('unknown');
    });
  });

  describe('extractDirectory', () => {
    it('should return info.directory when provided', () => {
      expect(extractDirectory({ info: { directory: '/project' } })).toBe(
        '/project'
      );
    });

    it('should return directory when info.directory is not provided', () => {
      expect(extractDirectory({ directory: '/home/user' })).toBe('/home/user');
    });

    it('should return unknown when no directory', () => {
      expect(extractDirectory({})).toBe('unknown');
    });
  });

  describe('createToolExecuteBeforeRecord', () => {
    it('should create record with correct fields when shouldLog is true', () => {
      const input = { tool: 'bash', sessionID: 'session-123' };
      const record = createToolExecuteBeforeRecord(input, true);

      expect(record).not.toBeNull();
      expect(record).toMatchObject({
        event: 'tool.execute.before',
        tool: 'bash',
        session: 'session-123',
      });
      expect(record?.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should return null when shouldLog is false', () => {
      const input = { tool: 'bash', sessionID: 'session-123' };
      const record = createToolExecuteBeforeRecord(input, false);

      expect(record).toBeNull();
    });
  });

  describe('createToolExecuteAfterRecord', () => {
    it('should create record with success status for exit 0', () => {
      const input = { tool: 'bash', sessionID: 'session-123' };
      const output = { metadata: { exit: 0 } };
      const record = createToolExecuteAfterRecord(input, output, true);

      expect(record).not.toBeNull();
      expect(record).toMatchObject({
        event: 'tool.execute.after',
        tool: 'bash',
        session: 'session-123',
        status: 'success',
        error: undefined,
      });
    });

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

    it('should exclude scriptToasts', () => {
      const input = { tool: 'bash', sessionID: 'session-123' };
      const output = {
        metadata: { exit: 0 },
        scriptToasts: [{ id: 'toast-1' }],
      };
      const record = createToolExecuteAfterRecord(input, output, true);

      expect(record).not.toBeNull();
      expect(record).not.toHaveProperty('scriptToasts');
    });

    it('should return null when shouldLog is false', () => {
      const record = createToolExecuteAfterRecord(
        { tool: 'bash', sessionID: 'session-123' },
        { metadata: { exit: 0 } },
        false
      );

      expect(record).toBeNull();
    });

    it('should have success status when no metadata', () => {
      const record = createToolExecuteAfterRecord(
        { tool: 'read', sessionID: 'session-456' },
        {},
        true
      );

      expect(record).not.toBeNull();
      expect(record?.status).toBe('success');
    });

    it('should have success status when undefined output', () => {
      const record = createToolExecuteAfterRecord(
        { tool: 'edit', sessionID: 'session-789' },
        undefined,
        true
      );

      expect(record).not.toBeNull();
      expect(record?.status).toBe('success');
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

    it('should return null when shouldLog is false', () => {
      const input = { info: { id: 'session-123' } };
      const record = createSessionEventRecord('session.created', input, false);

      expect(record).toBeNull();
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
    it('should log tool.execute.before with correct fields', async () => {
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
      await recorder.logToolExecuteBefore({
        tool: 'bash',
        sessionID: 'session-123',
      });

      expect(mockWriteLine).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({
          event: 'tool.execute.before',
          tool: 'bash',
          session: 'session-123',
        })
      );
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
    it('should log session.created with correct fields', async () => {
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
      await recorder.logSessionEvent('session.created', {
        info: { id: 'session-123', directory: '/project' },
      });

      expect(mockWriteLine).toHaveBeenCalledWith(
        'events',
        expect.objectContaining({
          event: 'session.created',
          session: 'session-123',
          directory: '/project',
        })
      );
    });

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
