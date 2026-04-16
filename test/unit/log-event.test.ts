import {
  logEventConfig,
  logScriptOutput,
} from '../../.opencode/plugins/features/events/log-event';

jest.mock('../../.opencode/plugins/features/persistence/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../.opencode/plugins/config', () => ({
  userConfig: {
    enabled: true,
    default: {
      debug: false,
      toast: false,
      runScripts: false,
      runOnlyOnce: false,
      saveToFile: false,
      appendToSession: false,
    },
    events: {
      'session.created': { saveToFile: true },
      'chat.message': { enabled: false },
      'chat.params': { enabled: false },
      'chat.headers': { enabled: false },
      'experimental.chat.messages.transform': { enabled: false },
      'experimental.chat.system.transform': { enabled: false },
      'experimental.text.complete': { enabled: false },
      'session.unknown': { enabled: false },
    },
    tools: {},
  },
}));

jest.mock('../../.opencode/plugins/core/toast-queue', () => {
  const mockQueue = {
    add: jest.fn(),
    addMultiple: jest.fn(),
    clear: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  };
  return {
    createToastQueue: jest.fn(() => mockQueue),
    initGlobalToastQueue: jest.fn(() => mockQueue),
    useGlobalToastQueue: jest.fn(() => mockQueue),
    getGlobalToastQueue: jest.fn(() => mockQueue),
    resetGlobalToastQueue: jest.fn(),
  };
});

const mockSaveToFile =
  require('../../.opencode/plugins/features/persistence/save-to-file').saveToFile;

describe('logEventConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const {
      resetGlobalToastQueue,
    } = require('../../.opencode/plugins/core/toast-queue');
    resetGlobalToastQueue();
  });
  it('should save config when saveToFile is true', async () => {
    const resolved = {
      enabled: true,
      debug: false,
      toast: true,
      toastTitle: 'Test',
      toastMessage: 'Test message',
      toastVariant: 'info' as const,
      toastDuration: 2000,
      scripts: ['test.sh'],
      saveToFile: true,
      appendToSession: false,
      runOnlyOnce: false,
    };

    await logEventConfig(
      '2026-04-04T22:00:00.000Z',
      'session.created',
      {},
      resolved
    );

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: expect.stringContaining('session.created'),
      showToast: expect.any(Function),
    });
  });

  it('should not save when saveToFile is false', async () => {
    const resolved = {
      enabled: true,
      debug: false,
      toast: true,
      toastTitle: 'Test',
      toastMessage: 'Test message',
      toastVariant: 'info' as const,
      toastDuration: 2000,
      scripts: [],
      saveToFile: false,
      appendToSession: false,
      runOnlyOnce: false,
    };

    await logEventConfig(
      '2026-04-04T22:00:00.000Z',
      'session.created',
      {},
      resolved
    );

    expect(mockSaveToFile).not.toHaveBeenCalled();
  });

  it('should skip message.* events', async () => {
    const resolved = {
      enabled: true,
      debug: false,
      toast: true,
      toastTitle: 'Test',
      toastMessage: 'Test message',
      toastVariant: 'info' as const,
      toastDuration: 2000,
      scripts: [],
      saveToFile: true,
      appendToSession: false,
      runOnlyOnce: false,
    };

    await logEventConfig(
      '2026-04-04T22:00:00.000Z',
      'message.created',
      {},
      resolved
    );

    expect(mockSaveToFile).not.toHaveBeenCalled();
  });
});

describe('logScriptOutput', () => {
  it('should save script output', async () => {
    await logScriptOutput('2026-04-04T22:00:00.000Z', 'Script output');

    const call = mockSaveToFile.mock.calls.find((c) =>
      c[0].content?.includes('SCRIPT_OUTPUT')
    );
    expect(call).toBeDefined();
    const content = JSON.parse(call[0].content);
    expect(content.type).toBe('SCRIPT_OUTPUT');
    expect(content.data).toBe('Script output');
  });

  it('should save empty output', async () => {
    await logScriptOutput('2026-04-04T22:00:00.000Z', '');

    const call = mockSaveToFile.mock.calls.find((c) =>
      c[0].content?.includes('SCRIPT_OUTPUT')
    );
    expect(call).toBeDefined();
    const content = JSON.parse(call[0].content);
    expect(content.type).toBe('SCRIPT_OUTPUT');
    expect(content.data).toBe('');
  });
});
