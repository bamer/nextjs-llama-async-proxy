import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { createTables } from '@/lib/database/database.types';
import { initTestDatabase, closeTestDatabase } from './test-utils';
import Database from 'better-sqlite3';

describe('database.types', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initTestDatabase();
  });

  afterEach(() => {
    closeTestDatabase(db);
  });

  describe('createTables', () => {
    it('should create all required tables', () => {
      createTables(db);
      
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
      const tableNames = tables.map((t: any) => t.name);
      
      const expectedTables = [
        'metrics_history',
        'models',
        'model_fit_params',
        'model_sampling_config',
        'model_memory_config',
        'model_gpu_config',
        'model_advanced_config',
        'model_lora_config',
        'model_multimodal_config',
        'model_server_config',
        'metadata'
      ];
      
      expect(tableNames).toEqual(expect.arrayContaining(expectedTables));
    });

    it('should create indexes', () => {
      createTables(db);
      
      const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
      expect(indexes.length).toBeGreaterThan(0);
    });

    it('should handle database errors gracefully', () => {
      const mockDb = {
        exec: jest.fn(() => { throw new Error('Table creation failed'); })
      } as unknown;
      
      expect(() => {
        createTables(mockDb as Database.Database);
      }).toThrow();
    });
  });

  describe('TABLE_SCHEMAS constants', () => {
    it('should have all required table definitions', () => {
      const { TABLE_SCHEMAS } = require('@/lib/database/database.types');
      
      expect(Object.keys(TABLE_SCHEMAS)).toEqual([
        'metrics_history',
        'models',
        'model_fit_params',
        'model_sampling_config',
        'model_memory_config',
        'model_gpu_config',
        'model_advanced_config',
        'model_lora_config',
        'model_multimodal_config',
        'model_server_config',
        'metadata'
      ]);
    });

    it('should have proper SQL syntax', () => {
      const { TABLE_SCHEMAS } = require('@/lib/database/database.types');
      
      Object.values(TABLE_SCHEMAS).forEach((schema: string) => {
        expect(() => {
          db.exec(schema);
        }).not.toThrow();
      });
    });
  });
});
