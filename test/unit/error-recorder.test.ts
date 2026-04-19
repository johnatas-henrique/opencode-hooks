import { createErrorRecorder } from '../../.opencode/plugins/features/audit/error-recorder';
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

  describe('createErrorRecorder', () => {
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
