import { loadModelConfig, saveModelConfig } from "@/actions/config-actions";
import * as db from "@/lib/database";

jest.mock("@/lib/database");

describe("config-actions - error handling", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  describe("Error handling and logging", () => {
    it("should log error when loading config fails", async () => {
      const error = new Error("Load error");
      (db.getModelSamplingConfig as jest.Mock).mockRejectedValue(error);

      try {
        await loadModelConfig(1, "sampling");
        fail("Expected error to be thrown");
      } catch {
        // Error should be thrown and logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error loading sampling config:",
          error
        );
      }
    });

    it("should log error when saving config fails", async () => {
      const error = new Error("Save error");
      (db.saveModelSamplingConfig as jest.Mock).mockRejectedValue(error);

      try {
        await saveModelConfig(1, "sampling", {});
        fail("Expected error to be thrown");
      } catch {
        // Error should be thrown and logged
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error saving sampling config:",
          error
        );
      }
    });

    it("should preserve original error stack trace", async () => {
      const originalError = new Error("Original error");
      (db.getModelSamplingConfig as jest.Mock).mockRejectedValue(originalError);

      try {
        await loadModelConfig(1, "sampling");
        fail("Expected error to be thrown");
      } catch (error) {
        expect((error as Error).stack).toBeDefined();
        expect((error as Error).message).toBe("Original error");
      }
    });
  });
});
