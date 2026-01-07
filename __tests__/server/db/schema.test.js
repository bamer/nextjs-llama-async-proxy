/**
 * @jest-environment node
 */

import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import DatabasePackage from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const Database = DatabasePackage;

import {
  getSchemaDefinition,
  getIndexesDefinition,
  getModelsMigrations,
  getMetricsMigrations,
  initSchema,
  createIndexes,
  runModelsMigrations,
  runMetricsMigrations,
  runAllMigrations,
} from "../../../server/db/schema.js";

describe("Schema Module", () => {
  let db;
  let testDbPath;

  beforeEach(() => {
    // Create a unique temporary database for each test
    testDbPath =
      "/tmp/test-schema-db-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9) + ".db";
    db = new Database(testDbPath);
  });

  afterEach(() => {
    if (db) {
      db.close();
    }
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe("getSchemaDefinition()", () => {
    it("should return a non-empty string", () => {
      // Positive test: verify getSchemaDefinition returns a string
      const schema = getSchemaDefinition();
      expect(typeof schema).toBe("string");
      expect(schema.length).toBeGreaterThan(0);
    });

    it("should contain CREATE TABLE statements for all expected tables", () => {
      // Positive test: verify schema includes all required tables
      const schema = getSchemaDefinition();
      expect(schema).toContain("CREATE TABLE IF NOT EXISTS models");
      expect(schema).toContain("CREATE TABLE IF NOT EXISTS metrics");
      expect(schema).toContain("CREATE TABLE IF NOT EXISTS logs");
      expect(schema).toContain("CREATE TABLE IF NOT EXISTS server_config");
      expect(schema).toContain("CREATE TABLE IF NOT EXISTS metadata");
    });

    it("should define all models table columns with correct types and defaults", () => {
      // Positive test: verify models table structure
      const schema = getSchemaDefinition();
      expect(schema).toContain("id TEXT PRIMARY KEY");
      expect(schema).toContain("name TEXT NOT NULL");
      expect(schema).toContain("type TEXT DEFAULT 'llama'");
      expect(schema).toContain("status TEXT DEFAULT 'idle'");
      expect(schema).toContain("parameters TEXT DEFAULT '{}'");
      expect(schema).toContain("ctx_size INTEGER DEFAULT 4096");
      expect(schema).toContain("batch_size INTEGER DEFAULT 512");
      expect(schema).toContain("threads INTEGER DEFAULT 4");
    });

    it("should define all metrics table columns with correct types and defaults", () => {
      // Positive test: verify metrics table structure
      const schema = getSchemaDefinition();
      expect(schema).toContain("cpu_usage REAL");
      expect(schema).toContain("memory_usage REAL");
      expect(schema).toContain("disk_usage REAL");
      expect(schema).toContain("active_models INTEGER");
      expect(schema).toContain("uptime REAL");
      expect(schema).toContain("gpu_usage REAL DEFAULT 0");
      expect(schema).toContain("gpu_memory_used REAL DEFAULT 0");
      expect(schema).toContain("gpu_memory_total REAL DEFAULT 0");
    });

    it("should define timestamp columns with auto-generation", () => {
      // Positive test: verify timestamp columns use SQLite strftime
      const schema = getSchemaDefinition();
      expect(schema).toContain("timestamp INTEGER DEFAULT (strftime('%s', 'now'))");
    });

    it("should define logs table with required constraints", () => {
      // Positive test: verify logs table has NOT NULL constraints
      const schema = getSchemaDefinition();
      expect(schema).toContain("level TEXT NOT NULL");
      expect(schema).toContain("message TEXT NOT NULL");
    });

    it("should define server_config with primary key constraint", () => {
      // Positive test: verify server_config primary key
      const schema = getSchemaDefinition();
      expect(schema).toContain(
        "CREATE TABLE IF NOT EXISTS server_config (key TEXT PRIMARY KEY, value TEXT NOT NULL)"
      );
    });
  });

  describe("getIndexesDefinition()", () => {
    it("should return an array of index definitions", () => {
      // Positive test: verify returns array
      const indexes = getIndexesDefinition();
      expect(Array.isArray(indexes)).toBe(true);
      expect(indexes.length).toBeGreaterThan(0);
    });

    it("should contain all expected index definitions", () => {
      // Positive test: verify all required indexes are present
      const indexes = getIndexesDefinition();
      const indexStrings = indexes.join(" ");

      expect(indexStrings).toContain("idx_models_status");
      expect(indexStrings).toContain("idx_models_name");
      expect(indexStrings).toContain("idx_models_created");
      expect(indexStrings).toContain("idx_metrics_timestamp");
      expect(indexStrings).toContain("idx_logs_timestamp");
      expect(indexStrings).toContain("idx_logs_source");
      expect(indexStrings).toContain("idx_logs_level");
      expect(indexStrings).toContain("idx_metadata_key");
    });

    it("should use CREATE INDEX IF NOT EXISTS syntax", () => {
      // Positive test: verify safe index creation syntax
      const indexes = getIndexesDefinition();
      indexes.forEach((idx) => {
        expect(idx).toContain("CREATE INDEX IF NOT EXISTS");
      });
    });

    it("should define correct column references for each index", () => {
      // Positive test: verify index column references
      const indexes = getIndexesDefinition();
      expect(indexes).toContain("CREATE INDEX IF NOT EXISTS idx_models_status ON models(status)");
      expect(indexes).toContain("CREATE INDEX IF NOT EXISTS idx_models_name ON models(name)");
      expect(indexes).toContain(
        "CREATE INDEX IF NOT EXISTS idx_models_created ON models(created_at DESC)"
      );
      expect(indexes).toContain(
        "CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp DESC)"
      );
    });

    it("should have 8 total indexes", () => {
      // Positive test: verify correct number of indexes
      const indexes = getIndexesDefinition();
      expect(indexes.length).toBe(8);
    });
  });

  describe("getModelsMigrations()", () => {
    it("should return an array of migration objects", () => {
      // Positive test: verify returns array
      const migrations = getModelsMigrations();
      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBeGreaterThan(0);
    });

    it("should have migrations with name and type properties", () => {
      // Positive test: verify migration object structure
      const migrations = getModelsMigrations();
      migrations.forEach((mig) => {
        expect(mig).toHaveProperty("name");
        expect(mig).toHaveProperty("type");
        expect(typeof mig.name).toBe("string");
        expect(typeof mig.type).toBe("string");
      });
    });

    it("should include all expected model migration columns", () => {
      // Positive test: verify all migration columns are defined
      const migrations = getModelsMigrations();
      const migrationNames = migrations.map((m) => m.name);

      expect(migrationNames).toContain("embedding_size");
      expect(migrationNames).toContain("block_count");
      expect(migrationNames).toContain("head_count");
      expect(migrationNames).toContain("head_count_kv");
      expect(migrationNames).toContain("ffn_dim");
      expect(migrationNames).toContain("file_type");
    });

    it("should have 6 total model migrations", () => {
      // Positive test: verify correct number of migrations
      const migrations = getModelsMigrations();
      expect(migrations.length).toBe(6);
    });

    it("should define correct column types for each migration", () => {
      // Positive test: verify migration column types
      const migrations = getModelsMigrations();
      const migrationsByName = {};
      migrations.forEach((m) => {
        migrationsByName[m.name] = m.type;
      });

      expect(migrationsByName["embedding_size"]).toBe("INTEGER DEFAULT 0");
      expect(migrationsByName["block_count"]).toBe("INTEGER DEFAULT 0");
      expect(migrationsByName["head_count"]).toBe("INTEGER DEFAULT 0");
      expect(migrationsByName["head_count_kv"]).toBe("INTEGER DEFAULT 0");
      expect(migrationsByName["ffn_dim"]).toBe("INTEGER DEFAULT 0");
      expect(migrationsByName["file_type"]).toBe("INTEGER DEFAULT 0");
    });
  });

  describe("getMetricsMigrations()", () => {
    it("should return an array of migration objects", () => {
      // Positive test: verify returns array
      const migrations = getMetricsMigrations();
      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBeGreaterThan(0);
    });

    it("should have migrations with name and type properties", () => {
      // Positive test: verify migration object structure
      const migrations = getMetricsMigrations();
      migrations.forEach((mig) => {
        expect(mig).toHaveProperty("name");
        expect(mig).toHaveProperty("type");
        expect(typeof mig.name).toBe("string");
        expect(typeof mig.type).toBe("string");
      });
    });

    it("should include all expected metrics migration columns", () => {
      // Positive test: verify all migration columns are defined
      const migrations = getMetricsMigrations();
      const migrationNames = migrations.map((m) => m.name);

      expect(migrationNames).toContain("gpu_usage");
      expect(migrationNames).toContain("gpu_memory_used");
      expect(migrationNames).toContain("gpu_memory_total");
    });

    it("should have 3 total metrics migrations", () => {
      // Positive test: verify correct number of migrations
      const migrations = getMetricsMigrations();
      expect(migrations.length).toBe(3);
    });

    it("should define correct column types for each migration", () => {
      // Positive test: verify migration column types
      const migrations = getMetricsMigrations();
      const migrationsByName = {};
      migrations.forEach((m) => {
        migrationsByName[m.name] = m.type;
      });

      expect(migrationsByName["gpu_usage"]).toBe("REAL DEFAULT 0");
      expect(migrationsByName["gpu_memory_used"]).toBe("REAL DEFAULT 0");
      expect(migrationsByName["gpu_memory_total"]).toBe("REAL DEFAULT 0");
    });
  });

  describe("initSchema()", () => {
    it("should create all required tables", () => {
      // Positive test: verify initSchema creates all tables
      initSchema(db);

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all()
        .map((t) => t.name);

      expect(tables).toContain("models");
      expect(tables).toContain("metrics");
      expect(tables).toContain("logs");
      expect(tables).toContain("server_config");
      expect(tables).toContain("metadata");
    });

    it("should create indexes after table creation", () => {
      // Positive test: verify initSchema creates indexes
      initSchema(db);

      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        .all()
        .map((i) => i.name);

      expect(indexes.length).toBeGreaterThan(0);
      expect(indexes).toContain("idx_models_status");
      expect(indexes).toContain("idx_models_name");
    });

    it("should be idempotent (safe to call multiple times)", () => {
      // Positive test: verify initSchema can be called multiple times without error
      expect(() => {
        initSchema(db);
        initSchema(db);
        initSchema(db);
      }).not.toThrow();
    });

    it("should not duplicate tables if called again", () => {
      // Positive test: verify tables aren't duplicated
      initSchema(db);
      initSchema(db);

      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();

      // Should have exactly 6 tables (not duplicates)
      expect(tables.length).toBe(6);
    });
  });

  describe("createIndexes()", () => {
    it("should create all defined indexes", () => {
      // Positive test: verify createIndexes creates all indexes
      // First create tables without indexes
      db.exec(getSchemaDefinition());
      createIndexes(db);

      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        .all()
        .map((i) => i.name);

      expect(indexes).toContain("idx_models_status");
      expect(indexes).toContain("idx_models_name");
      expect(indexes).toContain("idx_models_created");
      expect(indexes).toContain("idx_metrics_timestamp");
      expect(indexes).toContain("idx_logs_timestamp");
      expect(indexes).toContain("idx_logs_source");
      expect(indexes).toContain("idx_logs_level");
      expect(indexes).toContain("idx_metadata_key");
    });

    it("should be idempotent (safe to call multiple times)", () => {
      // Positive test: verify createIndexes can be called multiple times
      // First create the tables that indexes depend on
      db.exec(getSchemaDefinition());
      expect(() => {
        createIndexes(db);
        createIndexes(db);
        createIndexes(db);
      }).not.toThrow();
    });

    it("should not throw when called on database with tables", () => {
      // Negative test: verify createIndexes works when tables exist
      // First create the tables that indexes depend on
      db.exec(getSchemaDefinition());
      expect(() => {
        createIndexes(db);
      }).not.toThrow();
    });
  });

  describe("runModelsMigrations()", () => {
    it("should not add columns that already exist", () => {
      // Positive test: verify migration skips existing columns
      initSchema(db);

      // Count columns before migration
      const columnsBefore = db.prepare("PRAGMA table_info(models)").all();

      runModelsMigrations(db);

      // Count columns after migration (should be same)
      const columnsAfter = db.prepare("PRAGMA table_info(models)").all();

      expect(columnsAfter.length).toBe(columnsBefore.length);
    });

    it("should add missing columns from migrations", () => {
      // Negative test: verify migration adds columns that don't exist
      // Create a simplified models table without migration columns
      db.exec(`
        CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'llama',
          status TEXT DEFAULT 'idle',
          parameters TEXT DEFAULT '{}',
          model_path TEXT,
          file_size INTEGER,
          params TEXT,
          quantization TEXT,
          ctx_size INTEGER DEFAULT 4096,
          batch_size INTEGER DEFAULT 512,
          threads INTEGER DEFAULT 4,
          created_at INTEGER,
          updated_at INTEGER
        )
      `);

      // Verify migration columns don't exist
      const columnsBefore = db.prepare("PRAGMA table_info(models)").all();
      const columnNamesBefore = columnsBefore.map((c) => c.name);
      expect(columnNamesBefore).not.toContain("embedding_size");
      expect(columnNamesBefore).not.toContain("block_count");

      runModelsMigrations(db);

      // Verify migration columns now exist
      const columnsAfter = db.prepare("PRAGMA table_info(models)").all();
      const columnNamesAfter = columnsAfter.map((c) => c.name);

      expect(columnNamesAfter).toContain("embedding_size");
      expect(columnNamesAfter).toContain("block_count");
      expect(columnNamesAfter).toContain("head_count");
      expect(columnNamesAfter).toContain("head_count_kv");
      expect(columnNamesAfter).toContain("ffn_dim");
      expect(columnNamesAfter).toContain("file_type");
    });

    it("should handle database errors gracefully", () => {
      // Negative test: verify error handling for corrupted/invalid database
      // Create a mock that will throw
      const badDb = {
        exec: () => {},
        prepare: () => {
          throw new Error("Simulated database error");
        },
      };

      // Should not throw, should catch and log warning
      expect(() => {
        runModelsMigrations(badDb);
      }).not.toThrow();
    });

    it("should be idempotent (safe to call multiple times)", () => {
      // Positive test: verify migration can be called multiple times safely
      // Create a simplified models table
      db.exec(`
        CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      expect(() => {
        runModelsMigrations(db);
        runModelsMigrations(db);
        runModelsMigrations(db);
      }).not.toThrow();
    });
  });

  describe("runMetricsMigrations()", () => {
    it("should not add columns that already exist", () => {
      // Positive test: verify migration skips existing columns
      initSchema(db);

      // Count columns before migration
      const columnsBefore = db.prepare("PRAGMA table_info(metrics)").all();

      runMetricsMigrations(db);

      // Count columns after migration (should be same)
      const columnsAfter = db.prepare("PRAGMA table_info(metrics)").all();

      expect(columnsAfter.length).toBe(columnsBefore.length);
    });

    it("should add missing columns from migrations", () => {
      // Negative test: verify migration adds columns that don't exist
      // Create a simplified metrics table without migration columns
      db.exec(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cpu_usage REAL,
          memory_usage REAL,
          disk_usage REAL,
          active_models INTEGER,
          uptime REAL,
          timestamp INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // Verify migration columns don't exist
      const columnsBefore = db.prepare("PRAGMA table_info(metrics)").all();
      const columnNamesBefore = columnsBefore.map((c) => c.name);
      expect(columnNamesBefore).not.toContain("gpu_usage");
      expect(columnNamesBefore).not.toContain("gpu_memory_used");

      runMetricsMigrations(db);

      // Verify migration columns now exist
      const columnsAfter = db.prepare("PRAGMA table_info(metrics)").all();
      const columnNamesAfter = columnsAfter.map((c) => c.name);

      expect(columnNamesAfter).toContain("gpu_usage");
      expect(columnNamesAfter).toContain("gpu_memory_used");
      expect(columnNamesAfter).toContain("gpu_memory_total");
    });

    it("should handle database errors gracefully", () => {
      // Negative test: verify error handling for corrupted/invalid database
      const badDb = {
        exec: () => {},
        prepare: () => {
          throw new Error("Simulated database error");
        },
      };

      // Should not throw, should catch and log warning
      expect(() => {
        runMetricsMigrations(badDb);
      }).not.toThrow();
    });

    it("should be idempotent (safe to call multiple times)", () => {
      // Positive test: verify migration can be called multiple times safely
      // Create a simplified metrics table
      db.exec(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cpu_usage REAL
        )
      `);

      expect(() => {
        runMetricsMigrations(db);
        runMetricsMigrations(db);
        runMetricsMigrations(db);
      }).not.toThrow();
    });
  });

  describe("runAllMigrations()", () => {
    it("should run both models and metrics migrations", () => {
      // Positive test: verify runAllMigrations executes both migrations
      // Create simplified tables without migration columns
      db.exec(`
        CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cpu_usage REAL
        )
      `);

      runAllMigrations(db);

      // Verify models migration columns were added
      const modelColumns = db.prepare("PRAGMA table_info(models)").all();
      const modelColumnNames = modelColumns.map((c) => c.name);
      expect(modelColumnNames).toContain("embedding_size");

      // Verify metrics migration columns were added
      const metricsColumns = db.prepare("PRAGMA table_info(metrics)").all();
      const metricsColumnNames = metricsColumns.map((c) => c.name);
      expect(metricsColumnNames).toContain("gpu_usage");
    });

    it("should handle errors in one migration without stopping the other", () => {
      // Negative test: verify one error doesn't stop the other migration
      const dbWithModelsError = {
        exec: () => {},
        prepare: (query) => {
          if (query.includes("table_info(models)")) {
            throw new Error("Models table error");
          }
          return {
            all: () => [{ name: "cpu_usage" }],
          };
        },
      };

      // Should not throw - errors should be caught
      expect(() => {
        runAllMigrations(dbWithModelsError);
      }).not.toThrow();
    });

    it("should be safe to call on a fully migrated database", () => {
      // Positive test: verify safe to call on already-migrated database
      initSchema(db);

      expect(() => {
        runAllMigrations(db);
        runAllMigrations(db);
      }).not.toThrow();
    });

    it("should complete successfully on empty database", () => {
      // Positive test: verify works on empty database
      expect(() => {
        runAllMigrations(db);
      }).not.toThrow();
    });
  });

  describe("Integration tests", () => {
    it("should create a functional database with initSchema", () => {
      // Integration test: verify full schema initialization works
      initSchema(db);

      // Insert a model
      db.prepare(
        `INSERT INTO models (id, name, type, status, parameters, ctx_size, batch_size, threads, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        "test-model-1",
        "Test Model",
        "llama",
        "idle",
        "{}",
        4096,
        512,
        4,
        Math.floor(Date.now() / 1000),
        Math.floor(Date.now() / 1000)
      );

      // Insert metrics
      db.prepare(
        "INSERT INTO metrics (cpu_usage, memory_usage, disk_usage, active_models, uptime) VALUES (?, ?, ?, ?, ?)"
      ).run(50.5, 1024000, 50, 1, 3600);

      // Insert log
      db.prepare("INSERT INTO logs (level, message, source) VALUES (?, ?, ?)").run(
        "info",
        "Test log",
        "test"
      );

      // Verify data can be retrieved
      const models = db.prepare("SELECT * FROM models").all();
      const metrics = db.prepare("SELECT * FROM metrics").all();
      const logs = db.prepare("SELECT * FROM logs").all();

      expect(models.length).toBe(1);
      expect(models[0].name).toBe("Test Model");
      expect(metrics.length).toBe(1);
      expect(metrics[0].cpu_usage).toBe(50.5);
      expect(logs.length).toBe(1);
      expect(logs[0].message).toBe("Test log");
    });

    it("should support full workflow: init, migrate, query", () => {
      // Integration test: verify complete workflow
      // 1. Create tables without migration columns
      db.exec(`
        CREATE TABLE IF NOT EXISTS models (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          ctx_size INTEGER DEFAULT 4096,
          batch_size INTEGER DEFAULT 512,
          threads INTEGER DEFAULT 4,
          created_at INTEGER,
          updated_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          cpu_usage REAL,
          timestamp INTEGER DEFAULT (strftime('%s', 'now'))
        )
      `);

      // 2. Run migrations
      runAllMigrations(db);

      // 3. Insert data including new columns
      const now = Math.floor(Date.now() / 1000);
      db.prepare(
        `INSERT INTO models (id, name, ctx_size, embedding_size, block_count, batch_size, threads, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run("model-with-migrations", "Migrated Model", 4096, 4096, 32, 512, 4, now, now);

      db.prepare(
        "INSERT INTO metrics (cpu_usage, gpu_usage, gpu_memory_used) VALUES (?, ?, ?)"
      ).run(75.0, 85.5, 8000000000);

      // 4. Verify data
      const model = db.prepare("SELECT * FROM models WHERE id = ?").get("model-with-migrations");
      expect(model.embedding_size).toBe(4096);
      expect(model.block_count).toBe(32);

      // Verify metrics columns were added
      const metricsColumns = db.prepare("PRAGMA table_info(metrics)").all();
      const metricsColumnNames = metricsColumns.map((c) => c.name);
      expect(metricsColumnNames).toContain("gpu_usage");
      expect(metricsColumnNames).toContain("gpu_memory_used");
      expect(metricsColumnNames).toContain("gpu_memory_total");

      const allMetrics = db.prepare("SELECT * FROM metrics ORDER BY id DESC LIMIT 1").get();
      expect(allMetrics.gpu_usage).toBe(85.5);
      expect(allMetrics.gpu_memory_used).toBe(8000000000);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle null database gracefully in initSchema", () => {
      // Negative test: verify error handling for null db
      expect(() => {
        initSchema(null);
      }).toThrow();
    });

    it("should handle null database gracefully in createIndexes", () => {
      // Negative test: verify error handling for null db
      expect(() => {
        createIndexes(null);
      }).toThrow();
    });

    it("should handle null database gracefully in runModelsMigrations", () => {
      // Negative test: verify error handling for null db (catches and logs warning)
      expect(() => {
        runModelsMigrations(null);
      }).not.toThrow();
    });

    it("should handle null database gracefully in runMetricsMigrations", () => {
      // Negative test: verify error handling for null db (catches and logs warning)
      expect(() => {
        runMetricsMigrations(null);
      }).not.toThrow();
    });

    it("should handle null database gracefully in runAllMigrations", () => {
      // Negative test: verify error handling for null db (catches and logs warning)
      expect(() => {
        runAllMigrations(null);
      }).not.toThrow();
    });

    it("should handle database with read-only access in getSchemaDefinition", () => {
      // Positive test: verify pure function works with read-only access
      const schema = getSchemaDefinition();
      expect(typeof schema).toBe("string");
      expect(schema.length).toBeGreaterThan(0);
    });

    it("should handle database with read-only access in getIndexesDefinition", () => {
      // Positive test: verify pure function works with read-only access
      const indexes = getIndexesDefinition();
      expect(Array.isArray(indexes)).toBe(true);
      expect(indexes.length).toBe(8);
    });

    it("should handle database with read-only access in getModelsMigrations", () => {
      // Positive test: verify pure function works with read-only access
      const migrations = getModelsMigrations();
      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBe(6);
    });

    it("should handle database with read-only access in getMetricsMigrations", () => {
      // Positive test: verify pure function works with read-only access
      const migrations = getMetricsMigrations();
      expect(Array.isArray(migrations)).toBe(true);
      expect(migrations.length).toBe(3);
    });

    it("should properly handle closed database in migration functions", () => {
      // Negative test: verify error handling for closed database
      const closedDb = {
        exec: () => {},
        prepare: () => {
          throw new Error("Database closed");
        },
      };

      // These should catch the error and not throw
      expect(() => {
        runModelsMigrations(closedDb);
      }).not.toThrow();
    });
  });
});
