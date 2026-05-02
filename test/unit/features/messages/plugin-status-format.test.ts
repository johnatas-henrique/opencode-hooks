import { formatPluginStatus } from '.opencode/plugins/features/messages/plugin-status';
import type { PluginStatus } from '.opencode/plugins/types/plugin';

describe('plugin-status - formatPluginStatus', () => {
  const activeUser: PluginStatus = {
    name: 'user-plugin',
    status: 'active',
    source: 'user',
  };
  const activeBuiltIn: PluginStatus = {
    name: 'built-in-plugin',
    status: 'active',
    source: 'built-in',
  };
  const failedUser: PluginStatus = {
    name: 'failed-plugin',
    status: 'failed',
    error: 'load error',
    source: 'user',
  };
  const failedBuiltIn: PluginStatus = {
    name: 'failed-built-in',
    status: 'failed',
    error: 'built-in error',
    source: 'built-in',
  };
  const incompatibleUser: PluginStatus = {
    name: 'old-plugin',
    status: 'incompatible',
    error: 'not compatible',
    source: 'user',
  };

  describe('user-only mode', () => {
    it('returns message when no plugins', () => {
      const result = formatPluginStatus([], 'user-only');
      expect(result).toBe('No plugins detected in logs');
    });

    it('shows only user plugins', () => {
      const result = formatPluginStatus(
        [activeUser, activeBuiltIn],
        'user-only'
      );
      expect(result).toContain('user-plugin');
      expect(result).not.toContain('built-in-plugin');
    });

    it('formats active user plugins', () => {
      const result = formatPluginStatus([activeUser], 'user-only');
      expect(result).toContain('Active:');
      expect(result).toContain('✓ user-plugin');
    });

    it('formats failed user plugins', () => {
      const result = formatPluginStatus([failedUser], 'user-only');
      expect(result).toContain('Failed:');
      expect(result).toContain('✗ failed-plugin');
      expect(result).toContain('load error');
    });

    it('formats incompatible user plugins', () => {
      const result = formatPluginStatus([incompatibleUser], 'user-only');
      expect(result).toContain('Incompatible:');
      expect(result).toContain('⚠ old-plugin');
    });

    it('counts user plugins correctly', () => {
      const result = formatPluginStatus(
        [activeUser, failedUser, incompatibleUser],
        'user-only'
      );
      expect(result).toContain('3 active');
      expect(result).toContain('1 failed');
      expect(result).toContain('1 incompatible');
    });
  });

  describe('user-separated mode', () => {
    it('shows both user and built-in active plugins', () => {
      const result = formatPluginStatus(
        [activeUser, activeBuiltIn],
        'user-separated'
      );
      expect(result).toContain('Active (user):');
      expect(result).toContain('Active (built-in):');
      expect(result).toContain('✓ user-plugin');
      expect(result).toContain('✓ built-in-plugin');
    });

    it('shows failed plugins without source label', () => {
      const result = formatPluginStatus(
        [failedUser, failedBuiltIn],
        'user-separated'
      );
      expect(result).toContain('Failed:');
      expect(result).toContain('✗ failed-plugin');
      expect(result).toContain('✗ failed-built-in');
    });

    it('shows incompatible plugins without source label', () => {
      const result = formatPluginStatus([incompatibleUser], 'user-separated');
      expect(result).toContain('Incompatible:');
      expect(result).toContain('⚠ old-plugin');
    });
  });

  describe('all mode (default)', () => {
    it('shows all plugins with source labels', () => {
      const result = formatPluginStatus(
        [activeUser, activeBuiltIn],
        'all-labeled'
      );
      expect(result).toContain('Active:');
      expect(result).toContain('✓ user-plugin (user)');
      expect(result).toContain('✓ built-in-plugin (built-in)');
    });

    it('shows failed plugins with source labels', () => {
      const result = formatPluginStatus(
        [failedUser, failedBuiltIn],
        'all-labeled'
      );
      expect(result).toContain('Failed:');
      expect(result).toContain('✗ failed-plugin (load error) (user)');
      expect(result).toContain('✗ failed-built-in (built-in error) (built-in)');
    });

    it('shows incompatible plugins with source labels', () => {
      const result = formatPluginStatus([incompatibleUser], 'all-labeled');
      expect(result).toContain('Incompatible:');
      expect(result).toContain('⚠ old-plugin (user)');
    });
  });

  describe('default mode (no mode specified)', () => {
    it('uses user-only mode by default', () => {
      const result = formatPluginStatus([activeUser]);
      expect(result).toContain('✓ user-plugin');
      expect(result).not.toContain('(user)');
    });
  });

  describe('edge cases', () => {
    it('handles mixed user and built-in plugins', () => {
      const result = formatPluginStatus(
        [activeUser, activeBuiltIn, failedUser, incompatibleUser],
        'all-labeled'
      );
      expect(result).toContain('Plugins:');
      expect(result).toContain('Active:');
      expect(result).toContain('Failed:');
      expect(result).toContain('Incompatible:');
    });

    it('handles failed plugin without error message', () => {
      const noError: PluginStatus = {
        name: 'no-error',
        status: 'failed',
        source: 'user',
      };
      const result = formatPluginStatus([noError], 'user-only');
      expect(result).toContain('✗ no-error');
    });
  });
});
