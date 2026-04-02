import { saveToFile } from "../.opencode/plugins/helpers/save-to-file";
import * as fs from "fs/promises";

jest.mock("fs/promises", () => ({
  appendFile: jest.fn().mockResolvedValue(undefined),
}));

const mockAppendFile = fs.appendFile as jest.MockedFunction<typeof fs.appendFile>;

describe("save-to-file", () => {
  const LOG_DIR = "./production/session-logs";
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should save content to default log file", async () => {
    const content = "Test content";
    await saveToFile({ content });

    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/./session_events.log`,
      expect.stringContaining("Test content")
    );
  });

  it("should save content to custom filename", async () => {
    const content = "Test content";
    const customFile = "./custom.log";
    await saveToFile({ content, filename: customFile });

    expect(mockAppendFile).toHaveBeenCalledTimes(1);
    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/${customFile}`,
      expect.stringContaining("Test content")
    );
  });

  it("should trim and format content correctly", async () => {
    const content = "  Test  content  \n  with  spaces  ";
    await saveToFile({ content });

    expect(mockAppendFile).toHaveBeenCalledWith(
      `${LOG_DIR}/./session_events.log`,
      expect.stringContaining("Test")
    );
  });
});