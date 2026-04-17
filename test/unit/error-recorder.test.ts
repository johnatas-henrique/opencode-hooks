import {
  createErrorRecord,
  getErrorType,
  createErrorRecorder,
} from '../../.opencode/plugins/features/audit/error-recorder';
import type { AuditConfig } from '../../.opencode/plugins/types/audit';

describe('error-recorder', () => {
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

  describe('getErrorType', () => {
    it('should return config for ConfigErrorContext', () => {
      const context = { message: 'Script not found' };
      expect(getErrorType(context)).toBe('config');
    });

    it('should return code for CodeErrorContext', () => {
      const context = { error: new Error('Something went wrong') };
      expect(getErrorType(context)).toBe('code');
    });
  });

  describe('createErrorRecord', () => {
    it('should return null when shouldLog is false', () => {
      const context = { message: 'Error' };
      expect(createErrorRecord(context, false)).toBeNull();
    });

    it('should create config error record', () => {
      const context = { message: 'Script not found', scriptPath: 'test.sh' };
      const record = createErrorRecord(context, true);

      expect(record).not.toBeNull();
      expect(record!.ts).toBeDefined();
      expect(record!.type).toBe('config');
      expect(record!.error).toBe('Script not found');
      expect(record!.scriptPath).toBe('test.sh');
    });

    it('should create config error with eventType and toolName', () => {
      const context = {
        message: 'Permission denied',
        eventType: 'tool.execute.before',
        toolName: 'bash',
      };
      const record = createErrorRecord(context, true);

      expect(record!.type).toBe('config');
      expect(record!.eventType).toBe('tool.execute.before');
      expect(record!.toolName).toBe('bash');
    });

    it('should create code error record with stack', () => {
      const error = new Error('Something broke');
      const context = { error, context: 'Event handler' };
      const record = createErrorRecord(context, true);

      expect(record).not.toBeNull();
      expect(record!.ts).toBeDefined();
      expect(record!.type).toBe('code');
      expect(record!.error).toBe('Something broke');
      expect(record!.stack).toBeDefined();
      expect(record!.context).toBe('Event handler');
    });

    it('should create code error without context', () => {
      const error = new Error('Null pointer');
      const context = { error };
      const record = createErrorRecord(context, true);

      expect(record!.type).toBe('code');
      expect(record!.context).toBeUndefined();
    });
  });

  describe('createErrorRecorder', () => {
    it('should create recorder with logError function', () => {
      const mockWriteLine = vi.fn();
      const deps = { writeLine: mockWriteLine };
      const recorder = createErrorRecorder(defaultConfig, deps);

      expect(recorder.logError).toBeDefined();
    });

    it('should call writeLine with errors fileType', async () => {
      const mockWriteLine = vi.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const recorder = createErrorRecorder(defaultConfig, deps);

      await recorder.logError({ message: 'Test error' });

      expect(mockWriteLine).toHaveBeenCalledWith('errors', expect.any(Object));
    });

    it('should not call writeLine when disabled', async () => {
      const mockWriteLine = vi.fn();
      const deps = { writeLine: mockWriteLine };
      const config = { ...defaultConfig, enabled: false };
      const recorder = createErrorRecorder(config, deps);

      await recorder.logError({ message: 'Test error' });

      expect(mockWriteLine).not.toHaveBeenCalled();
    });

    it('should pass correct record data to writeLine', async () => {
      const mockWriteLine = vi.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const recorder = createErrorRecorder(defaultConfig, deps);

      await recorder.logError({
        message: 'Script failed',
        scriptPath: 'deploy.sh',
      });

      const recordArg = mockWriteLine.mock.calls[0][1];
      expect(recordArg.type).toBe('config');
      expect(recordArg.error).toBe('Script failed');
      expect(recordArg.scriptPath).toBe('deploy.sh');
    });

    it('should include stack for code errors', async () => {
      const mockWriteLine = vi.fn().mockResolvedValue(undefined);
      const deps = { writeLine: mockWriteLine };
      const recorder = createErrorRecorder(defaultConfig, deps);

      await recorder.logError({
        error: new Error('Code error'),
        context: 'handler',
      });

      const recordArg = mockWriteLine.mock.calls[0][1];
      expect(recordArg.type).toBe('code');
      expect(recordArg.stack).toBeDefined();
    });
  });
});
