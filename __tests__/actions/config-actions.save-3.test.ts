import { saveModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - save config part 3", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should throw error for invalid config type in save", async () => {
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      saveModelConfig(1, "invalid" as any, {})
    ).rejects.toThrow("Invalid config type: invalid");
  });

  it("should throw error with correct message for invalid config type", async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await saveModelConfig(1, "unknown" as any, {});
      fail("Expected error to be thrown");
    } catch (error) {
      expect((error as Error).message).toBe("Invalid config type: unknown");
    }
  });

  it("should handle empty config objects", async () => {
    (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

    await expect(
      saveModelConfig(1, "sampling", {})
    ).resolves.not.toThrow();

    expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, {});
  });

  it("should handle null/undefined values in config", async () => {
    const configWithNulls = {
      temperature: null,
      top_p: undefined,
    };
    (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

    await saveModelConfig(1, "sampling", configWithNulls);

    expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, configWithNulls);
  });

  it("should handle complex nested config objects", async () => {
    const complexConfig = {
      nested: {
        value: 1,
        array: [1, 2, 3],
      },
      string: "test",
      boolean: true,
      number: 123,
    };
    (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);

    await saveModelConfig(1, "sampling", complexConfig);

    expect(db.saveModelSamplingConfig).toHaveBeenCalledWith(1, complexConfig);
  });

  it("should handle transaction-like scenarios", async () => {
    (db.saveModelSamplingConfig as jest.Mock).mockResolvedValue(1);
    (db.saveModelMemoryConfig as jest.Mock).mockResolvedValue(2);
    (db.saveModelGpuConfig as jest.Mock).mockResolvedValue(3);

    await Promise.all([
      saveModelConfig(1, "sampling", { temp: 0.7 }),
      saveModelConfig(1, "memory", { cache_ram: 1000 }),
      saveModelConfig(1, "gpu", { gpu_layers: 20 }),
    ]);

    expect(db.saveModelSamplingConfig).toHaveBeenCalled();
    expect(db.saveModelMemoryConfig).toHaveBeenCalled();
    expect(db.saveModelGpuConfig).toHaveBeenCalled();
  });
});
