import { countActiveModels } from "@/utils/chart-utils";
import { createMockModel, createMockModels } from "./chart-utils.test-utils";

describe("chart-utils - Validation", () => {
  describe("countActiveModels", () => {
    it("counts models with running status", () => {
      const models = [
        createMockModel("1", "Model 1", "running"),
        createMockModel("2", "Model 2", "idle"),
        createMockModel("3", "Model 3", "running"),
        createMockModel("4", "Model 4", "error"),
        createMockModel("5", "Model 5", "running"),
      ];

      const result = countActiveModels(models);
      expect(result).toBe(3);
    });

    it("returns 0 for empty array", () => {
      const result = countActiveModels([]);
      expect(result).toBe(0);
    });

    it("returns 0 when no models are running", () => {
      const idleModels = [
        createMockModel("1", "Model 1", "idle"),
        createMockModel("2", "Model 2", "error"),
      ];

      const result = countActiveModels(idleModels);
      expect(result).toBe(0);
    });

    it("counts all models when all are running", () => {
      const allRunning = createMockModels(5, 5);

      const result = countActiveModels(allRunning);
      expect(result).toBe(5);
    });

    it("handles single running model", () => {
      const singleRunning = [createMockModel("1", "Model 1", "running")];

      const result = countActiveModels(singleRunning);
      expect(result).toBe(1);
    });

    it("handles different status values", () => {
      const mixedStatus = [
        createMockModel("1", "Model 1", "running"),
        createMockModel("2", "Model 2", "loading"),
        createMockModel("3", "Model 3", "error"),
      ];

      const result = countActiveModels(mixedStatus);
      expect(result).toBe(1);
    });

    it("handles large number of models", () => {
      const manyModels = createMockModels(100, 50);

      const result = countActiveModels(manyModels);
      expect(result).toBe(50);
    });
  });
});
