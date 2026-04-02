import { OpencodeHooks } from "../.opencode/plugins/opencode-hooks";

jest.mock("../.opencode/plugins/helpers/run-script", () => ({
  runScript: jest.fn().mockResolvedValue("Script executed"),
}));

jest.mock("../.opencode/plugins/helpers/save-to-file", () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../.opencode/plugins/helpers/create-toast", () => ({
  createToast: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../.opencode/plugins/helpers/events-config", () => ({
  loadEventsConfig: jest.fn().mockResolvedValue({
    version: "1.0.0",
    description: "Test config",
    enabled: true,
    toast: true,
    script: true,
    saveToFile: true,
    appendToSession: true,
    events: {
      "session.created": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.compacted": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.deleted": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.idle": { enabled: false, toast: false },
      "session.error": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.diff": { enabled: false, toast: false },
      "session.status": { enabled: true, toast: false },
      "session.updated": { enabled: true, toast: false },
      "server.instance.disposed": { enabled: true, script: true },
      "tool.execute.after": { enabled: true, toast: true, script: true },
    },
  }),
  getEventConfig: jest.fn((eventType: string) => {
    const testConfig: Record<string, any> = {
      "session.created": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.compacted": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.deleted": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.idle": { enabled: false, toast: false },
      "session.error": { enabled: true, toast: true, script: true, saveToFile: true, appendToSession: true },
      "session.diff": { enabled: false, toast: false },
      "session.status": { enabled: true, toast: false },
      "session.updated": { enabled: true, toast: false },
      "server.instance.disposed": { enabled: true, script: true },
      "tool.execute.after": { enabled: true, toast: true, script: true },
      "tool.execute.task": { enabled: true, toast: true, script: true },
    };
    return testConfig[eventType] || { enabled: true, toast: false, script: false, saveToFile: true, appendToSession: false };
  }),
  resetConfigCache: jest.fn(),
  isEventEnabled: jest.fn((eventType: string) => {
    const disabledEvents = ["session.idle", "session.diff"];
    return !disabledEvents.includes(eventType);
  }),
}));

jest.mock("../.opencode/plugins/helpers/toast-queue", () => ({
  ...jest.requireActual("../.opencode/plugins/helpers/toast-queue"),
  getGlobalToastQueue: jest.fn((showFn) => {
    const queue = {
      add: jest.fn((toast) => {
        showFn(toast);
      }),
      flush: jest.fn().mockResolvedValue(undefined),
      pending: 0,
    };
    return queue;
  }),
  resetGlobalToastQueue: jest.fn(),
}));

import { runScript } from "../.opencode/plugins/helpers/run-script";
import { saveToFile } from "../.opencode/plugins/helpers/save-to-file";
import { createToast } from "../.opencode/plugins/helpers/create-toast";

const LOG_FILE = "./session_events.log";

interface Session {
  id: string;
  projectID: string;
  directory: string;
  title: string;
  version: string;
  time: { created: number; updated: number };
}

interface MockClient {
  tui: {
    showToast: ReturnType<typeof jest.fn>;
  };
  session: {
    prompt: ReturnType<typeof jest.fn>;
  };
}

const createMockClient = (): MockClient => ({
  tui: {
    showToast: jest.fn().mockResolvedValue(undefined),
  },
  session: {
    prompt: jest.fn().mockResolvedValue(undefined),
  },
});

const createMockSession = (id: string = "test-session-123"): Session => ({
  id,
  projectID: "test-project",
  directory: "/test/dir",
  title: "Test Session",
  version: "1.0.0",
  time: { created: Date.now(), updated: Date.now() },
});

describe("Session Plugins", () => {
  let mockClient: MockClient;
  let mockDollar: any;

  beforeEach(() => {
    mockClient = createMockClient();
    mockDollar = { spawn: jest.fn().mockResolvedValue({ exitCode: 0, stdout: "", stderr: "" }) };
    jest.clearAllMocks();
  });

  describe("session.created", () => {
    it("should trigger toast with variant success", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.created", properties: { info: createMockSession("session-123") } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe("success");
      expect(callArgs.body.title).toBe("====SESSION CREATED====");
    });

    it("should contain correct session ID in message", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.created", properties: { info: createMockSession("my-session-456") } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("my-session-456");
    });

    it("should have duration of 2000ms (default SHORT)", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.created", properties: { info: createMockSession() } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.duration).toBe(2000);
    });

    it("should call saveToFile with log entry", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.created", properties: { info: createMockSession() } };
      await plugin.event({ event });
      expect(saveToFile).toHaveBeenCalledTimes(3);
      expect(saveToFile).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringMatching(/session.created/) }));
    });
  });

  describe("session.compacted", () => {
    it("should trigger toast with variant info", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.compacted", properties: { sessionID: "session-123" } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe("info");
      expect(callArgs.body.title).toBe("====SESSION COMPACTED====");
    });

    it("should run pre-compact.sh script", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.compacted", properties: { sessionID: "session-123" } };
      await plugin.event({ event });
      expect(runScript).toHaveBeenCalledTimes(1);
      expect(runScript).toHaveBeenCalledWith(mockDollar, "pre-compact.sh");
    });

    it("should contain session ID in message", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.compacted", properties: { sessionID: "compact-session-789" } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("compact-session-789");
    });
  });

  describe("session.deleted", () => {
    it("should trigger toast with variant error", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.deleted", properties: { info: createMockSession("delete-session-001") } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe("error");
      expect(callArgs.body.title).toBe("====SESSION DELETED====");
    });

    it("should contain correct session ID", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.deleted", properties: { info: createMockSession("deleted-id-999") } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("deleted-id-999");
    });
  });

  describe("session.idle", () => {
    it("should not trigger toast when disabled in config", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.idle", properties: { sessionID: "idle-session-001" } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe("session.error", () => {
    it("should trigger toast with variant error", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.error", properties: { sessionID: "error-session-001", error: { name: "ApiError", data: { message: "Test error" } } } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.variant).toBe("error");
      expect(callArgs.body.title).toBe("====SESSION ERROR====");
    });

    it("should extract error name correctly", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.error", properties: { sessionID: "error-session-001", error: { name: "ProviderAuthError", data: { message: "Auth failed" } } } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("ProviderAuthError");
    });

    it("should extract error message correctly", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.error", properties: { sessionID: "error-session-001", error: { name: "ApiError", data: { message: "Specific error message" } } } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("Specific error message");
    });

    it("should show Unknown error fallback when error is undefined", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.error", properties: { sessionID: "error-session-001", error: undefined } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("Unknown error");
      expect(callArgs.body.message).toContain("Unknown message");
    });

    it("should show Unknown message fallback when data is missing", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.error", properties: { sessionID: "error-session-001", error: { name: "SomeError" } as any } };
      await plugin.event({ event });
      const callArgs = mockClient.tui.showToast.mock.calls[0][0];
      expect(callArgs.body.message).toContain("Unknown message");
    });
  });

  describe("session.diff", () => {
    it("should not trigger toast when disabled in config", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.diff", properties: { sessionID: "diff-session-001", diff: [] } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe("session.status", () => {
    it("should not trigger toast", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.status", properties: { sessionID: "status-session-001", status: { type: "idle" } } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it("should complete without error", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.status", properties: { sessionID: "status-session-001", status: { type: "idle" } } };
      await expect(plugin.event({ event })).resolves.not.toThrow();
    });
  });

  describe("session.updated", () => {
    it("should not trigger toast", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.updated", properties: { info: createMockSession("updated-session-001") } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it("should complete without error", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "session.updated", properties: { info: createMockSession("updated-session-001") } };
      await expect(plugin.event({ event })).resolves.not.toThrow();
    });
  });

  describe("server.instance.disposed", () => {
    it("should run session-stop.sh script", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "server.instance.disposed", properties: { directory: "/test/dir" } };
      await plugin.event({ event });
      expect(runScript).toHaveBeenCalledTimes(1);
      expect(runScript).toHaveBeenCalledWith(mockDollar, "session-stop.sh");
    });

    it("should not trigger toast", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const event = { type: "server.instance.disposed", properties: { directory: "/test/dir" } };
      await plugin.event({ event });
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe("tool.execute.after handler", () => {
    it("should trigger toast when tool is task", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: "task", sessionID: "session-123", callID: "call-456", args: { subagent_type: "explore" } };
      const output = { title: "Task completed", output: "result", metadata: {} };
      await plugin["tool.execute.after"](input, output);
      expect(mockClient.tui.showToast).toHaveBeenCalledTimes(1);
    });

    it("should not trigger toast for non-task tools", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: "read", sessionID: "session-123", callID: "call-456", args: {} };
      const output = { title: "Read completed", output: "result", metadata: {} };
      await plugin["tool.execute.after"](input, output);
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });

    it("should not trigger toast when subagent_type is undefined", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const input = { tool: "task", sessionID: "session-123", callID: "call-456", args: {} };
      const output = { title: "Task completed", output: "result", metadata: {} };
      await plugin["tool.execute.after"](input, output);
      expect(mockClient.tui.showToast).not.toHaveBeenCalled();
    });
  });

  describe("saveToFile", () => {
    it("should be called for enabled events with logToFile", async () => {
      const ctx = { client: mockClient, $: mockDollar };
      const plugin = await OpencodeHooks(ctx);
      const events = [
        { type: "session.created", properties: { info: createMockSession() } },
        { type: "session.compacted", properties: { sessionID: "123" } },
        { type: "session.deleted", properties: { info: createMockSession() } },
        { type: "session.idle", properties: { sessionID: "123" } },
        { type: "session.error", properties: { sessionID: "123", error: undefined } },
        { type: "session.diff", properties: { sessionID: "123", diff: [] } },
        { type: "session.status", properties: { sessionID: "123", status: { type: "idle" } } },
        { type: "session.updated", properties: { info: createMockSession() } },
      ];
      for (const event of events) {
        await plugin.event({ event });
      }
      expect(saveToFile).toHaveBeenCalledTimes(11);
    });
  });
});
