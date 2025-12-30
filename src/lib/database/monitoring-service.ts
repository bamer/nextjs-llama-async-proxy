import Database from "better-sqlite3";
import type { MetricsHistoryEntry } from "./metrics-service";
import { initDatabase, closeDatabase } from "./database-client";

export function getHistory(minutes: number = 10): MetricsHistoryEntry[] {
  const db = initDatabase();
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE created_at >= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(cutoffTime) as MetricsHistoryEntry[];
    return entries;
  } finally {
    closeDatabase(db);
  }
}

export function getHistoryByTimeRange(
  startTime: number,
  endTime: number
): MetricsHistoryEntry[] {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE timestamp >= ? AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(startTime, endTime) as MetricsHistoryEntry[];
    return entries;
  } finally {
    closeDatabase(db);
  }
}

export function getHistoryWithSampling(
  minutes: number = 10,
  maxPoints: number = 100
): MetricsHistoryEntry[] {
  const db = initDatabase();
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      WHERE created_at >= ?
      ORDER BY timestamp ASC
    `);

    const entries = stmt.all(cutoffTime) as MetricsHistoryEntry[];

    if (entries.length <= maxPoints) {
      return entries;
    }

    const step = Math.floor(entries.length / maxPoints);
    const sampled: MetricsHistoryEntry[] = [];

    for (let i = 0; i < entries.length; i += step) {
      sampled.push(entries[i]);
    }

    return sampled;
  } finally {
    closeDatabase(db);
  }
}

export function deleteOldHistory(minutes: number = 10): number {
  const db = initDatabase();
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  try {
    const stmt = db.prepare(`
      DELETE FROM metrics_history
      WHERE created_at < ?
    `);

    const result = stmt.run(cutoffTime);
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}

export function deleteHistoryByTimeRange(
  startTime: number,
  endTime: number
): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      DELETE FROM metrics_history
      WHERE timestamp >= ? AND timestamp <= ?
    `);

    const result = stmt.run(startTime, endTime);
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}

export function clearAllHistory(): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare("DELETE FROM metrics_history");
    const result = stmt.run();
    return result.changes;
  } finally {
    closeDatabase(db);
  }
}

export function getHistoryCount(minutes: number = 10): number {
  const db = initDatabase();
  const cutoffTime = Date.now() - minutes * 60 * 1000;

  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM metrics_history
      WHERE created_at >= ?
    `);

    const row = stmt.get(cutoffTime) as { count: number };
    return row.count;
  } finally {
    closeDatabase(db);
  }
}

export function getHistorySizeBytes(): number {
  const db = initDatabase();

  try {
    const stmt = db.prepare("SELECT COUNT(*) as count FROM metrics_history");
    const row = stmt.get() as { count: number };

    const avgRowSize = 200;
    return row.count * avgRowSize;
  } finally {
    closeDatabase(db);
  }
}

export function getOldestHistoryEntry(): MetricsHistoryEntry | null {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      ORDER BY timestamp ASC
      LIMIT 1
    `);

    const row = stmt.get() as MetricsHistoryEntry | undefined;

    if (!row) return null;
    return row;
  } finally {
    closeDatabase(db);
  }
}

export function getNewestHistoryEntry(): MetricsHistoryEntry | null {
  const db = initDatabase();

  try {
    const stmt = db.prepare(`
      SELECT * FROM metrics_history
      ORDER BY timestamp DESC
      LIMIT 1
    `);

    const row = stmt.get() as MetricsHistoryEntry | undefined;

    if (!row) return null;
    return row;
  } finally {
    closeDatabase(db);
  }
}
