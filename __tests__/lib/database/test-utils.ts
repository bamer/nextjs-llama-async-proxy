import Database from 'better-sqlite3';

/**
 * Test database initializer that uses in-memory database
 */
export function initTestDatabase(): Database.Database {
  return new Database(':memory:');
}

/**
 * Close test database
 */
export function closeTestDatabase(db: Database.Database): void {
  db.close();
}
