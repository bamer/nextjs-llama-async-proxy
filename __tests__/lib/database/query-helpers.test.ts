import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { setMetadata, getMetadata, deleteMetadata } from '@/lib/database/query-helpers';
import Database from 'better-sqlite3';

describe('query-helpers', () => {
  let db: Database.Database | null;

  beforeEach(() => {
    // Initialize fresh in-memory database for each test
    db = new Database(':memory:');
    // Create metadata table
    db.exec(`
      CREATE TABLE metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  });

  afterEach(() => {
    if (db) {
      db.close();
      db = null;
    }
  });

  describe('setMetadata (with db parameter)', () => {
    it('should set metadata value', () => {
      if (!db) throw new Error('Database not initialized');
      
      setMetadata(db, 'test_key', 'test_value');
      
      const value = getMetadata(db, 'test_key');
      expect(value).toBe('test_value');
    });

    it('should update existing metadata value', () => {
      if (!db) throw new Error('Database not initialized');
      
      setMetadata(db, 'update_test', 'initial');
      setMetadata(db, 'update_test', 'updated');
      
      const value = getMetadata(db, 'update_test');
      expect(value).toBe('updated');
    });

    it('should handle null values', () => {
      if (!db) throw new Error('Database not initialized');
      
      expect(() => {
        setMetadata(db, 'null_test', null as unknown as string);
      }).not.toThrow();
      
      const value = getMetadata(db, 'null_test');
      expect(value).toBeNull();
    });

    it('should handle empty values', () => {
      if (!db) throw new Error('Database not initialized');
      
      expect(() => {
        setMetadata(db, 'empty_test', '');
      }).not.toThrow();
      
      const value = getMetadata(db, 'empty_test');
      expect(value).toBe('');
    });
  });

  describe('getMetadata', () => {
    it('should return null for non-existent key', () => {
      if (!db) throw new Error('Database not initialized');
      
      const value = getMetadata(db, 'non_existent_key');
      expect(value).toBeNull();
    });

    it('should return value for existing key', () => {
      if (!db) throw new Error('Database not initialized');
      
      setMetadata(db, 'existing_key', 'existing_value');
      
      const value = getMetadata(db, 'existing_key');
      expect(value).toBe('existing_value');
    });
  });

  describe('deleteMetadata', () => {
    it('should delete metadata value', () => {
      if (!db) throw new Error('Database not initialized');
      
      setMetadata(db, 'delete_test', 'to_delete');
      
      deleteMetadata(db, 'delete_test');
      
      const value = getMetadata(db, 'delete_test');
      expect(value).toBeNull();
    });

    it('should not throw for non-existent key', () => {
      if (!db) throw new Error('Database not initialized');
      
      expect(() => {
        deleteMetadata(db, 'non_existent_key');
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw error if database is null', () => {
      expect(() => {
        setMetadata(null as Database.Database, 'error_test', 'value');
      }).toThrow('Database not initialized');
    });

    it('should handle database prepare errors', () => {
      const mockDb = {
        prepare: jest.fn(() => { throw new Error('Prepare failed'); })
      } as unknown;
      
      expect(() => {
        setMetadata(mockDb as Database.Database, 'error_test', 'value');
      }).toThrow('Prepare failed');
    });

    it('should handle database get errors', () => {
      const mockDb = {
        prepare: jest.fn().mockImplementation(() => { throw new Error('Get failed'); })
      } as unknown;
      
      expect(() => {
        getMetadata(mockDb as Database.Database, 'error_test');
      }).toThrow('Get failed');
    });
  });
});
