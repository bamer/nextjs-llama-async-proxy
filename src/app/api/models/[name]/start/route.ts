import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { ModelState, ExtendedState } from '@/lib/types';
import { MODEL_NAME_REGEX } from '@/lib/constants';
import { STATE_FILE, persistState } from '@/lib/state-file';

/* ---------------------------------------------------------------------
 * Load the extended state once (module initialization)
 * --------------------------------------------------------------------- */
let STATE_CACHE: ExtendedState = {};
(async () => {
  try {
    const raw = await fs.promises.readFile(STATE_FILE, 'utf8');
    STATE_CACHE = JSON.parse(raw);
  } catch {
    STATE_CACHE = {};
  }
})();

/* ---------------------------------------------------------------------
 * Process tracking – model name => { pid, launchedAt }
 * --------------------------------------------------------------------- */
const runningProcesses = new Map<string, { pid: number; launchedAt: number }>();

/* ---------------------------------------------------------------------
 * Validation helper
 * --------------------------------------------------------------------- */
function validateModelName(raw: string): string {
  if (!raw || !MODEL_NAME_REGEX.test(raw)) {
    throw new Error('Invalid model name');
  }
  return raw.trim();
}

/* ---------------------------------------------------------------------
 * Core process control
 * --------------------------------------------------------------------- */
async function startProcess(model: string): Promise<{ pid: number; launchedAt: number }> {
  if (runningProcesses.has(model)) return runningProcesses.get(model)!;

  const llamaBin = path.join(process.cwd(), 'data', 'models', model, 'model.bin');
  const cmd = '/usr/local/bin/llama.cpp';
  const args = [
    '-m',
    llamaBin,
    '-c',
    '2048',
    '-ngl',
    '0',
    '-p',
    '"prompt=Hello from Next.js API"',
  ];

  const child = spawn(cmd, args, { detached: true, stdio: 'ignore' });
  child.unref();

  const launchedAt = Date.now();
  const pid = child.pid!;
  runningProcesses.set(model, { pid, launchedAt });
  return { pid, launchedAt };
}

function stopProcess(model: string): boolean {
  if (!runningProcesses.has(model)) return false;
  const { pid } = runningProcesses.get(model)!;
  try {
    process.kill(pid, 'SIGTERM');
  } catch {
    // ignore – process may have already exited
  }
  runningProcesses.delete(model);
  return true;
}

/* ---------------------------------------------------------------------
 * GET handler – returns current status of a model
 * --------------------------------------------------------------------- */
export async function GET(request: { nextUrl: { pathname: string } }) {
  try {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const rawModelName = segments[segments.length - 2];
    const model = validateModelName(rawModelName);

    const current = STATE_CACHE as Record<string, any>;
    const status = (current[model] as ModelState)?.status ?? 'idle';

    return NextResponse.json({ modelName: model, status });
  } catch {
    return NextResponse.json({ error: 'Invalid model name' }, { status: 400 });
  }
}

/* ---------------------------------------------------------------------
 * POST handler – start or mark as starting a model
 * --------------------------------------------------------------------- */
export async function POST(request: { nextUrl: { pathname: string } }) {
  try {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const rawModelName = segments[segments.length - 2];
    const model = validateModelName(rawModelName);

    const current = STATE_CACHE as Record<string, any>;

    // Enforce transition rules: only from idle or error
    const previous = (current[model] as ModelState)?.status ?? 'idle';
    if (previous !== 'idle' && previous !== 'error') {
      return NextResponse.json(
        {
          success: false,
          modelName: model,
          error: 'Model is already in progress or started',
          previousStatus: previous,
        },
        { status: 409 }
      );
    }

    // Start the underlying llama.cpp process
    const { pid, launchedAt } = await startProcess(model);

    // Transition state to "starting" then "started"
    current[model] = { ...(current[model] as ModelState), pid, launchedAt, status: 'starting' };
    await persistState(current);

    current[model] = { ...(current[model] as ModelState), status: 'started' };
    await persistState(current);

    return NextResponse.json({
      success: true,
      modelName: model,
      message: 'Model started successfully',
      previousStatus: previous,
      pid,
      launchedAt,
    });
  } catch (error: any) {
    console.error('Error starting model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start model', details: error.message },
      { status: 500 }
    );
  }
}

/* ---------------------------------------------------------------------
 * POST_STOP handler – stop a running model
 * --------------------------------------------------------------------- */
export async function POST_STOP(request: { nextUrl: { pathname: string } }) {
  try {
    const pathname = request.nextUrl.pathname;
    const segments = pathname.split('/');
    const rawModelName = segments[segments.length - 2];
    const model = validateModelName(rawModelName);

    const stopped = stopProcess(model);

    const current = STATE_CACHE as Record<string, any>;
    const state = current[model] as ModelState;
    current[model] = {
      ...state,
      status: 'error',
      error: stopped ? 'stopped_by_user' : 'was_not_running',
    };
    await persistState(current);

    return NextResponse.json({
      success: stopped,
      modelName: model,
      message: stopped
        ? 'Model stopped successfully'
        : 'Model was not running',
    });
  } catch (error: any) {
    console.error('Error stopping model:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to stop model', details: error.message },
      { status: 500 }
    );
  }
}