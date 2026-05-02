import {
  createToastQueue,
  initGlobalToastQueue,
  getGlobalToastQueue,
  useGlobalToastQueue,
  resetGlobalToastQueue,
} from '.opencode/plugins/core/toast-queue';
import type { TuiToast } from '@opencode-ai/plugin/tui';

describe('toast-queue', () => {
  let showFn: (toast: TuiToast) => void | Promise<void>;
  let queue: ReturnType<typeof createToastQueue>;

  beforeEach(() => {
    const mockFn = vi.fn().mockResolvedValue(undefined);
    showFn = (toast: TuiToast) => mockFn(toast);
    queue = createToastQueue(showFn, { staggerMs: 0, maxSize: 10 });
  });

  it('creates queue with add method', () => {
    expect(queue.add).toBeDefined();
    expect(typeof queue.add).toBe('function');
  });

  it('creates queue with addMultiple method', () => {
    expect(queue.addMultiple).toBeDefined();
    expect(typeof queue.addMultiple).toBe('function');
  });

  it('creates queue with clear method', () => {
    expect(queue.clear).toBeDefined();
    expect(typeof queue.clear).toBe('function');
  });

  it('creates queue with flush method', () => {
    expect(queue.flush).toBeDefined();
    expect(typeof queue.flush).toBe('function');
  });

  it('add enqueues a toast', () => {
    const toast: TuiToast = { title: 'Test', message: '' };
    queue.add(toast);
    expect(queue.pending).toBe(1);
  });

  it('addMultiple enqueues multiple toasts', () => {
    const toasts: TuiToast[] = [
      { title: '1', message: '' },
      { title: '2', message: '' },
      { title: '3', message: '' },
    ];
    queue.addMultiple(toasts);
    expect(queue.pending).toBe(3);
  });

  it('clear removes all pending toasts', () => {
    queue.add({ title: '1', message: '' });
    queue.add({ title: '2', message: '' });
    expect(queue.pending).toBe(2);
    queue.clear();
    expect(queue.pending).toBe(0);
  });

  it('pending returns 0 initially', () => {
    expect(queue.pending).toBe(0);
  });

  it('initGlobalToastQueue initializes global queue', () => {
    resetGlobalToastQueue();
    const result = initGlobalToastQueue(showFn);
    expect(result.add).toBeDefined();
    expect(result.flush).toBeDefined();
  });

  it('getGlobalToastQueue returns existing queue when initialized', () => {
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn);
    const result = getGlobalToastQueue();
    expect(result).toBeDefined();
    expect(result.add).toBeDefined();
  });

  it('getGlobalToastQueue initializes when showFn provided', () => {
    resetGlobalToastQueue();
    const result = getGlobalToastQueue(showFn);
    expect(result).toBeDefined();
    expect(result.add).toBeDefined();
  });

  it('getGlobalToastQueue throws when not initialized and no showFn', () => {
    resetGlobalToastQueue();
    expect(() => getGlobalToastQueue()).toThrow('ToastQueue not initialized');
  });

  it('useGlobalToastQueue returns queue when initialized', () => {
    resetGlobalToastQueue();
    initGlobalToastQueue(showFn);
    const result = useGlobalToastQueue();
    expect(result).toBeDefined();
  });

  it('useGlobalToastQueue throws when not initialized', () => {
    resetGlobalToastQueue();
    expect(() => useGlobalToastQueue()).toThrow('ToastQueue not initialized');
  });

  it('resetGlobalToastQueue clears global queue', () => {
    initGlobalToastQueue(showFn);
    expect(useGlobalToastQueue()).toBeDefined();
    resetGlobalToastQueue();
    expect(() => useGlobalToastQueue()).toThrow();
  });
});
