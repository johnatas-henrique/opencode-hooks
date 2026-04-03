import type { Plugin, PluginInput } from '@opencode-ai/plugin';
import type {
  EventSessionCreated,
  EventSessionCompacted,
  EventSessionDeleted,
  EventSessionDiff,
  EventSessionError,
  EventSessionIdle,
  EventSessionStatus,
  EventSessionUpdated,
  Session,
} from '@opencode-ai/sdk';

export type {
  Plugin,
  PluginInput,
  EventSessionCreated,
  EventSessionCompacted,
  EventSessionDeleted,
  EventSessionDiff,
  EventSessionError,
  EventSessionIdle,
  EventSessionStatus,
  EventSessionUpdated,
  Session,
};

export const mockSession: Session = {
  id: 'test-session-123',
  projectID: 'test-project',
  directory: '/test/dir',
  title: 'Test Session',
  version: '1.0.0',
  time: {
    created: Date.now(),
    updated: Date.now(),
  },
};

export const mockEventSessionCreated: EventSessionCreated = {
  type: 'session.created',
  properties: {
    info: mockSession,
  },
};

export const mockEventSessionCompacted: EventSessionCompacted = {
  type: 'session.compacted',
  properties: {
    sessionID: 'test-session-123',
  },
};

export const mockEventSessionDeleted: EventSessionDeleted = {
  type: 'session.deleted',
  properties: {
    info: mockSession,
  },
};

export const mockEventSessionDiff: EventSessionDiff = {
  type: 'session.diff',
  properties: {
    sessionID: 'test-session-123',
    diff: [],
  },
};

export const mockEventSessionError: EventSessionError = {
  type: 'session.error',
  properties: {
    sessionID: 'test-session-123',
    error: {
      name: 'ApiError' as const,
      data: {
        message: 'Test error message',
        isRetryable: false,
      },
    },
  },
};

export const mockEventSessionErrorUnknown: EventSessionError = {
  type: 'session.error',
  properties: {
    sessionID: 'test-session-123',
    error: undefined,
  },
};

export const mockEventSessionIdle: EventSessionIdle = {
  type: 'session.idle',
  properties: {
    sessionID: 'test-session-123',
  },
};

export const mockEventSessionStatus: EventSessionStatus = {
  type: 'session.status',
  properties: {
    sessionID: 'test-session-123',
    status: { type: 'idle' as const },
  },
};

export const mockEventSessionUpdated: EventSessionUpdated = {
  type: 'session.updated',
  properties: {
    info: mockSession,
  },
};

export type MockClient = {
  tui: {
    showToast: jest.Mock<Promise<void>, [any]>;
  };
};

export type MockDollar = {
  spawn: jest.Mock<any, any[]>;
};

export const createMockClient = (): MockClient => ({
  tui: {
    showToast: jest.fn().mockResolvedValue(undefined),
  },
});

export const createMockDollar = (): MockDollar => ({
  spawn: jest.fn().mockResolvedValue({ exitCode: 0, stdout: '', stderr: '' }),
});
