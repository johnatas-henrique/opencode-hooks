import { runScript } from "../.opencode/plugins/helpers/run-script";

describe("run-script", () => {
  let mockDollar: any;

  beforeEach(() => {
    mockDollar = jest.fn((strings: any) => {
      const result = {
        quiet: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue("script output"),
        }),
      };
      return result;
    });
  });

  it("should run script without arguments", async () => {
    const result = await runScript(mockDollar as any, "test-script.sh");

    expect(mockDollar).toHaveBeenCalled();
    expect(result).toBe("script output");
  });

  it("should run script with arguments", async () => {
    const result = await runScript(mockDollar as any, "test-script.sh", "arg1", "arg2");

    expect(mockDollar).toHaveBeenCalled();
    expect(result).toBe("script output");
  });

  it("should return output text from script", async () => {
    const customResult = "custom output";
    mockDollar = jest.fn((strings: any) => {
      return {
        quiet: jest.fn().mockReturnValue({
          text: jest.fn().mockReturnValue(customResult),
        }),
      };
    });

    const result = await runScript(mockDollar as any, "test-script.sh");

    expect(result).toBe(customResult);
  });
});