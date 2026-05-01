import {
  resolveEventConfig,
  getHandler,
} from '.opencode/plugins/features/events/events';

vi.mock('.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    toast: true,
    logToAudit: true,
    appendToSession: false,
    runScripts: true,
    logDisabledEvents: false,
    showPluginStatus: true,
    pluginStatusDisplayMode: 'user-only',
    loadClaudeHookSettings: { enabled: false },
    scriptToasts: {
      showOutput: true,
      showError: true,
      outputVariant: 'warning',
      errorVariant: 'error',
      outputDuration: 5000,
      errorDuration: 15000,
      outputTitle: '- SCRIPTS OUTPUT',
      errorTitle: '- SCRIPT ERROR',
    },
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      logToAudit: true,
      appendToSession: false,
    },
    events: {
      'session.created': { toast: true },
    },
    tools: {},
    audit: {
      enabled: true,
      level: 'debug',
      basePath: './production/session-logs',
      maxSizeMB: 3,
      maxAgeDays: 30,
      logTruncationKB: 2,
      maxFieldSize: 1000,
      maxArrayItems: 50,
      largeFields: [
        'patch',
        'diff',
        'content',
        'snapshot',
        'output',
        'result',
        'text',
      ],
      sessionId: 'init',
    },
  },
}));

interface ToastParams {
  title: string;
  message?: string;
  variant: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
}

interface ToastContract {
  params: ToastParams;
  shouldShow: boolean;
}

function resolveToastParams(eventType: string): ToastContract {
  const config = resolveEventConfig(eventType);
  const handler = getHandler(eventType);

  if (!config.enabled || !config.toast || !handler) {
    return {
      params: {
        title: '',
        variant: 'info',
      },
      shouldShow: false,
    };
  }

  return {
    params: {
      title: config.toastTitle || handler.title,
      message: config.toastMessage,
      variant: config.toastVariant || handler.variant,
      duration: config.toastDuration || handler.duration,
    },
    shouldShow: true,
  };
}

describe('Toast Contract', () => {
  describe('handler resolution', () => {
    it('should find handler for session.error', () => {
      const handler = getHandler('session.error');
      expect(handler).toBeDefined();
      expect(handler?.title).toBe('====SESSION ERROR====');
    });

    it('should return undefined for nonexistent event', () => {
      const handler = getHandler('nonexistent.event');
      expect(handler).toBeUndefined();
    });
  });

  describe('toast params resolution', () => {
    it('should return shouldShow: true when enabled and toast true', () => {
      const contract = resolveToastParams('session.created');
      expect(contract.shouldShow).toBe(true);
    });

    it('should return shouldShow: false when event is disabled', () => {
      const contract = resolveToastParams('session.disabled');
      expect(contract.shouldShow).toBe(false);
    });

    it('should return shouldShow: false when handler not found', () => {
      const contract = resolveToastParams('nonexistent.event');
      expect(contract.shouldShow).toBe(false);
    });

    it('should use handler variant when config variant not set', () => {
      const contract = resolveToastParams('session.created');
      expect(contract.params.variant).toBe('success');
    });

    it('should use handler duration when config duration not set', () => {
      const contract = resolveToastParams('session.created');
      expect(contract.params.duration).toBe(10000);
    });
  });
});
