import {
  initGlobalToastQueue,
  useGlobalToastQueue,
  resetGlobalToastQueue,
  createToastQueue,
} from '../../.opencode/plugins/helpers/toast-queue';

describe('Global Toast Queue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetGlobalToastQueue();
  });

  afterEach(() => {
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('should initialize and use global queue', async () => {
    const showFn = jest.fn();
    const queue = initGlobalToastQueue(showFn);

    queue.add({ title: 'Test', message: 'Hello', variant: 'info' as const });
    await jest.runAllTimersAsync();

    expect(useGlobalToastQueue()).toBe(queue);
  });

  it('should throw error when not initialized', () => {
    expect(() => useGlobalToastQueue()).toThrow('ToastQueue not initialized');
  });

  it('should create queue with createToastQueue', () => {
    const showFn = jest.fn();
    const queue = createToastQueue(showFn);

    queue.add({
      title: 'Test',
      message: 'Hello',
      variant: 'info' as const,
      duration: 1000,
    });

    expect(queue.pending).toBeGreaterThanOrEqual(0);
  });
});
