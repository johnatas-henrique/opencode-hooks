import type { ToastDirector } from '.opencode/plugins/types/toast';
import type { TuiToast } from '@opencode-ai/plugin/tui';
import { DEFAULTS } from '.opencode/plugins/core/constants';

export class ToastDirectorImpl implements ToastDirector {
  private queue: TuiToast[] = [];
  private processing = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private activePromise: Promise<void> | null = null;
  private idleCallbacks: (() => void)[] = [];

  constructor(
    private showFn: (toast: TuiToast) => void | Promise<void>,
    private options: { staggerMs?: number; maxSize?: number },
    private onToastDropped: (dropped: TuiToast) => void
  ) {}

  enqueue(toast: TuiToast): void {
    const maxSize = this.options.maxSize ?? 50;
    if (maxSize === 0) {
      return;
    }
    if (this.queue.length >= maxSize) {
      const dropped = this.queue.shift()!;
      this.onToastDropped(dropped);
    }

    if (toast.variant === 'error') {
      this.queue.unshift(toast);
    } else {
      this.queue.push(toast);
    }

    if (!this.processing) {
      queueMicrotask(() => this.processQueue());
    }
  }

  async flush(): Promise<void> {
    if (!this.processing && this.queue.length === 0) {
      return;
    }

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

        await this.scheduleTimer(this.options.staggerMs ?? 0);

        try {
          this.activePromise = Promise.resolve(this.showFn(toast));
          await this.activePromise;
        } catch {
          // Error handled silently; continue processing
        } finally {
          this.activePromise = null;
        }

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
