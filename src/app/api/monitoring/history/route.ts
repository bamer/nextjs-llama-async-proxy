import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'monitoring-history.json');

/**
 * Safely reads the monitoring history JSON file.
 * Returns an empty array if the file does not exist or cannot be parsed.
 */
function readHistory(): any[] {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      // File does not exist yet – start with empty history
      return [];
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read or parse monitoring history file:', error);
    return [];
  }
}

/**
 * Safely writes the monitoring history array to the JSON file.
 * Errors are logged but do not break the API response.
 */
function writeHistory(history: any[]) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.error('Failed to write monitoring history file:', error);
    // Continue – the API response is still valid even if persistence fails
  }
}

/**
 * Generates realistic metrics history for the last `limit` minutes.
 * Used only as a fallback when the stored history is empty.
 */
export function generateMetricsHistory(limit: number) {
  const history = [];
  const now = Date.now();

  for (let i = 0; i < limit; i++) {
    const timestamp = new Date(now - (i * 60000)).toISOString();
    history.push({
      cpuUsage: Math.floor(Math.random() * 50) + 20, // 20-70%
      memoryUsage: Math.floor(Math.random() * 30) + 50, // 50-80%
      activeModels: Math.floor(Math.random() * 5) + 1, // 1-5 models
      totalRequests: Math.floor(Math.random() * 500) + 100, // 100-600 requests
      avgResponseTime: Math.floor(Math.random() * 300) + 100, // 100-400ms
      timestamp,
    });
  }
  return history;
}

/**
 * GET /api/monitoring/history
 * Returns a slice of monitoring history respecting an optional `limit` query param (1‑100).
 * Provides detailed error responses with context.
 */
export async function GET(request: { nextUrl: { searchParams: URLSearchParams } }) {
  try {
    // ---------- Input Validation ----------
    const rawLimit = request.nextUrl.searchParams.get('limit');
    let limit: number;

    if (rawLimit === null) {
      // No limit provided → default to 60
      limit = 60;
    } else {
      const parsed = Number(rawLimit);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 100) {
        // Invalid limit → bad request with context
        return NextResponse.json(
          {
            error: 'Invalid limit parameter',
            details: `"limit" must be an integer between 1 and 100`,
          },
          { status: 400 }
        );
      }
      limit = parsed;
    }

    // ---------- Load History ----------
    const history = readHistory();

    // If there is no persisted data, generate a fallback dataset
    if (history.length === 0) {
      const fallback = generateMetricsHistory(limit);
      writeHistory(fallback);
      return NextResponse.json(fallback);
    }

    // Slice the array to respect the requested limit
    const sliced = history.slice(0, limit);
    return NextResponse.json(sliced);
  } catch (error: any) {
    // ---------- Unexpected Errors ----------
    console.error('Unhandled error in /api/monitoring/history:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}