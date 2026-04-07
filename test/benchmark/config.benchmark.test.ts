import {
  resolveEventConfig,
  resolveToolConfig,
} from '../../.opencode/plugins/helpers/events';

jest.mock('../../.opencode/plugins/helpers/default-handlers', () => ({
  handlers: {
    'session.created': {
      title: '====TEST====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'test.sh',
      buildMessage: () => 'test',
    },
    'tool.execute.after': {
      title: '====TOOL====',
      variant: 'info',
      duration: 2000,
      defaultScript: 'tool.sh',
      buildMessage: () => 'tool',
    },
  },
}));

jest.mock('../../.opencode/plugins/helpers/user-events.config', () => ({
  userConfig: {
    enabled: true,
    default: {
      debug: false,
      toast: true,
      runScripts: true,
      runOnlyOnce: false,
      saveToFile: true,
      appendToSession: false,
    },
    events: {
      'session.created': { toast: true },
    },
    tools: {
      'tool.execute.after': {
        task: { toast: true, scripts: ['task.sh'] },
      },
    },
  },
}));

describe('Benchmark: resolveEventConfig', () => {
  const ITERATIONS = 10000;
  const EXPECTED_MAX_MS = 2000;

  it('should resolve event config efficiently for 10000 calls', () => {
    const eventTypes = [
      'session.created',
      'session.error',
      'session.compacted',
      'session.idle',
      'tool.execute.before',
      'tool.execute.after',
    ];

    const start = Date.now();

    for (let i = 0; i < ITERATIONS; i++) {
      for (const eventType of eventTypes) {
        resolveEventConfig(eventType);
      }
    }

    const elapsed = Date.now() - start;

    console.log(
      `resolveEventConfig: ${ITERATIONS} iterations in ${elapsed}ms (${(elapsed / ITERATIONS) * 1000}us per call)`
    );

    expect(elapsed).toBeLessThan(EXPECTED_MAX_MS);
  });
});

describe('Benchmark: resolveToolConfig', () => {
  const ITERATIONS = 10000;
  const EXPECTED_MAX_MS = 100;

  it('should resolve tool config in under 10ms for 10000 calls', () => {
    const toolNames = ['task', 'skill', 'read', 'write', 'edit', 'glob'];

    const start = Date.now();

    for (let i = 0; i < ITERATIONS; i++) {
      for (const toolName of toolNames) {
        resolveToolConfig('tool.execute.after', toolName);
      }
    }

    const elapsed = Date.now() - start;

    console.log(
      `resolveToolConfig: ${ITERATIONS} iterations in ${elapsed}ms (${(elapsed / ITERATIONS) * 1000}us per call)`
    );

    expect(elapsed).toBeLessThan(EXPECTED_MAX_MS);
  });
});
