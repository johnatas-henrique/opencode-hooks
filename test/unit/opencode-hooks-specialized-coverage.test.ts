import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpencodeHooks } from '../../.opencode/plugins/opencode-hooks';
import * as settings from '../../.opencode/plugins/config/settings';
import * as events from '../../.opencode/plugins/features/events/events';
import type { Hooks } from '@opencode-ai/plugin';
import type {
  ToolExecuteBeforeInput,
  ToolExecuteBeforeOutput,
} from '../../.opencode/plugins/types/core';
import type { ResolvedEventConfig } from '../../.opencode/plugins/types/config';
import type { MockPluginInput } from '../__mocks__/@opencode-ai/plugin';
import { createMockPluginInput } from '../__mocks__/@opencode-ai/plugin';

vi.mock('../../.opencode/plugins/config/settings', () => ({
  userConfig: {
    enabled: true,
    audit: {},
    tools: {},
  },
}));

vi.mock('../../.opencode/plugins/features/events/events', () => ({
  resolveToolConfig: vi.fn(),
  resolveEventConfig: vi.fn(),
}));

vi.mock(
  '../../.opencode/plugins/features/block-system/block-handler',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../../.opencode/plugins/features/block-system/block-handler')
      >();
    return {
      ...actual,
      executeBlocking: vi.fn(),
    };
  }
);

vi.mock('../../.opencode/plugins/features/audit/plugin-integration', () => ({
  initAuditLogging: vi.fn(),
  getEventRecorder: vi
    .fn()
    .mockReturnValue({ logEvent: vi.fn().mockResolvedValue(undefined) }),
  getScriptRecorder: vi.fn(),
  getErrorRecorder: vi.fn(),
  archiveAllJsonFiles: vi.fn(),
}));

vi.mock('../../.opencode/plugins/features/messages/show-startup-toast', () => ({
  showStartupToast: vi.fn(),
}));

describe('opencode-hooks specialized coverage', () => {
  let mockCtx: MockPluginInput;

  beforeEach(() => {
    vi.clearAllMocks();
    (settings.userConfig as { enabled: boolean }).enabled = true;
    mockCtx = createMockPluginInput();
  });

  it('should cover line 197 when plugin is disabled', async () => {
    (settings.userConfig as { enabled: boolean }).enabled = false;

    const plugin = await OpencodeHooks(
      mockCtx as unknown as Parameters<typeof OpencodeHooks>[0]
    );
    expect(plugin).toEqual({});
  });

  it('should cover line 163 when event is tool.execute.before and has blocks', async () => {
    const mockResolved: ResolvedEventConfig = {
      enabled: true,
      debug: false,
      scripts: [],
      block: [{ check: vi.fn().mockReturnValue(true), message: 'Blocked' }],
      toast: false,
      toastTitle: '',
      toastMessage: '',
      toastVariant: 'info',
      toastDuration: 0,
      runScripts: false,
      logToAudit: false,
      appendToSession: false,
      runOnlyOnce: false,
      scriptToasts: {
        showOutput: false,
        showError: false,
        outputVariant: 'info',
        errorVariant: 'error',
        outputDuration: 0,
        errorDuration: 0,
        outputTitle: '',
        errorTitle: '',
      },
    };

    const spy = vi.spyOn(events, 'resolveToolConfig');
    spy.mockReturnValue(mockResolved);

    const plugin = await OpencodeHooks(
      mockCtx as unknown as Parameters<typeof OpencodeHooks>[0]
    );
    const hooks = plugin as Hooks;
    const handler = hooks['tool.execute.before'];

    if (handler) {
      const input: ToolExecuteBeforeInput = {
        tool: 'test-tool',
        sessionID: 'test-session',
        callID: 'call-123',
      };
      const output: ToolExecuteBeforeOutput = { args: {} };

      await handler(input, output);
    } else {
      throw new Error('tool.execute.before handler not found');
    }
  });
});
