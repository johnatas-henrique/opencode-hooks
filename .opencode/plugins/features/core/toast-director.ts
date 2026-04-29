import type { ToastDirector } from '../../types/toast';
import type { TuiToast } from '@opencode-ai/plugin/tui';
import { DEFAULTS } from '../../core/constants';
import { getErrorRecorder } from '../audit/plugin-integration';

/**
 * ToastDirectorImpl manages a single-producer toast queue with staggered display.
 * State is instance-local, not global.
 */
export class ToastDirectorImpl implements ToastDirector {
  private queue: TuiToast[] = [];
  private processing = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private activePromise: Promise<void> | null = null;
  private idleCallbacks: (() => void)[] = [];

  constructor(
    private showFn: (toast: TuiToast) => void | Promise<void>,
    private options: { staggerMs?: number; maxSize?: number } = {}
  ) {}

  enqueue(toast: TuiToast): void {
    const maxSize = this.options.maxSize ?? 50;
    // If maxSize is 0, do not enqueue at all
    if (maxSize === 0) {
      return;
    }
    // Enforce maxSize by dropping oldest
    if (this.queue.length >= maxSize) {
      const dropped = this.queue.shift()!;
      // Log dropped toast if errorRecorder available
      try {
        const recorder = getErrorRecorder();
        if (recorder?.logError) {
          recorder.logError({
            message: `Toast dropped: ${dropped.title || '(no title)'}`,
            context: JSON.stringify(dropped),
          });
        }
      } catch {
        // Audit not available; continue silently
      }
    }

    // Errors go to front, others to back
    if (toast.variant === 'error') {
      this.queue.unshift(toast);
    } else {
      this.queue.push(toast);
    }

    // Start processing asynchronously if not already running
    if (!this.processing) {
      queueMicrotask(() => this.processQueue());
    }
  }

  async flush(): Promise<void> {
    // If already idle, return immediately
    if (!this.processing && this.queue.length === 0) {
      return;
    }

    // Wait for processing to finish and queue to empty
    await new Promise<void>((resolve) => {
      this.idleCallbacks.push(resolve);
    });
  }

  clear(): void {
    this.queue = [];
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    this.processing = false;
    this.notifyIdle();
  }

  get pending(): number {
    return this.queue.length;
  }

  get isProcessing(): boolean {
    return this.processing;
  }

  async shutdown(): Promise<void> {
    await this.flush();
    this.clear();
  }

  private notifyIdle(): void {
    const callbacks = this.idleCallbacks;
    this.idleCallbacks = [];
    for (const cb of callbacks) {
      cb();
    }
  }

  private scheduleTimer(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const t = setTimeout(resolve, ms);
      t.unref();
      this.timers.push(t);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;

    this.processing = true;

    try {
      while (this.queue.length > 0) {
        const toast = this.queue.shift()!;

        // Stagger before showing
        await this.scheduleTimer(this.options.staggerMs ?? 0);

        // Show toast (do not stop queue on errors)
        try {
          this.activePromise = Promise.resolve(this.showFn(toast));
          await this.activePromise;
        } catch {
          // Error handled silently; continue processing remaining toasts
        } finally {
          this.activePromise = null;
        }

        // Wait for toast duration (display time)
        const duration =
          toast.duration ?? DEFAULTS.toast.durations.FIVE_SECONDS;
        await this.scheduleTimer(duration);
      }
    } finally {
      this.processing = false;
      this.notifyIdle();
    }
  }
}
