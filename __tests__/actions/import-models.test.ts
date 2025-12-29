import { importModelsFromLlamaServer } from "@/actions/import-models";
import { LlamaServerIntegration } from "@/server/services/LlamaServerIntegration";
import * as db from "@/lib/database";

jest.mock("@/server/services/LlamaServerIntegration");
jest.mock("@/lib/database");

describe("import-models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.LLAMA_SERVER_PATH = "/path/to/llama-server";
    process.env.LLAMA_SERVER_HOST = "localhost";
    process.env.LLAMA_SERVER_PORT = "8134";
    process.env.LLAMA_SERVER_BASE_PATH = "/path/to/models";
  });

  describe("importModelsFromLlamaServer", () => {
    it("should import new models from llama-server", async () => {
      const llamaModels = [
        { name: "model1", parameters: { ctx_size: 2048, batch_size: 512 } },
        { name: "model2", parameters: { ctx_size: 4096, batch_size: 1024 } },
      ];

      const mockInstance = {
        getModels: jest.fn().mockResolvedValue(llamaModels),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );
      (db.getModels as jest.Mock).mockReturnValue([]);
      (db.saveModel as jest.Mock)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });

      const result = await importModelsFromLlamaServer();

      expect(result.success).toBe(true);
      expect(result.data.imported).toBe(2);
      expect(result.data.skipped).toBe(0);
      expect(db.saveModel).toHaveBeenCalledTimes(2);
    });

    it("should skip existing models", async () => {
      const llamaModels = [
        { name: "model1", parameters: { ctx_size: 2048, batch_size: 512 } },
      ];

      const existingModels = [{ id: 1, name: "model1", type: "llama" }];

      const mockInstance = {
        getModels: jest.fn().mockResolvedValue(llamaModels),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );
      (db.getModels as jest.Mock).mockReturnValue(existingModels);

      const result = await importModelsFromLlamaServer();

      expect(result.success).toBe(true);
      expect(result.data.imported).toBe(0);
      expect(result.data.skipped).toBe(1);
      expect(db.saveModel).not.toHaveBeenCalled();
    });

    it("should handle mixed import and skip", async () => {
      const llamaModels = [
        { name: "model1", parameters: { ctx_size: 2048, batch_size: 512 } },
        { name: "model2", parameters: { ctx_size: 4096, batch_size: 1024 } },
      ];

      const existingModels = [{ id: 1, name: "model1", type: "llama" }];

      const mockInstance = {
        getModels: jest.fn().mockResolvedValue(llamaModels),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );
      (db.getModels as jest.Mock).mockReturnValue(existingModels);
      (db.saveModel as jest.Mock).mockResolvedValue({ id: 2 });

      const result = await importModelsFromLlamaServer();

      expect(result.success).toBe(true);
      expect(result.data.imported).toBe(1);
      expect(result.data.skipped).toBe(1);
      expect(db.saveModel).toHaveBeenCalledTimes(1);
    });

    it("should handle empty models list", async () => {
      const mockInstance = {
        getModels: jest.fn().mockResolvedValue([]),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );
      (db.getModels as jest.Mock).mockReturnValue([]);

      const result = await importModelsFromLlamaServer();

      expect(result.success).toBe(true);
      expect(result.data.imported).toBe(0);
      expect(result.data.skipped).toBe(0);
    });

    it("should handle errors from llama-server", async () => {
      const error = new Error("Connection failed");
      const mockInstance = {
        getModels: jest.fn().mockRejectedValue(error),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );

      const result = await importModelsFromLlamaServer();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
    });

    it("should handle database save errors", async () => {
      const llamaModels = [
        { name: "model1", parameters: { ctx_size: 2048, batch_size: 512 } },
      ];

      const mockInstance = {
        getModels: jest.fn().mockResolvedValue(llamaModels),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );
      (db.getModels as jest.Mock).mockReturnValue([]);
      (db.saveModel as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await importModelsFromLlamaServer();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should create model with correct structure", async () => {
      const llamaModels = [
        {
          name: "test-model",
          parameters: {
            ctx_size: 3000,
            batch_size: 256,
            model_path: "/path/to/model.gguf",
          },
        },
      ];

      const mockInstance = {
        getModels: jest.fn().mockResolvedValue(llamaModels),
      };

      (LlamaServerIntegration as jest.Mock).mockImplementation(
        () => mockInstance
      );
      (db.getModels as jest.Mock).mockReturnValue([]);
      (db.saveModel as jest.Mock).mockResolvedValue({ id: 1 });

      await importModelsFromLlamaServer();

      const savedModel = (db.saveModel as jest.Mock).mock.calls[0][0];
      expect(savedModel.name).toBe("test-model");
      expect(savedModel.type).toBe("llama");
      expect(savedModel.status).toBe("idle");
      expect(savedModel.parameters.ctx_size).toBe(3000);
      expect(savedModel.parameters.batch_size).toBe(256);
    });
  });
});
