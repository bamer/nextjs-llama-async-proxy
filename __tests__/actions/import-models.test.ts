import { importModelsFromLlamaServer } from "@/actions/import-models";

describe("import-models", () => {
  describe("importModelsFromLlamaServer", () => {
    it("should throw deprecation error when called", async () => {
      await expect(importModelsFromLlamaServer()).rejects.toThrow(
        "importModelsFromLlamaServer() is deprecated - use WebSocket rescanModels event instead"
      );
    });

    it("should throw error with exact deprecation message", async () => {
      try {
        await importModelsFromLlamaServer();
        fail("Expected function to throw");
      } catch (error) {
        expect((error as Error).message).toBe(
          "importModelsFromLlamaServer() is deprecated - use WebSocket rescanModels event instead"
        );
      }
    });

    it("should always throw regardless of context", async () => {
      // Test multiple calls
      await expect(importModelsFromLlamaServer()).rejects.toThrow();
      await expect(importModelsFromLlamaServer()).rejects.toThrow();
      await expect(importModelsFromLlamaServer()).rejects.toThrow();
    });

    it("should return an Error object", async () => {
      try {
        await importModelsFromLlamaServer();
        fail("Expected function to throw");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error).toHaveProperty("message");
      }
    });

    it("should not accept any parameters", async () => {
      // @ts-expect-error - Testing that parameters are ignored
      await expect(importModelsFromLlamaServer({})).rejects.toThrow();
    });
  });
});
