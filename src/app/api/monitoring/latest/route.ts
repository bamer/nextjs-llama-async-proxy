import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import type { MonitoringEntry } from '@/types/monitoring';

const HISTORY_FILE = path.join(process.cwd(), 'data', 'monitoring-history.json');

/**
 * GET /api/monitoring/latest
 * Returns the most recent monitoring entry from the persisted JSON file.
 * If the file does not exist or is empty, returns a 404 response.
 * CORS headers are included so the endpoint can be called from any origin.
 */
export async function GET() {
  try {
    // -------------------------------------------------------------
    // 1️⃣ Ensure the history file exists – create an empty array if missing
    // -------------------------------------------------------------
    if (!fs.existsSync(HISTORY_FILE)) {
      fs.writeFileSync(HISTORY_FILE, JSON.stringify([]), 'utf8');
    }

    // -------------------------------------------------------------
    // 2️⃣ Load the persisted history
    // -------------------------------------------------------------
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    let history: MonitoringEntry[];
    try {
      history = JSON.parse(raw);
    } catch {
      history = [];
    }

    // -------------------------------------------------------------
    // 3️⃣ Return the latest entry if one exists
    // -------------------------------------------------------------
    if (Array.isArray(history) && history.length > 0) {
      const latest: MonitoringEntry = history[history.length - 1];
      return NextResponse.json(latest, {
        headers: {
          // Allow any origin (CORS)
          'Access-Control-Allow-Origin': '*',
          // Prevent caching – we always want fresh data
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          // Content type
          'Content-Type': 'application/json',
        },
      });
    }

    // -------------------------------------------------------------
    // 4️⃣ No data available – 404 with helpful message
    // -------------------------------------------------------------
    return new NextResponse(
      JSON.stringify({ error: 'No monitoring data available' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('⚠️  /api/monitoring/latest unexpected error:', error);
    return new NextResponse(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}