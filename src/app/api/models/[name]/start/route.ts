import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

// ---------- CONFIG ----------
const STATE_FILE = path.join(process.cwd(), 'data', 'models-state.json');
const MODEL_NAME_REGEX = /^[a-zA-Z0-9_-]+$/;

// ---------- TYPE DEFINITIONS ----------
type ModelState = 'idle' | 'starting' | 'started' | 'error';
type StateCache = Record<string, ModelState>;

// In‑memory cache that persists across requests
let STATE_CACHE: StateCache = {};

// Load the cache once when the module is first imported
(async () => {
  try {
    const raw = await fs.promises.readFile(STATE_FILE, 'utf8');
    STATE_CACHE = JSON.parse(raw);
  } catch {
    STATE_CACHE = {};
  }
})();

// ---------- HELPERS ----------
function readState(): StateCache {
  return STATE_CACHE;
}

async function writeState(state: StateCache): Promise<void> {
  // Simple atomic write – overwrite the file with the new state
  await fs.promises.writeFile(STATE_FILE, JSON.stringify(state), 'utf8');
}

// ---------- POST /api/models/[name]/start ----------
export async function POST(request: { nextUrl: { pathname: string } }) {
  try {
    // ------- Input Validation -------
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const rawModelName = segments[segments.length - 2];

    // Strict whitelist validation
    if (!rawModelName || !MODEL_NAME_REGEX.test(rawModelName)) {
      return NextResponse.json(
        { success: false, error: 'Invalid model name' },
        { status: 400 }
      );
    }
    const modelName = rawModelName.trim();

    // ------- State Manipulation -------
    const state = readState();
    const previousStatus = state[modelName] ?? 'idle';
    if (previousStatus !== 'idle' && previousStatus !== 'error') {
      return NextResponse.json(
        {
          success: false,
          modelName,
          error: 'Model is already in progress or started',
          previousStatus,
        },
        { status: 409 }
      );
    }

    // Transition to starting, then to started
    state[modelName] = 'starting';
    await writeState(state);

    state[modelName] = 'started';
    await writeState(state);

    return NextResponse.json({
      success: true,
      modelName,
      message: 'Model started successfully',
      previousStatus,
    });
  } catch (error: any) {
    console.error('Unexpected error in POST /api/models/[name]/start:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ---------- GET /api/models/[name]/start ----------
export async function GET(request: { nextUrl: { pathname: string } }) {
  try {
    // ------- Input Validation -------
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const rawModelName = segments[segments.length - 2];

    if (!rawModelName || !MODEL_NAME_REGEX.test(rawModelName)) {
      return NextResponse.json(
        { error: 'Invalid model name' },
        { status: 400 }
      );
    }
    const modelName = rawModelName.trim();

    // ------- Return current status -------
    const state = readState();
    const status = state[modelName] ?? 'idle';

    return NextResponse.json({ modelName, status });
  } catch (error) {
    console.error('Unexpected error in GET /api/models/[name]/start:', error);
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