import {
  loadEventsConfig,
  getEventConfig,
  isEventEnabled,
  resetConfigCache,
} from "../.opencode/plugins/helpers/events-config";
import * as fs from "fs/promises";
import * as path from "path";

jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
}));

jest.mock("../.opencode/plugins/helpers/save-to-file", () => ({
  saveToFile: jest.fn().mockResolvedValue(undefined),
}));

const mockReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;

describe("events-config", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetConfigCache();
  });

  describe("loadEventsConfig", () => {
    it("should load config from JSON file", async () => {
      const mockConfig = {
        version: "1.0.0",
        description: "Test config",
        enabled: true,
        toast: true,
        script: true,
        saveToFile: true,
        appendToSession: true,
        events: { "custom.event": true },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadEventsConfig();

      expect(config.enabled).toBe(true);
      expect(config.version).toBe("1.0.0");
    });

    it("should merge with default config", async () => {
      const mockConfig = {
        enabled: false,
        events: { "session.created": false },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

      const config = await loadEventsConfig();

      expect(config.enabled).toBe(false);
      expect(config.toast).toBe(true);
      expect(config.version).toBe("1.0.0");
    });

    it("should return default config on error", async () => {
      mockReadFile.mockRejectedValue(new Error("File not found"));

      const config = await loadEventsConfig();

      expect(config.enabled).toBe(true);
      expect(config.version).toBe("1.0.0");
    });

    it("should cache config after first load", async () => {
      const mockConfig = {
        version: "1.0.0",
        enabled: true,
        toast: true,
        script: true,
        saveToFile: true,
        appendToSession: true,
        events: {},
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

      await loadEventsConfig();
      await loadEventsConfig();

      expect(mockReadFile).toHaveBeenCalledTimes(1);
    });
  });

  describe("getEventConfig", () => {
    beforeEach(async () => {
      const mockConfig = {
        version: "1.0.0",
        description: "Test",
        enabled: true,
        toast: true,
        script: true,
        saveToFile: true,
        appendToSession: true,
        events: {
          "session.created": { enabled: false },
          "session.diff": { toast: false },
          "session.idle": false,
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));
      await loadEventsConfig();
    });

    it("should return event config when defined in JSON", () => {
      const config = getEventConfig("session.created");

      expect(config.enabled).toBe(false);
    });

    it("should merge event config with global defaults for partial config", () => {
      const config = getEventConfig("session.diff");

      expect(config.toast).toBe(false);
      expect(config.enabled).toBe(true);
      expect(config.script).toBe(true);
    });

    it("should handle boolean event config", () => {
      const config = getEventConfig("session.idle");

      expect(config.enabled).toBe(false);
    });

    it("should return global defaults when event not in config", () => {
      const config = getEventConfig("session.unknown");

      expect(config.enabled).toBe(true);
      expect(config.toast).toBe(true);
      expect(config.script).toBe(true);
    });
  });

  describe("isEventEnabled", () => {
    beforeEach(async () => {
      const mockConfig = {
        version: "1.0.0",
        enabled: true,
        toast: true,
        script: true,
        saveToFile: true,
        appendToSession: true,
        events: {
          "session.disabled": false,
          "session.partial": { enabled: false },
        },
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));
      await loadEventsConfig();
    });

    it("should return true when event enabled", () => {
      expect(isEventEnabled("session.unknown")).toBe(true);
    });

    it("should return false when event disabled via boolean", () => {
      expect(isEventEnabled("session.disabled")).toBe(false);
    });

    it("should return false when event disabled via object", () => {
      expect(isEventEnabled("session.partial")).toBe(false);
    });
  });

  describe("resetConfigCache", () => {
    it("should clear cached config", async () => {
      const mockConfig = {
        version: "1.0.0",
        enabled: true,
        toast: true,
        script: true,
        saveToFile: true,
        appendToSession: true,
        events: {},
      };
      mockReadFile.mockResolvedValue(JSON.stringify(mockConfig));

      await loadEventsConfig();
      resetConfigCache();
      await loadEventsConfig();

      expect(mockReadFile).toHaveBeenCalledTimes(2);
    });
  });
});