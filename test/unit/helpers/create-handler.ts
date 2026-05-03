import type { EventHandler } from '.opencode/plugins/types/events';

export function createHandler(overrides?: Partial<EventHandler>): EventHandler {
  return {
    title: 'Test Handler',
    variant: 'info',
    duration: 5000,
    defaultScript: 'test-script.sh',
    buildMessage: () => 'test-message',
    ...overrides,
  };
}
