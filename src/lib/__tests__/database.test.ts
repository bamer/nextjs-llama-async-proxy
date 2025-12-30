// Mock path first
jest.mock("path", () => ({
  join: jest.fn(() => "/mock/db/path"),
}));

// Mock fs
jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  statSync: jest.fn(),
}));

// Mock better-sqlite3
jest.mock("better-sqlite3", () => jest.fn());

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import {
  initDatabase,
  closeDatabase,
  getDatabaseSize,
  saveMetrics,
  getMetricsHistory,
  getLatestMetrics,
  saveModel,
  getModels,
  getModelById,
  setMetadata,
  getMetadata,
  vacuumDatabase,
  exportDatabase,
} from "@/lib/database";

// Mock console
const mockConsole = {
  error: jest.fn(),
};
global.console = mockConsole as any;

describe("database", () => {
  const mockDb = {
    pragma: jest.fn(),
    exec: jest.fn(),
    prepare: jest.fn().mockReturnValue({
      run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
      all: jest.fn(),
      get: jest.fn(),
    }),
    close: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Database as jest.MockedFunction<typeof Database>).mockReturnValue(mockDb as any);
    (fs.statSync as jest.Mock).mockReturnValue({ size: 1024 });
  });

  describe("initDatabase", () => {
    it("should initialize database with correct options", () => {
      const db = initDatabase();

      expect(Database).toHaveBeenCalledWith("/mock/db/path", {
        readonly: false,
        fileMustExist: false,
        timeout: 5000,
      });
      expect(mockDb.pragma).toHaveBeenCalledWith("journal_mode = WAL");
      expect(mockDb.exec).toHaveBeenCalled();
      expect(db).toBe(mockDb);
    });
  });

  describe("closeDatabase", () => {
    it("should close the database", () => {
      closeDatabase(mockDb as any);

      expect(mockDb.close).toHaveBeenCalled();
    });
  });

  describe("getDatabaseSize", () => {
    it("should return file size", () => {
      const size = getDatabaseSize();

      expect(fs.statSync).toHaveBeenCalledWith("/mock/db/path");
      expect(size).toBe(1024);
    });
  });

  describe("saveMetrics", () => {
    it("should save metrics data", () => {
      const mockStmt = {
        run: jest.fn().mockReturnValue({ lastInsertRowid: 1 }),
      };
      const mockCleanupStmt = {
        run: jest.fn(),
      };
      mockDb.prepare
        .mockReturnValueOnce(mockStmt)
        .mockReturnValueOnce(mockCleanupStmt);

      const metrics = {
        cpu_usage: 50,
        memory_usage: 60,
        gpu_usage: 40,
      };

      saveMetrics(metrics);

      expect(mockStmt.run).toHaveBeenCalledWith(
        expect.any(Number), // timestamp
        50, 60, 0, 40, 0, 0, 0, 0, 0, 0, 0,
        expect.any(Number) // created_at
      );
      expect(mockCleanupStmt.run).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe("getMetricsHistory", () => {
    it("should return metrics history", () => {
      const mockStmt = {
        all: jest.fn().mockReturnValue([
          {
            id: 1,
            timestamp: Date.now(),
            cpu_usage: 50,
            created_at: Date.now(),
          },
        ]),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const history = getMetricsHistory(5);

      expect(mockStmt.all).toHaveBeenCalledWith(expect.any(Number));
      expect(history).toHaveLength(1);
      expect(history[0].cpu_usage).toBe(50);
    });
  });

  describe("getLatestMetrics", () => {
    it("should return latest metrics when available", () => {
      const mockStmt = {
        get: jest.fn().mockReturnValue({
          cpu_usage: 45,
          memory_usage: 55,
        }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const latest = getLatestMetrics();

      expect(latest).toEqual({
        cpu_usage: 45,
        memory_usage: 55,
      });
    });

    it("should return null when no metrics", () => {
      const mockStmt = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const latest = getLatestMetrics();

      expect(latest).toBeNull();
    });
  });

  describe("saveModel", () => {
    it("should save model and return id", () => {
      const mockStmt = {
        run: jest.fn().mockReturnValue({ lastInsertRowid: 123 }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const modelConfig = {
        name: "test-model",
        type: "llama" as const,
        status: "stopped" as const,
        ctx_size: 4096,
      };

      const id = saveModel(modelConfig);

      expect(id).toBe(123);
    });
  });

  describe("getModels", () => {
    it("should return all models without filters", () => {
      const mockStmt = {
        all: jest.fn().mockReturnValue([
          { id: 1, name: "model1" },
          { id: 2, name: "model2" },
        ]),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const models = getModels();

      expect(mockStmt.all).toHaveBeenCalledWith();
      expect(models).toHaveLength(2);
    });
  });

  describe("getModelById", () => {
    it("should return model when found", () => {
      const mockStmt = {
        get: jest.fn().mockReturnValue({ id: 1, name: "test-model" }),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const model = getModelById(1);

      expect(mockStmt.get).toHaveBeenCalledWith(1);
      expect(model).toEqual({ id: 1, name: "test-model" });
    });

    it("should return null when not found", () => {
      const mockStmt = {
        get: jest.fn().mockReturnValue(undefined),
      };
      mockDb.prepare.mockReturnValue(mockStmt);

      const model = getModelById(999);

      expect(model).toBeNull();
    });
  });

  describe("metadata functions", () => {
    describe("setMetadata", () => {
      it("should set metadata", () => {
        const mockStmt = {
          run: jest.fn(),
        };
        mockDb.prepare.mockReturnValue(mockStmt);

        setMetadata("test-key", "test-value");

        expect(mockStmt.run).toHaveBeenCalledWith("test-key", "test-value", expect.any(Number));
      });
    });

    describe("getMetadata", () => {
      it("should return metadata value when found", () => {
        const mockStmt = {
          get: jest.fn().mockReturnValue({ value: "test-value" }),
        };
        mockDb.prepare.mockReturnValue(mockStmt);

        const value = getMetadata("test-key");

        expect(value).toBe("test-value");
      });

      it("should return null when not found", () => {
        const mockStmt = {
          get: jest.fn().mockReturnValue(undefined),
        };
        mockDb.prepare.mockReturnValue(mockStmt);

        const value = getMetadata("missing-key");

        expect(value).toBeNull();
      });
    });
  });

  describe("vacuumDatabase", () => {
    it("should vacuum database", () => {
      const mockConsole = { log: jest.fn() };
      global.console = mockConsole as any;

      vacuumDatabase();

      expect(mockDb.pragma).toHaveBeenCalledWith("wal_checkpoint(TRUNCATE)");
      expect(mockDb.exec).toHaveBeenCalledWith("VACUUM");
      expect(mockConsole.log).toHaveBeenCalledWith("Database vacuumed successfully");
    });
  });

  describe("exportDatabase", () => {
    it("should export database", () => {
      const mockConsole = { log: jest.fn() };
      global.console = mockConsole as any;

      exportDatabase("/path/to/export.db");

      expect(mockDb.exec).toHaveBeenCalledWith("VACUUM INTO '/path/to/export.db'");
      expect(mockConsole.log).toHaveBeenCalledWith("Database exported to /path/to/export.db");
    });
  });
});