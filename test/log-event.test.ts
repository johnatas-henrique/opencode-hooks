import {
  logEventConfig,
  logScriptOutput,
} from '../.opencode/plugins/helpers/log-event';

jest.mock('../.opencode/plugins/helpers/save-to-file', () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../.opencode/plugins/helpers/toast-queue', () => ({
  createToastQueue: jest.fn(() => ({
    add: jest.fn(),
    addMultiple: jest.fn(),
    clear: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    pending: 0,
  })),
}));

const mockSaveToFile =
  require('../.opencode/plugins/helpers/save-to-file').saveToFile;

describe('logEventConfig', () => {
  let mockQueue: {
    add: jest.Mock;
    addMultiple: jest.Mock;
    clear: jest.Mock;
    flush: jest.Mock;
    pending: number;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue = {
      add: jest.fn(),
      addMultiple: jest.fn(),
      clear: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
      pending: 0,
    };
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
      resolved,
      mockQueue
    );

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: expect.stringContaining('session.created'),
      showToast: mockQueue.add,
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
      resolved,
      mockQueue
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
      'message.updated',
      resolved,
      mockQueue
    );

    expect(mockSaveToFile).not.toHaveBeenCalled();
  });

  it('should allow non-message events', async () => {
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
      'session.created',
      resolved,
      mockQueue
    );

    expect(mockSaveToFile).toHaveBeenCalled();
  });
});

describe('logScriptOutput', () => {
  let mockQueue: {
    add: jest.Mock;
    addMultiple: jest.Mock;
    clear: jest.Mock;
    flush: jest.Mock;
    pending: number;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueue = {
      add: jest.fn(),
      addMultiple: jest.fn(),
      clear: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
      pending: 0,
    };
  });

  it('should save script output', async () => {
    await logScriptOutput(
      '2026-04-04T22:00:00.000Z',
      'Script output',
      mockQueue
    );

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: '[2026-04-04T22:00:00.000Z] Script output\n',
      showToast: mockQueue.add,
    });
  });

  it('should save empty output', async () => {
    await logScriptOutput('2026-04-04T22:00:00.000Z', '', mockQueue);

    expect(mockSaveToFile).toHaveBeenCalledWith({
      content: '[2026-04-04T22:00:00.000Z] \n',
      showToast: mockQueue.add,
    });
  });
});
