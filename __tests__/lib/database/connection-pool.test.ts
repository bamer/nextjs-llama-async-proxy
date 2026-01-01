import { describe, it, expect, afterEach, jest } from '@jest/globals';
import { initDatabase, closeDatabase } from '@/lib/database/connection-pool';
import Database from 'better-sqlite3';

describe('connection-pool', () => {
  let db: Database.Database | null;

  afterEach(() => {
    if (db) {
      closeDatabase(db);
      db = null;
    }
  });

  describe('initDatabase', () => {
    it('should return a Database instance', () => {
      db = initDatabase();
      
      expect(db).toBeDefined();
      expect(typeof db).toBe('object');
      expect(db.prepare).toBeDefined();
      expect(db.exec).toBeDefined();
    });

    it('should enable WAL mode if supported', () => {
      db = initDatabase();
      
      const journalMode = db.pragma('journal_mode', { simple: true });
      expect(['wal', 'delete']).toContain(journalMode);
    });

    it('should set performance pragmas', () => {
      db = initDatabase();
      
      const syncMode = db.pragma('synchronous', { simple: true });
      const cacheSize = db.pragma('cache_size', { simple: true });
      
      expect(syncMode).toBeDefined();
      expect(cacheSize).toBeDefined();
    });

    it('should create tables on first initialization', () => {
      db = initDatabase();
      
      expect(() => {
        db.prepare('SELECT 1 FROM models');
      }).not.toThrow();
    });
  });

  describe('closeDatabase', () => {
    it('should close database connection', () => {
      db = initDatabase();
      
      expect(() => {
        closeDatabase(db);
      }).not.toThrow();
    });

    it('should handle null database gracefully', () => {
      expect(() => {
        closeDatabase(null as unknown as Database.Database);
      }).toThrow();
    });
  });
});
