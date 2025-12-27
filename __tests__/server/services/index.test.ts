"use client";

import { LlamaService } from "@/server/services/index";

import type {
  LlamaServerConfig,
  LlamaModel,
  LlamaServiceStatus,
  LlamaServiceState,
} from "@/server/services/index";

describe("Services Index Re-exports", () => {
  describe("LlamaService class", () => {
    it("should export LlamaService class", () => {
      expect(LlamaService).toBeDefined();
      expect(typeof LlamaService).toBe("function");
    });

    it("should be instantiable", () => {
      const mockConfig = {
        port: 8080,
        host: "localhost",
      };

      expect(() => {
        new LlamaService(mockConfig as LlamaServerConfig);
      }).not.toThrow();
    });
  });

  describe("Type exports", () => {
    it("should export LlamaServerConfig type", () => {
      const config: LlamaServerConfig = {
        port: 8080,
        host: "localhost",
      };
      expect(config.port).toBe(8080);
    });

    it("should export LlamaModel type", () => {
      const model: LlamaModel = {
        id: "test-model",
        name: "Test Model",
        size: 1000000,
        type: "gguf",
        modified_at: Date.now(),
      };
      expect(model.id).toBe("test-model");
    });

    it("should export LlamaServiceStatus type", () => {
      const status: LlamaServiceStatus = "initial";
      expect(status).toBe("initial");
    });

    it("should export LlamaServiceState type", () => {
      const state: LlamaServiceState = {
        status: "initial",
        models: [],
        lastError: null,
        retries: 0,
        uptime: 0,
        startedAt: null,
      };
      expect(state.status).toBe("initial");
    });
  });

  describe("Type validation", () => {
    it("should allow valid LlamaServerConfig values", () => {
      const validConfig: LlamaServerConfig = {
        port: 8080,
        host: "localhost",
      };
      expect(validConfig).toBeDefined();
    });

    it("should allow valid LlamaModel values", () => {
      const validModel: LlamaModel = {
        id: "model-123",
        name: "Llama-2-7b",
        path: "/models/llama-2-7b.gguf",
        size: 4000000000,
        type: "gguf",
        modified_at: Date.now(),
      };
      expect(validModel).toBeDefined();
    });

    it("should allow valid LlamaServiceStatus values", () => {
      const validStatus: LlamaServiceStatus = "ready";
      expect(validStatus).toBeDefined();
    });

    it("should allow valid LlamaServiceState values", () => {
      const validState: LlamaServiceState = {
        status: "ready",
        models: [
          {
            id: "model-123",
            name: "Llama-2-7b",
            path: "/models/llama-2-7b.gguf",
            size: 4000000000,
            type: "gguf",
            modified_at: Date.now(),
          },
        ],
        lastError: null,
        retries: 0,
        uptime: 3600,
        startedAt: new Date(),
      };
      expect(validState).toBeDefined();
    });
  });

  describe("LlamaServiceStatus status types", () => {
    it("should accept valid status values", () => {
      const statuses: Array<LlamaServiceStatus> = ["initial", "starting", "ready", "error", "crashed", "stopping"];
      expect(statuses).toHaveLength(6);
    });
  });

  describe("Module exports", () => {
    it("should export all expected items", () => {
      expect(LlamaService).toBeDefined();
      expect(typeof LlamaService).toBe("function");
    });
  });
});
