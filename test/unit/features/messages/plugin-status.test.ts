import {
  parseLogLine,
  formatPluginStatus,
} from '.opencode/plugins/features/messages/plugin-status';
import type { PluginStatus } from '.opencode/plugins/types/plugin';

describe('plugin-status (pure functions)', () => {
  describe('parseLogLine', () => {
    it('should parse INFO plugin line', () => {
      const result = parseLogLine(
        'INFO  2026-04-03T14:30:22 +50ms service=plugin name=opencode-hooks loading internal plugin'
      );

      expect(result).toEqual({
        level: 'INFO',
        message: 'loading internal plugin',
        name: 'opencode-hooks',
        path: undefined,
        pkg: undefined,
        error: undefined,
      });
    });

    it('should parse ERROR plugin line with error tag', () => {
      const result = parseLogLine(
        'ERROR  2026-04-03T14:30:22 +200ms service=plugin name=opencode-broken error=ModuleNotFound failed to load plugin'
      );

      expect(result).toEqual({
        level: 'ERROR',
        message: 'failed to load plugin',
        name: 'opencode-broken',
        path: undefined,
        pkg: undefined,
        error: 'ModuleNotFound',
      });
    });

    it('should parse WARN plugin line', () => {
      const result = parseLogLine(
        'WARN  2026-04-03T14:30:22 +250ms service=plugin path=npm:old-plugin error=No server entrypoint plugin incompatible'
      );

      expect(result).toEqual({
        level: 'WARN',
        message: 'server entrypoint plugin incompatible',
        name: undefined,
        path: 'npm:old-plugin',
        pkg: undefined,
        error: 'No',
      });
    });

    it('should return null for non-plugin service', () => {
      const result = parseLogLine(
        'INFO  2026-04-03T14:30:22 +50ms service=session message=Session created'
      );

      expect(result).toBeNull();
    });

    it('should return null for malformed line', () => {
      const result = parseLogLine('This is not a valid log line');

      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = parseLogLine('');

      expect(result).toBeNull();
    });
  });

  describe('formatPluginStatus', () => {
    it('should return message when no plugins detected', () => {
      const result = formatPluginStatus([]);

      expect(result).toBe('No plugins detected in logs');
    });

    it('should format mixed statuses', () => {
      const statuses: PluginStatus[] = [
        { name: 'opencode-hooks', status: 'active', source: 'user' },
        { name: 'npm:theme', status: 'active', source: 'user' },
        {
          name: 'npm:broken',
          status: 'failed',
          error: 'Error',
          source: 'user',
        },
        { name: 'npm:old', status: 'incompatible', source: 'user' },
      ];

      const result = formatPluginStatus(statuses, 'user-only');

      expect(result).toContain('4 active, 1 failed, 1 incompatible');
      expect(result).toContain('✓ opencode-hooks');
      expect(result).toContain('✓ npm:theme');
      expect(result).toContain('✗ npm:broken (Error)');
      expect(result).toContain('⚠ npm:old');
    });

    describe('displayMode - user-only', () => {
      it('should show failed plugin without error message', () => {
        const statuses: PluginStatus[] = [
          { name: 'broken-plugin', status: 'failed', source: 'user' },
        ];

        const result = formatPluginStatus(statuses, 'user-only');

        expect(result).toContain('Failed:');
        expect(result).toContain('broken-plugin');
      });
    });

    describe('displayMode - user-separated', () => {
      it('should show total count including built-in', () => {
        const statuses: PluginStatus[] = [
          { name: 'user-plugin', status: 'active', source: 'user' },
          { name: 'CodexAuthPlugin', status: 'active', source: 'built-in' },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('2 active');
      });

      it('should show failed section when failed plugins exist', () => {
        const statuses: PluginStatus[] = [
          { name: 'user-plugin', status: 'active', source: 'user' },
          {
            name: 'broken-plugin',
            status: 'failed',
            error: 'Error',
            source: 'user',
          },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('Failed:');
        expect(result).toContain('broken-plugin');
      });

      it('should show incompatible section when incompatible plugins exist', () => {
        const statuses: PluginStatus[] = [
          { name: 'user-plugin', status: 'active', source: 'user' },
          { name: 'old-plugin', status: 'incompatible', source: 'user' },
        ];

        const result = formatPluginStatus(statuses, 'user-separated');

        expect(result).toContain('Incompatible:');
        expect(result).toContain('old-plugin');
      });
    });

    describe('displayMode - all-labeled', () => {
      it('should show total count including all plugins', () => {
        const statuses: PluginStatus[] = [
          { name: 'user-plugin', status: 'active', source: 'user' },
          { name: 'CodexAuthPlugin', status: 'active', source: 'built-in' },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('2 active');
      });

      it('should show incompatible section with labels', () => {
        const statuses: PluginStatus[] = [
          { name: 'user-plugin', status: 'active', source: 'user' },
          { name: 'old-plugin', status: 'incompatible', source: 'built-in' },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('Incompatible:');
        expect(result).toContain('old-plugin (built-in)');
      });

      it('should use built-in label for failed in all-labeled mode', () => {
        const statuses: PluginStatus[] = [
          {
            name: 'CodexAuthPlugin',
            status: 'failed',
            error: 'Error',
            source: 'built-in',
          },
        ];

        const result = formatPluginStatus(statuses, 'all-labeled');

        expect(result).toContain('(built-in)');
        expect(result).toContain('CodexAuthPlugin');
      });
    });

    describe('displayMode - default behavior', () => {
      it('should default to user-only when no mode specified', () => {
        const statuses: PluginStatus[] = [
          { name: 'user-plugin', status: 'active', source: 'user' },
          { name: 'CodexAuthPlugin', status: 'active', source: 'built-in' },
        ];

        const result = formatPluginStatus(statuses);

        expect(result).toContain('1 active');
        expect(result).toContain('user-plugin');
        expect(result).not.toContain('CodexAuthPlugin');
      });
    });
  });
});
