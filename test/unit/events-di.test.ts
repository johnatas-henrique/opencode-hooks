import { createResolvers } from '../helpers';
import { createUserConfig } from '../helpers';
// import { createHandlers } from '../helpers'; // Available for custom handler tests

describe('events - resolveEventConfig (DI)', () => {
  describe('basic config resolution', () => {
    it('should return defaults for unknown event', () => {
      const { eventResolver } = createResolvers(createUserConfig());
      const config = eventResolver.resolve('session.unknown');

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(true);
      expect(config.toastTitle).toBe('====UNKNOWN SESSION EVENT====');
      expect(config.toastVariant).toBe('warning');
      expect(config.toastDuration).toBe(5000);
      expect(config.scripts).toEqual([]);
      expect(config.saveToFile).toBe(true);
      expect(config.appendToSession).toBe(true);
    });

    it('should return enabled: false for disabled event', () => {
      const config = createUserConfig({
        events: { 'session.disabled': false },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.disabled');

      expect(result.enabled).toBe(false);
    });

    it('should return default script for event set to boolean true', () => {
      const config = createUserConfig({
        events: { 'session.created': true },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.created');

      expect(result.enabled).toBe(true);
      expect(result.scripts).toEqual(['session-created.sh']);
    });

    it('should return specified scripts for event with scripts array', () => {
      const config = createUserConfig({
        events: {
          'session.custom': {
            scripts: ['custom-a.sh', 'custom-b.sh'],
          },
        },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.custom');

      expect(result.enabled).toBe(true);
      expect(result.scripts).toEqual(['custom-a.sh', 'custom-b.sh']);
    });

    it('should return empty scripts when runScripts: false', () => {
      const config = createUserConfig({
        events: {
          'session.no-scripts': {
            runScripts: false,
            scripts: ['should-be-ignored.sh'],
          },
        },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.no-scripts');

      expect(result.scripts).toEqual([]);
    });
  });

  describe('toast configuration', () => {
    it('should return toast: false when default toast is disabled', () => {
      const config = createUserConfig({
        default: { toast: false },
        events: { 'session.test': true },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.test');

      expect(result.toast).toBe(false);
    });

    it('should return toast: false when event toast is disabled', () => {
      const config = createUserConfig({
        events: { 'session.toast-off': { toast: false } },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.toast-off');

      expect(result.toast).toBe(false);
    });

    it('should return custom toast configuration', () => {
      const config = createUserConfig({
        events: {
          'session.custom-toast': {
            toast: {
              title: 'Custom Title',
              variant: 'warning',
              duration: 5000,
              message: 'Custom message',
            },
          },
        },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.custom-toast');

      expect(result.toastTitle).toBe('Custom Title');
      expect(result.toastVariant).toBe('warning');
      expect(result.toastDuration).toBe(5000);
    });
  });

  describe('saveToFile configuration', () => {
    it('should respect saveToFile override', () => {
      const config = createUserConfig({
        events: { 'session.no-save': { saveToFile: false } },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.no-save');

      expect(result.saveToFile).toBe(false);
    });
  });

  describe('appendToSession configuration', () => {
    it('should respect appendToSession override', () => {
      const config = createUserConfig({
        events: { 'session.no-append': { appendToSession: false } },
      });
      const { eventResolver } = createResolvers(config);
      const result = eventResolver.resolve('session.no-append');

      expect(result.appendToSession).toBe(false);
    });
  });
});

describe('events - resolveToolConfig (DI)', () => {
  describe('basic tool config resolution', () => {
    it('should resolve tool config with defaults', () => {
      const { toolResolver } = createResolvers(createUserConfig());
      const result = toolResolver.resolve('tool.execute.after', 'task');

      expect(result.enabled).toBe(true);
    });

    it('should fall back to resolveEventConfig when tool not found', () => {
      const config = createUserConfig({
        events: { 'tool.execute.after': { toast: true } },
      });
      const { toolResolver } = createResolvers(config);
      const result = toolResolver.resolve('tool.execute.after', 'unknown-tool');

      expect(result.toast).toBe(true);
    });

    it('should return disabled config when tool is explicitly disabled', () => {
      const config = createUserConfig({
        tools: {
          'tool.execute.after': {
            disabled: false,
          },
        },
      });
      const { toolResolver } = createResolvers(config);
      const result = toolResolver.resolve('tool.execute.after', 'disabled');

      expect(result.enabled).toBe(false);
      expect(result.toast).toBe(false);
    });

    it('should override toast for specific tool', () => {
      const config = createUserConfig({
        tools: {
          'tool.execute.after': {
            chat: { toast: false },
          },
        },
      });
      const { toolResolver } = createResolvers(config);
      const result = toolResolver.resolve('tool.execute.after', 'chat');

      expect(result.toast).toBe(false);
    });

    it('should override runScripts for specific tool', () => {
      const config = createUserConfig({
        tools: {
          'tool.execute.after': {
            'git.commit': { runScripts: false },
          },
        },
      });
      const { toolResolver } = createResolvers(config);
      const result = toolResolver.resolve('tool.execute.after', 'git.commit');

      expect(result.runScripts).toBe(false);
    });
  });

  describe('tool with scripts', () => {
    it('should include tool-specific scripts', () => {
      const config = createUserConfig({
        tools: {
          'tool.execute.after': {
            task: {
              toast: true,
              scripts: ['log-agent.sh'],
            },
          },
        },
      });
      const { toolResolver } = createResolvers(config);
      const result = toolResolver.resolve('tool.execute.after', 'task');

      expect(result.scripts).toContain('log-agent.sh');
    });
  });
});
