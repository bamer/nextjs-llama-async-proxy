/**
 * Models Repository Branch Coverage Tests
 * Comprehensive branch coverage tests for all CRUD operation branches
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { ModelsRepository } from "../../../server/db/models-repository.js";

describe("ModelsRepository Branch Coverage", () => {
  let mockDb;
  let mockStmtAll;
  let mockStmtGet;
  let mockStmtRun;
  let mockStmtDelete;
  let repository;

  beforeEach(() => {
    jest.clearAllMocks();

    mockStmtAll = {
      all: jest.fn().mockReturnValue([]),
    };

    mockStmtGet = {
      get: jest.fn().mockReturnValue(null),
    };

    mockStmtRun = {
      run: jest.fn().mockReturnValue({ changes: 1 }),
    };

    mockStmtDelete = {
      run: jest.fn().mockReturnValue({ changes: 0 }),
    };

    mockDb = {
      prepare: jest.fn((query) => {
        if (query.includes("SELECT * FROM models ORDER BY created_at DESC")) {
          return mockStmtAll;
        }
        if (query.includes("SELECT * FROM models WHERE id = ?")) {
          return mockStmtGet;
        }
        if (query.includes("INSERT OR REPLACE")) {
          return mockStmtRun;
        }
        if (query.includes("UPDATE models SET")) {
          return mockStmtRun;
        }
        if (query.includes("DELETE FROM models WHERE id = ?")) {
          return mockStmtDelete;
        }
        return mockStmtRun;
      }),
    };

    repository = new ModelsRepository(mockDb);
  });

  describe("save() - getValue function branches", () => {
    /**
     * Objective: Test getValue function branches for array handling
     * Test: Pass array with first element to use the val[0] branch
     */
    it("should use first element when array has values in getValue", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        name: "Test",
        parameters: ["firstValue", "secondValue"], // Array with values
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // parameters goes through getValue which takes val[0] = "firstValue"
      // Then JSON.stringify("firstValue")
      expect(callArgs[4]).toBe('"firstValue"');
    });

    /**
     * Objective: Test getValue function when array is empty
     * Test: Pass empty array to use default value
     */
    it("should use default value when array is empty in getValue", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        name: "Test",
        parameters: [], // Empty array
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // Empty array through getValue: val[0] is undefined, so uses default (0)
      // Then JSON.stringify(0)
      expect(callArgs[4]).toBe("0");
    });

    /**
     * Objective: Test getValue function for undefined handling
     * Test: Pass undefined to trigger the undefined branch
     */
    it("should use default value when value is undefined in getValue", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        name: "Test",
        parameters: undefined, // Explicitly undefined
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // undefined triggers default value (0)
      expect(callArgs[4]).toBe("0");
    });

    /**
     * Objective: Test getValue function for null handling
     * Test: Pass null to trigger the null branch
     */
    it("should use default value when value is null in getValue", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        name: "Test",
        parameters: null, // Explicitly null
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // null triggers default value (0)
      expect(callArgs[4]).toBe("0");
    });

    /**
     * Objective: Test getValue function for normal value handling
     * Test: Pass normal value to return val branch
     */
    it("should use original value when value is normal in getValue", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);
      const params = { temperature: 0.7, max_tokens: 100 };

      repository.save({
        name: "Test",
        parameters: params, // Normal object value
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // Normal value goes through: JSON.stringify(params)
      expect(callArgs[4]).toBe(JSON.stringify(params));
    });

    /**
     * Objective: Test getValue function with falsy first element in array
     * Test: Pass array with falsy first element (0)
     */
    it("should use default when array first element is falsy in getValue", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        name: "Test",
        parameters: [0, "second"], // First element is 0 (falsy)
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // val[0] = 0 is falsy, so uses default (0)
      expect(callArgs[4]).toBe("0");
    });
  });

  describe("save() - ID generation branches", () => {
    /**
     * Objective: Test save with provided ID
     * Test: When model.id is provided, use it instead of generating
     */
    it("should use provided ID when model.id exists", () => {
      const savedModel = { id: "my_custom_id", name: "Test Model" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ id: "my_custom_id", name: "Test Model" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[0]).toBe("my_custom_id");
    });

    /**
     * Objective: Test save with auto-generated ID
     * Test: When model.id is not provided, generate one
     */
    it("should auto-generate ID when model.id is not provided", () => {
      const savedModel = { id: "model_123", name: "Test Model" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Test Model" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      const generatedId = callArgs[0];
      // Should start with "model_" followed by timestamp and random suffix
      expect(generatedId).toMatch(/^model_\d+_[a-z0-9]+$/);
    });

    /**
     * Objective: Test save with falsy ID value
     * Test: When model.id is empty string or 0, should generate new ID
     */
    it("should auto-generate ID when model.id is falsy (empty string)", () => {
      const savedModel = { id: "model_123", name: "Test" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ id: "", name: "Test" }); // Empty string is falsy

      const callArgs = mockStmtRun.run.mock.calls[0];
      // Empty string is falsy, so should generate ID
      expect(mockStmtRun.run).toHaveBeenCalled();
    });
  });

  describe("save() - default value branches", () => {
    /**
     * Objective: Test default value when type is not provided
     * Test: model.type || "llama" - when type is falsy, use "llama"
     */
    it("should use default type 'llama' when not provided", () => {
      const savedModel = { id: "model_123", type: "llama" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Test" }); // No type

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[2]).toBe("llama");
    });

    /**
     * Objective: Test provided type is used
     * Test: model.type || "llama" - when type is provided, use it
     */
    it("should use provided type when given", () => {
      const savedModel = { id: "model_123", type: "mistral" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Test", type: "mistral" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[2]).toBe("mistral");
    });

    /**
     * Objective: Test default value when status is not provided
     * Test: model.status || "idle"
     */
    it("should use default status 'idle' when not provided", () => {
      const savedModel = { id: "model_123", status: "idle" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Test" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[3]).toBe("idle");
    });

    /**
     * Objective: Test path fallback when model_path is not provided
     * Test: model.model_path || model.path || null
     */
    it("should use path fallback when model_path is null", () => {
      const savedModel = { id: "model_123", model_path: "/path/to/model.gguf" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Test", path: "/path/to/model.gguf" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[5]).toBe("/path/to/model.gguf");
    });

    /**
     * Objective: Test path fallback when both model_path and path are provided
     * Test: model_path takes precedence over path
     */
    it("should prefer model_path over path when both provided", () => {
      const savedModel = { id: "model_123", model_path: "/model_path.gguf" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        name: "Test",
        model_path: "/model_path.gguf",
        path: "/fallback.gguf",
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[5]).toBe("/model_path.gguf");
    });

    /**
     * Objective: Test all numeric defaults
     * Test: ctx_size, batch_size, threads, embedding_size, etc.
     */
    it("should use default numeric values when not provided", () => {
      const savedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Test" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // Index 9 = ctx_size default 4096
      expect(callArgs[9]).toBe(4096);
      // Index 10 = batch_size default 512
      expect(callArgs[10]).toBe(512);
      // Index 11 = threads default 4
      expect(callArgs[11]).toBe(4);
      // Index 14 = embedding_size default 0
      expect(callArgs[14]).toBe(0);
      // Index 15 = block_count default 0
      expect(callArgs[15]).toBe(0);
      // Index 16 = head_count default 0
      expect(callArgs[16]).toBe(0);
      // Index 17 = head_count_kv default 0
      expect(callArgs[17]).toBe(0);
      // Index 18 = ffn_dim default 0
      expect(callArgs[18]).toBe(0);
      // Index 19 = file_type default 0
      expect(callArgs[19]).toBe(0);
    });
  });

  describe("update() - allowed columns branches", () => {
    /**
     * Objective: Test update only includes allowed columns
     * Test: ALLOWED_UPDATE_COLUMNS.includes(k) - when column IS in list
     */
    it("should include only allowed columns in UPDATE query", () => {
      const updatedModel = { id: "model_123", name: "Updated" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", {
        name: "Updated Name",
        type: "mistral",
        status: "running",
      });

      const query = mockDb.prepare.mock.calls.find((call) =>
        call[0].includes("UPDATE models SET")
      )[0];
      expect(query).toContain("name = ?");
      expect(query).toContain("type = ?");
      expect(query).toContain("status = ?");
    });

    /**
     * Objective: Test update excludes disallowed columns
     * Test: ALLOWED_UPDATE_COLUMNS.includes(k) - when column is NOT in list
     */
    it("should exclude disallowed columns from UPDATE query", () => {
      const updatedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", {
        name: "Updated",
        invalid_column: "should be ignored",
        created_at: 999,
      });

      const query = mockDb.prepare.mock.calls.find((call) =>
        call[0].includes("UPDATE models SET")
      )[0];
      expect(query).toContain("name = ?");
      expect(query).not.toContain("invalid_column");
      expect(query).not.toContain("created_at");
    });

    /**
     * Objective: Test update with empty updates returns null
     * Test: set.length === 0 branch
     */
    it("should return null when updates object is empty", () => {
      const result = repository.update("model_123", {});
      expect(result).toBeNull();
      expect(mockStmtRun.run).not.toHaveBeenCalled();
    });

    /**
     * Objective: Test update with only disallowed columns returns null
     * Test: set.length === 0 when all columns filtered out
     */
    it("should return null when all updates are for disallowed columns", () => {
      const result = repository.update("model_123", {
        id: "new_id",
        created_at: 999,
        updated_at: 999,
      });
      expect(result).toBeNull();
      expect(mockStmtRun.run).not.toHaveBeenCalled();
    });
  });

  describe("update() - value serialization branches", () => {
    /**
     * Objective: Test update serializes array values to JSON
     * Test: Array.isArray(v) - when v IS an array
     */
    it("should serialize array values to JSON in update", () => {
      const updatedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", { quantization: ["Q4_K_M", "Q5_0"] });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[0]).toBe('["Q4_K_M","Q5_0"]');
    });

    /**
     * Objective: Test update serializes parameters object to JSON
     * Test: k === "parameters" - when updating parameters field
     */
    it("should serialize parameters object to JSON in update", () => {
      const updatedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", {
        parameters: { temperature: 0.7, max_tokens: 100 },
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[0]).toBe(JSON.stringify({ temperature: 0.7, max_tokens: 100 }));
    });

    /**
     * Objective: Test update handles non-array, non-parameters values as-is
     * Test: Array.isArray(v) false AND k !== "parameters"
     */
    it("should pass through non-array, non-parameters values unchanged", () => {
      const updatedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", {
        name: "Updated Name",
        status: "running",
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[0]).toBe("Updated Name");
      expect(callArgs[1]).toBe("running");
    });

    /**
     * Objective: Test update returns updated model
     * Test: After successful update, return getById result
     */
    it("should return the updated model after successful update", () => {
      const updatedModel = { id: "model_123", name: "Updated", updated_at: 999 };
      mockStmtGet.get.mockReturnValue(updatedModel);

      const result = repository.update("model_123", { name: "Updated" });

      expect(result).toEqual(updatedModel);
      expect(mockStmtGet.get).toHaveBeenCalledWith("model_123");
    });
  });

  describe("cleanupMissingFiles() - validation branches", () => {
    let testDir;

    function createGgufFile(filePath) {
      const buffer = Buffer.alloc(4);
      buffer.writeUInt32LE(0x46554747, 0);
      fs.writeFileSync(filePath, buffer);
    }

    beforeEach(() => {
      testDir = path.join(
        tmpdir(),
        `test-models-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      );
      fs.mkdirSync(testDir, { recursive: true });
    });

    afterEach(() => {
      if (testDir && fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
      }
    });

    /**
     * Objective: Test cleanup deletes invalid models
     * Test: validateModelEntry returns { valid: false } - the !valid branch
     */
    it("should delete models with no path (invalid)", () => {
      const mockModels = [{ id: "model_1", name: "No Path Model", model_path: null }];
      mockStmtAll.all.mockReturnValue(mockModels);

      const result = repository.cleanupMissingFiles();

      expect(result).toBe(1);
      expect(mockStmtDelete.run).toHaveBeenCalledWith("model_1");
    });

    /**
     * Objective: Test cleanup deletes models with missing files
     * Test: validateModelEntry returns { valid: false, reason: "file missing" }
     */
    it("should delete models with missing files", () => {
      const mockModels = [
        {
          id: "model_1",
          name: "Missing File Model",
          model_path: path.join(testDir, "nonexistent.gguf"),
        },
      ];
      mockStmtAll.all.mockReturnValue(mockModels);

      const result = repository.cleanupMissingFiles();

      expect(result).toBe(1);
      expect(mockStmtDelete.run).toHaveBeenCalledWith("model_1");
    });

    /**
     * Objective: Test cleanup skips valid models
     * Test: validateModelEntry returns { valid: true } - the valid branch
     */
    it("should skip models with valid files", () => {
      const validFile = path.join(testDir, "valid.gguf");
      createGgufFile(validFile);

      const mockModels = [{ id: "model_1", name: "Valid Model", model_path: validFile }];
      mockStmtAll.all.mockReturnValue(mockModels);

      const result = repository.cleanupMissingFiles();

      expect(result).toBe(0);
      expect(mockStmtDelete.run).not.toHaveBeenCalled();
    });

    /**
     * Objective: Test cleanup with mixed valid/invalid models
     * Test: Both valid and invalid branches in the loop
     */
    it("should handle mix of valid and invalid models", () => {
      const validFile = path.join(testDir, "valid.gguf");
      createGgufFile(validFile);

      const mockModels = [
        { id: "model_1", name: "Invalid 1", model_path: path.join(testDir, "missing1.gguf") },
        { id: "model_2", name: "Valid Model", model_path: validFile },
        { id: "model_3", name: "Invalid 2", model_path: path.join(testDir, "missing2.gguf") },
      ];
      mockStmtAll.all.mockReturnValue(mockModels);

      const result = repository.cleanupMissingFiles();

      expect(result).toBe(2);
      expect(mockStmtDelete.run).toHaveBeenCalledTimes(2);
    });

    /**
     * Objective: Test cleanup with no models
     * Test: Empty array - no iterations
     */
    it("should return 0 when no models exist", () => {
      mockStmtAll.all.mockReturnValue([]);

      const result = repository.cleanupMissingFiles();

      expect(result).toBe(0);
    });
  });

  describe("getAll() and getById() - simple branches", () => {
    /**
     * Objective: Test getAll returns empty array when no models
     * Test: Empty result from database
     */
    it("should return empty array when no models exist", () => {
      mockStmtAll.all.mockReturnValue([]);

      const result = repository.getAll();

      expect(result).toEqual([]);
    });

    /**
     * Objective: Test getAll returns all models
     * Test: Non-empty result from database
     */
    it("should return all models ordered by created_at DESC", () => {
      const mockModels = [
        { id: "model_1", name: "Model 1", created_at: 100 },
        { id: "model_2", name: "Model 2", created_at: 200 },
      ];
      mockStmtAll.all.mockReturnValue(mockModels);

      const result = repository.getAll();

      expect(result).toEqual(mockModels);
      expect(mockDb.prepare).toHaveBeenCalledWith("SELECT * FROM models ORDER BY created_at DESC");
    });

    /**
     * Objective: Test getById returns null for non-existent model
     * Test: Database returns null
     */
    it("should return null when model does not exist", () => {
      mockStmtGet.get.mockReturnValue(null);

      const result = repository.getById("non_existent_id");

      expect(result).toBeNull();
    });

    /**
     * Objective: Test getById returns model when exists
     * Test: Database returns model object
     */
    it("should return model when it exists", () => {
      const mockModel = { id: "model_123", name: "Test Model" };
      mockStmtGet.get.mockReturnValue(mockModel);

      const result = repository.getById("model_123");

      expect(result).toEqual(mockModel);
    });
  });

  describe("delete() - change tracking branches", () => {
    /**
     * Objective: Test delete returns true when model was deleted
     * Test: Database returns { changes: 1 }
     */
    it("should return true when model was deleted", () => {
      mockStmtDelete.run.mockReturnValue({ changes: 1 });

      const result = repository.delete("model_123");

      expect(result).toBe(true);
      expect(mockDb.prepare).toHaveBeenCalledWith("DELETE FROM models WHERE id = ?");
    });

    /**
     * Objective: Test delete returns false when model didn't exist
     * Test: Database returns { changes: 0 }
     */
    it("should return false when model did not exist", () => {
      mockStmtDelete.run.mockReturnValue({ changes: 0 });

      const result = repository.delete("non_existent");

      expect(result).toBe(false);
    });
  });

  describe("Edge cases and error handling", () => {
    /**
     * Objective: Test save with all fields at maximum values
     * Test: Verify all branches handle extreme values
     */
    it("should handle model with all fields provided", () => {
      const savedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({
        id: "custom_id",
        name: "Full Test Model",
        type: "custom",
        status: "active",
        parameters: { temperature: 1.0, max_tokens: 32768 },
        model_path: "/path/to/model.gguf",
        file_size: 8589934592, // 8GB
        params: 70000000000, // 70B
        quantization: "Q4_K_M",
        ctx_size: 8192,
        batch_size: 1024,
        threads: 16,
        embedding_size: 4096,
        block_count: 32,
        head_count: 32,
        head_count_kv: 8,
        ffn_dim: 14336,
        file_type: 1,
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      expect(callArgs[0]).toBe("custom_id");
      expect(callArgs[1]).toBe("Full Test Model");
      expect(callArgs[2]).toBe("custom");
      expect(callArgs[3]).toBe("active");
      expect(callArgs[4]).toBe(JSON.stringify({ temperature: 1.0, max_tokens: 32768 }));
      expect(callArgs[5]).toBe("/path/to/model.gguf");
      expect(callArgs[6]).toBe(8589934592);
      expect(callArgs[7]).toBe(70000000000);
      expect(callArgs[8]).toBe("Q4_K_M");
      expect(callArgs[9]).toBe(8192);
      expect(callArgs[10]).toBe(1024);
      expect(callArgs[11]).toBe(16);
      expect(callArgs[14]).toBe(4096);
      expect(callArgs[15]).toBe(32);
      expect(callArgs[16]).toBe(32);
      expect(callArgs[17]).toBe(8);
      expect(callArgs[18]).toBe(14336);
      expect(callArgs[19]).toBe(1);
    });

    /**
     * Objective: Test update with multiple allowed columns
     * Test: Verify all allowed columns work correctly
     */
    it("should handle update with multiple allowed columns", () => {
      const updatedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", {
        name: "Updated",
        type: "mistral",
        status: "loaded",
        ctx_size: 8192,
        batch_size: 1024,
        threads: 8,
      });

      const query = mockDb.prepare.mock.calls.find((call) =>
        call[0].includes("UPDATE models SET")
      )[0];
      expect(query).toContain("name = ?");
      expect(query).toContain("type = ?");
      expect(query).toContain("status = ?");
      expect(query).toContain("ctx_size = ?");
      expect(query).toContain("batch_size = ?");
      expect(query).toContain("threads = ?");
    });

    /**
     * Objective: Test update with zero values
     * Test: Verify zero values are preserved (not replaced with defaults)
     */
    it("should preserve zero values in update", () => {
      const updatedModel = { id: "model_123" };
      mockStmtGet.get.mockReturnValue(updatedModel);

      repository.update("model_123", {
        embedding_size: 0,
        block_count: 0,
        head_count: 0,
      });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // First 3 args should be the values (embedding_size, block_count, head_count)
      expect(callArgs[0]).toBe(0);
      expect(callArgs[1]).toBe(0);
      expect(callArgs[2]).toBe(0);
    });

    /**
     * Objective: Test save with only minimal fields
     * Test: Verify defaults are applied correctly
     */
    it("should use all defaults when only name is provided", () => {
      const savedModel = { id: "model_123", name: "Minimal" };
      mockStmtGet.get.mockReturnValue(savedModel);

      repository.save({ name: "Minimal" });

      const callArgs = mockStmtRun.run.mock.calls[0];
      // All defaults should be applied
      expect(callArgs[2]).toBe("llama"); // type
      expect(callArgs[3]).toBe("idle"); // status
      expect(callArgs[4]).toBe("{}"); // parameters (default {})
      expect(callArgs[5]).toBeNull(); // model_path
      expect(callArgs[6]).toBeNull(); // file_size
      expect(callArgs[7]).toBeNull(); // params
      expect(callArgs[8]).toBeNull(); // quantization
      expect(callArgs[9]).toBe(4096); // ctx_size
      expect(callArgs[10]).toBe(512); // batch_size
      expect(callArgs[11]).toBe(4); // threads
      expect(callArgs[14]).toBe(0); // embedding_size
      expect(callArgs[15]).toBe(0); // block_count
      expect(callArgs[16]).toBe(0); // head_count
      expect(callArgs[17]).toBe(0); // head_count_kv
      expect(callArgs[18]).toBe(0); // ffn_dim
      expect(callArgs[19]).toBe(0); // file_type
    });
  });
});
