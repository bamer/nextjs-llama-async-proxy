import Database from "better-sqlite3";
import { initDatabase, closeDatabase } from "./database-client";

export interface LogEntry {
  id?: number;
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  source?: string;
  metadata?: string;
  created_at?: number;
}

export function getLogs(limit: number = 100): LogEntry[] {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM logs
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const logs = stmt.all(limit) as LogEntry[];
    return logs;
  } finally {
    closeDatabase(db);
  }
}

export function getLogsByLevel(level: LogEntry["level"], limit: number = 100): LogEntry[] {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE level = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const logs = stmt.all(level, limit) as LogEntry[];
    return logs;
  } finally {
    closeDatabase(db);
  }
}

export function getLogsByTimeRange(
  startTime: number,
  endTime: number
): LogEntry[] {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    const logs = stmt.all(startTime, endTime) as LogEntry[];
    return logs;
  } finally {
    closeDatabase(db);
  }
}

export function filterBySource(source: string, limit: number = 100): LogEntry[] {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM logs
      WHERE source = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    const logs = stmt.all(source, limit) as LogEntry[];
    return logs;
  } finally {
    closeDatabase(db);
  }
}

export function filterByLevel(
  level: LogEntry["level"],
  source?: string
): LogEntry[] {
  const db = initDatabase();

  try {
    let query = "SELECT * FROM logs WHERE level = ?";
    const params: unknown[] = [level];

    if (source) {
      query += " AND source = ?";
      params.push(source);
    }

    query += " ORDER BY timestamp DESC";

    const stmt = db.prepare(query);
    const logs = stmt.all(...params) as LogEntry[];
    return logs;
  } finally {
    closeDatabase(db);
  }
}

export function insertLog(log: Omit<LogEntry, "id" | "created_at">): number {
  const db = initDatabase();
  const now = Date.now();

  try {
    const stmt = db.prepare(`
      INSERT INTO logs (timestamp, level, message, source, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      log.timestamp,
      log.level,
      log.message,
      log.source ?? null,
      log.metadata ?? null,
      now
    );

    return result.lastInsertRowid as number;
  } finally {
    closeDatabase(db);
  }
}

export function deleteLogsOlderThan(timestamp: number): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      DELETE FROM logs
      WHERE timestamp < ?
    `);

    const result = stmt.run(timestamp);
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}

export function deleteLogsByLevel(level: LogEntry["level"]): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      DELETE FROM logs
      WHERE level = ?
    `);

    const result = stmt.run(level);
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}

export function deleteLogsBySource(source: string): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      DELETE FROM logs
      WHERE source = ?
    `);

    const result = stmt.run(source);
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}

export function clearAllLogs(): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM logs");
    const result = stmt.run();
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}
